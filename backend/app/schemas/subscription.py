from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class PlanMonths(int, Enum):
    ONE = 1
    THREE = 3
    SIX = 6
    TWELVE = 12


class PlanOption(BaseModel):
    plan_months: int
    price: float
    price_per_month: float
    label: str
    discount_percent: float


class PaywallStatusResponse(BaseModel):
    enabled: bool
    plans: list[PlanOption]
    user_plan: str | None = None
    expires_at: datetime | None = None


class CheckoutRequest(BaseModel):
    plan_months: PlanMonths


class CheckoutResponse(BaseModel):
    checkout_url: str


class SubscriptionResponse(BaseModel):
    id: UUID
    plan_months: int
    amount: float
    status: str
    starts_at: datetime
    expires_at: datetime
