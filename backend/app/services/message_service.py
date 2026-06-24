from sqlalchemy.orm import Session

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
):
    return (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
        is not None
    )


def send_message(
    db: Session,
    conversation_id: int,
    sender_id: int,
    content: str
):
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_conversation_messages(
    db: Session,
    conversation_id: int,
    page: int,
    limit: int
):
    offset = (page - 1) * limit
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
