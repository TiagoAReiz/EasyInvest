"""Testes para endpoints de conexões (/api/v1/connections)."""
import uuid

from sqlalchemy.orm import Session

from app.core.security import decrypt_value
from app.db.models import ConnectionStatusEnum, ConnectionTypeEnum, WalletConnection


class TestListConnections:
    def test_list_empty(self, auth_client):
        resp = auth_client.get("/api/v1/connections/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_only_own_connections(
        self, auth_client, db: Session, test_user, other_user
    ):
        db.add(WalletConnection(
            user_id=test_user.id, type=ConnectionTypeEnum.BINANCE,
            api_key_encrypted="enc1", api_secret_encrypted="enc1",
            status=ConnectionStatusEnum.ACTIVE,
        ))
        db.add(WalletConnection(
            user_id=other_user.id, type=ConnectionTypeEnum.BINANCE,
            api_key_encrypted="enc2", api_secret_encrypted="enc2",
            status=ConnectionStatusEnum.ACTIVE,
        ))
        db.commit()

        resp = auth_client.get("/api/v1/connections/")
        assert len(resp.json()) == 1


class TestCreateConnection:
    def test_create_connection_success(self, auth_client, db: Session):
        resp = auth_client.post("/api/v1/connections/", json={
            "type": "BINANCE",
            "label": "Minha Binance",
            "api_key": "key123",
            "api_secret": "secret456",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "BINANCE"
        assert data["label"] == "Minha Binance"
        assert data["status"] == "ACTIVE"
        # Verifica que não retorna as keys em plaintext
        assert "api_key" not in data
        assert "api_secret" not in data

    def test_api_keys_are_encrypted_in_db(self, auth_client, db: Session):
        auth_client.post("/api/v1/connections/", json={
            "type": "MERCADO_BITCOIN",
            "api_key": "minha_key",
            "api_secret": "meu_secret",
        })

        conn = db.query(WalletConnection).first()
        assert conn.api_key_encrypted != "minha_key"
        assert conn.api_secret_encrypted != "meu_secret"
        # Mas descriptografando, voltam ao original
        assert decrypt_value(conn.api_key_encrypted) == "minha_key"
        assert decrypt_value(conn.api_secret_encrypted) == "meu_secret"


class TestDeleteConnection:
    def test_delete_success(self, auth_client, db: Session, test_user):
        conn = WalletConnection(
            user_id=test_user.id, type=ConnectionTypeEnum.BINANCE,
            api_key_encrypted="enc", api_secret_encrypted="enc",
            status=ConnectionStatusEnum.ACTIVE,
        )
        db.add(conn)
        db.commit()
        db.refresh(conn)

        resp = auth_client.delete(f"/api/v1/connections/{conn.id}")
        assert resp.status_code == 204

        assert db.query(WalletConnection).filter(WalletConnection.id == conn.id).first() is None

    def test_delete_nonexistent_returns_404(self, auth_client):
        resp = auth_client.delete(f"/api/v1/connections/{uuid.uuid4()}")
        assert resp.status_code == 404

    def test_cannot_delete_other_users_connection(
        self, auth_client, db: Session, other_user
    ):
        conn = WalletConnection(
            user_id=other_user.id, type=ConnectionTypeEnum.BINANCE,
            api_key_encrypted="enc", api_secret_encrypted="enc",
            status=ConnectionStatusEnum.ACTIVE,
        )
        db.add(conn)
        db.commit()
        db.refresh(conn)

        resp = auth_client.delete(f"/api/v1/connections/{conn.id}")
        assert resp.status_code == 404


class TestSyncConnection:
    def test_sync_returns_connection(self, auth_client, db: Session, test_user):
        conn = WalletConnection(
            user_id=test_user.id, type=ConnectionTypeEnum.BINANCE,
            api_key_encrypted="enc", api_secret_encrypted="enc",
            status=ConnectionStatusEnum.ACTIVE,
        )
        db.add(conn)
        db.commit()
        db.refresh(conn)

        resp = auth_client.post(f"/api/v1/connections/{conn.id}/sync")
        assert resp.status_code == 200
        assert resp.json()["id"] == str(conn.id)

    def test_sync_nonexistent_returns_404(self, auth_client):
        resp = auth_client.post(f"/api/v1/connections/{uuid.uuid4()}/sync")
        assert resp.status_code == 404
