"""Testes para endpoint de histórico (/api/v1/portfolio/history)."""
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.db.models import PositionHistory, User


class TestReadHistory:
    def test_empty_history(self, auth_client):
        resp = auth_client.get("/api/v1/portfolio/history/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_history_entries(self, auth_client, db: Session, test_user: User):
        today = date.today()
        db.add(PositionHistory(
            user_id=test_user.id, date=today,
            total_equity=50000.0, crypto_equity=20000.0,
            stock_equity=25000.0, fixed_income_equity=5000.0,
        ))
        db.add(PositionHistory(
            user_id=test_user.id, date=today - timedelta(days=1),
            total_equity=49000.0, crypto_equity=19500.0,
            stock_equity=24500.0, fixed_income_equity=5000.0,
        ))
        db.commit()

        resp = auth_client.get("/api/v1/portfolio/history/")
        data = resp.json()
        assert len(data) == 2
        # Ordenado por data DESC
        assert data[0]["total_equity"] == 50000.0
        assert data[1]["total_equity"] == 49000.0

    def test_period_filter(self, auth_client, db: Session, test_user: User):
        today = date.today()
        db.add(PositionHistory(
            user_id=test_user.id, date=today,
            total_equity=50000.0, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        ))
        db.add(PositionHistory(
            user_id=test_user.id, date=today - timedelta(days=15),
            total_equity=45000.0, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        ))
        db.add(PositionHistory(
            user_id=test_user.id, date=today - timedelta(days=60),
            total_equity=40000.0, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        ))
        db.commit()

        resp_7d = auth_client.get("/api/v1/portfolio/history/", params={"period": "7d"})
        assert len(resp_7d.json()) == 1

        resp_30d = auth_client.get("/api/v1/portfolio/history/", params={"period": "30d"})
        assert len(resp_30d.json()) == 2

        resp_all = auth_client.get("/api/v1/portfolio/history/", params={"period": "all"})
        assert len(resp_all.json()) == 3

    def test_isolation_between_users(
        self, auth_client, db: Session, test_user, other_user
    ):
        today = date.today()
        db.add(PositionHistory(
            user_id=test_user.id, date=today,
            total_equity=10000.0, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        ))
        db.add(PositionHistory(
            user_id=other_user.id, date=today,
            total_equity=99999.0, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        ))
        db.commit()

        resp = auth_client.get("/api/v1/portfolio/history/")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["total_equity"] == 10000.0
