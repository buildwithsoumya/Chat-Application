from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.deps import get_db
from app.schemas.message import MessageCreate
from app.schemas.message import MessageResponse
from app.services.message_service import (
    get_conversation_by_id,
    get_conversation_messages,
    is_conversation_member,
    send_message
)

router = APIRouter(
    tags=["Messages"]
)


@router.post(
    "/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED
)
def create_message(
    payload: MessageCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = get_conversation_by_id(
        db,
        payload.conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if not is_conversation_member(
        db,
        payload.conversation_id,
        current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation"
        )

    return send_message(
        db=db,
        conversation_id=payload.conversation_id,
        sender_id=current_user.id,
        content=payload.content
    )


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse]
)
def list_conversation_messages(
    conversation_id: int,
    page: int = Query(
        default=1,
        ge=1
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100
    ),
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

    if not is_conversation_member(
        db,
        conversation_id,
        current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation"
        )

    return get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
        page=page,
        limit=limit
    )
