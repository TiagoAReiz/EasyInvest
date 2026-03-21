import base64
import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = settings.JWT_ALGORITHM


def create_access_token(user_id: UUID, plan: str, token_version: int = 0) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        seconds=settings.JWT_ACCESS_TOKEN_EXPIRATION_SECONDS
    )
    payload = {
        "sub": str(user_id),
        "plan": plan,
        "type": "access",
        "tv": token_version,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        seconds=settings.JWT_REFRESH_TOKEN_EXPIRATION_SECONDS
    )
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica e valida um JWT. Retorna o payload ou None se inválido."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ---------- Criptografia AES para WalletConnection ----------

def encrypt_value(value: str) -> str:
    """Criptografia simples com Fernet (AES-128-CBC via cryptography lib).
    Para AES-256-GCM em produção, migrar para cryptography.hazmat.
    """
    from cryptography.fernet import Fernet

    key = settings.ENCRYPTION_KEY.encode()
    # Fernet exige chave base64-url de 32 bytes; se a env var já estiver nesse
    # formato, usamos direto. Caso contrário, derivamos.
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    from cryptography.fernet import Fernet

    key = settings.ENCRYPTION_KEY.encode()
    f = Fernet(key)
    return f.decrypt(encrypted.encode()).decode()
