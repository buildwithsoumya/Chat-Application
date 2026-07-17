"""create messages table

Revision ID: b7f2a8d9c1e4
Revises: 51c3dde87de6
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence
from typing import Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7f2a8d9c1e4"
down_revision: Union[str, Sequence[str], None] = "968c947415ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "messages",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "sender_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "content",
            sa.Text(),
            nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"]
        ),
        sa.ForeignKeyConstraint(
            ["sender_id"],
            ["users.id"]
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        op.f("ix_messages_id"),
        "messages",
        ["id"],
        unique=False
    )
    op.create_index(
        "ix_messages_conversation_id_created_at",
        "messages",
        ["conversation_id", "created_at"],
        unique=False
    )
    op.create_index(
        op.f("ix_messages_sender_id"),
        "messages",
        ["sender_id"],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_messages_sender_id"),
        table_name="messages"
    )
    op.drop_index(
        "ix_messages_conversation_id_created_at",
        table_name="messages"
    )
    op.drop_index(
        op.f("ix_messages_id"),
        table_name="messages"
    )
    op.drop_table("messages")
