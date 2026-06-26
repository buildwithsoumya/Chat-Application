from json import JSONDecodeError

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.dependencies import get_user_from_token
from app.database.deps import get_db
from app.schemas.message import MessageCreate
from app.services.message_service import ensure_conversation_member
from app.services.message_service import send_message
from app.websocket.manager import connection_manager

router = APIRouter(
    tags=["WebSocket"]
)


async def send_error_event(
    websocket: WebSocket,
    message: str
) -> None:
    """Send a structured WebSocket error event to a client."""
    await websocket.send_json(
        {
            "type": "error",
            "data": {
                "message": message
            }
        }
    )


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db)
) -> None:
    """Authenticate and join a conversation-scoped WebSocket room."""
    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user = get_user_from_token(
            token=token,
            db=db
        )
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        ensure_conversation_member(
            db=db,
            conversation_id=conversation_id,
            user_id=user.id
        )
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await connection_manager.connect(
        user_id=user.id,
        websocket=websocket
    )
    connection_manager.join_room(
        conversation_id=conversation_id,
        user_id=user.id
    )
    try:
        while True:
            try:
                payload = await websocket.receive_json()
                message_payload = MessageCreate(
                    conversation_id=conversation_id,
                    content=payload.get("content")
                )
            except (AttributeError, JSONDecodeError, ValidationError):
                await send_error_event(
                    websocket=websocket,
                    message="Invalid message payload"
                )
                continue

            try:
                message = send_message(
                    db=db,
                    conversation_id=message_payload.conversation_id,
                    sender_id=user.id,
                    content=message_payload.content
                )
            except HTTPException:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return

            await connection_manager.broadcast_to_room(
                conversation_id=conversation_id,
                payload={
                    "type": "message",
                    "data": {
                        "id": message.id,
                        "conversation_id": message.conversation_id,
                        "sender_id": message.sender_id,
                        "content": message.content,
                        "created_at": message.created_at.isoformat()
                    }
                }
            )
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.leave_room(
            conversation_id=conversation_id,
            user_id=user.id
        )
        connection_manager.disconnect(user.id)
