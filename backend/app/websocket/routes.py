from json import JSONDecodeError
from typing import Any

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
    """Send a structured WebSocket error event."""
    await websocket.send_json(
        {
            "type": "error",
            "data": {
                "message": message
            }
        }
    )


def normalize_message_payload(
    payload: dict[str, Any],
    conversation_id: int
) -> MessageCreate:
    """Validate a message event and return persistence-ready data."""
    data = payload.get("data")
    if data is None and "content" in payload:
        data = payload
    if not isinstance(data, dict):
        raise ValueError("Message event data must be an object")

    content = data.get("content")
    if content is None:
        raise ValueError("Message content is required")

    return MessageCreate(
        conversation_id=conversation_id,
        content=content
    )


def message_event(message) -> dict[str, Any]:
    """Build the outbound message event from a persisted message."""
    return {
        "type": "message",
        "data": {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "created_at": message.created_at.isoformat()
        }
    }


async def broadcast_presence_event(
    conversation_id: int,
    user_id: int,
    status_value: str
) -> None:
    """Broadcast a presence status update to a room."""
    await connection_manager.broadcast_to_room(
        conversation_id=conversation_id,
        payload={
            "type": "presence",
            "data": {
                "user_id": user_id,
                "status": status_value
            }
        }
    )


async def handle_message_event(
    payload: dict[str, Any],
    conversation_id: int,
    user_id: int,
    db: Session,
    websocket: WebSocket
) -> bool:
    """Persist and broadcast an incoming message event."""
    try:
        message_payload = normalize_message_payload(
            payload=payload,
            conversation_id=conversation_id
        )
    except (ValueError, ValidationError):
        await send_error_event(
            websocket=websocket,
            message="Invalid message payload"
        )
        return True

    try:
        message = send_message(
            db=db,
            conversation_id=message_payload.conversation_id,
            sender_id=user_id,
            content=message_payload.content
        )
    except HTTPException:
        await send_error_event(
            websocket=websocket,
            message="You are not authorized to send messages to this conversation"
        )
        return True

    await connection_manager.broadcast_to_room(
        conversation_id=conversation_id,
        payload=message_event(message)
    )
    return True


async def handle_typing_event(
    event_type: str,
    conversation_id: int,
    user_id: int
) -> None:
    """Broadcast a transient typing event to a room."""
    await connection_manager.broadcast_to_room(
        conversation_id=conversation_id,
        payload={
            "type": event_type,
            "data": {
                "conversation_id": conversation_id,
                "user_id": user_id
            }
        }
    )


async def dispatch_event(
    payload: dict[str, Any],
    conversation_id: int,
    user_id: int,
    db: Session,
    websocket: WebSocket
) -> bool:
    """Route an incoming WebSocket event to the correct handler."""
    event_type = payload.get("type")
    if event_type is None and "content" in payload:
        event_type = "message"

    if event_type == "message":
        return await handle_message_event(
            payload=payload,
            conversation_id=conversation_id,
            user_id=user_id,
            db=db,
            websocket=websocket
        )

    if event_type in {"typing_start", "typing_stop"}:
        if not isinstance(payload.get("data"), dict):
            await send_error_event(
                websocket=websocket,
                message="Invalid typing event payload"
            )
            return True
        await handle_typing_event(
            event_type=event_type,
            conversation_id=conversation_id,
            user_id=user_id
        )
        return True

    await send_error_event(
        websocket=websocket,
        message="Unknown event type"
    )
    return True


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db)
) -> None:
    """Authenticate a user, join a room, and process realtime events."""
    # Accept the connection before sending any close/error frames.
    # The WebSocket protocol requires the handshake to be completed
    # before the server can send a close frame.
    await websocket.accept()

    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user = get_user_from_token(
            token=token,
            db=db
        )
        ensure_conversation_member(
            db=db,
            conversation_id=conversation_id,
            user_id=user.id
        )
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    connection_manager.join_room(
        conversation_id=conversation_id,
        user_id=user.id,
        websocket=websocket
    )
    await connection_manager.connect(
        user_id=user.id,
        websocket=websocket
    )
    await broadcast_presence_event(
        conversation_id=conversation_id,
        user_id=user.id,
        status_value="online"
    )

    try:
        while True:
            try:
                payload = await websocket.receive_json()
                if not isinstance(payload, dict):
                    raise ValueError("Event payload must be an object")
            except (JSONDecodeError, ValueError):
                await send_error_event(
                    websocket=websocket,
                    message="Malformed event payload"
                )
                continue

            should_continue = await dispatch_event(
                payload=payload,
                conversation_id=conversation_id,
                user_id=user.id,
                db=db,
                websocket=websocket
            )
            if not should_continue:
                return
    except WebSocketDisconnect:
        pass
    finally:
        went_offline = connection_manager.disconnect(
            user_id=user.id,
            websocket=websocket
        )
        connection_manager.leave_room(
            conversation_id=conversation_id,
            user_id=user.id,
            websocket=websocket
        )
        if went_offline:
            await broadcast_presence_event(
                conversation_id=conversation_id,
                user_id=user.id,
                status_value="offline"
            )
