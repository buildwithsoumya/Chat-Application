from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status
from fastapi import WebSocket
from fastapi import WebSocketDisconnect
from sqlalchemy.orm import Session

from app.api.dependencies import get_user_from_token
from app.database.deps import get_db
from app.services.message_service import ensure_conversation_member
from app.websocket.manager import connection_manager

router = APIRouter(
    tags=["WebSocket"]
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
            message = await websocket.receive_text()
            await connection_manager.send_personal_message(
                user_id=user.id,
                message=message
            )
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.leave_room(
            conversation_id=conversation_id,
            user_id=user.id
        )
        connection_manager.disconnect(user.id)
