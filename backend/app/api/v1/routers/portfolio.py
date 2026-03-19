from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import Asset, AssetQuote, AssetTypeEnum, PortfolioPosition, User
from app.db.session import get_db
from app.schemas.portfolio import (
    PortfolioSummary,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
    PositionWithQuote,
)

router = APIRouter()


def _get_latest_price(db: Session, asset_id: UUID) -> float | None:
    """Busca a cotação mais recente de um ativo."""
    quote = (
        db.query(AssetQuote)
        .filter(AssetQuote.asset_id == asset_id)
        .order_by(desc(AssetQuote.fetched_at))
        .first()
    )
    return float(quote.price) if quote else None


def _enrich_position(db: Session, pos: PortfolioPosition) -> PositionWithQuote:
    """Transforma uma posição do DB em PositionWithQuote com dados calculados."""
    asset = pos.asset
    current_price = _get_latest_price(db, pos.asset_id)

    quantity = float(pos.quantity)
    avg_price = float(pos.average_price)

    if current_price is not None:
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
        rate_value=float(pos.rate_value) if pos.rate_value else None,
        investment_date=pos.investment_date,
        maturity_date=pos.maturity_date,
        invested_amount=float(pos.invested_amount) if pos.invested_amount else None,
        created_at=pos.created_at,
        updated_at=pos.updated_at,
        ticker=asset.ticker,
        asset_name=asset.name,
        asset_type=asset.type,
        current_price=current_price,
        current_value=current_value,
        profit_loss=profit_loss,
    )


@router.get("/", response_model=list[PositionWithQuote])
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
    return [_enrich_position(db, p) for p in positions]


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

    enriched = [_enrich_position(db, p) for p in positions]

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
