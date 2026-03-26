// Enums espelhando backend/app/db/models.py

export enum AssetTypeEnum {
  STOCK = "STOCK",
  FII = "FII",
  CRYPTO = "CRYPTO",
  FIXED_INCOME = "FIXED_INCOME",
  CASH = "CASH",
}

export enum OriginEnum {
  MANUAL = "MANUAL",
  BINANCE_API = "BINANCE_API",
  MERCADO_BITCOIN_API = "MERCADO_BITCOIN_API",
  B3_API = "B3_API",
}

export enum RateTypeEnum {
  CDI_PERCENTAGE = "CDI_PERCENTAGE",
  CDI_PLUS = "CDI_PLUS",
  PREFIXED = "PREFIXED",
  IPCA_PLUS = "IPCA_PLUS",
}

export enum ConnectionTypeEnum {
  BINANCE = "BINANCE",
  MERCADO_BITCOIN = "MERCADO_BITCOIN",
  B3_OAUTH = "B3_OAUTH",
  PLUGGY = "PLUGGY",
}

export enum ConnectionStatusEnum {
  ACTIVE = "ACTIVE",
  ERROR = "ERROR",
  REVOKED = "REVOKED",
}

export enum PlanEnum {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
}

// Auth responses

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  google_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  plan: PlanEnum;
}

// Asset responses

export interface AssetResponse {
  id: string;
  ticker: string;
  name: string;
  type: AssetTypeEnum;
  sector: string | null;
}

export interface AssetQuoteResponse {
  id: string;
  asset_id: string;
  price: number;
  fetched_at: string;
}

// Portfolio

export interface PositionWithQuote {
  id: string;
  user_id: string;
  asset_id: string;
  quantity: number;
  average_price: number;
  origin: OriginEnum;
  institution_name: string | null;
  rate_type: RateTypeEnum | null;
  rate_value: number | null;
  investment_date: string | null;
  maturity_date: string | null;
  invested_amount: number | null;
  created_at: string;
  updated_at: string;
  ticker: string;
  asset_name: string;
  asset_type: AssetTypeEnum;
  connection_id: string | null;
  current_price: number | null;
  current_value: number | null;
  profit_loss: number | null;
}

export interface PortfolioSummary {
  total_equity: number;
  stock_equity: number;
  fii_equity: number;
  crypto_equity: number;
  fixed_income_equity: number;
  cash_equity: number;
  positions: PositionWithQuote[];
}

export interface HistoryEntry {
  date: string;
  total_equity: number;
  crypto_equity: number;
  stock_equity: number;
  fixed_income_equity: number;
}

// Connection

export interface ConnectionResponse {
  id: string;
  user_id: string;
  type: ConnectionTypeEnum;
  label: string | null;
  status: ConnectionStatusEnum;
  last_synced_at: string | null;
  created_at: string;
}

export interface SyncSummary {
  created: number;
  updated: number;
  removed: number;
}

export interface ConnectionSyncResponse extends ConnectionResponse {
  sync_summary: SyncSummary | null;
}

// Requests

export interface PositionCreateRequest {
  asset_id: string;
  quantity: number;
  average_price: number;
  origin?: OriginEnum;
  institution_name?: string;
  rate_type?: RateTypeEnum;
  rate_value?: number;
  investment_date?: string;
  maturity_date?: string;
  invested_amount?: number;
}

export interface PositionUpdateRequest {
  quantity?: number;
  average_price?: number;
  institution_name?: string;
  rate_type?: RateTypeEnum;
  rate_value?: number;
  investment_date?: string;
  maturity_date?: string;
  invested_amount?: number;
}

export interface ConnectionCreateRequest {
  type: ConnectionTypeEnum;
  label?: string;
  api_key: string;
  api_secret: string;
}

// Settings

export interface UserSettings {
  theme: string;
  notif_price_alerts: boolean;
  notif_dividends: boolean;
  notif_sync: boolean;
  notif_maturity: boolean;
}

export interface UserSettingsUpdate {
  theme?: string;
  notif_price_alerts?: boolean;
  notif_dividends?: boolean;
  notif_sync?: boolean;
  notif_maturity?: boolean;
}

// Notifications

export enum NotificationTypeEnum {
  PRICE = "PRICE",
  SYNC = "SYNC",
  DIVIDEND = "DIVIDEND",
  MATURITY = "MATURITY",
}

export interface NotificationResponse {
  id: string;
  type: NotificationTypeEnum;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

// Subscription / Paywall

export interface PlanOption {
  plan_months: number;
  price: number;
  price_per_month: number;
  label: string;
  discount_percent: number;
}

export interface PaywallStatusResponse {
  enabled: boolean;
  plans: PlanOption[];
  user_plan: string | null;
  expires_at: string | null;
}

export interface CheckoutResponse {
  checkout_url: string;
}

export interface SubscriptionResponse {
  id: string;
  plan_months: number;
  amount: number;
  status: string;
  starts_at: string;
  expires_at: string;
}
