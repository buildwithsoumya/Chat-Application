# ChatSphere Backend Stabilization Report

**Sprint:** Backend Stabilization  
**Date:** 2026-07-09  
**Engineer:** Senior Backend AI (Antigravity)  
**Test Result:** 21 / 21 tests passed

---

## 1. Executive Summary

The ChatSphere backend (FastAPI + SQLAlchemy + PostgreSQL) underwent a full stabilization sprint covering authentication, conversations, messaging, WebSockets, database models, API consistency, security, performance, code quality, and testing.

The project had a reasonable architectural foundation but contained **12 distinct bugs** ranging from a critical WebSocket protocol violation (close-before-accept) to silent Pydantic v2 validator failure and an anonymous database constraint that breaks Alembic downgrade.

All identified bugs have been fixed, all dead code removed, cascade rules added, the missing `/users/search` endpoint created, and a 21-test automated suite written and confirmed green.

---

## 2. Bugs Discovered and Fixed

### Bug 1 — WebSocket close() called before accept() [CRITICAL]

**File:** `app/websocket/routes.py`

**Root Cause:** The WebSocket handshake must be completed via `await websocket.accept()` before the server can send any frame, including a close frame. The original code called `await websocket.close(...)` immediately when `token is None` — before `accept()` was ever called. This raised a `RuntimeError` at runtime, making all unauthenticated connection attempts crash the server-side handler instead of cleanly rejecting the client.

**Fix:** Moved `await websocket.accept()` to be the very first operation in the endpoint, before any validation. Rejection now sends a close frame on an accepted (but immediately closing) connection, which is the correct WebSocket protocol behavior.

---

### Bug 2 — Pydantic v2 field validators silently ignored [HIGH]

**File:** `app/schemas/message.py`

**Root Cause:** Pydantic v2 changed the validator registration API. The old pattern `_validate_content = field_validator("content")(fn)` used a private-name attribute (leading underscore) which Pydantic v2 does not recognize as a validator. The result: `MessageCreate` and `MessageUpdate` accepted whitespace-only and empty strings despite the validator appearing to check for them.

**Fix:** Replaced with the proper Pydantic v2 `@field_validator("content") @classmethod def validate_content(cls, value) -> str` decorator pattern.

---

### Bug 3 — ConversationCreate ignores camelCase frontend payload [HIGH]

**File:** `app/schemas/conversation.py`

**Root Cause:** The frontend sends `isGroup` and `participantIds` (camelCase). The backend schema expected `is_group` and `participant_ids` (snake_case) with no alias configuration. Pydantic silently ignored the frontend fields, defaulting `is_group=False` and `participant_ids=[]`. Every created conversation was a self-only direct chat regardless of what the frontend sent.

**Fix:** Added `alias="isGroup"` and `alias="participantIds"` to the relevant fields, and set `model_config = {"populate_by_name": True}` so both snake_case (programmatic) and camelCase (frontend) forms are accepted.

---

### Bug 4 — ConversationResponse uses deprecated Pydantic v1 Config class [MEDIUM]

**File:** `app/schemas/conversation.py`

**Root Cause:** `class Config: from_attributes = True` is the Pydantic v1 syntax. Under Pydantic v2 it is deprecated and may not work correctly with `from_attributes` in all serialization paths.

**Fix:** Replaced `class Config` with `model_config = {"from_attributes": True}` throughout all schemas.

---

### Bug 5 — Anonymous unique constraint breaks Alembic downgrade [MEDIUM]

**File:** `alembic/versions/51c3dde87de6_create_users_table.py`

**Root Cause:** `op.create_unique_constraint(None, 'users', ['email'])` passes `None` as the constraint name. On upgrade, Alembic auto-generates a name, but the corresponding downgrade `op.drop_constraint(None, ...)` cannot reference it, causing `alembic downgrade` to fail on PostgreSQL with "constraint not found".

**Fix:** Named the constraint `'uq_users_email'` in both `create_unique_constraint` and `drop_constraint`.

---

### Bug 6 — Missing cascade rules on all foreign keys [MEDIUM]

**Files:** `app/models/conversation.py`, `app/models/conversation_member.py`, `app/models/message.py`

**Root Cause:** No `ondelete` parameter was set on any foreign key. Deleting a user or conversation would either be blocked by the database (RESTRICT behavior) or leave orphaned rows.

**Fix:** Added `ondelete="CASCADE"` to all foreign keys: `conversations.created_by`, `conversation_members.conversation_id`, `conversation_members.user_id`, `messages.conversation_id`, `messages.sender_id`.

---

### Bug 7 — WebSocket message handler terminates session on per-event auth failure [HIGH]

**File:** `app/websocket/routes.py`

**Root Cause:** `handle_message_event` called `await websocket.close(code=WS_1008_POLICY_VIOLATION)` when `send_message` raised an HTTPException. This terminated the entire WebSocket session for a per-event condition that should result in an error event, not a disconnection.

**Fix:** Changed to send an error event `{"type": "error", ...}` and return `True` to keep the loop running. Sessions are only closed for hard authentication failures at connection time.

---

### Bug 8 — normalize_message_payload passes None content to MessageCreate [MEDIUM]

**File:** `app/websocket/routes.py`

**Root Cause:** `content=data.get("content")` returns `None` if the key is absent. `MessageCreate(content=None)` would fail with an opaque Pydantic error.

**Fix:** Added an explicit `None` check before constructing `MessageCreate`, raising `ValueError` which is caught and returned as a clean error event.

---

### Bug 9 — UserCreate has no server-side validation constraints [MEDIUM]

**File:** `app/schemas/user.py`

**Root Cause:** `username` and `password` had no length or content constraints. A 1-character username and 1-character password could be registered.

**Fix:** Added `Field(min_length=3, max_length=50)` to `username` and `Field(min_length=8, max_length=72)` to `password`.

---

### Bug 10 — No user search endpoint (blocks conversation creation) [HIGH]

**File:** `app/api/users.py` (endpoint was missing)

**Root Cause:** The frontend conversation creation flow requires looking up other users by username to get their IDs. No endpoint for this existed. Without it, `participant_ids` in `ConversationCreate` could never be populated correctly from the UI.

**Fix:** Added `GET /users/search?q=<prefix>&limit=<n>` that searches users by username prefix (case-insensitive), excluding the current user. Returns `UserSearchResult` (id + username).

---

### Bug 11 — CORS origins hardcoded to localhost [MEDIUM]

**File:** `app/main.py`

**Root Cause:** `allow_origins=["http://localhost:5173"]` is hardcoded. Any production deployment would require a code change.

**Fix:** Added `CORS_ORIGINS` environment variable support (comma-separated list). Falls back to localhost for local development.

---

### Bug 12 — utc_now() duplicated across 4 files [LOW]

**Files:** `app/models/conversation.py`, `app/models/conversation_member.py`, `app/models/message.py`, `app/services/message_service.py`

**Root Cause:** The same function was copy-pasted into each file. Future changes would require updating all four locations with risk of inconsistency.

**Fix:** Extracted to `app/core/utils.py` and updated all four files to import from there.

---

## 3. Files Modified

| File | Change Type | Description |
|---|---|---|
| `app/main.py` | Modified | CORS env-driven, health endpoint, import cleanup |
| `app/core/utils.py` | New | Centralized utc_now() |
| `app/database/session.py` | Modified | Removed aggressive pool_timeout, added pool_size/max_overflow/pool_recycle |
| `app/models/conversation.py` | Modified | Centralized utc_now, ondelete CASCADE, explicit nullable |
| `app/models/conversation_member.py` | Modified | Centralized utc_now, ondelete CASCADE |
| `app/models/message.py` | Modified | Centralized utc_now, ondelete CASCADE |
| `app/schemas/conversation.py` | Modified | camelCase aliases, modern model_config |
| `app/schemas/message.py` | Modified | Fixed Pydantic v2 validators |
| `app/schemas/user.py` | Modified | Added field constraints, UserSearchResult schema |
| `app/api/conversations.py` | Modified | Minor cleanup, safe is_group defaulting |
| `app/api/users.py` | Modified | Added /users/search endpoint |
| `app/services/message_service.py` | Modified | Centralized utc_now, return type annotations |
| `app/websocket/routes.py` | Modified | Fixed accept-before-close, error event on authz fail, null content guard |
| `alembic/versions/51c3dde87de6_create_users_table.py` | Modified | Named unique constraint |
| `tests/test_backend_stabilization.py` | Modified | Expanded from 8 to 21 tests |
| `requirements.txt` | Modified | Added pytest, pytest-asyncio, httpx |
| `pytest.ini` | New | Pytest configuration |
| `.env.example` | New | Environment variable template |

All other files (`app/core/config.py`, `app/core/jwt.py`, `app/core/security.py`, `app/core/errors.py`, `app/database/base.py`, `app/database/deps.py`, `app/models/user.py`, `app/api/auth.py`, `app/api/messages.py`, `app/api/dependencies.py`, `app/services/conversation_service.py`, `app/services/user_service.py`, `app/websocket/manager.py`) were reviewed and found correct — no changes made.

---

## 4. Test Results

```
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.6.0
rootdir: backend, configfile: pytest.ini
plugins: anyio-4.14.0, asyncio-1.4.0
collected 21 items

test_broadcast_to_room_cleans_up_dead_sockets              PASSED
test_connection_manager_multi_connection_per_user           PASSED
test_connection_manager_rooms_presence_and_cleanup          PASSED
test_conversation_list_returns_member_conversations         PASSED
test_conversation_list_uses_real_latest_message_timestamp   PASSED
test_conversation_rejects_invalid_participant_ids           PASSED
test_conversation_rejects_nonexistent_participants          PASSED
test_database_errors_return_service_unavailable             PASSED
test_direct_conversation_creation_and_duplicate_prevention  PASSED
test_direct_conversation_requires_exactly_one_other_participant PASSED
test_group_conversation_creation                            PASSED
test_jwt_validation_success_expired_and_malformed           PASSED
test_message_lifecycle_authorization_and_history            PASSED
test_message_pagination                                     PASSED
test_password_hashing_and_verification                      PASSED
test_send_message_to_nonexistent_conversation               PASSED
test_websocket_dispatch_invalid_message_content_sends_error PASSED
test_websocket_dispatch_non_member_message_sends_error      PASSED
test_websocket_dispatch_persists_and_broadcasts_message     PASSED
test_websocket_dispatch_typing_events                       PASSED
test_websocket_dispatch_unknown_event_sends_error           PASSED

============================= 21 passed in 15.80s =============================
```

---

## 5. Remaining Known Limitations

The following items require architectural changes or significant new features beyond a stabilization sprint scope.

**5.1 In-memory WebSocket state does not scale horizontally.** The ConnectionManager stores all connections, room memberships, and presence in process memory. Multiple workers or instances will result in incorrect broadcast, presence, and room membership behavior. Requires Redis pub/sub or a managed realtime backplane.

**5.2 WebSocket token in query string.** The `?token=...` parameter appears in access logs, browser history, and proxy logs. Requires short-lived ticket exchange or cookie-based auth.

**5.3 JWT stored in localStorage.** Susceptible to XSS token exfiltration. Requires HttpOnly cookie with SameSite=Strict and CSRF token, or refresh token architecture.

**5.4 Message history uses offset pagination.** Offset pagination is slow at scale and unstable when new messages arrive during paging. Requires cursor-based pagination using `(created_at, id)`.

**5.5 No rate limiting.** No rate limiting on login, registration, message sending, or WebSocket connections. Requires slowapi middleware or reverse proxy rate limiting.

**5.6 No structured logging or observability.** No structured logs, request IDs, error tracking, or metrics endpoint. Requires structlog, request ID middleware, and error tracking integration.

**5.7 Alembic migrations not verified against live database.** The migration chain was reviewed for correctness but `alembic upgrade head` on the live Supabase database was not run during this sprint.

**5.8 No message deduplication / idempotency.** WebSocket message retries after network hiccups could result in duplicate persistence. No client message ID strategy exists.

---

## 6. Backend Architecture Observations

| Observation | Assessment |
|---|---|
| FastAPI with dependency injection for auth | Correct pattern |
| SQLAlchemy 2.0 ORM with mapped_column | Modern and correct |
| Alembic migration chain | Coherent (e5c4 to 51c3 to 968c to b7f2 to c8a4) |
| Service layer separated from routes | Good separation of concerns |
| JWT via python-jose, bcrypt via bcrypt | Correct library choices |
| WebSocket authentication via query token | Works but has security tradeoffs (see 5.2) |
| In-memory WebSocket manager | Single-process only — scale blocker (see 5.1) |
| Conversation membership checked everywhere | Enforced in message service and WS route |
| Message persist then commit then broadcast | Correct and safe ordering |

---

## 7. Security Observations

| Finding | Severity | Status |
|---|---|---|
| WebSocket close before accept (crash vector) | Critical | Fixed |
| Pydantic validators silently inactive | High | Fixed |
| No input length limits on registration | Medium | Fixed |
| CORS origins hardcoded | Medium | Fixed |
| Anonymous unique constraint (DB integrity) | Medium | Fixed |
| CASCADE rules missing (orphaned rows) | Medium | Fixed |
| JWT in localStorage | High | Known limitation |
| WebSocket token in query string | High | Known limitation |
| No rate limiting | High | Known limitation |
| No account lockout or brute-force detection | High | Known limitation |
| No CSRF strategy | Medium | Out of scope (no cookies used) |
| No content sanitization policy | Low | Out of scope |

---

## 8. Performance Observations

| Finding | Severity | Impact |
|---|---|---|
| Conversation list N+1 member queries | Medium | Degrades linearly with conversation count |
| Message history offset pagination | Medium | Slow and unstable at scale |
| No database query profiling | Low | Cannot identify slow queries |
| No index on conversations.created_by | Low | Full scan when filtering by creator |
| utc_now() centralized | Fixed | Eliminated 4-copy inconsistency risk |
| Connection pool configuration corrected | Fixed | pool_size=10, max_overflow=20, pool_recycle=1800 added |

---

## 9. Production Readiness Assessment

| Category | Before Sprint | After Sprint |
|---|---|---|
| Backend Runtime | WebSocket close crash | No runtime crashes |
| Authentication | Correct | Correct with field validation |
| Authorization | Enforced | Enforced with error events |
| Conversation Creation | Silently ignores participants | camelCase aliases with validation |
| Messaging | Mostly correct | Validators enforced |
| WebSocket Protocol | Protocol violation crash | Protocol correct |
| Database Integrity | Missing cascades | Cascade rules added |
| Alembic Migrations | Broken downgrade | Named constraint |
| User Search | Missing endpoint | Added |
| Automated Tests | 8 tests incomplete | 21 tests all passing |
| Environment Config | No .env.example | .env.example created |
| CORS | Hardcoded | Env-driven |
| Scalability | In-memory WS state | Known limitation |
| Rate Limiting | None | Known limitation |
| Structured Logging | None | Known limitation |

**Verdict:** The backend is now stable and functionally correct for a single-instance deployment with moderate load. All critical and high-severity bugs have been resolved. The remaining limitations are scalability and security hardening items requiring architectural work beyond stabilization sprint scope.

Before scaled production deployment, prioritize: Redis-backed WebSocket fanout (5.1), rate limiting (5.5), and secure token transport (5.2 and 5.3).
