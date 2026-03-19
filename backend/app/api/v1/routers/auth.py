from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import (
    GoogleLoginRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import generate_tokens, upsert_user, verify_google_token

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Recebe id_token do Google, faz UPSERT no User, retorna JWT próprio."""
    try:
        google_claims = verify_google_token(body.id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token do Google inválido",
        )

    user = upsert_user(db, google_claims)
    return generate_tokens(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """Renova o par de tokens usando o refresh_token."""
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado",
        )

    user = db.query(User).filter(User.id == UUID(payload["sub"])).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
        )

    return generate_tokens(user)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Retorna dados do usuário logado."""
    return current_user
