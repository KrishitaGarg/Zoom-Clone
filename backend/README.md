# Zoom Clone Backend

The FastAPI backend owns meeting and participant mutations, persists data with SQLAlchemy and SQLite, broadcasts authoritative room state, and forwards targeted WebRTC signaling.

## Responsibilities

- REST APIs for instant/scheduled meetings, joining, leaving, media state, host removal, and meeting end.
- SQLite persistence with `Meeting`, `MeetingParticipant`, and `ParticipantSession` models.
- Idempotent startup seed data, including the default application user.
- `WS /ws/meetings/{meeting_id}?participant_id={id}` for room-state snapshots and WebRTC signaling.
- Room-scoped, in-memory chat events with validated sender names and UTC timestamps.
- Targeted forwarding of `webrtc_offer`, `webrtc_answer`, and `ice_candidate`; signaling messages are not broadcast to every room socket.

## Structure

```text
backend/
├── app/api/          # Users, meetings, participants, WebSocket routes
├── app/core/         # Settings and SQLAlchemy configuration
├── app/models/       # Database models
├── app/realtime/     # Single-process connection manager
├── app/schemas/      # Pydantic schemas
├── app/services/     # Meeting lifecycle operations
├── requirements.txt
└── .env.example
```

## Local development

```bash
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

REST API: `http://localhost:8000/api`  
OpenAPI: `http://localhost:8000/docs`

## Configuration

- `DATABASE_URL` defaults to `sqlite:///./zoom.db`.
- `FRONTEND_URL` is used to create invite links.
- `CORS_ORIGINS` must include the frontend origin.

The backend is deployed on Render. Configure these variables in the service settings; do not commit production URLs, credentials, or database secrets. The repository does not include a public Render deployment URL.

## Operational limitations

The connection manager is in memory and is appropriate for a single FastAPI process. Production multi-worker operation requires Redis Pub/Sub or another shared broker. Authentication and authorization are intentionally excluded from this assignment; host role checks are not a substitute for production access control.
