from typing import Any

from fastapi import WebSocket
from fastapi import WebSocketDisconnect


class ConnectionManager:
    """Manage active WebSocket connections for the application."""

    def __init__(self) -> None:
        """Initialize in-memory user connections and room membership."""
        self.active_connections: dict[int, WebSocket] = {}
        self.rooms: dict[int, set[int]] = {}

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket
    ) -> None:
        """Accept and register a WebSocket connection for a user."""
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int) -> None:
        """Remove a user's WebSocket connection from the registry."""
        self.active_connections.pop(user_id, None)

    async def send_personal_message(
        self,
        user_id: int,
        payload: dict[str, Any]
    ) -> None:
        """Send a JSON payload to a connected user."""
        websocket = self.active_connections.get(user_id)
        if websocket is not None:
            await websocket.send_json(payload)

    async def broadcast_to_room(
        self,
        conversation_id: int,
        payload: dict[str, Any]
    ) -> None:
        """Send a JSON payload to every connected user in a room."""
        disconnected_user_ids: list[int] = []

        for user_id in self.get_room_members(conversation_id):
            websocket = self.active_connections.get(user_id)
            if websocket is None:
                disconnected_user_ids.append(user_id)
                continue

            try:
                await websocket.send_json(payload)
            except (RuntimeError, WebSocketDisconnect):
                disconnected_user_ids.append(user_id)

        for user_id in disconnected_user_ids:
            self.leave_room(
                conversation_id=conversation_id,
                user_id=user_id
            )
            self.disconnect(user_id)

    def join_room(
        self,
        conversation_id: int,
        user_id: int
    ) -> None:
        """Add a user to a conversation room."""
        if conversation_id not in self.rooms:
            self.rooms[conversation_id] = set()
        self.rooms[conversation_id].add(user_id)

    def leave_room(
        self,
        conversation_id: int,
        user_id: int
    ) -> None:
        """Remove a user from a conversation room and clean empty rooms."""
        room_members = self.rooms.get(conversation_id)
        if room_members is None:
            return

        room_members.discard(user_id)
        if not room_members:
            self.rooms.pop(conversation_id, None)

    def get_room_members(self, conversation_id: int) -> set[int]:
        """Return the connected user ids for a conversation room."""
        return self.rooms.get(conversation_id, set()).copy()


connection_manager = ConnectionManager()
