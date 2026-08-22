"""add job coordinates, job image, email verifications

Revision ID: a7d4e2b91c30
Revises: f4a1c8d02e91
Create Date: 2026-08-21 22:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7d4e2b91c30"
down_revision: Union[str, Sequence[str], None] = "f4a1c8d02e91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("jobs", sa.Column("image_key", sa.String(length=500), nullable=True))

    op.create_table(
        "email_verifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_email_verifications_id", "email_verifications", ["id"])
    op.create_index(
        "ix_email_verifications_user_id", "email_verifications", ["user_id"]
    )

    # Existing accounts stay usable after verification is introduced.
    op.execute(sa.text("UPDATE users SET is_verified = true"))


def downgrade() -> None:
    op.drop_index("ix_email_verifications_user_id", table_name="email_verifications")
    op.drop_index("ix_email_verifications_id", table_name="email_verifications")
    op.drop_table("email_verifications")
    op.drop_column("jobs", "image_key")
    op.drop_column("jobs", "longitude")
    op.drop_column("jobs", "latitude")
