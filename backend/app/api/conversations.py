from fastapi import APIRouter
from fastapi import Depends
from app.api.dependencies import get_current_user
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse
)
from app.services.conversation_service import (
    create_conversation
)
from app.database.deps import get_db
from sqlalchemy.orm import Session
router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)
@router.post(
    "",
    response_model=ConversationResponse
)
def create_new_conversation(
    payload: ConversationCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = create_conversation(
        db=db,
        name=payload.name,
        is_group=payload.is_group,
        creator_id=current_user.id
    )
    return conversation