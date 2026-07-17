from typing import Any

from fastapi import WebSocket
from fastapi import WebSocketDisconnect


class ConnectionManager:
    """Manage active WebSocket connections, rooms, and presence."""

    def __init__(self) -> None:
        """Initialize in-memory realtime state."""
        self.active_connections: dict[int, set[WebSocket]] = {}
        self.connection_users: dict[WebSocket, int] = {}
        self.rooms: dict[int, set[int]] = {}
        self.room_connections: dict[int, dict[int, set[WebSocket]]] = {}
        self.online_users: set[int] = set()

    async def connect(
        self,
        user_id: int,
        websocket: WebSocket
    ) -> None:
        """Accept and register a WebSocket connection for a user."""
        await websocket.accept()
        self.active_connections.setdefault(user_id, set()).add(websocket)
        self.connection_users[websocket] = user_id
        self.online_users.add(user_id)

    def disconnect(
        self,
        user_id: int,
        websocket: WebSocket | None = None
    ) -> bool:
        """Remove a WebSocket connection and return whether the user went offline."""
        sockets = self.active_connections.get(user_id)
        if sockets is None:
            self.online_users.discard(user_id)
            return False

        if websocket is None:
            for socket in sockets:
                self.connection_users.pop(socket, None)
            sockets.clear()
        else:
            sockets.discard(websocket)
            self.connection_users.pop(websocket, None)

        if sockets:
            return False

        self.active_connections.pop(user_id, None)
        was_online = user_id in self.online_users
        self.online_users.discard(user_id)
        return was_online

    def join_room(
        self,
        conversation_id: int,
        user_id: int,
        websocket: WebSocket
    ) -> None:
        """Add a user to a conversation room."""
        self.rooms.setdefault(conversation_id, set()).add(user_id)
        room_connections = self.room_connections.setdefault(conversation_id, {})
        room_connections.setdefault(user_id, set()).add(websocket)

    def leave_room(
        self,
        conversation_id: int,
        user_id: int,
        websocket: WebSocket | None = None
    ) -> None:
        """Remove a user from a conversation room and delete empty rooms."""
        user_sockets = self.room_connections.get(conversation_id, {}).get(user_id)
        if user_sockets is None:
            return

        if websocket is None:
            user_sockets.clear()
        else:
            user_sockets.discard(websocket)

        if user_sockets:
            return

        room_connections = self.room_connections.get(conversation_id)
        if room_connections is not None:
            room_connections.pop(user_id, None)
            if not room_connections:
                self.room_connections.pop(conversation_id, None)

        room_members = self.rooms.get(conversation_id)
        if room_members is not None:
            room_members.discard(user_id)
        if room_members is not None and not room_members:
            self.rooms.pop(conversation_id, None)

    def get_room_members(self, conversation_id: int) -> set[int]:
        """Return a copy of connected user ids in a room."""
        return self.rooms.get(conversation_id, set()).copy()

    def is_online(self, user_id: int) -> bool:
        """Return whether a user has at least one active WebSocket."""
        return user_id in self.online_users

    async def send_personal_message(
        self,
        user_id: int,
        payload: dict[str, Any]
    ) -> None:
        """Send a JSON payload to all sockets for one connected user."""
        for websocket in list(self.active_connections.get(user_id, set())):
            await websocket.send_json(payload)

    async def broadcast_to_room(
        self,
        conversation_id: int,
        payload: dict[str, Any]
    ) -> None:
        """Send a JSON payload to every connected socket in a room."""
        disconnected: list[tuple[int, WebSocket]] = []

        room_connections = self.room_connections.get(conversation_id, {})
        for user_id, sockets in list(room_connections.items()):
            for websocket in list(sockets):
                try:
                    await websocket.send_json(payload)
                except (RuntimeError, WebSocketDisconnect):
                    disconnected.append((user_id, websocket))

        for user_id, websocket in disconnected:
            self.disconnect(
                user_id=user_id,
                websocket=websocket
            )
            self.leave_room(
                conversation_id=conversation_id,
                user_id=user_id,
                websocket=websocket
            )


connection_manager = ConnectionManager()
