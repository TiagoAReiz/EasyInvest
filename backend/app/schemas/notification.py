from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import NotificationTypeEnum


class NotificationResponse(BaseModel):
    id: UUID
    type: NotificationTypeEnum
    title: str
    body: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    type: NotificationTypeEnum
    title: str
    body: str
