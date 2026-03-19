"""Testes para endpoints de portfólio (/api/v1/portfolio)."""
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import (
    Asset,
    AssetQuote,
    AssetTypeEnum,
    OriginEnum,
    PortfolioPosition,
    RateTypeEnum,
)


class TestReadPortfolio:
    def test_empty_portfolio(self, auth_client):
        resp = auth_client.get("/api/v1/portfolio/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_portfolio_with_position_and_quote(self, auth_client, sample_position):
        resp = auth_client.get("/api/v1/portfolio/")
        assert resp.status_code == 200
        data = resp.json()

        assert len(data) == 1
        pos = data[0]
        assert pos["ticker"] == "PETR4"
        assert pos["quantity"] == 100.0
        assert pos["average_price"] == 30.0
        assert pos["current_price"] == 35.5
        # current_value = 100 * 35.5 = 3550
        assert pos["current_value"] == 3550.0
        # profit_loss = 3550 - (100 * 30) = 550
        assert pos["profit_loss"] == 550.0

    def test_portfolio_without_quote_has_null_values(
        self, auth_client, db: Session, test_user, sample_stock
    ):
        """Posição sem cotação deve retornar current_price/value/profit como null."""
        pos = PortfolioPosition(
            user_id=test_user.id,
            asset_id=sample_stock.id,
            quantity=50,
            average_price=28.0,
            origin=OriginEnum.MANUAL,
        )
        db.add(pos)
        db.commit()

        resp = auth_client.get("/api/v1/portfolio/")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["current_price"] is None
        assert data[0]["current_value"] is None
        assert data[0]["profit_loss"] is None


class TestPortfolioSummary:
    def test_summary_empty(self, auth_client):
        resp = auth_client.get("/api/v1/portfolio/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_equity"] == 0.0
        assert data["positions"] == []

    def test_summary_with_multiple_asset_types(
        self, auth_client, db: Session, test_user, sample_stock, sample_crypto
    ):
        # Cotações
        db.add(AssetQuote(asset_id=sample_stock.id, price=40.0, fetched_at=datetime.now(timezone.utc)))
        db.add(AssetQuote(asset_id=sample_crypto.id, price=300000.0, fetched_at=datetime.now(timezone.utc)))

        # Posições
        db.add(PortfolioPosition(
            user_id=test_user.id, asset_id=sample_stock.id,
            quantity=100, average_price=30.0, origin=OriginEnum.MANUAL,
        ))
        db.add(PortfolioPosition(
            user_id=test_user.id, asset_id=sample_crypto.id,
            quantity=0.5, average_price=200000.0, origin=OriginEnum.MANUAL,
        ))
        db.commit()

        resp = auth_client.get("/api/v1/portfolio/summary")
        data = resp.json()

        assert data["stock_equity"] == 4000.0  # 100 * 40
        assert data["crypto_equity"] == 150000.0  # 0.5 * 300000
        assert data["total_equity"] == 154000.0
        assert len(data["positions"]) == 2


class TestCreatePosition:
    def test_create_position_success(self, auth_client, sample_stock):
        resp = auth_client.post("/api/v1/portfolio/position", json={
            "asset_id": str(sample_stock.id),
            "quantity": 200,
            "average_price": 32.50,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["quantity"] == 200.0
        assert data["average_price"] == 32.5
        assert data["origin"] == "MANUAL"

    def test_create_position_with_fixed_income_fields(self, auth_client, db: Session):
        fi_asset = Asset(
            ticker="CDB_INTER_120",
            name="CDB Inter 120% CDI",
            type=AssetTypeEnum.FIXED_INCOME,
        )
        db.add(fi_asset)
        db.commit()
        db.refresh(fi_asset)

        resp = auth_client.post("/api/v1/portfolio/position", json={
            "asset_id": str(fi_asset.id),
            "quantity": 1,
            "average_price": 0,
            "rate_type": "CDI_PERCENTAGE",
            "rate_value": 120.0,
            "investment_date": "2025-01-15",
            "maturity_date": "2027-01-15",
            "invested_amount": 10000.0,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["rate_type"] == "CDI_PERCENTAGE"
        assert data["rate_value"] == 120.0
        assert data["invested_amount"] == 10000.0

    def test_create_position_nonexistent_asset_returns_404(self, auth_client):
        resp = auth_client.post("/api/v1/portfolio/position", json={
            "asset_id": str(uuid.uuid4()),
            "quantity": 10,
            "average_price": 50.0,
        })
        assert resp.status_code == 404


class TestUpdatePosition:
    def test_update_position_success(self, auth_client, sample_position):
        resp = auth_client.put(
            f"/api/v1/portfolio/position/{sample_position.id}",
            json={"quantity": 150, "average_price": 31.50},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["quantity"] == 150.0
        assert data["average_price"] == 31.5

    def test_update_partial_fields(self, auth_client, sample_position):
        resp = auth_client.put(
            f"/api/v1/portfolio/position/{sample_position.id}",
            json={"institution_name": "XP Investimentos"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["institution_name"] == "XP Investimentos"
        assert data["quantity"] == 100.0  # não alterou

    def test_update_nonexistent_position_returns_404(self, auth_client):
        resp = auth_client.put(
            f"/api/v1/portfolio/position/{uuid.uuid4()}",
            json={"quantity": 10},
        )
        assert resp.status_code == 404


class TestDeletePosition:
    def test_delete_position_success(self, auth_client, sample_position, db: Session):
        resp = auth_client.delete(f"/api/v1/portfolio/position/{sample_position.id}")
        assert resp.status_code == 204

        remaining = db.query(PortfolioPosition).filter(
            PortfolioPosition.id == sample_position.id
        ).first()
        assert remaining is None

    def test_delete_nonexistent_position_returns_404(self, auth_client):
        resp = auth_client.delete(f"/api/v1/portfolio/position/{uuid.uuid4()}")
        assert resp.status_code == 404


class TestPortfolioIsolation:
    """Garante que um usuário não vê/modifica dados de outro."""

    def test_user_cannot_see_other_users_positions(
        self, db: Session, other_user, sample_stock, sample_quote, auth_client
    ):
        pos = PortfolioPosition(
            user_id=other_user.id,
            asset_id=sample_stock.id,
            quantity=999,
            average_price=10.0,
            origin=OriginEnum.MANUAL,
        )
        db.add(pos)
        db.commit()

        resp = auth_client.get("/api/v1/portfolio/")
        assert resp.json() == []

    def test_user_cannot_delete_other_users_position(
        self, db: Session, other_user, sample_stock, auth_client
    ):
        pos = PortfolioPosition(
            user_id=other_user.id,
            asset_id=sample_stock.id,
            quantity=10,
            average_price=10.0,
            origin=OriginEnum.MANUAL,
        )
        db.add(pos)
        db.commit()
        db.refresh(pos)

        resp = auth_client.delete(f"/api/v1/portfolio/position/{pos.id}")
        assert resp.status_code == 404
