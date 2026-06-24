from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
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