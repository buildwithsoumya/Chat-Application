"""create conversations tables

Revision ID: 968c947415ab
Revises: 51c3dde87de6
Create Date: 2026-06-24 11:11:53.238326

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '968c947415ab'
down_revision: Union[str, Sequence[str], None] = '51c3dde87de6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('is_group', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'conversation_members',
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ['conversation_id'],
            ['conversations.id']
        ),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id']
        ),
        sa.PrimaryKeyConstraint(
            'conversation_id',
            'user_id'
        )
    )

    # Indexes for faster lookups
    op.create_index(
        'ix_conversation_members_user_id',
        'conversation_members',
        ['user_id']
    )

    op.create_index(
        'ix_conversation_members_conversation_id',
        'conversation_members',
        ['conversation_id']
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        'ix_conversation_members_user_id',
        table_name='conversation_members'
    )

    op.drop_index(
        'ix_conversation_members_conversation_id',
        table_name='conversation_members'
    )

    op.drop_table('conversation_members')
    op.drop_table('conversations')