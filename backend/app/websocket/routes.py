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
from app.websocket.manager import connection_manager

router = APIRouter(
    tags=["WebSocket"]
)


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db)
) -> None:
    """Authenticate a WebSocket connection and echo incoming messages."""
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

    await connection_manager.connect(
        user_id=user.id,
        websocket=websocket
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
        connection_manager.disconnect(user.id)
