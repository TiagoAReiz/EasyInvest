"""Testes para endpoints de ativos (/api/v1/assets)."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.models import Asset, AssetQuote, AssetTypeEnum


class TestSearchAssets:
    def test_search_by_ticker(self, auth_client, sample_stock):
        resp = auth_client.get("/api/v1/assets/search", params={"q": "PETR"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["ticker"] == "PETR4"

    def test_search_by_name(self, auth_client, sample_stock):
        resp = auth_client.get("/api/v1/assets/search", params={"q": "petrobras"})
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_search_case_insensitive(self, auth_client, sample_stock):
        resp = auth_client.get("/api/v1/assets/search", params={"q": "petr4"})
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_search_no_results(self, auth_client, sample_stock):
        resp = auth_client.get("/api/v1/assets/search", params={"q": "XYZW"})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_search_multiple_results(self, auth_client, db: Session, sample_stock):
        db.add(Asset(ticker="PETR3", name="Petrobras ON", type=AssetTypeEnum.STOCK))
        db.commit()

        resp = auth_client.get("/api/v1/assets/search", params={"q": "PETR"})
        assert len(resp.json()) == 2

    def test_search_requires_query_param(self, auth_client):
        resp = auth_client.get("/api/v1/assets/search")
        assert resp.status_code == 422


class TestAssetQuotes:
    def test_get_quotes(self, auth_client, sample_stock, sample_quote):
        resp = auth_client.get(f"/api/v1/assets/{sample_stock.id}/quotes")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["price"] == 35.5

    def test_get_quotes_nonexistent_asset(self, auth_client):
        resp = auth_client.get(f"/api/v1/assets/{uuid.uuid4()}/quotes")
        assert resp.status_code == 404

    def test_get_quotes_period_filter(self, auth_client, db: Session, sample_stock):
        now = datetime.now(timezone.utc)
        # Cotação de hoje
        db.add(AssetQuote(asset_id=sample_stock.id, price=35.0, fetched_at=now))
        # Cotação de 60 dias atrás (fora do range 30d)
        db.add(AssetQuote(asset_id=sample_stock.id, price=30.0, fetched_at=now - timedelta(days=60)))
        db.commit()

        resp_30d = auth_client.get(f"/api/v1/assets/{sample_stock.id}/quotes", params={"period": "30d"})
        assert len(resp_30d.json()) == 1

        resp_90d = auth_client.get(f"/api/v1/assets/{sample_stock.id}/quotes", params={"period": "90d"})
        assert len(resp_90d.json()) == 2

    def test_get_quotes_period_all(self, auth_client, db: Session, sample_stock):
        now = datetime.now(timezone.utc)
        db.add(AssetQuote(asset_id=sample_stock.id, price=35.0, fetched_at=now))
        db.add(AssetQuote(asset_id=sample_stock.id, price=10.0, fetched_at=now - timedelta(days=400)))
        db.commit()

        resp = auth_client.get(f"/api/v1/assets/{sample_stock.id}/quotes", params={"period": "all"})
        assert len(resp.json()) == 2
