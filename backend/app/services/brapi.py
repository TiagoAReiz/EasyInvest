"""Serviço de integração com brapi.dev para busca e cotação de ativos brasileiros."""

import logging

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Asset, AssetTypeEnum

logger = logging.getLogger(__name__)

BRAPI_SEARCH_URL = "https://brapi.dev/api/available"
BRAPI_QUOTE_URL = "https://brapi.dev/api/quote"


def _classify_ticker(ticker: str) -> AssetTypeEnum:
    """Classifica o tipo de ativo pelo padrão do ticker brasileiro."""
    upper = ticker.upper()
    # FIIs terminam em 11 (HGLG11, XPML11, etc.)
    if upper.endswith("11") and len(upper) >= 6:
        return AssetTypeEnum.FII
    return AssetTypeEnum.STOCK


def search_brapi(query: str) -> list[dict]:
    """Busca ativos disponíveis na brapi.dev por ticker.
    
    Retorna lista de dicts com 'ticker' e 'name'.
    """
    try:
        params = {"search": query.upper()}
        if settings.BRAPI_TOKEN:
            params["token"] = settings.BRAPI_TOKEN

        with httpx.Client(timeout=10) as client:
            resp = client.get(BRAPI_SEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        # A brapi retorna {"stocks": ["PETR4", "PETR3", ...]}
        tickers = data.get("stocks", [])
        
        # Filtra pela query e limita resultados
        filtered = [t for t in tickers if query.upper() in t.upper()][:20]
        
        return [{"ticker": t, "name": t} for t in filtered]

    except Exception as e:
        logger.error(f"Erro ao buscar na brapi.dev: {e}")
        return []


def get_quote_brapi(ticker: str) -> float | None:
    """Busca a cotação atual de um ticker na brapi.dev."""
    try:
        params = {}
        if settings.BRAPI_TOKEN:
            params["token"] = settings.BRAPI_TOKEN

        with httpx.Client(timeout=10) as client:
            resp = client.get(f"{BRAPI_QUOTE_URL}/{ticker}", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = data.get("results", [])
        if results:
            return results[0].get("regularMarketPrice")
        return None

    except Exception as e:
        logger.error(f"Erro ao buscar cotação na brapi.dev para {ticker}: {e}")
        return None


def get_or_create_asset(db: Session, ticker: str) -> Asset:
    """Busca ativo no banco local; se não existir, cria a partir do ticker."""
    asset = db.query(Asset).filter(Asset.ticker == ticker.upper()).first()
    if asset:
        return asset

    # Tenta obter nome completo via brapi quote
    name = ticker.upper()
    try:
        params = {}
        if settings.BRAPI_TOKEN:
            params["token"] = settings.BRAPI_TOKEN

        with httpx.Client(timeout=10) as client:
            resp = client.get(f"{BRAPI_QUOTE_URL}/{ticker}", params=params)
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if results:
                name = results[0].get("longName") or results[0].get("shortName") or name
    except Exception:
        pass

    asset = Asset(
        ticker=ticker.upper(),
        name=name,
        type=_classify_ticker(ticker),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
