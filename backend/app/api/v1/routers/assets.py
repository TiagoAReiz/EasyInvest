from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import Asset, AssetQuote, User
from app.db.session import get_db
from app.schemas.asset import AssetCurrentPriceResponse, AssetQuoteResponse, AssetResponse
from app.services.brapi import get_or_create_assets_batch, get_quote_brapi, search_brapi

router = APIRouter()

PERIOD_MAP = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
}


@router.get("/search", response_model=list[AssetResponse])
def search_assets(
    q: str = Query(..., min_length=1, description="Busca por ticker ou nome"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Busca ativos no catálogo local e na brapi.dev."""
    pattern = f"%{q.upper()}%"

    # 1. Busca no banco local primeiro
    local_results = (
        db.query(Asset)
        .filter(Asset.ticker.ilike(pattern) | Asset.name.ilike(pattern))
        .limit(20)
        .all()
    )

    # 2. Se poucos resultados locais, busca na brapi.dev e cria em batch
    if len(local_results) < 5:
        brapi_results = search_brapi(q)
        local_tickers = {a.ticker for a in local_results}

        # Filtra tickers novos que ainda não temos
        new_tickers = [
            item["ticker"]
            for item in brapi_results
            if item["ticker"] not in local_tickers
        ]

        # Limita para não passar de 20 resultados totais
        slots = 20 - len(local_results)
        new_tickers = new_tickers[:slots]

        if new_tickers:
            # Uma única chamada batch em vez de N chamadas individuais
            new_assets = get_or_create_assets_batch(db, new_tickers)
            local_results.extend(new_assets)

    return local_results


@router.get("/{asset_id}/price", response_model=AssetCurrentPriceResponse)
def asset_current_price(
    asset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna o preço atual de um ativo (busca na brapi com cache)."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ativo não encontrado",
        )

    price = get_quote_brapi(asset.ticker)

    return AssetCurrentPriceResponse(
        asset_id=asset.id,
        ticker=asset.ticker,
        price=price,
    )


@router.get("/{asset_id}/quotes", response_model=list[AssetQuoteResponse])
def asset_quotes(
    asset_id: UUID,
    period: str = Query("30d", description="Período: 7d, 30d, 90d, 1y, all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Histórico de cotações de um ativo específico."""
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ativo não encontrado",
        )

    query = db.query(AssetQuote).filter(AssetQuote.asset_id == asset_id)

    if period != "all":
        days = PERIOD_MAP.get(period, 30)
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.filter(AssetQuote.fetched_at >= since)

    return query.order_by(desc(AssetQuote.fetched_at)).all()
