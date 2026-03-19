from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.db.models import User


def verify_google_token(token: str) -> dict:
    """Valida o id_token do Google e retorna os claims (email, name, sub, picture)."""
    idinfo = google_id_token.verify_oauth2_token(
        token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
    )
    return idinfo


def upsert_user(db: Session, google_claims: dict) -> User:
    """Cria ou atualiza o usuário com base nos dados do Google."""
    user = db.query(User).filter(User.google_id == google_claims["sub"]).first()

    if user is None:
        user = User(
            google_id=google_claims["sub"],
            email=google_claims["email"],
            name=google_claims.get("name", ""),
            avatar_url=google_claims.get("picture"),
        )
        db.add(user)
    else:
        user.name = google_claims.get("name", user.name)
        user.avatar_url = google_claims.get("picture", user.avatar_url)

    db.commit()
    db.refresh(user)
    return user


def generate_tokens(user: User) -> dict:
    """Gera par access_token + refresh_token para o usuário."""
    return {
        "access_token": create_access_token(user.id, user.plan.value),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }
