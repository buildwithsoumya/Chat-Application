"""
Backend Stabilization Tests
============================
Covers: password hashing, JWT lifecycle, conversation creation,
        messaging authorization, WebSocket manager, and WebSocket event dispatch.

All tests use an in-memory SQLite database so no live database is required.
"""
import asyncio
import unittest
from datetime import datetime
from datetime import timedelta
from datetime import timezone

from fastapi import HTTPException
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.api.dependencies import get_user_from_token
from app.core.config import settings
from app.core.errors import database_exception_handler
from app.core.jwt import create_access_token
from app.core.security import hash_password
from app.core.security import verify_password
from app.database.base import Base
from app.models.conversation import Conversation
from app.models.conversation_member import ConversationMember
from app.models.message import Message
from app.models.user import User
from app.services.conversation_service import create_new_conversation
from app.services.conversation_service import get_user_conversations
from app.services.message_service import delete_message
from app.services.message_service import edit_message
from app.services.message_service import get_conversation_messages
from app.services.message_service import send_message
from app.websocket.manager import ConnectionManager
from app.websocket import routes as websocket_routes


class FakeWebSocket:
    """Minimal WebSocket stub for unit tests."""

    def __init__(self) -> None:
        self.accepted = False
        self.closed = False
        self.close_code: int | None = None
        self.sent: list[dict] = []

    async def accept(self) -> None:
        self.accepted = True

    async def send_json(self, payload: dict) -> None:
        if self.closed:
            raise RuntimeError("socket closed")
        self.sent.append(payload)

    async def close(self, code: int = 1000) -> None:
        self.closed = True
        self.close_code = code


class BackendStabilizationTests(unittest.TestCase):
    # ------------------------------------------------------------------
    # Fixtures
    # ------------------------------------------------------------------

    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionLocal()
        self.users = self._create_users()

    def tearDown(self) -> None:
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def _create_users(self) -> list[User]:
        users = [
            User(
                username="alice",
                email="alice@example.com",
                password_hash=hash_password("password1!")
            ),
            User(
                username="bob",
                email="bob@example.com",
                password_hash=hash_password("password2!")
            ),
            User(
                username="charlie",
                email="charlie@example.com",
                password_hash=hash_password("password3!")
            )
        ]
        self.db.add_all(users)
        self.db.commit()
        for user in users:
            self.db.refresh(user)
        return users

    def _create_conversation(self) -> Conversation:
        """Create a direct conversation between alice and bob."""
        conversation = Conversation(
            name=None,
            is_group=False,
            created_by=self.users[0].id
        )
        self.db.add(conversation)
        self.db.flush()
        self.db.add_all(
            [
                ConversationMember(
                    conversation_id=conversation.id,
                    user_id=self.users[0].id
                ),
                ConversationMember(
                    conversation_id=conversation.id,
                    user_id=self.users[1].id
                )
            ]
        )
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    # ------------------------------------------------------------------
    # Security tests
    # ------------------------------------------------------------------

    def test_password_hashing_and_verification(self) -> None:
        """Correct password passes; wrong password fails."""
        hashed = hash_password("correct-password!")
        self.assertTrue(verify_password("correct-password!", hashed))
        self.assertFalse(verify_password("wrong-password", hashed))

    def test_jwt_validation_success_expired_and_malformed(self) -> None:
        """Valid token authenticates; expired and malformed tokens raise 401."""
        user = self.users[0]
        token = create_access_token({"sub": str(user.id)})

        authenticated = get_user_from_token(token, self.db)
        self.assertEqual(authenticated.id, user.id)

        # Expired token
        expired = jwt.encode(
            {
                "sub": str(user.id),
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1)
            },
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )
        with self.assertRaises(HTTPException) as ctx:
            get_user_from_token(expired, self.db)
        self.assertEqual(ctx.exception.status_code, 401)

        # Malformed token
        with self.assertRaises(HTTPException) as ctx:
            get_user_from_token("not-a-jwt", self.db)
        self.assertEqual(ctx.exception.status_code, 401)

        # Token with non-existent user
        phantom_token = create_access_token({"sub": "9999999"})
        with self.assertRaises(HTTPException) as ctx:
            get_user_from_token(phantom_token, self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    # ------------------------------------------------------------------
    # Database error handler tests
    # ------------------------------------------------------------------

    def test_database_errors_return_service_unavailable(self) -> None:
        async def scenario() -> None:
            response = await database_exception_handler(
                request=None,
                exc=OperationalError("select 1", {}, Exception("dns failure"))
            )
            self.assertEqual(response.status_code, 503)

        asyncio.run(scenario())

    # ------------------------------------------------------------------
    # Conversation tests
    # ------------------------------------------------------------------

    def test_direct_conversation_creation_and_duplicate_prevention(self) -> None:
        """Creating the same direct conversation twice returns the existing one."""
        alice, bob, _ = self.users

        first = create_new_conversation(
            db=self.db,
            current_user_id=alice.id,
            name=None,
            is_group=False,
            participant_ids=[str(bob.id)]
        )
        second = create_new_conversation(
            db=self.db,
            current_user_id=alice.id,
            name=None,
            is_group=False,
            participant_ids=[str(bob.id)]
        )

        # Same conversation id returned
        self.assertEqual(first["id"], second["id"])
        # Participants excludes the requesting user
        self.assertEqual(len(first["participants"]), 1)
        self.assertEqual(first["participants"][0]["id"], str(bob.id))

    def test_group_conversation_creation(self) -> None:
        """Group conversation can include multiple other participants."""
        alice, bob, charlie = self.users

        result = create_new_conversation(
            db=self.db,
            current_user_id=alice.id,
            name="Test Group",
            is_group=True,
            participant_ids=[str(bob.id), str(charlie.id)]
        )
        self.assertEqual(result["name"], "Test Group")
        self.assertTrue(result["is_group"])
        # Two participants returned (bob and charlie, excluding alice)
        participant_ids = {p["id"] for p in result["participants"]}
        self.assertIn(str(bob.id), participant_ids)
        self.assertIn(str(charlie.id), participant_ids)

    def test_conversation_rejects_invalid_participant_ids(self) -> None:
        """Non-integer participant IDs raise a 422 error."""
        alice = self.users[0]
        with self.assertRaises(HTTPException) as ctx:
            create_new_conversation(
                db=self.db,
                current_user_id=alice.id,
                name=None,
                is_group=False,
                participant_ids=["not-an-int"]
            )
        self.assertEqual(ctx.exception.status_code, 422)

    def test_conversation_rejects_nonexistent_participants(self) -> None:
        """Participant IDs that don't exist raise a 404 error."""
        alice = self.users[0]
        with self.assertRaises(HTTPException) as ctx:
            create_new_conversation(
                db=self.db,
                current_user_id=alice.id,
                name=None,
                is_group=False,
                participant_ids=["9999"]
            )
        self.assertEqual(ctx.exception.status_code, 404)

    def test_direct_conversation_requires_exactly_one_other_participant(self) -> None:
        """A direct conversation with zero participants is rejected."""
        alice = self.users[0]
        with self.assertRaises(HTTPException) as ctx:
            create_new_conversation(
                db=self.db,
                current_user_id=alice.id,
                name=None,
                is_group=False,
                participant_ids=[]
            )
        self.assertEqual(ctx.exception.status_code, 400)

    def test_conversation_list_returns_member_conversations(self) -> None:
        """get_user_conversations returns only conversations the user belongs to."""
        conversation = self._create_conversation()
        alice, _, charlie = self.users

        alice_convs = get_user_conversations(self.db, alice.id)
        charlie_convs = get_user_conversations(self.db, charlie.id)

        self.assertEqual(len(alice_convs), 1)
        self.assertEqual(alice_convs[0]["id"], str(conversation.id))
        self.assertEqual(len(charlie_convs), 0)

    def test_conversation_list_uses_real_latest_message_timestamp(self) -> None:
        """lastMessageAt reflects the most recent message timestamp."""
        conversation = self._create_conversation()
        alice = self.users[0]

        message = send_message(
            db=self.db,
            conversation_id=conversation.id,
            sender_id=alice.id,
            content="latest"
        )

        conversations = get_user_conversations(self.db, alice.id)
        self.assertEqual(conversations[0]["id"], str(conversation.id))
        self.assertEqual(
            conversations[0]["lastMessageAt"],
            message.created_at.isoformat()
        )

    # ------------------------------------------------------------------
    # Messaging tests
    # ------------------------------------------------------------------

    def test_message_lifecycle_authorization_and_history(self) -> None:
        """Full message lifecycle: send, retrieve, edit, delete with authz."""
        conversation = self._create_conversation()
        alice, bob, charlie = self.users

        first = send_message(
            db=self.db,
            conversation_id=conversation.id,
            sender_id=alice.id,
            content="hello"
        )
        second = send_message(
            db=self.db,
            conversation_id=conversation.id,
            sender_id=bob.id,
            content="hi"
        )

        # History is in ascending chronological order
        history = get_conversation_messages(
            db=self.db,
            conversation_id=conversation.id,
            user_id=alice.id,
            page=1,
            limit=20
        )
        self.assertEqual([m.id for m in history], [first.id, second.id])

        # Non-member cannot send a message
        with self.assertRaises(HTTPException) as ctx:
            send_message(
                db=self.db,
                conversation_id=conversation.id,
                sender_id=charlie.id,
                content="spoof"
            )
        self.assertEqual(ctx.exception.status_code, 403)

        # Non-member cannot retrieve messages
        with self.assertRaises(HTTPException) as ctx:
            get_conversation_messages(
                db=self.db,
                conversation_id=conversation.id,
                user_id=charlie.id,
                page=1,
                limit=20
            )
        self.assertEqual(ctx.exception.status_code, 403)

        # Owner can edit own message
        edited = edit_message(
            db=self.db,
            message_id=first.id,
            user_id=alice.id,
            content="hello edited"
        )
        self.assertEqual(edited.content, "hello edited")

        # Cannot edit another user's message
        with self.assertRaises(HTTPException) as ctx:
            edit_message(
                db=self.db,
                message_id=second.id,
                user_id=alice.id,
                content="not mine"
            )
        self.assertEqual(ctx.exception.status_code, 403)

        # Owner can delete own message
        delete_message(
            db=self.db,
            message_id=first.id,
            user_id=alice.id
        )
        self.assertIsNone(self.db.get(Message, first.id))

    def test_send_message_to_nonexistent_conversation(self) -> None:
        """Sending to a nonexistent conversation raises 404."""
        alice = self.users[0]
        with self.assertRaises(HTTPException) as ctx:
            send_message(
                db=self.db,
                conversation_id=99999,
                sender_id=alice.id,
                content="hello"
            )
        self.assertEqual(ctx.exception.status_code, 404)

    def test_message_pagination(self) -> None:
        """Pagination correctly limits and offsets message history."""
        conversation = self._create_conversation()
        alice = self.users[0]

        # Send 5 messages
        message_ids = []
        for i in range(5):
            msg = send_message(
                db=self.db,
                conversation_id=conversation.id,
                sender_id=alice.id,
                content=f"message {i}"
            )
            message_ids.append(msg.id)

        page1 = get_conversation_messages(
            db=self.db,
            conversation_id=conversation.id,
            user_id=alice.id,
            page=1,
            limit=3
        )
        page2 = get_conversation_messages(
            db=self.db,
            conversation_id=conversation.id,
            user_id=alice.id,
            page=2,
            limit=3
        )

        self.assertEqual(len(page1), 3)
        self.assertEqual(len(page2), 2)
        self.assertEqual([m.id for m in page1], message_ids[:3])
        self.assertEqual([m.id for m in page2], message_ids[3:])

    # ------------------------------------------------------------------
    # WebSocket manager tests
    # ------------------------------------------------------------------

    def test_connection_manager_multi_connection_per_user(self) -> None:
        """A user can have multiple active WebSocket connections."""
        async def scenario() -> None:
            manager = ConnectionManager()
            socket1 = FakeWebSocket()
            socket2 = FakeWebSocket()

            await manager.connect(1, socket1)
            await manager.connect(1, socket2)

            self.assertTrue(manager.is_online(1))
            self.assertEqual(len(manager.active_connections[1]), 2)

            # Disconnecting one socket keeps user online
            went_offline = manager.disconnect(1, socket1)
            self.assertFalse(went_offline)
            self.assertTrue(manager.is_online(1))

            # Disconnecting the last socket marks user offline
            went_offline = manager.disconnect(1, socket2)
            self.assertTrue(went_offline)
            self.assertFalse(manager.is_online(1))

        asyncio.run(scenario())

    def test_connection_manager_rooms_presence_and_cleanup(self) -> None:
        """Room membership, broadcast, and presence lifecycle work correctly."""
        async def scenario() -> None:
            manager = ConnectionManager()
            alice_socket = FakeWebSocket()
            bob_socket = FakeWebSocket()

            await manager.connect(1, alice_socket)
            await manager.connect(2, bob_socket)
            manager.join_room(10, 1, alice_socket)
            manager.join_room(10, 2, bob_socket)

            self.assertTrue(manager.is_online(1))
            self.assertEqual(manager.get_room_members(10), {1, 2})

            await manager.broadcast_to_room(
                10,
                {"type": "typing_start", "data": {"user_id": 1}}
            )
            self.assertEqual(len(alice_socket.sent), 1)
            self.assertEqual(len(bob_socket.sent), 1)

            went_offline = manager.disconnect(1, alice_socket)
            manager.leave_room(10, 1, alice_socket)

            self.assertTrue(went_offline)
            self.assertFalse(manager.is_online(1))
            self.assertEqual(manager.get_room_members(10), {2})

        asyncio.run(scenario())

    def test_broadcast_to_room_cleans_up_dead_sockets(self) -> None:
        """Broadcast removes sockets that raise RuntimeError on send."""
        async def scenario() -> None:
            manager = ConnectionManager()
            live_socket = FakeWebSocket()
            dead_socket = FakeWebSocket()
            dead_socket.closed = True  # Will raise RuntimeError on send_json

            await manager.connect(1, live_socket)
            await manager.connect(2, dead_socket)
            manager.join_room(10, 1, live_socket)
            manager.join_room(10, 2, dead_socket)

            await manager.broadcast_to_room(10, {"type": "ping"})

            # Live socket received message; dead socket was removed
            self.assertEqual(len(live_socket.sent), 1)
            self.assertFalse(manager.is_online(2))

        asyncio.run(scenario())

    # ------------------------------------------------------------------
    # WebSocket event dispatch tests
    # ------------------------------------------------------------------

    def test_websocket_dispatch_persists_and_broadcasts_message(self) -> None:
        """Message events are persisted to DB and broadcast to room members."""
        async def scenario() -> None:
            old_manager = websocket_routes.connection_manager
            manager = ConnectionManager()
            websocket_routes.connection_manager = manager
            try:
                conversation = self._create_conversation()
                alice_socket = FakeWebSocket()
                bob_socket = FakeWebSocket()
                alice, bob, _ = self.users

                await manager.connect(alice.id, alice_socket)
                await manager.connect(bob.id, bob_socket)
                manager.join_room(conversation.id, alice.id, alice_socket)
                manager.join_room(conversation.id, bob.id, bob_socket)

                should_continue = await websocket_routes.dispatch_event(
                    payload={
                        "type": "message",
                        "data": {"content": "realtime"}
                    },
                    conversation_id=conversation.id,
                    user_id=alice.id,
                    db=self.db,
                    websocket=alice_socket
                )

                self.assertTrue(should_continue)
                # Message was persisted exactly once
                self.assertEqual(self.db.query(Message).count(), 1)
                # Both alice and bob received the broadcast
                self.assertEqual(alice_socket.sent[-1]["type"], "message")
                self.assertEqual(bob_socket.sent[-1]["type"], "message")
                # Broadcast contains the persisted message data
                data = alice_socket.sent[-1]["data"]
                self.assertEqual(data["content"], "realtime")
                self.assertEqual(data["sender_id"], alice.id)
            finally:
                websocket_routes.connection_manager = old_manager

        asyncio.run(scenario())

    def test_websocket_dispatch_typing_events(self) -> None:
        """Typing start/stop events are broadcast but not persisted."""
        async def scenario() -> None:
            old_manager = websocket_routes.connection_manager
            manager = ConnectionManager()
            websocket_routes.connection_manager = manager
            try:
                conversation = self._create_conversation()
                alice_socket = FakeWebSocket()
                bob_socket = FakeWebSocket()
                alice, bob, _ = self.users

                await manager.connect(alice.id, alice_socket)
                await manager.connect(bob.id, bob_socket)
                manager.join_room(conversation.id, alice.id, alice_socket)
                manager.join_room(conversation.id, bob.id, bob_socket)

                await websocket_routes.dispatch_event(
                    payload={"type": "typing_start", "data": {}},
                    conversation_id=conversation.id,
                    user_id=alice.id,
                    db=self.db,
                    websocket=alice_socket
                )

                # No message persisted
                self.assertEqual(self.db.query(Message).count(), 0)
                # Bob received the typing event
                self.assertEqual(bob_socket.sent[-1]["type"], "typing_start")
            finally:
                websocket_routes.connection_manager = old_manager

        asyncio.run(scenario())

    def test_websocket_dispatch_unknown_event_sends_error(self) -> None:
        """Unknown event types return an error event without disconnecting."""
        async def scenario() -> None:
            old_manager = websocket_routes.connection_manager
            manager = ConnectionManager()
            websocket_routes.connection_manager = manager
            try:
                conversation = self._create_conversation()
                alice_socket = FakeWebSocket()
                alice = self.users[0]

                await manager.connect(alice.id, alice_socket)
                manager.join_room(conversation.id, alice.id, alice_socket)

                result = await websocket_routes.dispatch_event(
                    payload={"type": "unknown", "data": {}},
                    conversation_id=conversation.id,
                    user_id=alice.id,
                    db=self.db,
                    websocket=alice_socket
                )

                self.assertTrue(result)
                self.assertEqual(alice_socket.sent[-1]["type"], "error")
            finally:
                websocket_routes.connection_manager = old_manager

        asyncio.run(scenario())

    def test_websocket_dispatch_invalid_message_content_sends_error(self) -> None:
        """Empty or whitespace-only message content sends an error event."""
        async def scenario() -> None:
            old_manager = websocket_routes.connection_manager
            manager = ConnectionManager()
            websocket_routes.connection_manager = manager
            try:
                conversation = self._create_conversation()
                alice_socket = FakeWebSocket()
                alice = self.users[0]

                await manager.connect(alice.id, alice_socket)
                manager.join_room(conversation.id, alice.id, alice_socket)

                result = await websocket_routes.dispatch_event(
                    payload={"type": "message", "data": {"content": "   "}},
                    conversation_id=conversation.id,
                    user_id=alice.id,
                    db=self.db,
                    websocket=alice_socket
                )

                # Should continue (not disconnect)
                self.assertTrue(result)
                # Error sent to client
                self.assertEqual(alice_socket.sent[-1]["type"], "error")
                # No message persisted
                self.assertEqual(self.db.query(Message).count(), 0)
            finally:
                websocket_routes.connection_manager = old_manager

        asyncio.run(scenario())

    def test_websocket_dispatch_non_member_message_sends_error(self) -> None:
        """Non-member message event sends an error (does not crash the loop)."""
        async def scenario() -> None:
            old_manager = websocket_routes.connection_manager
            manager = ConnectionManager()
            websocket_routes.connection_manager = manager
            try:
                conversation = self._create_conversation()
                charlie_socket = FakeWebSocket()
                _, _, charlie = self.users

                await manager.connect(charlie.id, charlie_socket)
                manager.join_room(conversation.id, charlie.id, charlie_socket)

                result = await websocket_routes.dispatch_event(
                    payload={"type": "message", "data": {"content": "spoof"}},
                    conversation_id=conversation.id,
                    user_id=charlie.id,
                    db=self.db,
                    websocket=charlie_socket
                )

                self.assertTrue(result)
                self.assertEqual(charlie_socket.sent[-1]["type"], "error")
                self.assertEqual(self.db.query(Message).count(), 0)
            finally:
                websocket_routes.connection_manager = old_manager

        asyncio.run(scenario())


if __name__ == "__main__":
    unittest.main()
