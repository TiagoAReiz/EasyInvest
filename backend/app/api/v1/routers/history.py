"""Endpoint de evolução patrimonial para o gráfico do dashboard.

Gera os pontos do gráfico on-the-fly a partir das posições do usuário.
- Renda variável (STOCK/FII): usa o preço atual (última cotação) como base
  para todos os pontos (simplificação MVP — sem histórico de cotações diárias)
- Renda fixa: recalcula o rendimento CDI para cada data do período
- Crypto: usa o preço atual como base (mesma simplificação)
"""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import (
    Asset,
    AssetQuote,
    AssetTypeEnum,
    PortfolioPosition,
    PositionHistory,
    User,
)
from app.db.session import get_db
from app.schemas.portfolio import HistoryEntry
from app.services.cdi import calculate_fixed_income_value

router = APIRouter()

PERIOD_MAP = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
}


def _generate_history(
    db: Session, user_id, period_days: int | None
) -> list[HistoryEntry]:
    """Gera pontos do gráfico de evolução patrimonial.

    Para cada dia no período, calcula o patrimônio total considerando
    apenas posições que já existiam naquela data.
    """
    positions = (
        db.query(PortfolioPosition)
        .filter(PortfolioPosition.user_id == user_id)
        .all()
    )

    if not positions:
        return []

    today = date.today()

    # Determina o range de datas
    if period_days is not None:
        start_date = today - timedelta(days=period_days)
    else:
        # "all": desde a posição mais antiga
        earliest = min(p.created_at.date() for p in positions)
        start_date = earliest

    # Não precisa de mais de 365 pontos
    if (today - start_date).days > 365:
        start_date = today - timedelta(days=365)

    # Coleta preço atual de cada ativo de renda variável/crypto
    # (simplificação MVP: assume preço constante no período)
    current_prices: dict[str, float] = {}
    for pos in positions:
        asset = pos.asset
        if asset.type in (AssetTypeEnum.STOCK, AssetTypeEnum.FII, AssetTypeEnum.CRYPTO):
            if asset.id not in current_prices:
                from sqlalchemy import desc
                quote = (
                    db.query(AssetQuote)
                    .filter(AssetQuote.asset_id == asset.id)
                    .order_by(desc(AssetQuote.fetched_at))
                    .first()
                )
                if quote:
                    current_prices[str(asset.id)] = float(quote.price)

    # Gera pontos dia a dia
    entries: list[HistoryEntry] = []
    current_date = start_date

    while current_date <= today:
        stock_eq = 0.0
        fii_eq = 0.0
        crypto_eq = 0.0
        fi_eq = 0.0

        for pos in positions:
            # Só conta posições que já existiam nesta data
            if pos.created_at.date() > current_date:
                continue

            asset = pos.asset
            quantity = float(pos.quantity)
            avg_price = float(pos.average_price)

            if asset.type == AssetTypeEnum.FIXED_INCOME:
                # Renda fixa: calcula rendimento CDI até esta data
                invested = float(pos.invested_amount) if pos.invested_amount else 0
                rate_val = float(pos.rate_value) if pos.rate_value else 0
                if invested and rate_val and pos.investment_date:
                    value = calculate_fixed_income_value(
                        invested_amount=invested,
                        rate_type=pos.rate_type.value if pos.rate_type else "CDI_PERCENTAGE",
                        rate_value=rate_val,
                        investment_date=pos.investment_date,
                        today=current_date,
                    )
                else:
                    value = invested or (quantity * avg_price)
                fi_eq += value

            elif asset.type == AssetTypeEnum.STOCK:
                price = current_prices.get(str(asset.id), avg_price)
                stock_eq += quantity * price

            elif asset.type == AssetTypeEnum.FII:
                price = current_prices.get(str(asset.id), avg_price)
                fii_eq += quantity * price

            elif asset.type == AssetTypeEnum.CRYPTO:
                price = current_prices.get(str(asset.id), avg_price)
                crypto_eq += quantity * price

        total = stock_eq + fii_eq + crypto_eq + fi_eq

        # Só adiciona ponto se tem algum patrimônio
        if total > 0:
            entries.append(HistoryEntry(
                date=current_date,
                total_equity=round(total, 2),
                stock_equity=round(stock_eq + fii_eq, 2),
                crypto_equity=round(crypto_eq, 2),
                fixed_income_equity=round(fi_eq, 2),
            ))

        current_date += timedelta(days=1)

    return entries


@router.get("", response_model=list[HistoryEntry])
def read_history(
    period: str = Query("30d", description="Período: 7d, 30d, 90d, 1y, all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna dados para o gráfico de evolução patrimonial.

    Combina snapshots salvos (PositionHistory) com cálculo on-the-fly
    para datas que ainda não têm snapshot, dando prioridade aos dados reais.
    """
    period_days = PERIOD_MAP.get(period) if period != "all" else None

    today = date.today()
    if period_days is not None:
        start_date = today - timedelta(days=period_days)
    else:
        positions = (
            db.query(PortfolioPosition)
            .filter(PortfolioPosition.user_id == current_user.id)
            .all()
        )
        if not positions:
            return []
        earliest = min(p.created_at.date() for p in positions)
        start_date = earliest
        if (today - start_date).days > 365:
            start_date = today - timedelta(days=365)

    # Busca snapshots salvos no período
    from sqlalchemy import asc
    saved_rows = (
        db.query(PositionHistory)
        .filter(
            PositionHistory.user_id == current_user.id,
            PositionHistory.date >= start_date,
        )
        .order_by(asc(PositionHistory.date))
        .all()
    )

    saved_map = {
        r.date: HistoryEntry(
            date=r.date,
            total_equity=float(r.total_equity),
            stock_equity=float(r.stock_equity),
            crypto_equity=float(r.crypto_equity),
            fixed_income_equity=float(r.fixed_income_equity),
        )
        for r in saved_rows
    }

    # Se temos snapshots para todas as datas, retorna direto
    if saved_map:
        # Gera on-the-fly apenas para datas sem snapshot
        generated = _generate_history(db, current_user.id, period_days)
        generated_map = {e.date: e for e in generated}

        # Merge: snapshot real sobrescreve o gerado
        generated_map.update(saved_map)

        result = sorted(generated_map.values(), key=lambda e: e.date)
        return result

    # Sem nenhum snapshot salvo: gera tudo dinamicamente
    return _generate_history(db, current_user.id, period_days)
