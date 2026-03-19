from uuid import UUID

from pydantic import BaseModel

from app.db.models import PlanEnum


class GoogleLoginRequest(BaseModel):
    id_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    google_id: str
    name: str
    email: str
    avatar_url: str | None
    plan: PlanEnum

    model_config = {"from_attributes": True}
