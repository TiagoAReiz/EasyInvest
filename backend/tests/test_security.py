"""Testes para app.core.security — JWT e criptografia."""
import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    decrypt_value,
    encrypt_value,
)


class TestJWT:
    def test_create_access_token_contains_correct_claims(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "FREE")
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

        assert payload["sub"] == str(user_id)
        assert payload["plan"] == "FREE"
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_create_refresh_token_contains_correct_claims(self):
        user_id = uuid.uuid4()
        token = create_refresh_token(user_id)
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"
        assert "exp" in payload
        assert "plan" not in payload

    def test_decode_valid_token(self):
        user_id = uuid.uuid4()
        token = create_access_token(user_id, "PREMIUM")
        payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["plan"] == "PREMIUM"

    def test_decode_invalid_token_returns_none(self):
        assert decode_token("token.invalido.aqui") is None

    def test_decode_wrong_secret_returns_none(self):
        user_id = uuid.uuid4()
        token = jwt.encode(
            {"sub": str(user_id), "type": "access", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "segredo-errado",
            algorithm="HS256",
        )
        assert decode_token(token) is None

    def test_decode_expired_token_returns_none(self):
        user_id = uuid.uuid4()
        token = jwt.encode(
            {"sub": str(user_id), "type": "access", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
            settings.JWT_SECRET,
            algorithm=settings.JWT_ALGORITHM,
        )
        assert decode_token(token) is None


class TestEncryption:
    def test_encrypt_decrypt_roundtrip(self):
        original = "minha-api-key-secreta"
        encrypted = encrypt_value(original)
        assert encrypted != original
        assert decrypt_value(encrypted) == original

    def test_different_values_produce_different_ciphertexts(self):
        a = encrypt_value("chave_a")
        b = encrypt_value("chave_b")
        assert a != b
