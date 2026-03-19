from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import Asset, AssetQuote, User
from app.db.session import get_db
from app.schemas.asset import AssetQuoteResponse, AssetResponse
from app.services.brapi import get_or_create_asset, search_brapi

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

    # 2. Se poucos resultados locais, busca na brapi.dev e cria no banco
    if len(local_results) < 5:
        brapi_results = search_brapi(q)
        local_tickers = {a.ticker for a in local_results}

        for item in brapi_results:
            if item["ticker"] not in local_tickers:
                try:
                    asset = get_or_create_asset(db, item["ticker"])
                    local_results.append(asset)
                    local_tickers.add(asset.ticker)
                except Exception:
                    continue  # Se falhar um, continua pros outros

                if len(local_results) >= 20:
                    break

    return local_results


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
