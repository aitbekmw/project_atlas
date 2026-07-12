from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="PENDING",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    worker_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    job_id: Mapped[int] = mapped_column(
        ForeignKey(
            "jobs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    worker = relationship(
        "User",
        back_populates="applications",
    )

    job = relationship(
        "Job",
        back_populates="applications",
    )