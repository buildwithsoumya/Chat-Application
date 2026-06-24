from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.user import User


def get_conversation_by_id(
    db: Session,
    conversation_id: int
):
    return (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .first()
    )


def get_conversation_member(
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
    )


def create_conversation(
    db: Session,
    name: str | None,
    is_group: bool,
    creator_id: int
):
    conversation = Conversation(
        name=name,
        is_group=is_group,
        created_by=creator_id
    )
    db.add(conversation)
    db.flush()
    membership = ConversationMember(
        conversation_id=conversation.id,
        user_id=creator_id
    )
    db.add(membership)
    db.commit()
    db.refresh(conversation)
    return conversation
def get_user_conversations(
    db: Session,
    user_id: int
):
    return (
        db.query(Conversation)
        .join(
            ConversationMember,
            Conversation.id ==
            ConversationMember.conversation_id
        )
        .filter(
            ConversationMember.user_id == user_id
        )
        .all()
    )


def add_conversation_member(
    db: Session,
    conversation_id: int,
    user_id: int
):
    membership = ConversationMember(
        conversation_id=conversation_id,
        user_id=user_id
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def get_conversation_members(
    db: Session,
    conversation_id: int
):
    return (
        db.query(User)
        .join(
            ConversationMember,
            User.id == ConversationMember.user_id
        )
        .filter(
            ConversationMember.conversation_id == conversation_id
        )
        .all()
    )
