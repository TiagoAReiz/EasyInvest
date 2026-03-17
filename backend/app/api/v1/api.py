from fastapi import APIRouter
from .routers import portfolio

api_router = APIRouter()
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
