from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import ConnectionStatusEnum, ConnectionTypeEnum


class ConnectionCreate(BaseModel):
    type: ConnectionTypeEnum
    label: str | None = None
    api_key: str
    api_secret: str


class ConnectionResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: ConnectionTypeEnum
    label: str | None
    status: ConnectionStatusEnum
    last_synced_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
