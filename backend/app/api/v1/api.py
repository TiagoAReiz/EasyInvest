from fastapi import APIRouter

from .routers import assets, auth, connections, history, notifications, portfolio, settings, subscription

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(history.router, prefix="/portfolio/history", tags=["history"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(connections.router, prefix="/connections", tags=["connections"])
api_router.include_router(subscription.router, prefix="/subscription", tags=["subscription"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
