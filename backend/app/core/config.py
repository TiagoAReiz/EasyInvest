from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Acompanhamento de Investimentos API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/investment_db"

    # Auth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRATION_SECONDS: int = 3600  # 1 hora
    JWT_REFRESH_TOKEN_EXPIRATION_SECONDS: int = 604800  # 7 dias

    # APIs Externas
    BRAPI_TOKEN: str = ""
    BRAPI_BASE_URL: str = "https://brapi.dev/api"
    BCB_SGS_BASE_URL: str = "https://api.bcb.gov.br/dados/serie"

    # Criptografia para WalletConnection
    ENCRYPTION_KEY: str = ""

    # Paywall / Mercado Pago
    PAYWALL_ENABLED: bool = True
    MP_ACCESS_TOKEN: str = ""
    MP_WEBHOOK_SECRET: str = ""
    BACKEND_PUBLIC_URL: str = ""  # URL pública do backend (ex: https://app-easyinvest...azurecontainerapps.io)
    PLAN_PRICE_1M: float = 15.00
    PLAN_PRICE_3M: float = 40.00
    PLAN_PRICE_6M: float = 72.00
    PLAN_PRICE_12M: float = 120.00

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
