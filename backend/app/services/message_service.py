from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session

from app.core.utils import utc_now
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.message import Message


def get_conversation_by_id(
    db: Session,
    conversation_id: int
):
    return (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )


def is_conversation_member(
    db: Session,
    conversation_id: int,
    user_id: int
) -> bool:
    return (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
        is not None
    )


def get_message_by_id(
    db: Session,
    message_id: int
):
    return (
        db.query(Message)
        .filter(Message.id == message_id)
        .first()
    )


def ensure_conversation_exists(
    db: Session,
    conversation_id: int
) -> Conversation:
    conversation = get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return conversation


def ensure_conversation_member(
    db: Session,
    conversation_id: int,
    user_id: int
) -> None:
    """Verify conversation exists and user is a member. Raises 404 or 403."""
    ensure_conversation_exists(db, conversation_id)
    if not is_conversation_member(db, conversation_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation"
        )


def ensure_message_owner(
    message: Message,
    user_id: int
) -> None:
    if message.sender_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the owner of this message"
        )


def send_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    content: str,
    attachment: str | None = None
) -> Message:
    """Validate membership, persist message, commit, and return it."""
    ensure_conversation_member(db, conversation_id, sender_id)
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        attachment=attachment
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_conversation_messages(
    db: Session,
    conversation_id: int,
    user_id: int,
    page: int,
    limit: int
) -> list[Message]:
    ensure_conversation_member(db, conversation_id, user_id)
    offset = (page - 1) * limit
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def edit_message(
    db: Session,
    message_id: int,
    user_id: int,
    content: str
) -> Message:
    message = get_message_by_id(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    ensure_conversation_member(db, message.conversation_id, user_id)
    ensure_message_owner(message, user_id)
    message.content = content
    message.updated_at = utc_now()
    db.commit()
    db.refresh(message)
    return message


def delete_message(
    db: Session,
    message_id: int,
    user_id: int
) -> None:
    message = get_message_by_id(db, message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    ensure_conversation_member(db, message.conversation_id, user_id)
    ensure_message_owner(message, user_id)
    db.delete(message)
    db.commit()
