from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_portfolio():
    """
    Retorna a posição consolidada do portfólio do usuário.
    Futuramente este endpoint consultará o banco de dados e as APIs (ex: brapi).
    """
    return {
        "status": "success", 
        "data": {
            "total_equity": 15450.00,
            "assets": [
                {"ticker": "PETR4", "quantity": 100, "current_price": 35.50},
                {"ticker": "BTC", "quantity": 0.05, "current_price": 238000.00}
            ]
        }
    }
