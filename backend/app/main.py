from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

# Importar models para que o Base.metadata os registre
import app.db.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cria tabelas novas que ainda não existem no banco
    Base.metadata.create_all(bind=engine)
    # Adiciona colunas novas em tabelas existentes (create_all não faz ALTER)
    with engine.connect() as conn:
        conn.execute(
            __import__("sqlalchemy").text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0"
            )
        )
        conn.commit()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configuração de CORS para permitir requisições do Next.js (Front-end)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão de todas as rotas versão 1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"message": "Bem-vindo a API de Acompanhamento de Investimentos (MVP)"}
