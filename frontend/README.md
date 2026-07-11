# Zoom Clone Frontend

The Next.js 15 frontend provides the dashboard, meeting join flow, responsive room UI, local media controls, WebSocket room synchronization, and browser WebRTC peer connections.

## What it does

- Creates, schedules, lists, joins, and ends meetings through the FastAPI API.
- Displays upcoming and recent meetings, public meeting IDs, and invite links.
- Opens one meeting WebSocket using `NEXT_PUBLIC_API_URL`; HTTPS APIs are converted to WSS automatically.
- Replaces the roster from authoritative `room_state` messages and uses a five-second REST fallback only when the socket is unavailable.
- Uses targeted WebRTC offer, answer, and ICE signaling over that same socket.
- Captures local microphone/camera tracks and renders received remote `MediaStream` objects in the corresponding participant tiles.
- Keeps microphone/video controls synchronized with MediaStream tracks and participant state.

## Structure

```text
frontend/
├── src/app/meeting/[meetingId]/  # Meeting route and join flow
├── src/components/meeting/       # Room, tiles, toolbar, roster, invite UI
├── src/components/dashboard/     # Dashboard meeting views
├── src/services/api.js           # REST client and WebSocket URL helper
├── .env.local.example
└── package.json
```

## Local development

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` for local development. The backend must be running and camera/microphone permission must be granted to test calls.

## Deployment

The frontend is deployed on Vercel. Set `NEXT_PUBLIC_API_URL` to the public Render backend API URL including `/api`. The repository does not commit a public Vercel deployment URL or credentials.

## Constraints

The app intentionally has no authentication. WebRTC is a peer-to-peer MVP using STUN; production deployments need TURN and a scalable signaling/room-presence layer.
