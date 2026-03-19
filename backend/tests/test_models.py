"""Testes para modelos SQLAlchemy — validação de schema e constraints."""
from datetime import date, datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import (
    Asset,
    AssetTypeEnum,
    OriginEnum,
    PlanEnum,
    PortfolioPosition,
    PositionHistory,
    RateTypeEnum,
    User,
)


class TestUserModel:
    def test_create_user(self, db: Session, test_user: User):
        assert test_user.id is not None
        assert test_user.plan == PlanEnum.FREE

    def test_unique_email(self, db: Session, test_user):
        dup = User(
            google_id="google_dup",
            name="Dup",
            email=test_user.email,  # mesmo email
        )
        db.add(dup)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

    def test_unique_google_id(self, db: Session, test_user):
        dup = User(
            google_id=test_user.google_id,  # mesmo google_id
            name="Dup",
            email="outro-email@test.com",
        )
        db.add(dup)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


class TestAssetModel:
    def test_unique_ticker(self, db: Session, sample_stock):
        dup = Asset(ticker="PETR4", name="Duplicada", type=AssetTypeEnum.STOCK)
        db.add(dup)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


class TestPositionHistoryModel:
    def test_unique_user_date(self, db: Session, test_user):
        today = date.today()
        h1 = PositionHistory(
            user_id=test_user.id, date=today,
            total_equity=100, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        )
        h2 = PositionHistory(
            user_id=test_user.id, date=today,
            total_equity=200, crypto_equity=0, stock_equity=0, fixed_income_equity=0,
        )
        db.add(h1)
        db.commit()
        db.add(h2)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


class TestPortfolioPositionFixedIncome:
    def test_fixed_income_fields(self, db: Session, test_user):
        fi_asset = Asset(
            ticker="CDB_TEST", name="CDB Teste", type=AssetTypeEnum.FIXED_INCOME,
        )
        db.add(fi_asset)
        db.commit()
        db.refresh(fi_asset)

        pos = PortfolioPosition(
            user_id=test_user.id,
            asset_id=fi_asset.id,
            quantity=1,
            average_price=0,
            origin=OriginEnum.MANUAL,
            rate_type=RateTypeEnum.CDI_PERCENTAGE,
            rate_value=120.0,
            investment_date=date(2025, 1, 15),
            maturity_date=date(2027, 1, 15),
            invested_amount=10000.0,
        )
        db.add(pos)
        db.commit()
        db.refresh(pos)

        assert pos.rate_type == RateTypeEnum.CDI_PERCENTAGE
        assert float(pos.rate_value) == 120.0
        assert float(pos.invested_amount) == 10000.0

    def test_stock_position_fi_fields_are_null(self, db: Session, sample_position):
        assert sample_position.rate_type is None
        assert sample_position.rate_value is None
        assert sample_position.invested_amount is None
