from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from app.api.dependencies import get_current_user
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationListResponse,
    ConversationMemberAdd,
    ConversationMemberResponse
)
from app.services.conversation_service import (
    create_conversation,
    get_user_conversations,
    get_conversation_by_id,
    get_conversation_member,
    add_conversation_member,
    get_conversation_members
)
from app.database.deps import get_db
from app.services.user_service import get_user_by_id
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


@router.get(
    "",
    response_model=list[ConversationListResponse]
)
def list_conversations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return get_user_conversations(
        db,
        current_user.id
    )


@router.post(
    "/{conversation_id}/members",
    response_model=ConversationMemberResponse,
    status_code=status.HTTP_201_CREATED
)
def add_member_to_conversation(
    conversation_id: int,
    payload: ConversationMemberAdd,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = get_conversation_by_id(
        db,
        conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    user = get_user_by_id(
        db,
        payload.user_id
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    existing_member = get_conversation_member(
        db,
        conversation_id,
        payload.user_id
    )
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a conversation member"
        )

    add_conversation_member(
        db,
        conversation_id,
        payload.user_id
    )
    return user


@router.get(
    "/{conversation_id}/members",
    response_model=list[ConversationMemberResponse]
)
def list_conversation_members(
    conversation_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = get_conversation_by_id(
        db,
        conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return get_conversation_members(
        db,
        conversation_id
    )
