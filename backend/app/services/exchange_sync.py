"""Serviço de sincronização de saldos com exchanges de criptomoedas via CCXT.

Suporta Binance e Mercado Bitcoin. Operações somente-leitura (fetch_balance).
"""

import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import UUID

import ccxt
from sqlalchemy.orm import Session

from app.core.security import decrypt_value
from app.db.models import (
    Asset,
    AssetQuote,
    AssetTypeEnum,
    ConnectionStatusEnum,
    ConnectionTypeEnum,
    OriginEnum,
    PortfolioPosition,
    WalletConnection,
)

logger = logging.getLogger(__name__)

# ---------- Mapeamentos ----------

EXCHANGE_MAP: dict[ConnectionTypeEnum, str] = {
    ConnectionTypeEnum.BINANCE: "binance",
    ConnectionTypeEnum.MERCADO_BITCOIN: "mercadobitcoin",
}

ORIGIN_MAP: dict[ConnectionTypeEnum, OriginEnum] = {
    ConnectionTypeEnum.BINANCE: OriginEnum.BINANCE_API,
    ConnectionTypeEnum.MERCADO_BITCOIN: OriginEnum.MERCADO_BITCOIN_API,
}

# Moedas estáveis/fiat que não devem virar posição
IGNORED_SYMBOLS = {"BRL", "USD", "EUR", "USDT", "USDC", "BUSD", "TUSD", "FDUSD", "DAI"}

# Valor mínimo em unidades para considerar (filtro de dust)
DUST_THRESHOLD = 0.000001

# Cooldown entre syncs (segundos)
SYNC_COOLDOWN = 60

# Cache de preços em BRL: {symbol: (timestamp, price_brl)}
_price_cache: dict[str, tuple[float, float]] = {}
PRICE_CACHE_TTL = 900  # 15 minutos


@dataclass
class SyncResult:
    created: int = 0
    updated: int = 0
    removed: int = 0
    error: str | None = None


def _create_exchange(connection_type: ConnectionTypeEnum, api_key: str, api_secret: str):
    """Instancia o objeto ccxt da exchange."""
    exchange_id = EXCHANGE_MAP.get(connection_type)
    if not exchange_id:
        raise ValueError(f"Exchange não suportada: {connection_type}")

    exchange_class = getattr(ccxt, exchange_id)
    exchange = exchange_class({
        "apiKey": api_key,
        "secret": api_secret,
        "enableRateLimit": True,
    })
    return exchange


def get_or_create_crypto_asset(db: Session, symbol: str, name: str | None = None) -> Asset:
    """Busca ou cria um ativo do tipo CRYPTO pelo ticker."""
    ticker = symbol.upper()
    asset = db.query(Asset).filter(
        Asset.ticker == ticker,
        Asset.type == AssetTypeEnum.CRYPTO,
    ).first()

    if asset is None:
        asset = Asset(
            ticker=ticker,
            name=name or ticker,
            type=AssetTypeEnum.CRYPTO,
        )
        db.add(asset)
        db.flush()

    return asset


def _save_crypto_quote(db: Session, asset_id: UUID, price_brl: float) -> None:
    """Salva cotação do ativo cripto em asset_quotes."""
    quote = AssetQuote(
        asset_id=asset_id,
        price=price_brl,
    )
    db.add(quote)


def _fetch_prices_brl(exchange, symbols: list[str]) -> dict[str, float]:
    """Busca preços em BRL para os símbolos dados. Usa cache in-memory."""
    now = time.time()
    prices: dict[str, float] = {}
    to_fetch: list[str] = []

    for sym in symbols:
        cached = _price_cache.get(sym)
        if cached and (now - cached[0]) < PRICE_CACHE_TTL:
            prices[sym] = cached[1]
        else:
            to_fetch.append(sym)

    if not to_fetch:
        return prices

    # Tentar buscar pares /BRL primeiro
    for sym in to_fetch:
        pair_brl = f"{sym}/BRL"
        try:
            ticker = exchange.fetch_ticker(pair_brl)
            if ticker and ticker.get("last"):
                price = float(ticker["last"])
                prices[sym] = price
                _price_cache[sym] = (now, price)
                continue
        except Exception:
            pass

        # Fallback: par /USDT × taxa USDT/BRL
        try:
            pair_usdt = f"{sym}/USDT"
            ticker = exchange.fetch_ticker(pair_usdt)
            if ticker and ticker.get("last"):
                usdt_price = float(ticker["last"])
                # Buscar USDT/BRL
                usdt_brl = _price_cache.get("__USDT_BRL__")
                if not usdt_brl or (now - usdt_brl[0]) > PRICE_CACHE_TTL:
                    try:
                        usdt_ticker = exchange.fetch_ticker("USDT/BRL")
                        usdt_brl_rate = float(usdt_ticker["last"]) if usdt_ticker and usdt_ticker.get("last") else 5.5
                    except Exception:
                        usdt_brl_rate = 5.5  # fallback razoável
                    _price_cache["__USDT_BRL__"] = (now, usdt_brl_rate)
                else:
                    usdt_brl_rate = usdt_brl[1]

                price = usdt_price * usdt_brl_rate
                prices[sym] = price
                _price_cache[sym] = (now, price)
        except Exception:
            logger.warning("Não foi possível obter preço para %s", sym)

    return prices


def sync_connection(db: Session, connection: WalletConnection) -> SyncResult:
    """Sincroniza saldos de uma exchange conectada.

    1. Busca saldos via ccxt
    2. Cria/atualiza posições com origin da exchange
    3. Remove posições zeradas
    4. Salva cotações
    5. Atualiza status da conexão
    """
    result = SyncResult()

    # Verificar cooldown
    if connection.last_synced_at:
        elapsed = (datetime.now(timezone.utc) - connection.last_synced_at).total_seconds()
        if elapsed < SYNC_COOLDOWN:
            result.error = f"Aguarde {int(SYNC_COOLDOWN - elapsed)}s para sincronizar novamente."
            return result

    # Verificar exchange suportada
    if connection.type not in EXCHANGE_MAP:
        result.error = f"Exchange {connection.type} não suportada para sync."
        connection.status = ConnectionStatusEnum.ERROR
        db.commit()
        return result

    try:
        api_key = decrypt_value(connection.api_key_encrypted)
        api_secret = decrypt_value(connection.api_secret_encrypted)
    except Exception as e:
        logger.error("Erro ao descriptografar chaves da conexão %s: %s", connection.id, e)
        result.error = "Erro ao descriptografar chaves de API."
        connection.status = ConnectionStatusEnum.ERROR
        db.commit()
        return result

    try:
        exchange = _create_exchange(connection.type, api_key, api_secret)
        balance = exchange.fetch_balance()
    except ccxt.AuthenticationError as e:
        logger.warning("Auth error para conexão %s: %s", connection.id, e)
        result.error = "Chaves de API inválidas ou sem permissão. Verifique suas credenciais."
        connection.status = ConnectionStatusEnum.ERROR
        db.commit()
        return result
    except ccxt.NetworkError as e:
        logger.warning("Network error para conexão %s: %s", connection.id, e)
        result.error = "Erro de conexão com a exchange. Tente novamente."
        return result
    except ccxt.ExchangeError as e:
        logger.warning("Exchange error para conexão %s: %s", connection.id, e)
        result.error = f"Erro na exchange: {str(e)[:200]}"
        connection.status = ConnectionStatusEnum.ERROR
        db.commit()
        return result

    # Extrair saldos não-zero (free + used)
    total_balances: dict[str, float] = {}
    for symbol, amounts in balance.get("total", {}).items():
        if symbol in IGNORED_SYMBOLS:
            continue
        qty = float(amounts) if amounts else 0.0
        if qty > DUST_THRESHOLD:
            total_balances[symbol] = qty

    origin = ORIGIN_MAP[connection.type]

    # Buscar preços para calcular average_price de novas posições
    symbols_list = list(total_balances.keys())
    prices_brl: dict[str, float] = {}
    if symbols_list:
        try:
            prices_brl = _fetch_prices_brl(exchange, symbols_list)
        except Exception as e:
            logger.warning("Erro ao buscar preços: %s", e)

    # Buscar posições existentes desta conexão
    existing_positions = (
        db.query(PortfolioPosition)
        .filter(
            PortfolioPosition.user_id == connection.user_id,
            PortfolioPosition.connection_id == connection.id,
        )
        .all()
    )
    existing_map: dict[str, PortfolioPosition] = {}
    for pos in existing_positions:
        asset = db.query(Asset).filter(Asset.id == pos.asset_id).first()
        if asset:
            existing_map[asset.ticker] = pos

    # Criar/atualizar posições
    seen_tickers: set[str] = set()
    for symbol, qty in total_balances.items():
        ticker = symbol.upper()
        seen_tickers.add(ticker)

        # Obter nome do currency da exchange
        currency_name = None
        if hasattr(exchange, "currencies") and exchange.currencies:
            currency_info = exchange.currencies.get(symbol, {})
            currency_name = currency_info.get("name")

        asset = get_or_create_crypto_asset(db, ticker, currency_name)
        price_brl = prices_brl.get(symbol, 0.0)

        # Salvar cotação
        if price_brl > 0:
            _save_crypto_quote(db, asset.id, price_brl)

        if ticker in existing_map:
            # Atualizar quantidade
            pos = existing_map[ticker]
            pos.quantity = qty
            result.updated += 1
        else:
            # Criar nova posição — average_price = preço atual como referência
            new_pos = PortfolioPosition(
                user_id=connection.user_id,
                asset_id=asset.id,
                quantity=qty,
                average_price=price_brl,
                origin=origin,
                connection_id=connection.id,
                institution_name=connection.label or connection.type.value,
            )
            db.add(new_pos)
            result.created += 1

    # Remover posições que não estão mais no saldo da exchange
    for ticker, pos in existing_map.items():
        if ticker not in seen_tickers:
            db.delete(pos)
            result.removed += 1

    # Atualizar conexão
    connection.last_synced_at = datetime.now(timezone.utc)
    connection.status = ConnectionStatusEnum.ACTIVE

    db.commit()

    logger.info(
        "Sync concluído para conexão %s: +%d ~%d -%d",
        connection.id, result.created, result.updated, result.removed,
    )
    return result
