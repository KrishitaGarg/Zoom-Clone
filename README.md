# Zoom Clone - Full-Stack SDE Assignment MVP

A complete, functional, and deployment-ready Zoom Clone web application built as an SDE Full-Stack assignment. This project includes a FastAPI backend, a Next.js App Router frontend, and an SQLite database with a clean, decoupled architecture.

---

## 1. Project Overview
The Zoom Clone is designed to replicate the core workflows of Zoom's web interface: instant meetings, scheduled meetings, and an interactive meeting room layout. It focuses on simplicity, precise database normalization, and elegant design, serving as an educational showcase of modern web engineering.

---

## 2. Features
- **Responsive Navigation**: Persistent visual sidebar and header replicating the official Zoom dashboard.
- **Instant Meetings**: Single-click meeting generation that creates an active database record and instantly redirects the host to the meeting room.
- **Meeting Scheduler**: Dynamic modal interface allowing users to name, describe, schedule, and configure durations for future meetings, performing past-date validation.
- **Durable Dashboard Sections**: Separates and dynamically displays future scheduled events ("Upcoming Meetings") and completed or past events ("Recent Meetings").
- **Robust Joining Mechanism**: Validates entered IDs or complete invite URLs, ensuring the meeting exists and is active, then requests a display name prior to room routing.
- **Zoom-Style Meeting Room UI**: Features a dark, professional layout, local camera & microphone previews, a mic mute/unmute toggle, a video start/stop toggle, a participants panel, an invitation modal, and host controls (mute all, remove participant).

---

## 3. Technology Stack

### Frontend
- **Framework**: Next.js (App Router, Client-side state & navigation)
- **Language**: JavaScript (ES6+, No TypeScript as per constraints)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Native Web Fetch API

### Backend
- **Framework**: FastAPI (Python)
- **Database ORM**: SQLAlchemy (Object Relational Mapper)
- **Database Engine**: SQLite
- **Validation**: Pydantic v2
- **ASGI Server**: Uvicorn

---

## 4. Architecture
The application adopts an decoupled, multi-tier architecture to maintain a clear separation of concerns, ensuring high readability and seamless scalability:

```
+------------------------------------------+
|            Next.js Frontend              | (Port 3000)
|  - Custom Components & Tailwind UI       |
|  - API integration layer using fetch     |
+------------------------------------------+
                     |
                     | Native HTTP REST Requests
                     v
+------------------------------------------+
|            FastAPI Backend               | (Port 8000)
|  - Routers (Meetings, Users, Partic.)    |
|  - Service Layer (Business Logic)        |
|  - SQLAlchemy ORM & Schema Engine        |
+------------------------------------------+
                     |
                     | Local File Access (SQLAlchemy)
                     v
+------------------------------------------+
|           SQLite Database (zoom.db)      |
+------------------------------------------+
```

---

## 5. Folder Structure
```
zoom-clone/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # Server entry point, CORS, middlewares
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Pydantic-based configuration loads
│   │   │   └── database.py          # Session engines & base declarations
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User model (Host)
│   │   │   ├── meeting.py           # Meeting model (Instant/Scheduled)
│   │   │   └── participant.py       # Participant & Session models
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User Pydantic request/response schemas
│   │   │   ├── meeting.py           # Meeting Pydantic request/response schemas
│   │   │   └── participant.py       # Participant Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── meetings.py          # Meeting routes
│   │   │   ├── users.py             # User routes (default user)
│   │   │   └── participants.py      # Participant control routes
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── meeting_service.py   # Business logic (joining/ending/removing)
│   │   └── seed.py                  # Idempotent database seed utility
│   ├── requirements.txt             # Python packages
│   ├── .env.example                 # Environment structure
│   └── README.md                    # Backend-specific instructions
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css          # Tailwind and global styles
│   │   │   ├── layout.js            # Standard html shell
│   │   │   ├── page.js              # Landing dashboard
│   │   │   └── meeting/
│   │   │       └── [meetingId]/
│   │   │           └── page.js      # Zoom meeting room layout
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.js       # Persistent visual navigation
│   │   │   │   └── Navbar.js        # Professional Zoom header
│   │   │   ├── dashboard/
│   │   │   │   ├── ActionButtons.js # Landing page visual launcher controls
│   │   │   │   ├── MeetingCard.js   # Dynamic card representation
│   │   │   │   ├── UpcomingMeetings.js # Scheduled collections filter
│   │   │   │   └── RecentMeetings.js   # Historical records filter
│   │   │   ├── modals/
│   │   │   │   ├── JoinMeetingModal.js # Joining details modal
│   │   │   │   ├── ScheduleMeetingModal.js # Schedulers
│   │   │   │   └── InviteModal.js   # Live invite copy box
│   │   │   └── meeting/
│   │   │       ├── VideoTile.js     # Responsive avatar & video card
│   │   │       ├── MeetingToolbar.js # Bottom interaction bar
│   │   │       └── ParticipantsPanel.js # Slide-in dashboard details
│   │   ├── services/
│   │   │   └── api.js               # Common API service wrapper using Fetch
│   │   └── utils/
│   │       ├── dateUtils.js         # ISO formatting utilities
│   │       └── meetingUtils.js      # Formatters & parser utilities
│   ├── public/                      # Static static assets
│   ├── .env.local.example           # Client api settings
│   ├── package.json                 # Node scripts & dependencies
│   └── README.md                    # Frontend-specific instructions
└── README.md                        # Project root documentation (This file)
```

---

## 6. Database Schema & Entity Relationships

The SQLite database is meticulously engineered with bidirectional relationships, explicit foreign keys, indexes, unique constraints, and cascade-deletion configurations using SQLAlchemy.

### Entity Relationship Diagram (ERD)

```
       +-----------------------+
       |         User          |
       +-----------------------+
       | id (PK, Index)        |
       | name                  |
       | email (Unique, Index) |
       | avatar_url            |
       | created_at            |
       +-----------------------+
                   | 1
                   |
                   | N
       +-------------------------------+
       |            Meeting            |
       +-------------------------------+
       | id (PK, Index)                |
       | public_meeting_id (UQ, Index) | <--- separates internal DB serial key
       | title                         |      from Zoom-style hyphenated IDs
       | description                   |
       | host_id (FK -> users.id)      |
       | meeting_type (instant/sched)  |
       | status (live/sched/ended)     |
       | scheduled_start               |
       | duration_minutes              |
       | started_at                    |
       | ended_at                      |
       | created_at, updated_at        |
       +-------------------------------+
                   | 1
                   |
                   | N (Cascade Delete)
       +---------------------------------------+
       |          MeetingParticipant           |
       +---------------------------------------+
       | id (PK, Index)                        |
       | meeting_id (FK -> meetings.id)        |
       | display_name                          |
       | role (host/participant)               |
       | is_muted, is_camera_on                |
       | removed_at                            |
       | created_at, updated_at                |
       +---------------------------------------+
                   | 1
                   |
                   | N (Cascade Delete)
       +---------------------------------------+
       |          ParticipantSession           |
       +---------------------------------------+
       | id (PK, Index)                        |
       | participant_id (FK -> participants.id)|
       | joined_at                             |
       | left_at                               |
       +---------------------------------------+
```

### Architectural Database Decisions

1. **Why `public_meeting_id` is separate from standard database incremental `id`**:
   - Security and professionalism: Auto-incrementing database keys (e.g. `1`, `2`, `3`) are vulnerable to sequential guessing attacks and look unprofessional.
   - Zoom aesthetic: Zoom uses formatted IDs like `849-245-7316` to refer to specific meetings. This is separated from the database PK to optimize internal joining speed via efficient `INTEGER` indices.
2. **Why Invite Links are Generated on the Fly rather than Stored**:
   - To avoid redundant records and database bloat.
   - Prevents stale links if the site URL or domain changes (e.g., during cloud staging). It is derived dynamically as `FRONTEND_URL + "/meeting/" + public_meeting_id`.
3. **Why `ParticipantSession` is separate from `MeetingParticipant`**:
   - Preservation of complete history: In standard conferences, participants may lose connection, reload the page, or leave and rejoin.
   - Storing `joined_at` and `left_at` solely in the `MeetingParticipant` table would overwrite previous logs. This normalized layout logs multiple sessions for any individual participant.
4. **Why "Upcoming" and "Recent" Meetings are Queries, not Tables**:
   - Storing redundant state invites race-conditions.
   - Dynamic calculations using UTC comparisons ensure instant database-level correctness when page triggers are loaded.
5. **UTC Time-Handling Strategy**:
   - Mixing local time zones on the server yields parsing bugs across regions.
   - Solution: All DateTime cells in SQLite are strictly written as standard ISO-8601 UTC. The React client parses the ISO string and maps it locally utilizing the user's active system clock.

---

## 7. How to Setup & Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Run development server (FastAPI will automatically seed on startup!)
uvicorn app.main:app --reload --port 8000
```
- **REST Backend API**: http://localhost:8000/api
- **Interactive OpenAPI Documentation**: http://localhost:8000/docs

---

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend folder
cd frontend

# Install packages
npm install

# Create .env.local file from template
cp .env.local.example .env.local

# Run Next.js developer server
npm run dev
```
- **Web UI Client Interface**: http://localhost:3000

---

## 8. API Endpoint Documentation

| HTTP Method | Route Path | Description |
|---|---|---|
| **GET** | `/api/health` | Diagnostic status check to confirm server is online |
| **GET** | `/api/users/default` | Returns the profile details of the pre-seeded active user |
| **POST** | `/api/meetings/instant` | Generates a 10-digit hyphenated ID, inserts database record with `instant` status `live` |
| **POST** | `/api/meetings/schedule` | Adds a scheduled meeting. Validates date start constraints in UTC |
| **GET** | `/api/meetings` | Returns a full list of meetings |
| **GET** | `/api/meetings/upcoming` | Returns meetings where `status = "scheduled"` and start is in future |
| **GET** | `/api/meetings/recent` | Returns completed meetings or scheduled meetings that have elapsed |
| **GET** | `/api/meetings/{meeting_id}` | Fetches detailed parameters of a meeting matching the formatted public ID |
| **POST** | `/api/meetings/{meeting_id}/join` | Inserts participant entry and appends a newly active `ParticipantSession` |
| **GET** | `/api/meetings/{meeting_id}/participants` | Fetches a list of all active participants for the specified meeting |
| **PATCH** | `/api/participants/{participant_id}` | Updates audio (muted) or video (camera on) state for a participant |
| **DELETE** | `/api/participants/{participant_id}` | Allows the host to remove a selected participant from the meeting |
| **PATCH** | `/api/participants/{participant_id}/leave` | Gracefully closes the participant's active connection session |
| **PATCH** | `/api/meetings/{meeting_id}/end` | Updates a meeting's status to `ended` and writes the elapsed end timestamp |

---

## 9. Phase 3 Meeting Room Details & MVP Limitations

### Meeting Room Features
- **Browser Camera Preview**: Live rendering of webcam media streams onto standard HTML5 video components.
- **Browser Microphone Control**: Soft hardware track activation toggles (mute/unmute microphone).
- **Participant State Management**: Continuous state persistence and tracking of audio/video status across the roster.
- **Join and Leave Session Tracking**: Database synchronization of join times, exits, and historical logs.
- **Invitation Sharing**: Direct modal copying of structured meeting IDs and non-exposed invite links.
- **Host Controls**: Ro-level administrative actions including Mute All and Participant Eviction.
- **Responsive Zoom-inspired Interface**: Dark-themed grid with responsive video tiles and a collapsible side drawer.

### MVP Media Limitation
The application demonstrates local browser camera and microphone access through the native `MediaDevices` API. It does not transmit media between separate browsers. Production multi-user video conferencing would require WebRTC peer-to-peer connections, signaling infrastructure, and STUN/TURN traversal servers.

### Participant Synchronization Limitation
Participant data is refreshed using lightweight, efficient polling (every 5 seconds) only while the participants panel is open. WebSockets are intentionally excluded to keep the implementation focused and lightweight.

### Host Control Limitation
The host's "Mute All" button updates the server-side participant states for demonstration. Without active WebRTC track signaling, it does not remotely disable another participant's physical browser recording device.

### Security Assumption
Authentication is outside the assignment scope. Production host controls require authenticated identity and server-side authorization. Host identity in the meeting room is governed by the pre-allocated participant `role="host"` assigned at meeting creation.

---

## 10. Future Scope
- **WebRTC Signalling**: Peer-to-peer visual integration is currently simulated. Adding a lightweight STUN/TURN server and signaling router would allow multi-peer video streaming.
- **Authentication**: Adding a complete auth module with password hashing and JWT/OAuth tokens would allow multiple host accounts.
- **Persistent Chat**: Implementing standard WebSockets would enable real-time meeting room text chat and whiteboard features.
