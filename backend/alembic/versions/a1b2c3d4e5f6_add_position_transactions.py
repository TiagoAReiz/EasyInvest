"""add_position_transactions

Revision ID: a1b2c3d4e5f6
Revises: 5538fd2e1698
Create Date: 2026-03-20 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '5538fd2e1698'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('position_transactions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('position_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('type', sa.Enum('BUY', 'SELL', 'UPDATE', name='transactiontypeenum'), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('price', sa.Numeric(precision=18, scale=8), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['position_id'], ['portfolio_positions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_position_transactions_position', 'position_transactions', ['position_id'], unique=False)
    op.create_index('ix_position_transactions_user_date', 'position_transactions', ['user_id', 'date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_position_transactions_user_date', table_name='position_transactions')
    op.drop_index('ix_position_transactions_position', table_name='position_transactions')
    op.drop_table('position_transactions')
