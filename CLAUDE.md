# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EasyInvest** — Read-only investment portfolio consolidation app for the Brazilian market. Monorepo with a FastAPI backend, Next.js frontend, and PostgreSQL database, all orchestrated via Docker Compose.

Three data pillars:
1. **Renda Variável** (stocks/FIIs/BDRs): manual entry + brapi.dev for real-time quotes
2. **Criptomoedas**: read-only API keys from exchanges (Binance, Mercado Bitcoin)
3. **Renda Fixa** (CDBs/Tesouro): manual entry + CDI-based yield simulation

MVP constraint: zero paid APIs. All integrations use free/public endpoints.

## Development Commands

### Full stack (Docker Compose)
```bash
docker-compose up        # Start PostgreSQL (5432), Backend (8000), Frontend (3000)
docker-compose down      # Stop all services
```

### Backend (FastAPI / Python 3.11)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js 16 / React 19 / TypeScript 5)
```bash
cd frontend
npm install
npm run dev              # Dev server on port 3000
npm run build            # Production build
npm run lint             # ESLint
```

### Database
PostgreSQL 15 via Docker. Default credentials in docker-compose.yml (user/password/investment_db). Migrations use Alembic (not yet set up).

## Architecture

```
Browser → Next.js (3000) → FastAPI (8000) → PostgreSQL (5432)
                                          → External APIs (brapi.dev, exchange APIs, BCB)
```

### Backend structure (`backend/app/`)
- `main.py` — FastAPI app, CORS config (allows localhost:3000), mounts `/api/v1` router
- `core/config.py` — Pydantic Settings (DATABASE_URL, GOOGLE_CLIENT_ID, BRAPI_TOKEN)
- `api/v1/api.py` — Router aggregator for v1 endpoints
- `api/v1/routers/` — Individual route modules (currently `portfolio.py`)
- `db/`, `schemas/`, `services/` — Placeholder directories for ORM models, Pydantic schemas, business logic

### Frontend structure (`frontend/src/app/`)
- Uses Next.js App Router pattern
- Tailwind CSS 4 for styling
- Path alias: `@/*` → `./src/*`

### Environment variables
Backend: `DATABASE_URL`, `BRAPI_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (see `backend/.env.example`)
Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (see `frontend/.env.example`)

## IMPORTANTE: Variáveis de Ambiente

**SEMPRE** que adicionar uma nova variável de ambiente no `backend/app/core/config.py`, atualizar também o workflow de deploy em `.github/workflows/app-easyinvest-AutoDeployTrigger-*.yml`. Secrets vão como `${{ secrets.NOME }}` e valores fixos vão hardcoded. Sem isso o deploy vai subir com valor default/vazio.

## Deployment

- **Frontend**: Vercel (auto-deploy on push to `main`)
- **Backend**: Azure Container Apps via GitHub Actions (triggers on `backend/**` changes to `main`)
- **Registry**: Azure Container Registry (`acreasyinvest.azurecr.io`)

## Language

Project documentation and code comments are in **Brazilian Portuguese**. API responses and variable names use English.
