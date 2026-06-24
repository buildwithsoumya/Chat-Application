from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from app.database.base import Base
class ConversationMember(Base):
    __tablename__ = "conversation_members"
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id"),
        primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        primary_key=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )