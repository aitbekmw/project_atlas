"""add unique constraints for applications and reviews

Revision ID: c8e4a91f2b70
Revises: b3fc2f039b67
Create Date: 2026-08-20 15:10:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "c8e4a91f2b70"
down_revision: Union[str, Sequence[str], None] = "b3fc2f039b67"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_application_worker_job",
        "applications",
        ["worker_id", "job_id"],
    )
    op.create_unique_constraint(
        "uq_review_job_author",
        "reviews",
        ["job_id", "from_user_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_review_job_author", "reviews", type_="unique")
    op.drop_constraint("uq_application_worker_job", "applications", type_="unique")
