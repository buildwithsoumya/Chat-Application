from datetime import datetime

from pydantic import BaseModel
from pydantic import Field


class MessageCreate(BaseModel):
    conversation_id: int
    content: str = Field(
        min_length=1
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
