# Zoom Clone

A full-stack Zoom-inspired meeting application built for an SDE assignment. It provides instant and scheduled meetings, real-time participant state, and browser-to-browser audio/video calls.

## Features

- Instant meetings and scheduled meetings with generated public meeting IDs.
- Invite links, meeting join flow, upcoming meetings, and recent meetings.
- A default application user; authentication is intentionally outside the assignment scope.
- FastAPI REST APIs backed by SQLite and SQLAlchemy.
- Native WebSockets for authoritative room-state updates: joins, leaves, media state, removals, and meeting end events.
- Targeted WebSocket signaling for WebRTC offers, answers, and ICE candidates.
- In-meeting WebSocket chat with sender names, timestamps, unread indicators, and room-scoped delivery.
- Bidirectional peer-to-peer WebRTC audio and video using Google's public STUN server.
- Local microphone and camera controls that update the MediaStream tracks, REST state, and connected participants.
- Host controls for Mute All and participant removal.
- Responsive Zoom-like meeting room, participant roster, and invite modal.

## Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 15, React 19, Tailwind CSS, Lucide React |
| Backend | FastAPI, Uvicorn, Pydantic |
| Persistence | SQLite and SQLAlchemy |
| Real time | Native FastAPI WebSockets and browser WebRTC |
| Deployment | Vercel frontend and Render backend |

No deployed application URLs are committed to this repository. Configure the public frontend URL in `FRONTEND_URL` and the public backend API URL in `NEXT_PUBLIC_API_URL` during deployment; do not commit secrets or platform credentials.

## Architecture

```text
Next.js client
  ├─ REST ────────────────► FastAPI ─────────► SQLite
  └─ WebSocket ───────────► room state + chat + targeted WebRTC signaling
                                      │
Browser RTCPeerConnection ◄─ STUN ──► Browser RTCPeerConnection
```

REST endpoints remain the mutation layer. After a committed mutation, FastAPI broadcasts a fresh room snapshot. The same meeting WebSocket broadcasts room-scoped chat events and forwards WebRTC `webrtc_offer`, `webrtc_answer`, and `ice_candidate` messages only to their intended participant.

## Project structure

```text
zoom-clone/
├── backend/
│   ├── app/
│   │   ├── api/          # REST routes and WebSocket endpoint
│   │   ├── core/         # Settings and database setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── realtime/     # In-memory room connection manager
│   │   ├── schemas/      # Pydantic request, response, and room-state schemas
│   │   └── services/     # Meeting lifecycle logic
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/app/          # Next.js routes
│   ├── src/components/   # Dashboard and meeting UI
│   ├── src/services/     # REST and WebSocket URL helpers
│   └── README.md
└── README.md
```

## Local setup

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000/api`; OpenAPI documentation is at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. For local WebRTC testing, allow camera and microphone access in each browser.

## Environment configuration

`backend/.env`:

```env
DATABASE_URL="sqlite:///./zoom.db"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS='["http://localhost:3000"]'
```

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

For production, set `FRONTEND_URL` to the deployed Vercel origin, allow it in `CORS_ORIGINS`, and set `NEXT_PUBLIC_API_URL` to the deployed Render API origin plus `/api`. HTTPS API URLs automatically produce WSS WebSocket URLs in the client.

## API and real-time endpoints

- `POST /api/meetings/instant` — create an instant meeting.
- `POST /api/meetings/schedule` — schedule a meeting.
- `POST /api/meetings/{meeting_id}/join` — join or rejoin a meeting.
- `GET /api/meetings/{meeting_id}/participants` — list active participants.
- `PATCH /api/participants/{participant_id}` — update microphone or camera state.
- `PATCH /api/participants/{participant_id}/leave` — leave a meeting.
- `DELETE /api/participants/{participant_id}` — remove a participant.
- `PATCH /api/meetings/{meeting_id}/end` — end a meeting.
- `WS /ws/meetings/{meeting_id}?participant_id={id}` — room-state snapshots and targeted WebRTC signaling.

## Deployment

The frontend is deployed on Vercel and the FastAPI backend is deployed on Render. Configure environment variables in each platform rather than committing production values. Render must serve the ASGI application and allow WebSocket upgrades; Vercel must expose the Render API URL through `NEXT_PUBLIC_API_URL`. Public deployment URLs are not committed in this repository.

## Limitations and future work

- This MVP uses an in-memory connection manager, so a multi-worker deployment needs Redis Pub/Sub or another shared event broker.
- WebRTC currently uses public STUN and is most reliable for two participants. Production NAT traversal requires TURN infrastructure.
- Authentication and server-side authorization are intentionally not implemented.
- Future work includes authenticated accounts, persistent chat history, TURN infrastructure, Redis Pub/Sub, and broader production scaling/observability.
