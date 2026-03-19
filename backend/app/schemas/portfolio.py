from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import AssetTypeEnum, OriginEnum, RateTypeEnum


class PositionCreate(BaseModel):
    asset_id: UUID
    quantity: float
    average_price: float
    origin: OriginEnum = OriginEnum.MANUAL
    institution_name: str | None = None
    # Campos de renda fixa (opcionais)
    rate_type: RateTypeEnum | None = None
    rate_value: float | None = None
    investment_date: date | None = None
    maturity_date: date | None = None
    invested_amount: float | None = None


class PositionUpdate(BaseModel):
    quantity: float | None = None
    average_price: float | None = None
    institution_name: str | None = None
    rate_type: RateTypeEnum | None = None
    rate_value: float | None = None
    investment_date: date | None = None
    maturity_date: date | None = None
    invested_amount: float | None = None


class PositionResponse(BaseModel):
    id: UUID
    user_id: UUID
    asset_id: UUID
    quantity: float
    average_price: float
    origin: OriginEnum
    institution_name: str | None
    rate_type: RateTypeEnum | None
    rate_value: float | None
    investment_date: date | None
    maturity_date: date | None
    invested_amount: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PositionWithQuote(PositionResponse):
    """Posição enriquecida com dados do ativo e cotação atual."""
    ticker: str
    asset_name: str
    asset_type: AssetTypeEnum
    current_price: float | None = None
    current_value: float | None = None
    profit_loss: float | None = None


class PortfolioSummary(BaseModel):
    total_equity: float
    stock_equity: float
    fii_equity: float
    crypto_equity: float
    fixed_income_equity: float
    cash_equity: float
    positions: list[PositionWithQuote]


class HistoryEntry(BaseModel):
    date: date
    total_equity: float
    crypto_equity: float
    stock_equity: float
    fixed_income_equity: float

    model_config = {"from_attributes": True}
