from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuração de CORS para permitir requisições do Next.js (Front-end)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusão de todas as rotas versão 1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Bem-vindo a API de Acompanhamento de Investimentos (MVP)"}
