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

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
