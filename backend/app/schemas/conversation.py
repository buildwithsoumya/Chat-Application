from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ParticipantResponse(BaseModel):
    id: str
    username: str
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    name: Optional[str] = None
    is_group: Optional[bool] = False
    participant_ids: Optional[List[str]] = []

class ConversationResponse(BaseModel):
    id: str
    name: Optional[str] = None
    is_group: bool
    participants: List[ParticipantResponse]
    lastMessageAt: Optional[str] = None
    unreadCount: Optional[int] = 0

    class Config:
        from_attributes = True
