from datetime import datetime

from pydantic import BaseModel
from pydantic import Field
from pydantic import field_validator


def validate_message_content(
    value: str
):
    if not value.strip():
        raise ValueError("Message content cannot be empty")
    return value


class MessageCreate(BaseModel):
    conversation_id: int = Field(
        gt=0
    )
    content: str = Field(
        min_length=1,
        max_length=5000
    )

    _validate_content = field_validator("content")(
        validate_message_content
    )


class MessageUpdate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=5000
    )

    _validate_content = field_validator("content")(
        validate_message_content
    )


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
