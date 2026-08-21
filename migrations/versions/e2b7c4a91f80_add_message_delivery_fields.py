"""add message delivery and read_at columns

Revision ID: e2b7c4a91f80
Revises: c8e4a91f2b70
Create Date: 2026-08-21 01:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e2b7c4a91f80"
down_revision: Union[str, Sequence[str], None] = "c8e4a91f2b70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "messages",
        sa.Column(
            "is_delivered",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column(
        "messages",
        sa.Column(
            "read_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("messages", "read_at")
    op.drop_column("messages", "is_delivered")
