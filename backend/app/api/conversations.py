from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from typing import List
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.deps import get_db
from app.schemas.conversation import ConversationCreate
from app.schemas.conversation import ConversationResponse
from app.services.conversation_service import create_new_conversation
from app.services.conversation_service import get_user_conversations
from app.services.conversation_service import mark_conversation_as_read

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


@router.get(
    "",
    response_model=List[ConversationResponse]
)
def list_conversations(
    current_user=Depends(get_current_user),
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
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_new_conversation(
        db=db,
        current_user_id=current_user.id,
        name=payload.name,
        is_group=payload.is_group if payload.is_group is not None else False,
        participant_ids=payload.participant_ids
    )


@router.post(
    "/{conversation_id}/read",
    status_code=status.HTTP_200_OK
)
def mark_as_read(
    conversation_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all messages in a conversation as read for the current user."""
    mark_conversation_as_read(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    return {"status": "ok"}
