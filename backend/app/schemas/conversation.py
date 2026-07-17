from datetime import datetime
from typing import List
from typing import Optional

from pydantic import BaseModel
from pydantic import Field


class ParticipantResponse(BaseModel):
    id: str
    username: str
    avatar: Optional[str] = None

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    name: Optional[str] = None
    is_group: Optional[bool] = Field(default=False, alias="isGroup")
    participant_ids: List[str] = Field(default_factory=list, alias="participantIds")

    model_config = {"populate_by_name": True}


class ConversationResponse(BaseModel):
    id: str
    name: Optional[str] = None
    is_group: bool
    participants: List[ParticipantResponse]
    lastMessageAt: Optional[str] = None
    unreadCount: Optional[int] = 0

    model_config = {"from_attributes": True}
