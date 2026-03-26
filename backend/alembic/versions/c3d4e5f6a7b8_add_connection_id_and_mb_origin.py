"""add_connection_id_and_mercado_bitcoin_api_origin

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar valor MERCADO_BITCOIN_API ao enum originenum
    op.execute("ALTER TYPE originenum ADD VALUE IF NOT EXISTS 'MERCADO_BITCOIN_API'")

    # Adicionar coluna connection_id à tabela portfolio_positions
    op.add_column(
        'portfolio_positions',
        sa.Column('connection_id', sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        'fk_position_connection',
        'portfolio_positions',
        'wallet_connections',
        ['connection_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_position_connection', 'portfolio_positions', type_='foreignkey')
    op.drop_column('portfolio_positions', 'connection_id')
    # Nota: PostgreSQL não suporta remoção de valores de enum facilmente
