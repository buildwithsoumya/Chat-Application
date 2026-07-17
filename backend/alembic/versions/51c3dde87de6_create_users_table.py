"""add email to users table

Revision ID: 51c3dde87de6
Revises: e5c4a97fecb4
Create Date: 2026-06-23 12:55:15.487650

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51c3dde87de6'
down_revision: Union[str, Sequence[str], None] = 'e5c4a97fecb4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=False))
    # Named constraint so downgrade can reference it by name on all databases.
    op.create_unique_constraint('uq_users_email', 'users', ['email'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    op.drop_column('users', 'email')
