import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Uuid,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# ---------- Enums ----------

class PlanEnum(str, enum.Enum):
    FREE = "FREE"
    PREMIUM = "PREMIUM"


class ConnectionTypeEnum(str, enum.Enum):
    BINANCE = "BINANCE"
    MERCADO_BITCOIN = "MERCADO_BITCOIN"
    B3_OAUTH = "B3_OAUTH"
    PLUGGY = "PLUGGY"


class ConnectionStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ERROR = "ERROR"
    REVOKED = "REVOKED"


class AssetTypeEnum(str, enum.Enum):
    STOCK = "STOCK"
    FII = "FII"
    CRYPTO = "CRYPTO"
    FIXED_INCOME = "FIXED_INCOME"
    CASH = "CASH"


class OriginEnum(str, enum.Enum):
    MANUAL = "MANUAL"
    BINANCE_API = "BINANCE_API"
    B3_API = "B3_API"


class RateTypeEnum(str, enum.Enum):
    CDI_PERCENTAGE = "CDI_PERCENTAGE"
    CDI_PLUS = "CDI_PLUS"
    PREFIXED = "PREFIXED"
    IPCA_PLUS = "IPCA_PLUS"


# ---------- Models ----------

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    google_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    plan: Mapped[PlanEnum] = mapped_column(
        Enum(PlanEnum), default=PlanEnum.FREE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    connections: Mapped[list["WalletConnection"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    positions: Mapped[list["PortfolioPosition"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    history: Mapped[list["PositionHistory"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class WalletConnection(Base):
    __tablename__ = "wallet_connections"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE")
    )
    type: Mapped[ConnectionTypeEnum] = mapped_column(Enum(ConnectionTypeEnum))
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    api_key_encrypted: Mapped[str] = mapped_column(String)
    api_secret_encrypted: Mapped[str] = mapped_column(String)
    status: Mapped[ConnectionStatusEnum] = mapped_column(
        Enum(ConnectionStatusEnum), default=ConnectionStatusEnum.ACTIVE
    )
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="connections")


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    ticker: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    type: Mapped[AssetTypeEnum] = mapped_column(Enum(AssetTypeEnum))
    sector: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    quotes: Mapped[list["AssetQuote"]] = relationship(
        back_populates="asset", cascade="all, delete-orphan"
    )
    positions: Mapped[list["PortfolioPosition"]] = relationship(
        back_populates="asset"
    )


class AssetQuote(Base):
    __tablename__ = "asset_quotes"
    __table_args__ = (
        Index("ix_asset_quotes_asset_fetched", "asset_id", "fetched_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("assets.id", ondelete="CASCADE")
    )
    price: Mapped[float] = mapped_column(Numeric(18, 8))
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    asset: Mapped["Asset"] = relationship(back_populates="quotes")


class PortfolioPosition(Base):
    __tablename__ = "portfolio_positions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE")
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("assets.id")
    )
    quantity: Mapped[float] = mapped_column(Numeric(18, 8))
    average_price: Mapped[float] = mapped_column(Numeric(18, 8))
    origin: Mapped[OriginEnum] = mapped_column(
        Enum(OriginEnum), default=OriginEnum.MANUAL
    )
    institution_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Campos exclusivos para Renda Fixa
    rate_type: Mapped[RateTypeEnum | None] = mapped_column(
        Enum(RateTypeEnum), nullable=True
    )
    rate_value: Mapped[float | None] = mapped_column(
        Numeric(10, 4), nullable=True
    )
    investment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    maturity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    invested_amount: Mapped[float | None] = mapped_column(
        Numeric(18, 2), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="positions")
    asset: Mapped["Asset"] = relationship(back_populates="positions")


class PositionHistory(Base):
    __tablename__ = "position_history"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
        Index("ix_position_history_user_date", "user_id", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE")
    )
    date: Mapped[date] = mapped_column(Date)
    total_equity: Mapped[float] = mapped_column(Numeric(18, 2))
    crypto_equity: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    stock_equity: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    fixed_income_equity: Mapped[float] = mapped_column(Numeric(18, 2), default=0)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="history")
