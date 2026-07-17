from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enum import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
        index=True,
    )

    avatar: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default=UserRole.WORKER.value,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    is_online: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
    )

    last_seen: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ==========================
    # Relationships
    # ==========================

    jobs = relationship(
        "Job",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    applications = relationship(
        "Application",
        back_populates="worker",
        cascade="all, delete-orphan",
    )

    reviews_given = relationship(
        "Review",
        foreign_keys="Review.from_user_id",
        back_populates="from_user",
        cascade="all, delete-orphan",
    )

    reviews_received = relationship(
        "Review",
        foreign_keys="Review.to_user_id",
        back_populates="to_user",
        cascade="all, delete-orphan",
    )

    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    customer_conversations = relationship(
        "Conversation",
        foreign_keys="Conversation.customer_id",
    )

    worker_conversations = relationship(
        "Conversation",
        foreign_keys="Conversation.worker_id",
    )

    messages = relationship(
        "Message",
        back_populates="sender",
    )