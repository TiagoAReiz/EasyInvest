import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import encrypt_value
from app.db.models import ConnectionStatusEnum, User, WalletConnection
from app.db.session import get_db
from app.schemas.connection import ConnectionCreate, ConnectionResponse, ConnectionSyncResponse
from app.services.exchange_sync import sync_connection as do_sync

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=list[ConnectionResponse])
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


@router.post("", response_model=ConnectionSyncResponse, status_code=201)
def create_connection(
    body: ConnectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra nova API Key de exchange (criptografada) e dispara sync inicial."""
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

    # Sync inicial — se falhar, conexão continua criada com status=ERROR
    sync_summary = None
    try:
        result = do_sync(db, connection)
        if result.error:
            logger.warning("Sync inicial falhou para conexão %s: %s", connection.id, result.error)
        else:
            sync_summary = {
                "created": result.created,
                "updated": result.updated,
                "removed": result.removed,
            }
        db.refresh(connection)
    except Exception as e:
        logger.error("Erro no sync inicial da conexão %s: %s", connection.id, e)

    response = ConnectionSyncResponse.model_validate(connection)
    response.sync_summary = sync_summary
    return response


@router.delete("/{connection_id}", status_code=204)
def delete_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove uma conexão de exchange. Posições sincronizadas são mantidas (connection_id=NULL via SET NULL)."""
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


@router.post("/{connection_id}/sync", response_model=ConnectionSyncResponse)
def sync_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Força sync manual com a exchange."""
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

    result = do_sync(db, conn)

    if result.error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST
            if "Aguarde" not in result.error
            else status.HTTP_429_TOO_MANY_REQUESTS,
            detail=result.error,
        )

    db.refresh(conn)
    response = ConnectionSyncResponse.model_validate(conn)
    response.sync_summary = {
        "created": result.created,
        "updated": result.updated,
        "removed": result.removed,
    }
    return response
