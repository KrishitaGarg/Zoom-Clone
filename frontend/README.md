# Zoom Clone - Frontend

This is the Zoom-inspired Next.js frontend built with pure JavaScript, Tailwind CSS, and Lucide React.

## Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.js
│   │   │   └── Navbar.js
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ActionButtons.js
│   │   │   ├── MeetingCard.js
│   │   │   ├── UpcomingMeetings.js
│   │   │   └── RecentMeetings.js
│   │   │
│   │   ├── modals/
│   │   │   ├── JoinMeetingModal.js
│   │   │   └── ScheduleMeetingModal.js
│   │   │
│   │   └── ui/
│   │       ├── LoadingSpinner.js
│   │       ├── EmptyState.js
│   │       └── Toast.js
│   │
│   ├── services/
│   │   └── api.js
│   │
│   └── utils/
│       ├── dateUtils.js
│       └── meetingUtils.js
│
├── public/
├── .env.local.example
├── package.json
└── README.md
```

## Running the Application

1. Make sure the backend is running at `http://localhost:8000`.
2. Copy `.env.local.example` to `.env.local`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
