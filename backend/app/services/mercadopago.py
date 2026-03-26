import hashlib
import hmac
import logging
from uuid import UUID

import mercadopago

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_sdk() -> mercadopago.SDK:
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


def get_plan_price(plan_months: int) -> float:
    prices = {
        1: settings.PLAN_PRICE_1M,
        3: settings.PLAN_PRICE_3M,
        6: settings.PLAN_PRICE_6M,
        12: settings.PLAN_PRICE_12M,
    }
    return prices[plan_months]


PLAN_LABELS = {
    1: "Mensal",
    3: "Trimestral",
    6: "Semestral",
    12: "Anual",
}


def create_checkout_preference(
    user_id: UUID,
    user_email: str,
    user_name: str,
    plan_months: int,
    back_url_base: str,
    notification_url: str,
) -> str:
    """Cria preferência de checkout no Mercado Pago e retorna a URL."""
    sdk = _get_sdk()
    price = get_plan_price(plan_months)
    label = PLAN_LABELS[plan_months]

    # Separar nome e sobrenome (User model armazena campo único do Google OAuth)
    name_parts = user_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    preference_data = {
        "items": [
            {
                "id": "easyinvest-premium",
                "title": f"EasyInvest Premium — {label}",
                "description": f"Assinatura EasyInvest Premium plano {label} ({plan_months} meses)",
                "category_id": "services",
                "quantity": 1,
                "unit_price": price,
                "currency_id": "BRL",
            }
        ],
        "payer": {
            "email": user_email,
            "name": user_name,
            "first_name": first_name,
            "last_name": last_name,
        },
        "back_urls": {
            "success": f"{back_url_base}/plans/success",
            "failure": f"{back_url_base}/plans",
            "pending": f"{back_url_base}/plans/success",
        },
        "notification_url": notification_url,
        "external_reference": f"{user_id}|{plan_months}",
        "statement_descriptor": "EASYINVEST",
        "binary_mode": True,
    }

    result = sdk.preference().create(preference_data)
    logger.error("MP preference result: %s", result)
    status_code = result.get("status")
    response = result.get("response", {})

    if status_code not in (200, 201) or "init_point" not in response:
        error_msg = response.get("message", str(response))
        raise RuntimeError(f"Erro ao criar preferência no Mercado Pago: {error_msg}")

    # Usar sandbox_init_point quando em modo teste
    if settings.MP_SANDBOX and "sandbox_init_point" in response:
        return response["sandbox_init_point"]
    return response["init_point"]


def verify_webhook_signature(
    x_signature: str,
    x_request_id: str,
    data_id: str,
) -> bool:
    """Valida a assinatura HMAC-SHA256 do webhook do Mercado Pago."""
    if not settings.MP_WEBHOOK_SECRET:
        return True  # Em dev sem secret configurado, aceita tudo

    if not x_signature:
        return False  # Sem header x-signature não dá pra validar

    # Formato: ts=...,v1=...
    parts = {}
    for part in x_signature.split(","):
        key, _, value = part.strip().partition("=")
        parts[key] = value

    ts = parts.get("ts", "")
    v1 = parts.get("v1", "")

    # Monta o template conforme docs do MP
    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    computed = hmac.new(
        settings.MP_WEBHOOK_SECRET.encode(),
        manifest.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed, v1)


def get_payment_info(payment_id: str) -> dict:
    """Consulta informações do pagamento no Mercado Pago."""
    sdk = _get_sdk()
    result = sdk.payment().get(int(payment_id))
    return result["response"]
