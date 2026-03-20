from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import Asset, AssetQuote, AssetTypeEnum, PortfolioPosition, PositionHistory, User
from app.db.session import get_db
from app.schemas.portfolio import (
    PortfolioSummary,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
    PositionWithQuote,
)
from app.services.brapi import refresh_quotes_for_assets
from app.services.cdi import calculate_fixed_income_value

router = APIRouter()

# Cotações com menos de 15 min são consideradas frescas
QUOTE_FRESHNESS = timedelta(minutes=15)


def _get_fresh_prices(db: Session, positions: list[PortfolioPosition]) -> dict[UUID, float]:
    """Busca preços atualizados para todas as posições de uma vez.

    1. Verifica quais ativos já têm cotação recente no banco (< 15 min)
    2. Para os que não têm, busca em batch na brapi.dev e salva
    3. Retorna dict {asset_id: price}
    """
    if not positions:
        return {}

    # Coleta asset_ids únicos e seus tickers
    asset_map: dict[UUID, str] = {}
    for pos in positions:
        if pos.asset_id not in asset_map:
            asset_map[pos.asset_id] = pos.asset.ticker

    prices: dict[UUID, float] = {}
    stale_assets: dict[UUID, str] = {}  # asset_id -> ticker (precisam refresh)

    cutoff = datetime.now(timezone.utc) - QUOTE_FRESHNESS

    # Verifica cotações recentes no banco
    for asset_id, ticker in asset_map.items():
        quote = (
            db.query(AssetQuote)
            .filter(
                AssetQuote.asset_id == asset_id,
                AssetQuote.fetched_at >= cutoff,
            )
            .order_by(desc(AssetQuote.fetched_at))
            .first()
        )
        if quote:
            prices[asset_id] = float(quote.price)
        else:
            # Só busca na brapi ativos de renda variável (STOCK/FII)
            asset = db.query(Asset).filter(Asset.id == asset_id).first()
            if asset and asset.type in (AssetTypeEnum.STOCK, AssetTypeEnum.FII):
                stale_assets[asset_id] = ticker
            else:
                # Para outros tipos, tenta pegar a última cotação do banco (qualquer idade)
                old_quote = (
                    db.query(AssetQuote)
                    .filter(AssetQuote.asset_id == asset_id)
                    .order_by(desc(AssetQuote.fetched_at))
                    .first()
                )
                if old_quote:
                    prices[asset_id] = float(old_quote.price)

    # Busca cotações faltantes em batch na brapi e salva no banco
    if stale_assets:
        new_prices = refresh_quotes_for_assets(db, stale_assets)
        prices.update(new_prices)

    return prices


def _enrich_position(pos: PortfolioPosition, current_price: float | None) -> PositionWithQuote:
    """Transforma uma posição do DB em PositionWithQuote com dados calculados."""
    asset = pos.asset

    quantity = float(pos.quantity)
    avg_price = float(pos.average_price)
    invested = float(pos.invested_amount) if pos.invested_amount else None
    rate_val = float(pos.rate_value) if pos.rate_value else None

    # Renda fixa: calcula rendimento por tempo (CDI)
    if asset.type == AssetTypeEnum.FIXED_INCOME and invested and rate_val and pos.investment_date:
        current_value = calculate_fixed_income_value(
            invested_amount=invested,
            rate_type=pos.rate_type.value if pos.rate_type else "CDI_PERCENTAGE",
            rate_value=rate_val,
            investment_date=pos.investment_date,
        )
        profit_loss = current_value - invested
        # current_price não se aplica a renda fixa, mas preenchemos
        # com o valor atual para manter compatibilidade
        current_price = current_value
    elif current_price is not None:
        current_value = quantity * current_price
        profit_loss = current_value - (quantity * avg_price)
    else:
        current_value = None
        profit_loss = None

    return PositionWithQuote(
        id=pos.id,
        user_id=pos.user_id,
        asset_id=pos.asset_id,
        quantity=quantity,
        average_price=avg_price,
        origin=pos.origin,
        institution_name=pos.institution_name,
        rate_type=pos.rate_type,
        rate_value=rate_val,
        investment_date=pos.investment_date,
        maturity_date=pos.maturity_date,
        invested_amount=invested,
        created_at=pos.created_at,
        updated_at=pos.updated_at,
        ticker=asset.ticker,
        asset_name=asset.name,
        asset_type=asset.type,
        current_price=current_price,
        current_value=current_value,
        profit_loss=profit_loss,
    )


def _save_daily_snapshot(db: Session, user_id: UUID, enriched: list[PositionWithQuote]) -> None:
    """Salva (ou atualiza) o snapshot diário do patrimônio na PositionHistory.

    Chamado toda vez que enriquecemos posições com preços frescos,
    garantindo que temos ao menos um ponto por dia por usuário.
    """
    today = datetime.now(timezone.utc).date()

    totals = {"stock": 0.0, "fii": 0.0, "crypto": 0.0, "fixed_income": 0.0}
    for p in enriched:
        value = p.current_value or 0.0
        if p.asset_type == AssetTypeEnum.STOCK:
            totals["stock"] += value
        elif p.asset_type == AssetTypeEnum.FII:
            totals["stock"] += value  # stock_equity inclui FII no PositionHistory
        elif p.asset_type == AssetTypeEnum.CRYPTO:
            totals["crypto"] += value
        elif p.asset_type == AssetTypeEnum.FIXED_INCOME:
            totals["fixed_income"] += value

    total_equity = sum(totals.values())
    if total_equity == 0:
        return

    existing = (
        db.query(PositionHistory)
        .filter(PositionHistory.user_id == user_id, PositionHistory.date == today)
        .first()
    )

    if existing:
        existing.total_equity = total_equity
        existing.stock_equity = totals["stock"]
        existing.crypto_equity = totals["crypto"]
        existing.fixed_income_equity = totals["fixed_income"]
    else:
        db.add(PositionHistory(
            user_id=user_id,
            date=today,
            total_equity=total_equity,
            stock_equity=totals["stock"],
            crypto_equity=totals["crypto"],
            fixed_income_equity=totals["fixed_income"],
        ))

    db.commit()


@router.get("", response_model=list[PositionWithQuote])
def read_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna todas as posições do usuário com cotação atual."""
    positions = (
        db.query(PortfolioPosition)
        .filter(PortfolioPosition.user_id == current_user.id)
        .all()
    )

    # Busca todos os preços em batch (1-2 requests max)
    prices = _get_fresh_prices(db, positions)

    enriched = [
        _enrich_position(p, prices.get(p.asset_id))
        for p in positions
    ]

    # Salva snapshot diário do patrimônio
    _save_daily_snapshot(db, current_user.id, enriched)

    return enriched


@router.get("/summary", response_model=PortfolioSummary)
def portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna o patrimônio consolidado, dividido por classe de ativo."""
    positions = (
        db.query(PortfolioPosition)
        .filter(PortfolioPosition.user_id == current_user.id)
        .all()
    )

    # Busca todos os preços em batch (1-2 requests max)
    prices = _get_fresh_prices(db, positions)

    enriched = [
        _enrich_position(p, prices.get(p.asset_id))
        for p in positions
    ]

    # Salva snapshot diário do patrimônio
    _save_daily_snapshot(db, current_user.id, enriched)

    totals = {
        "stock": 0.0,
        "fii": 0.0,
        "crypto": 0.0,
        "fixed_income": 0.0,
        "cash": 0.0,
    }

    for p in enriched:
        value = p.current_value or 0.0
        if p.asset_type == AssetTypeEnum.STOCK:
            totals["stock"] += value
        elif p.asset_type == AssetTypeEnum.FII:
            totals["fii"] += value
        elif p.asset_type == AssetTypeEnum.CRYPTO:
            totals["crypto"] += value
        elif p.asset_type == AssetTypeEnum.FIXED_INCOME:
            totals["fixed_income"] += value
        elif p.asset_type == AssetTypeEnum.CASH:
            totals["cash"] += value

    total = sum(totals.values())

    return PortfolioSummary(
        total_equity=total,
        stock_equity=totals["stock"],
        fii_equity=totals["fii"],
        crypto_equity=totals["crypto"],
        fixed_income_equity=totals["fixed_income"],
        cash_equity=totals["cash"],
        positions=enriched,
    )


@router.post("/position", response_model=PositionResponse, status_code=201)
def create_position(
    body: PositionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria uma nova posição manual na carteira."""
    asset = db.query(Asset).filter(Asset.id == body.asset_id).first()
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ativo não encontrado no catálogo",
        )

    position = PortfolioPosition(
        user_id=current_user.id,
        **body.model_dump(),
    )
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


@router.put("/position/{position_id}", response_model=PositionResponse)
def update_position(
    position_id: UUID,
    body: PositionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edita uma posição existente do usuário."""
    position = (
        db.query(PortfolioPosition)
        .filter(
            PortfolioPosition.id == position_id,
            PortfolioPosition.user_id == current_user.id,
        )
        .first()
    )
    if position is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Posição não encontrada",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(position, field, value)

    db.commit()
    db.refresh(position)
    return position


@router.delete("/position/{position_id}", status_code=204)
def delete_position(
    position_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove uma posição da carteira do usuário."""
    position = (
        db.query(PortfolioPosition)
        .filter(
            PortfolioPosition.id == position_id,
            PortfolioPosition.user_id == current_user.id,
        )
        .first()
    )
    if position is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Posição não encontrada",
        )

    db.delete(position)
    db.commit()
