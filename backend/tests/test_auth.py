"""Testes para endpoints de autenticação (/api/v1/auth)."""
import uuid
from unittest.mock import patch

from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.db.models import PlanEnum, User


class TestLogin:
    GOOGLE_CLAIMS = {
        "sub": "google_new_user",
        "email": "novo@test.com",
        "name": "Novo User",
        "picture": "https://example.com/avatar.png",
    }

    @patch("app.api.v1.routers.auth.verify_google_token")
    def test_login_creates_new_user(self, mock_verify, client, db: Session):
        mock_verify.return_value = self.GOOGLE_CLAIMS

        resp = client.post("/api/v1/auth/login", json={"id_token": "fake-token"})

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        user = db.query(User).filter(User.google_id == "google_new_user").first()
        assert user is not None
        assert user.email == "novo@test.com"

    @patch("app.api.v1.routers.auth.verify_google_token")
    def test_login_updates_existing_user(self, mock_verify, client, db: Session, test_user):
        mock_verify.return_value = {
            "sub": test_user.google_id,
            "email": test_user.email,
            "name": "Nome Atualizado",
            "picture": "https://new-avatar.com/pic.png",
        }

        resp = client.post("/api/v1/auth/login", json={"id_token": "fake-token"})
        assert resp.status_code == 200

        db.refresh(test_user)
        assert test_user.name == "Nome Atualizado"
        assert test_user.avatar_url == "https://new-avatar.com/pic.png"

    @patch("app.api.v1.routers.auth.verify_google_token", side_effect=ValueError("invalid"))
    def test_login_invalid_google_token_returns_401(self, mock_verify, client):
        resp = client.post("/api/v1/auth/login", json={"id_token": "bad-token"})
        assert resp.status_code == 401


class TestRefresh:
    def test_refresh_returns_new_tokens(self, client, test_user):
        refresh_token = create_refresh_token(test_user.id)

        resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_with_access_token_fails(self, client, test_user):
        access_token = create_access_token(test_user.id, "FREE")

        resp = client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})
        assert resp.status_code == 401

    def test_refresh_with_invalid_token_fails(self, client):
        resp = client.post("/api/v1/auth/refresh", json={"refresh_token": "lixo"})
        assert resp.status_code == 401

    def test_refresh_with_nonexistent_user_fails(self, client):
        refresh_token = create_refresh_token(uuid.uuid4())

        resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 401


class TestMe:
    def test_me_returns_user_data(self, auth_client, test_user):
        resp = auth_client.get("/api/v1/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name
        assert data["plan"] == "FREE"

    def test_me_without_token_returns_401(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401
