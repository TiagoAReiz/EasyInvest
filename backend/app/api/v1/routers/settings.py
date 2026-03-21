from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.models import User, UserSettings
from app.db.session import get_db
from app.schemas.settings import UserSettingsResponse, UserSettingsUpdate

router = APIRouter()


def _get_or_create_settings(db: Session, user_id) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=UserSettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna as preferências do usuário (cria com defaults se não existir)."""
    return _get_or_create_settings(db, current_user.id)


@router.patch("", response_model=UserSettingsResponse)
def update_settings(
    body: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza parcialmente as preferências do usuário."""
    settings = _get_or_create_settings(db, current_user.id)
    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
