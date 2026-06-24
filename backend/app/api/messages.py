from fastapi import APIRouter
from fastapi import Depends
from fastapi import Query
from fastapi import status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.deps import get_db
from app.schemas.message import MessageCreate
from app.schemas.message import MessageResponse
from app.schemas.message import MessageUpdate
from app.services.message_service import (
    delete_message,
    edit_message,
    get_conversation_messages,
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
    return get_conversation_messages(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        page=page,
        limit=limit
    )


@router.patch(
    "/messages/{message_id}",
    response_model=MessageResponse
)
def update_message(
    message_id: int,
    payload: MessageUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return edit_message(
        db=db,
        message_id=message_id,
        user_id=current_user.id,
        content=payload.content
    )


@router.delete(
    "/messages/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_message(
    message_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    delete_message(
        db=db,
        message_id=message_id,
        user_id=current_user.id
    )
    return None
