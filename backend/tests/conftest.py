import uuid
from collections.abc import Generator
from datetime import date, datetime, timezone

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.db.base import Base
from app.db.models import (
    Asset,
    AssetQuote,
    AssetTypeEnum,
    OriginEnum,
    PlanEnum,
    PortfolioPosition,
    PositionHistory,
    User,
)
from app.db.session import get_db
from app.main import app

# SQLite in-memory para testes (sem precisar de PostgreSQL)
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Gerar chave Fernet válida para testes de criptografia
TEST_FERNET_KEY = Fernet.generate_key().decode()


@pytest.fixture(autouse=True)
def _patch_encryption_key(monkeypatch):
    """Garante que ENCRYPTION_KEY esteja configurada em todos os testes."""
    monkeypatch.setattr(settings, "ENCRYPTION_KEY", TEST_FERNET_KEY)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    """Cria tabelas, fornece sessão, derruba tudo ao final."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session) -> TestClient:
    """TestClient com DB override (sem autenticação)."""

    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def test_user(db: Session) -> User:
    """Cria e retorna um usuário de teste."""
    user = User(
        id=uuid.uuid4(),
        google_id="google_123",
        name="Tiago Teste",
        email="tiago@test.com",
        avatar_url=None,
        plan=PlanEnum.FREE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def other_user(db: Session) -> User:
    """Segundo usuário para testes de isolamento."""
    user = User(
        id=uuid.uuid4(),
        google_id="google_456",
        name="Outro User",
        email="outro@test.com",
        plan=PlanEnum.FREE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_header(test_user: User) -> dict:
    """Header Authorization com JWT válido para test_user."""
    token = create_access_token(test_user.id, test_user.plan.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_client(db: Session, test_user: User) -> TestClient:
    """TestClient autenticado como test_user."""

    def _override_get_db():
        yield db

    def _override_current_user():
        return test_user

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def sample_stock(db: Session) -> Asset:
    """Ativo PETR4 de teste."""
    asset = Asset(
        id=uuid.uuid4(),
        ticker="PETR4",
        name="Petrobras PN",
        type=AssetTypeEnum.STOCK,
        sector="Petróleo",
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@pytest.fixture()
def sample_crypto(db: Session) -> Asset:
    """Ativo BTC de teste."""
    asset = Asset(
        id=uuid.uuid4(),
        ticker="BTC",
        name="Bitcoin",
        type=AssetTypeEnum.CRYPTO,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@pytest.fixture()
def sample_fii(db: Session) -> Asset:
    """Ativo HGLG11 de teste."""
    asset = Asset(
        id=uuid.uuid4(),
        ticker="HGLG11",
        name="CSHG Logística FII",
        type=AssetTypeEnum.FII,
        sector="Logística",
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@pytest.fixture()
def sample_quote(db: Session, sample_stock: Asset) -> AssetQuote:
    """Cotação para PETR4."""
    quote = AssetQuote(
        asset_id=sample_stock.id,
        price=35.50,
        fetched_at=datetime.now(timezone.utc),
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


@pytest.fixture()
def sample_position(
    db: Session, test_user: User, sample_stock: Asset, sample_quote: AssetQuote
) -> PortfolioPosition:
    """Posição de 100 PETR4 a preço médio 30.00."""
    pos = PortfolioPosition(
        user_id=test_user.id,
        asset_id=sample_stock.id,
        quantity=100,
        average_price=30.00,
        origin=OriginEnum.MANUAL,
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return pos
