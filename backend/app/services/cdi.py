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
            # A série 12 do BCB retorna a taxa CDI DIÁRIA (ex: 0.0538%)
            # Precisamos anualizar: (1 + diária/100)^252 - 1
            daily_rate = float(data[0]["valor"])
            annual_rate = ((1 + daily_rate / 100) ** 252 - 1) * 100
            _cdi_cache = (time.time(), annual_rate)
            return annual_rate

    except Exception as e:
        logger.error(f"Erro ao buscar taxa CDI do BCB: {e}")

    # Retorna cache anterior ou fallback
    if _cdi_cache:
        return _cdi_cache[1]
    return CDI_FALLBACK_ANNUAL


def _count_full_months(start: date, end: date) -> int:
    """Conta meses completos entre duas datas."""
    months = (end.year - start.year) * 12 + (end.month - start.month)
    # Se o dia atual ainda não atingiu o dia de início, desconta 1 mês
    if end.day < start.day:
        months -= 1
    return max(months, 0)


def calculate_fixed_income_value(
    invested_amount: float,
    rate_type: str,
    rate_value: float,
    investment_date: date,
    today: date | None = None,
) -> float:
    """Calcula o valor atual de um investimento de renda fixa.

    Juros compostos mês a mês desde investment_date até hoje:
    1. Converte taxa anual efetiva → taxa mensal: (1 + anual)^(1/12) - 1
    2. Acumula mês a mês: valor = principal * (1 + mensal)^meses

    Suporta:
    - CDI_PERCENTAGE: ex. 110% do CDI → taxa_anual = CDI * 1.10
    - CDI_PLUS: ex. CDI + 2% → taxa_anual = CDI + 2
    - PREFIXED: ex. 13% a.a. fixo
    - IPCA_PLUS: ex. IPCA + 6% (usa estimativa de 4.5% para IPCA)
    """
    if today is None:
        today = date.today()

    months = _count_full_months(investment_date, today)
    if months <= 0:
        return invested_amount

    cdi_annual = get_cdi_annual_rate()

    if rate_type == "CDI_PERCENTAGE":
        effective_annual = cdi_annual * (rate_value / 100)
    elif rate_type == "CDI_PLUS":
        effective_annual = cdi_annual + rate_value
    elif rate_type == "PREFIXED":
        effective_annual = rate_value
    elif rate_type == "IPCA_PLUS":
        effective_annual = rate_value + 4.5
    else:
        effective_annual = cdi_annual

    # Taxa mensal a partir da anual (juros compostos)
    monthly_rate = (1 + effective_annual / 100) ** (1 / 12) - 1

    # Valor acumulado: principal compondo mês a mês
    current_value = invested_amount * ((1 + monthly_rate) ** months)

    return round(current_value, 2)


def clear_cache():
    """Limpa cache (útil para testes)."""
    global _cdi_cache
    _cdi_cache = None
