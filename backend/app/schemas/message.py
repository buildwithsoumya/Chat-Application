from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from pydantic import Field
from pydantic import field_serializer
from pydantic import field_validator
from pydantic import model_validator


class MessageCreate(BaseModel):
    conversation_id: int = Field(gt=0)
    content: str = Field(default="", max_length=5000)
    attachment: Optional[str] = Field(default=None, max_length=2000000)

    @model_validator(mode="after")
    def validate_content_or_attachment(self):
        if not self.content.strip() and not self.attachment:
            raise ValueError("Message must have either content or an attachment")
        return self


class MessageUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Message content cannot be empty or whitespace")
        return value


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    attachment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "updated_at")
    def serialize_datetime(self, dt: datetime) -> str:
        """Append Z suffix so the frontend parses timestamps as UTC."""
        if dt.tzinfo is None:
            return dt.isoformat() + "Z"
        return dt.isoformat()
