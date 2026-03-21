"""Serviço de integração com brapi.dev para busca e cotação de ativos brasileiros.

Otimizações:
- Cache in-memory com TTL para evitar chamadas repetidas
- Batch de cotações (até 20 tickers por request)
- Persistência em asset_quotes para evitar reconsultas
"""

import logging
import time
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Asset, AssetQuote, AssetTypeEnum

logger = logging.getLogger(__name__)

BRAPI_SEARCH_URL = "https://brapi.dev/api/available"
BRAPI_QUOTE_URL = "https://brapi.dev/api/quote"

# ---------- Cache in-memory ----------

SEARCH_CACHE_TTL = 600  # 10 minutos para busca de tickers
QUOTE_CACHE_TTL = 900   # 15 minutos para cotações

# {query_upper: (timestamp, results)}
_search_cache: dict[str, tuple[float, list[dict]]] = {}

# {ticker_upper: (timestamp, quote_data)}  quote_data = {"price": float, "longName": str, "shortName": str}
_quote_cache: dict[str, tuple[float, dict]] = {}


def _is_cache_valid(entry: tuple[float, object] | None, ttl: int) -> bool:
    if entry is None:
        return False 
    return (time.time() - entry[0]) < ttl


def clear_caches():
    """Limpa caches (útil para testes)."""
    _search_cache.clear()
    _quote_cache.clear()


# ---------- Classificação de ticker ----------

def _classify_ticker(ticker: str) -> AssetTypeEnum:
    """Classifica o tipo de ativo pelo padrão do ticker brasileiro."""
    upper = ticker.upper()
    if upper.endswith("11") and len(upper) >= 6:
        return AssetTypeEnum.FII
    return AssetTypeEnum.STOCK


# ---------- Helpers HTTP ----------

def _brapi_params(**extra) -> dict:
    """Monta params base com token se disponível."""
    params = {}
    if settings.BRAPI_TOKEN:
        params["token"] = settings.BRAPI_TOKEN
    params.update(extra)
    return params


# ---------- Busca de tickers ----------

def search_brapi(query: str) -> list[dict]:
    """Busca ativos disponíveis na brapi.dev por ticker.

    Retorna lista de dicts com 'ticker' e 'name'.
    Usa cache in-memory de 10 min.
    """
    key = query.upper()

    cached = _search_cache.get(key)
    if _is_cache_valid(cached, SEARCH_CACHE_TTL):
        return cached[1]

    try:
        params = _brapi_params(search=key)

        with httpx.Client(timeout=10) as client:
            resp = client.get(BRAPI_SEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        tickers = data.get("stocks", [])
        filtered = [t for t in tickers if key in t.upper()][:20]
        results = [{"ticker": t, "name": t} for t in filtered]

        _search_cache[key] = (time.time(), results)
        return results

    except Exception as e:
        logger.error(f"Erro ao buscar na brapi.dev: {e}")
        return []


# ---------- Cotações em batch ----------

def get_quotes_batch(tickers: list[str]) -> dict[str, dict]:
    """Busca cotações de múltiplos tickers em uma única chamada (máx 20 por request).

    Retorna dict {ticker: {"price": float, "longName": str, "shortName": str}}.
    Usa cache in-memory: tickers com cache válido não são rebuscados.
    """
    result: dict[str, dict] = {}
    to_fetch: list[str] = []

    # Verifica cache primeiro
    for t in tickers:
        key = t.upper()
        cached = _quote_cache.get(key)
        if _is_cache_valid(cached, QUOTE_CACHE_TTL):
            result[key] = cached[1]
        else:
            to_fetch.append(key)

    if not to_fetch:
        return result

    # Batch em grupos de 20 (limite da brapi)
    for i in range(0, len(to_fetch), 20):
        batch = to_fetch[i:i + 20]
        joined = ",".join(batch)

        try:
            params = _brapi_params()

            with httpx.Client(timeout=15) as client:
                resp = client.get(f"{BRAPI_QUOTE_URL}/{joined}", params=params)
                resp.raise_for_status()
                data = resp.json()

            for item in data.get("results", []):
                ticker_key = item.get("symbol", "").upper()
                if not ticker_key:
                    continue

                quote_data = {
                    "price": item.get("regularMarketPrice"),
                    "longName": item.get("longName"),
                    "shortName": item.get("shortName"),
                }

                result[ticker_key] = quote_data
                _quote_cache[ticker_key] = (time.time(), quote_data)

        except Exception as e:
            logger.warning(f"Batch quote falhou ({joined}): {e} — tentando individualmente")
            # Fallback: busca cada ticker individualmente para não perder
            # cotações válidas por causa de um ticker inválido no lote
            for single_ticker in batch:
                if single_ticker in result:
                    continue
                try:
                    with httpx.Client(timeout=10) as client:
                        resp = client.get(
                            f"{BRAPI_QUOTE_URL}/{single_ticker}",
                            params=_brapi_params(),
                        )
                        resp.raise_for_status()
                        data = resp.json()

                    for item in data.get("results", []):
                        ticker_key = item.get("symbol", "").upper()
                        if not ticker_key:
                            continue
                        quote_data = {
                            "price": item.get("regularMarketPrice"),
                            "longName": item.get("longName"),
                            "shortName": item.get("shortName"),
                        }
                        result[ticker_key] = quote_data
                        _quote_cache[ticker_key] = (time.time(), quote_data)

                except Exception as inner_e:
                    logger.warning(f"Ticker inválido ou indisponível: {single_ticker} — {inner_e}")

    return result


def get_quote_brapi(ticker: str) -> float | None:
    """Busca a cotação atual de um ticker (usa batch interno de 1)."""
    quotes = get_quotes_batch([ticker])
    data = quotes.get(ticker.upper())
    if data and data.get("price") is not None:
        return data["price"]
    return None


# ---------- Criação de ativos em batch ----------

def get_or_create_assets_batch(db: Session, tickers: list[str]) -> list[Asset]:
    """Busca ou cria múltiplos ativos de uma vez, usando uma única chamada batch à brapi.

    Muito mais eficiente que chamar get_or_create_asset() em loop.
    """
    upper_tickers = [t.upper() for t in tickers]

    # Busca existentes no banco
    existing = (
        db.query(Asset)
        .filter(Asset.ticker.in_(upper_tickers))
        .all()
    )
    existing_map = {a.ticker: a for a in existing}

    # Identifica quais precisam ser criados
    missing = [t for t in upper_tickers if t not in existing_map]

    if missing:
        # Busca nomes via batch quote (1 request pra todos os missing)
        quotes = get_quotes_batch(missing)

        for ticker in missing:
            quote_data = quotes.get(ticker, {})
            name = (
                quote_data.get("longName")
                or quote_data.get("shortName")
                or ticker
            )

            asset = Asset(
                ticker=ticker,
                name=name,
                type=_classify_ticker(ticker),
            )
            db.add(asset)
            existing_map[ticker] = asset

        db.commit()
        # Refresh dos novos
        for ticker in missing:
            if ticker in existing_map:
                db.refresh(existing_map[ticker])

    return [existing_map[t] for t in upper_tickers if t in existing_map]


def get_or_create_asset(db: Session, ticker: str) -> Asset:
    """Busca ativo no banco local; se não existir, cria a partir do ticker."""
    results = get_or_create_assets_batch(db, [ticker])
    if results:
        return results[0]

    # Fallback (não deveria chegar aqui)
    asset = Asset(
        ticker=ticker.upper(),
        name=ticker.upper(),
        type=_classify_ticker(ticker),
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


# ---------- Persistência de cotações no banco ----------

def refresh_quotes_for_assets(db: Session, asset_ids_tickers: dict) -> dict:
    """Busca cotações atualizadas e salva em asset_quotes.

    Args:
        asset_ids_tickers: dict {asset_id: ticker} dos ativos a atualizar

    Returns:
        dict {asset_id: price} com os preços obtidos
    """
    if not asset_ids_tickers:
        return {}

    tickers = list(asset_ids_tickers.values())
    id_by_ticker = {v.upper(): k for k, v in asset_ids_tickers.items()}

    # Busca cotações em batch (usa cache in-memory automaticamente)
    quotes = get_quotes_batch(tickers)

    prices: dict = {}
    now = datetime.now(timezone.utc)

    for ticker_upper, data in quotes.items():
        price = data.get("price")
        asset_id = id_by_ticker.get(ticker_upper)

        if price is not None and asset_id is not None:
            # Salva no banco
            quote = AssetQuote(
                asset_id=asset_id,
                price=price,
                fetched_at=now,
            )
            db.add(quote)
            prices[asset_id] = price

    if prices:
        db.commit()

    return prices
