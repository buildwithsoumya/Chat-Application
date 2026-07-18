from fastapi import HTTPException
from fastapi import status
from sqlalchemy import case
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.utils import utc_now
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.message import Message
from app.models.user import User


def serialize_participant(user: User) -> dict:
    """Serialize a conversation participant for API responses."""
    return {
        "id": str(user.id),
        "username": user.username,
        "avatar": user.avatar
    }


def parse_participant_ids(participant_ids: list[str]) -> list[int]:
    """Parse and de-duplicate participant ids from an API payload."""
    parsed_ids: list[int] = []
    for participant_id in participant_ids:
        try:
            parsed_id = int(participant_id)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=422,
                detail="participant_ids must contain valid user ids"
            ) from exc
        if parsed_id <= 0:
            raise HTTPException(
                status_code=422,
                detail="participant_ids must contain positive user ids"
            )
        if parsed_id not in parsed_ids:
            parsed_ids.append(parsed_id)
    return parsed_ids


def get_existing_direct_conversation(
    db: Session,
    user_a_id: int,
    user_b_id: int
) -> Conversation | None:
    """Return an existing one-to-one conversation for two users, if present."""
    member_counts = (
        db.query(
            ConversationMember.conversation_id,
            func.count(ConversationMember.user_id).label("member_count"),
            func.sum(
                case(
                    (
                        ConversationMember.user_id.in_([user_a_id, user_b_id]),
                        1
                    ),
                    else_=0
                )
            ).label("matching_count")
        )
        .join(Conversation, Conversation.id == ConversationMember.conversation_id)
        .filter(Conversation.is_group.is_(False))
        .group_by(ConversationMember.conversation_id)
        .subquery()
    )
    return (
        db.query(Conversation)
        .join(member_counts, Conversation.id == member_counts.c.conversation_id)
        .filter(
            member_counts.c.member_count == 2,
            member_counts.c.matching_count == 2
        )
        .first()
    )


def build_conversation_response(
    db: Session,
    conversation: Conversation,
    current_user_id: int
) -> dict:
    """Build a conversation response using persisted data."""
    members = (
        db.query(User)
        .join(ConversationMember, User.id == ConversationMember.user_id)
        .filter(ConversationMember.conversation_id == conversation.id)
        .order_by(User.id.asc())
        .all()
    )
    participants = [
        serialize_participant(member)
        for member in members
        if member.id != current_user_id
    ]

    latest_message = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .first()
    )
    last_message_at = (
        latest_message.created_at.isoformat()
        if latest_message is not None
        else None
    )

    # Count unread messages: messages from others after the user's last_read_at
    member_record = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation.id,
            ConversationMember.user_id == current_user_id
        )
        .first()
    )
    if member_record is not None:
        unread_count = (
            db.query(func.count(Message.id))
            .filter(
                Message.conversation_id == conversation.id,
                Message.sender_id != current_user_id,
                Message.created_at > member_record.last_read_at
            )
            .scalar() or 0
        )
    else:
        unread_count = 0

    return {
        "id": str(conversation.id),
        "name": conversation.name,
        "is_group": conversation.is_group,
        "participants": participants,
        "lastMessageAt": last_message_at,
        "unreadCount": unread_count
    }


def get_user_conversations(db: Session, user_id: int):
    """Return conversations where the user is a member."""
    conversations = (
        db.query(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == user_id)
        .order_by(Conversation.created_at.desc(), Conversation.id.desc())
        .all()
    )

    result = []
    for conversation in conversations:
        result.append(
            build_conversation_response(
                db=db,
                conversation=conversation,
                current_user_id=user_id
            )
        )

    return result


def mark_conversation_as_read(
    db: Session,
    conversation_id: int,
    user_id: int
) -> None:
    """Update the user's last_read_at for a conversation to now."""
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )
    if member is not None:
        member.last_read_at = utc_now()
        db.commit()


def create_new_conversation(
    db: Session,
    current_user_id: int,
    name: str | None,
    is_group: bool,
    participant_ids: list[str]
):
    """Create a direct or group conversation with validated members."""
    parsed_participant_ids = parse_participant_ids(participant_ids)
    participant_user_ids = [
        participant_id
        for participant_id in parsed_participant_ids
        if participant_id != current_user_id
    ]

    if not is_group and len(participant_user_ids) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direct conversations require exactly one other participant"
        )
    if is_group and not participant_user_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group conversations require at least one other participant"
        )

    existing_users = (
        db.query(User.id)
        .filter(User.id.in_(participant_user_ids))
        .all()
    )
    existing_user_ids = {user_id for (user_id,) in existing_users}
    missing_user_ids = set(participant_user_ids) - existing_user_ids
    if missing_user_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more participants were not found"
        )

    if not is_group:
        existing_direct_conversation = get_existing_direct_conversation(
            db=db,
            user_a_id=current_user_id,
            user_b_id=participant_user_ids[0]
        )
        if existing_direct_conversation is not None:
            return build_conversation_response(
                db=db,
                conversation=existing_direct_conversation,
                current_user_id=current_user_id
            )

    conversation = Conversation(
        name=name,
        is_group=is_group,
        created_by=current_user_id
    )
    db.add(conversation)
    db.flush()

    member_ids = [current_user_id, *participant_user_ids]
    for member_id in member_ids:
        db.add(
            ConversationMember(
                conversation_id=conversation.id,
                user_id=member_id
            )
        )

    db.commit()
    db.refresh(conversation)

    return build_conversation_response(
        db=db,
        conversation=conversation,
        current_user_id=current_user_id
    )
