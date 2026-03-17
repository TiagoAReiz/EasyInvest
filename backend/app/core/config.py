from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Acompanhamento de Investimentos API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/investment_db"

    # API Keys
    GOOGLE_CLIENT_ID: str = ""
    BRAPI_TOKEN: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
