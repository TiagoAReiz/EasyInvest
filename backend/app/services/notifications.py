from uuid import UUID

from sqlalchemy.orm import Session

from app.db.models import Notification, NotificationTypeEnum


def create_notification(
    db: Session,
    user_id: UUID,
    type: NotificationTypeEnum,
    title: str,
    body: str,
) -> Notification:
    """Cria uma notificação para o usuário."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
