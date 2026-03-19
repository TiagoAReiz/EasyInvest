from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import PositionHistory, User
from app.db.session import get_db
from app.schemas.portfolio import HistoryEntry

router = APIRouter()

PERIOD_MAP = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
}


@router.get("", response_model=list[HistoryEntry])
def read_history(
    period: str = Query("30d", description="Período: 7d, 30d, 90d, 1y, all"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna dados do PositionHistory para o gráfico de evolução patrimonial."""
    query = db.query(PositionHistory).filter(
        PositionHistory.user_id == current_user.id
    )

    if period != "all":
        days = PERIOD_MAP.get(period, 30)
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.filter(PositionHistory.date >= since.date())

    return query.order_by(desc(PositionHistory.date)).all()
