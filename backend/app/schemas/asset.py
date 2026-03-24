from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import AssetTypeEnum


class AssetResponse(BaseModel):
    id: UUID
    ticker: str
    name: str
    type: AssetTypeEnum
    sector: str | None 

    model_config = {"from_attributes": True}


class AssetQuoteResponse(BaseModel):
    id: UUID
    asset_id: UUID
    price: float
    fetched_at: datetime

    model_config = {"from_attributes": True}


class AssetCurrentPriceResponse(BaseModel):
    asset_id: UUID
    ticker: str
    price: float | None


class FixedIncomeAssetCreate(BaseModel):
    name: str
    ticker: str | None = None
