from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.models import PlanEnum, Subscription, SubscriptionStatusEnum, User
from app.db.session import get_db
from app.schemas.subscription import (
    CheckoutRequest,
    CheckoutResponse,
    PaywallStatusResponse,
    PlanOption,
    SubscriptionResponse,
)
from app.services.mercadopago import (
    PLAN_LABELS,
    create_checkout_preference,
    get_payment_info,
    get_plan_price,
    verify_webhook_signature,
)

router = APIRouter()

MONTHLY_BASE_PRICE = 15.00  # preço de referência para calcular desconto


def _build_plan_options() -> list[PlanOption]:
    plans = []
    for months in [1, 3, 6, 12]:
        price = get_plan_price(months)
        ppm = round(price / months, 2)
        discount = round((1 - ppm / MONTHLY_BASE_PRICE) * 100, 1) if months > 1 else 0
        plans.append(
            PlanOption(
                plan_months=months,
                price=price,
                price_per_month=ppm,
                label=PLAN_LABELS[months],
                discount_percent=discount,
            )
        )
    return plans


@router.get("/plans", response_model=PaywallStatusResponse)
def get_plans():
    """Retorna planos disponíveis e status do paywall. Público."""
    return PaywallStatusResponse(
        enabled=settings.PAYWALL_ENABLED,
        plans=_build_plan_options(),
    )


@router.get("/plans/me", response_model=PaywallStatusResponse)
def get_plans_for_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna planos + info do plano do usuário autenticado."""
    expires_at = None
    if current_user.plan == PlanEnum.PREMIUM:
        active_sub = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == current_user.id,
                Subscription.status == SubscriptionStatusEnum.ACTIVE,
            )
            .order_by(Subscription.expires_at.desc())
            .first()
        )
        if active_sub:
            expires_at = active_sub.expires_at

    return PaywallStatusResponse(
        enabled=settings.PAYWALL_ENABLED,
        plans=_build_plan_options(),
        user_plan=current_user.plan.value,
        expires_at=expires_at,
    )


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    body: CheckoutRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Cria preferência de checkout no Mercado Pago."""
    # Determinar URLs de callback
    origin = request.headers.get("origin", "http://localhost:3000")
    base_url = settings.BACKEND_PUBLIC_URL or str(request.base_url).rstrip("/")
    notification_url = f"{base_url}/api/v1/subscription/webhook"

    try:
        checkout_url = create_checkout_preference(
            user_id=current_user.id,
            user_email=current_user.email,
            plan_months=body.plan_months.value,
            back_url_base=origin,
            notification_url=notification_url,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )

    return CheckoutResponse(checkout_url=checkout_url)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def mp_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Recebe notificação do Mercado Pago e ativa a assinatura.

    Suporta dois formatos:
    - IPN (query params): ?data.id=123&type=payment
    - Webhook (JSON body): {"type": "payment", "data": {"id": "123"}}
    """
    # Tentar extrair do body JSON (formato webhook)
    data_id = ""
    notification_type = ""

    try:
        body = await request.json()
        notification_type = body.get("type", "")
        action = body.get("action", "")
        data_id = str(body.get("data", {}).get("id", ""))
    except Exception:
        body = {}
        notification_type = ""
        action = ""

    # Fallback: formato IPN (query params)
    if not data_id:
        data_id = request.query_params.get("data.id", "")
        notification_type = request.query_params.get("type", notification_type)
        action = ""

    # Filtrar apenas notificações de pagamento
    if notification_type != "payment" and action != "payment.created":
        return {"status": "ignored"}

    if not data_id:
        return {"status": "ignored"}

    # Validar signature
    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")

    if not verify_webhook_signature(x_signature, x_request_id, data_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assinatura inválida",
        )

    # Verificar se já processamos este pagamento
    existing = (
        db.query(Subscription)
        .filter(Subscription.mp_payment_id == data_id)
        .first()
    )
    if existing:
        return {"status": "already_processed"}

    # Consultar pagamento no MP
    payment = get_payment_info(data_id)

    if payment.get("status") != "approved":
        return {"status": "not_approved"}

    # Extrair user_id e plan_months do external_reference
    external_ref = payment.get("external_reference", "")
    try:
        user_id_str, plan_months_str = external_ref.split("|")
        plan_months = int(plan_months_str)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="external_reference inválido",
        )

    user = db.query(User).filter(User.id == user_id_str).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    # Criar subscription
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30 * plan_months)
    amount = payment.get("transaction_amount", get_plan_price(plan_months))

    subscription = Subscription(
        user_id=user.id,
        mp_payment_id=data_id,
        plan_months=plan_months,
        amount=amount,
        status=SubscriptionStatusEnum.ACTIVE,
        starts_at=now,
        expires_at=expires_at,
    )
    db.add(subscription)

    # Atualizar plano do usuário
    user.plan = PlanEnum.PREMIUM
    db.commit()

    return {"status": "ok"}


@router.get("/status", response_model=SubscriptionResponse | None)
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna a assinatura ativa do usuário, se houver."""
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatusEnum.ACTIVE,
        )
        .order_by(Subscription.expires_at.desc())
        .first()
    )

    if not subscription:
        return None

    return SubscriptionResponse(
        id=subscription.id,
        plan_months=subscription.plan_months,
        amount=float(subscription.amount),
        status=subscription.status.value,
        starts_at=subscription.starts_at,
        expires_at=subscription.expires_at,
    )
