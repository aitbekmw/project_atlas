"""add payment_method to jobs

Revision ID: f4a1c8d02e91
Revises: e2b7c4a91f80
Create Date: 2026-08-21 22:10:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f4a1c8d02e91"
down_revision: Union[str, Sequence[str], None] = "e2b7c4a91f80"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column(
            "payment_method",
            sa.String(length=20),
            server_default="AGREEMENT",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("jobs", "payment_method")
