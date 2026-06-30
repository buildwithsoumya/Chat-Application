from fastapi import APIRouter, Depends, status
from typing import List
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.deps import get_db
from app.schemas.conversation import ConversationResponse, ConversationCreate
from app.services.conversation_service import get_user_conversations, create_new_conversation

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)

@router.get(
    "",
    response_model=List[ConversationResponse]
)
def list_conversations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_conversations(db, current_user.id)

@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_conversation(
    payload: ConversationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_new_conversation(
        db=db,
        current_user_id=current_user.id,
        name=payload.name,
        is_group=payload.is_group,
        participant_ids=payload.participant_ids
    )
