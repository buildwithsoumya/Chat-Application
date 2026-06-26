from fastapi import WebSocket


class ConnectionManager:
    """Manage active WebSocket connections for the application."""

    def __init__(self) -> None:
        """Initialize the in-memory active connection registry."""
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection from the active registry."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal_message(
        self,
        message: str,
        websocket: WebSocket
    ) -> None:
        """Send a text message to a single WebSocket connection."""
        await websocket.send_text(message)


connection_manager = ConnectionManager()
