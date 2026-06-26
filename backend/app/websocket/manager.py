from fastapi import WebSocket


class ConnectionManager:
    """Manage active WebSocket connections for the application."""

    def __init__(self) -> None:
        """Initialize the in-memory user connection registry."""
        self.active_connections: dict[int, WebSocket] = {}

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
        message: str
    ) -> None:
        """Send a text message to a connected user."""
        websocket = self.active_connections.get(user_id)
        if websocket is not None:
            await websocket.send_text(message)


connection_manager = ConnectionManager()
