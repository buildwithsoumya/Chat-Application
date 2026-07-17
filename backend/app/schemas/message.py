from datetime import datetime

from pydantic import BaseModel
from pydantic import Field
from pydantic import field_validator


class MessageCreate(BaseModel):
    conversation_id: int = Field(gt=0)
    content: str = Field(min_length=1, max_length=5000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Message content cannot be empty or whitespace")
        return value


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
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
