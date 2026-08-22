from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.models.enum import JobStatus, PaymentMethod
from app.services.minio import MinioService


class JobBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    salary: int = Field(ge=0)
    payment_method: PaymentMethod = PaymentMethod.AGREEMENT
    city: str = Field(min_length=1, max_length=100)
    address: str = Field(min_length=1, max_length=255)
    category_id: int
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def coords_together(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    salary: int | None = Field(default=None, ge=0)
    payment_method: PaymentMethod | None = None
    city: str | None = Field(default=None, min_length=1, max_length=100)
    address: str | None = Field(default=None, min_length=1, max_length=255)
    category_id: int | None = None
    is_active: bool | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def coords_together(self):
        provided = self.model_fields_set
        if "latitude" in provided or "longitude" in provided:
            if (self.latitude is None) != (self.longitude is None):
                raise ValueError("latitude and longitude must be provided together")
        return self


class JobResponse(JobBase):
    id: int
    owner_id: int
    is_active: bool
    status: JobStatus
    created_at: datetime | None = None
    image_key: str | None = Field(default=None, exclude=True)

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def image_url(self) -> str | None:
        if not self.image_key:
            return None
        if self.image_key.startswith(("http://", "https://")):
            return self.image_key
        return MinioService().get_file_url(self.image_key)


class JobNearbyResponse(JobResponse):
    distance_km: float
