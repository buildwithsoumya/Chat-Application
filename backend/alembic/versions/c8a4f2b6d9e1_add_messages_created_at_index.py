"""add messages created_at index

Revision ID: c8a4f2b6d9e1
Revises: b7f2a8d9c1e4
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence
from typing import Union

from alembic import op


revision: str = "c8a4f2b6d9e1"
down_revision: Union[str, Sequence[str], None] = "b7f2a8d9c1e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_messages_created_at",
        "messages",
        ["created_at"],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(
        "ix_messages_created_at",
        table_name="messages"
    )
