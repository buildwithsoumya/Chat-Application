from sqlalchemy.orm import Session
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.user import User

def get_user_conversations(db: Session, user_id: int):
    # Get all conversations the user is a member of
    user_conv_ids = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == user_id
    ).subquery()

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(user_conv_ids)
    ).all()
    
    result = []
    for conv in conversations:
        # Get members
        members = db.query(User).join(
            ConversationMember, User.id == ConversationMember.user_id
        ).filter(
            ConversationMember.conversation_id == conv.id
        ).all()
        
        participants = [
            {"id": str(m.id), "username": m.username, "avatar": m.avatar_url if hasattr(m, 'avatar_url') else None}
            for m in members if m.id != user_id
        ]
        
        # If it's not a group and no other participants, they might be talking to themselves, so handle that
        if not participants and members:
            participants = [{"id": str(members[0].id), "username": members[0].username, "avatar": members[0].avatar_url if hasattr(members[0], 'avatar_url') else None}]

        result.append({
            "id": str(conv.id),
            "name": conv.name,
            "is_group": conv.is_group,
            "participants": participants,
            "lastMessageAt": None, # Mock
            "unreadCount": 0 # Mock
        })
        
    return result

def create_new_conversation(db: Session, current_user_id: int, name: str, is_group: bool, participant_ids: list):
    conv = Conversation(
        name=name,
        is_group=is_group,
        created_by=current_user_id
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    
    # Add creator
    db.add(ConversationMember(conversation_id=conv.id, user_id=current_user_id))
    
    # Add other participants
    for pid in participant_ids:
        try:
            pid_int = int(pid)
            if pid_int != current_user_id:
                db.add(ConversationMember(conversation_id=conv.id, user_id=pid_int))
        except ValueError:
            pass
            
    db.commit()
    
    # Fetch members for response
    members = db.query(User).join(
        ConversationMember, User.id == ConversationMember.user_id
    ).filter(
        ConversationMember.conversation_id == conv.id
    ).all()
    
    participants = [
        {"id": str(m.id), "username": m.username, "avatar": m.avatar_url if hasattr(m, 'avatar_url') else None}
        for m in members if m.id != current_user_id
    ]

    return {
        "id": str(conv.id),
        "name": conv.name,
        "is_group": conv.is_group,
        "participants": participants,
        "lastMessageAt": None,
        "unreadCount": 0
    }
