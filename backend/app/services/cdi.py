"""Serviço de cálculo de rendimento para renda fixa baseado em CDI.

Usa a API pública do Banco Central do Brasil (SGS) para obter a taxa CDI diária.
Endpoint: https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json
Série 12 = Taxa CDI diária (% a.a.)
"""

import logging
import time
from datetime import date

import httpx

logger = logging.getLogger(__name__)

# Cache da taxa CDI anual (atualiza a cada 6 horas)
_cdi_cache: tuple[float, float] | None = None  # (timestamp, taxa_anual)
CDI_CACHE_TTL = 21600  # 6 horas

# Fallback caso a API do BCB esteja fora
CDI_FALLBACK_ANNUAL = 14.15  # Taxa CDI anual aproximada (2025)


def get_cdi_annual_rate() -> float:
    """Retorna a taxa CDI anual (% a.a.) do Banco Central."""
    global _cdi_cache

    if _cdi_cache and (time.time() - _cdi_cache[0]) < CDI_CACHE_TTL:
        return _cdi_cache[1]

    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1"
        params = {"formato": "json"}

        with httpx.Client(timeout=10) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data and len(data) > 0:
            # O BCB retorna a taxa diária, mas a série 12 já é a taxa anualizada
            rate = float(data[0]["valor"])
            _cdi_cache = (time.time(), rate)
            return rate

    except Exception as e:
        logger.error(f"Erro ao buscar taxa CDI do BCB: {e}")

    # Retorna cache anterior ou fallback
    if _cdi_cache:
        return _cdi_cache[1]
    return CDI_FALLBACK_ANNUAL


def calculate_fixed_income_value(
    invested_amount: float,
    rate_type: str,
    rate_value: float,
    investment_date: date,
    today: date | None = None,
) -> float:
    """Calcula o valor atual de um investimento de renda fixa.

    Suporta:
    - CDI_PERCENTAGE: ex. 110% do CDI → rendimento = CDI * 1.10
    - CDI_PLUS: ex. CDI + 2% → rendimento = CDI + 2
    - PREFIXED: ex. 13% a.a. fixo
    - IPCA_PLUS: ex. IPCA + 6% (usa CDI como proxy simplificado)

    Fórmula: valor = principal * (1 + taxa_efetiva_anual/100) ^ (dias/365)
    """
    if today is None:
        today = date.today()

    days = (today - investment_date).days
    if days <= 0:
        return invested_amount

    cdi_annual = get_cdi_annual_rate()

    if rate_type == "CDI_PERCENTAGE":
        # Ex: 110% do CDI → taxa = CDI * 1.10
        effective_annual = cdi_annual * (rate_value / 100)
    elif rate_type == "CDI_PLUS":
        # Ex: CDI + 2% → taxa = CDI + 2
        effective_annual = cdi_annual + rate_value
    elif rate_type == "PREFIXED":
        # Taxa fixa informada
        effective_annual = rate_value
    elif rate_type == "IPCA_PLUS":
        # Simplificação: usa CDI como proxy do IPCA + spread
        # Em produção, buscaria IPCA real do BCB
        effective_annual = rate_value + 4.5  # IPCA estimado ~4.5%
    else:
        effective_annual = cdi_annual

    # Juros compostos: V = P * (1 + r)^(d/365)
    current_value = invested_amount * ((1 + effective_annual / 100) ** (days / 365))

    return round(current_value, 2)


def clear_cache():
    """Limpa cache (útil para testes)."""
    global _cdi_cache
    _cdi_cache = None
