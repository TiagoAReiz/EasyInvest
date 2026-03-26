import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
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
    MERCADO_BITCOIN_API = "MERCADO_BITCOIN_API"
    B3_API = "B3_API"


class RateTypeEnum(str, enum.Enum):
    CDI_PERCENTAGE = "CDI_PERCENTAGE"
    CDI_PLUS = "CDI_PLUS"
    PREFIXED = "PREFIXED"
    IPCA_PLUS = "IPCA_PLUS"


class SubscriptionStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class TransactionTypeEnum(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"
    UPDATE = "UPDATE"


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

    token_version: Mapped[int] = mapped_column(default=0)

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
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    settings: Mapped["UserSettings | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
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
    connection_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("wallet_connections.id", ondelete="SET NULL"), nullable=True
    )
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
    transactions: Mapped[list["PositionTransaction"]] = relationship(
        back_populates="position", cascade="all, delete-orphan"
    )


class PositionTransaction(Base):
    """Log de movimentações de cada posição — nunca perde dados originais."""
    __tablename__ = "position_transactions"
    __table_args__ = (
        Index("ix_position_transactions_position", "position_id"),
        Index("ix_position_transactions_user_date", "user_id", "date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    position_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("portfolio_positions.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE")
    )
    type: Mapped[TransactionTypeEnum] = mapped_column(Enum(TransactionTypeEnum))
    quantity: Mapped[float] = mapped_column(Numeric(18, 8))
    price: Mapped[float] = mapped_column(Numeric(18, 8))
    date: Mapped[date] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    position: Mapped["PortfolioPosition"] = relationship(back_populates="transactions")
    user: Mapped["User"] = relationship()


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


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE")
    )
    mp_payment_id: Mapped[str] = mapped_column(String, unique=True)
    plan_months: Mapped[int] = mapped_column()
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[SubscriptionStatusEnum] = mapped_column(
        Enum(SubscriptionStatusEnum), default=SubscriptionStatusEnum.PENDING
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="subscriptions")


class NotificationTypeEnum(str, enum.Enum):
    PRICE = "PRICE"
    SYNC = "SYNC"
    DIVIDEND = "DIVIDEND"
    MATURITY = "MATURITY"


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    theme: Mapped[str] = mapped_column(String, default="dark")
    notif_price_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_dividends: Mapped[bool] = mapped_column(Boolean, default=True)
    notif_sync: Mapped[bool] = mapped_column(Boolean, default=False)
    notif_maturity: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="settings")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE")
    )
    type: Mapped[NotificationTypeEnum] = mapped_column(Enum(NotificationTypeEnum))
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(String)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")
