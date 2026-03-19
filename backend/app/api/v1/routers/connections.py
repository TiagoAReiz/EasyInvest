from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import encrypt_value
from app.db.models import ConnectionStatusEnum, User, WalletConnection
from app.db.session import get_db
from app.schemas.connection import ConnectionCreate, ConnectionResponse

router = APIRouter()


@router.get("/", response_model=list[ConnectionResponse])
def list_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todas as conexões de exchange do usuário."""
    return (
        db.query(WalletConnection)
        .filter(WalletConnection.user_id == current_user.id)
        .all()
    )


@router.post("/", response_model=ConnectionResponse, status_code=201)
def create_connection(
    body: ConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra nova API Key de exchange (criptografada antes de gravar)."""
    connection = WalletConnection(
        user_id=current_user.id,
        type=body.type,
        label=body.label,
        api_key_encrypted=encrypt_value(body.api_key),
        api_secret_encrypted=encrypt_value(body.api_secret),
        status=ConnectionStatusEnum.ACTIVE,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection


@router.delete("/{connection_id}", status_code=204)
def delete_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove uma conexão de exchange."""
    conn = (
        db.query(WalletConnection)
        .filter(
            WalletConnection.id == connection_id,
            WalletConnection.user_id == current_user.id,
        )
        .first()
    )
    if conn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conexão não encontrada",
        )

    db.delete(conn)
    db.commit()


@router.post("/{connection_id}/sync", response_model=ConnectionResponse)
def sync_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Força sync manual com a exchange. (Placeholder — lógica de sync será implementada nos services)."""
    conn = (
        db.query(WalletConnection)
        .filter(
            WalletConnection.id == connection_id,
            WalletConnection.user_id == current_user.id,
        )
        .first()
    )
    if conn is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conexão não encontrada",
        )

    # TODO: Chamar service de sync da exchange específica
    return conn
