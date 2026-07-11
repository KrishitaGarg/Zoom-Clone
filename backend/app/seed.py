# Idempotent seeding script to populate the database with default data for demonstration.
import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant, ParticipantSession

def seed_database(db: Session):
    """
    Idempotently seeds database with default user, scheduled meetings, completed meetings,
    participants, and connection sessions.
    """
    print("[Seed] Running database idempotent seeding...")
    
    # 1. Create Default User (Krishita Garg)
    default_email = "krishita@example.com"
    default_user = db.query(User).filter(User.email == default_email).first()
    
    if not default_user:
        default_user = User(
            name="Krishita Garg",
            email=default_email,
            avatar_url=None,
            created_at=datetime.datetime.utcnow()
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        print(f"[Seed] Created default user: {default_user.name}")
    else:
        print(f"[Seed] Default user '{default_user.name}' already exists.")

    now = datetime.datetime.utcnow()

    # Pre-determined unique public IDs to ensure strict idempotency on restarts
    seed_meetings_data = [
        # Upcoming Scheduled Meeting 1
        {
            "public_meeting_id": "541-628-9347",
            "title": "System Design: Zoom Core Services",
            "description": "Deep-dive session reviewing the distributed indexing service and peer-to-peer signalling protocols.",
            "meeting_type": "scheduled",
            "status": "scheduled",
            "scheduled_start": now + datetime.timedelta(days=1, hours=2),
            "duration_minutes": 60,
        },
        # Upcoming Scheduled Meeting 2
        {
            "public_meeting_id": "729-105-8463",
            "title": "Quarterly SDE Engineering Sync",
            "description": "Project review and milestone tracking with team leads.",
            "meeting_type": "scheduled",
            "status": "scheduled",
            "scheduled_start": now + datetime.timedelta(days=3, hours=4),
            "duration_minutes": 45,
        },
        # Ended Meeting 1
        {
            "public_meeting_id": "302-749-1158",
            "title": "FastAPI Backend Architecture Onboarding",
            "description": "Overview of SQLAlchemy declarative structures, cascade rules, and query optimizations.",
            "meeting_type": "scheduled",
            "status": "ended",
            "scheduled_start": now - datetime.timedelta(days=2),
            "duration_minutes": 30,
            "started_at": now - datetime.timedelta(days=2),
            "ended_at": now - datetime.timedelta(days=2, minutes=30),
        },
        # Ended Meeting 2
        {
            "public_meeting_id": "915-438-6207",
            "title": "Instant Coffee Catch-up",
            "description": "Unscheduled coffee talk session with peers.",
            "meeting_type": "instant",
            "status": "ended",
            "scheduled_start": None,
            "duration_minutes": None,
            "started_at": now - datetime.timedelta(hours=5),
            "ended_at": now - datetime.timedelta(hours=4, minutes=15),
        }
    ]

    for data in seed_meetings_data:
        pub_id = data["public_meeting_id"]
        existing_meeting = db.query(Meeting).filter(Meeting.public_meeting_id == pub_id).first()
        
        if not existing_meeting:
            meeting = Meeting(
                public_meeting_id=pub_id,
                title=data["title"],
                description=data["description"],
                host_id=default_user.id,
                meeting_type=data["meeting_type"],
                status=data["status"],
                scheduled_start=data["scheduled_start"],
                duration_minutes=data["duration_minutes"],
                started_at=data.get("started_at"),
                ended_at=data.get("ended_at"),
                created_at=now,
                updated_at=now
            )
            db.add(meeting)
            db.commit()
            db.refresh(meeting)
            print(f"[Seed] Created meeting '{meeting.title}' ({meeting.public_meeting_id})")
        else:
            meeting = existing_meeting
            print(f"[Seed] Meeting '{existing_meeting.title}' already exists.")

        # Ensure every meeting has exactly one host participant
        host_p = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.role == "host",
            MeetingParticipant.removed_at.is_(None)
        ).first()

        if not host_p:
            host_p = MeetingParticipant(
                meeting_id=meeting.id,
                display_name="Krishita Garg",
                role="host",
                is_muted=meeting.status == "ended",
                is_camera_on=True,
                created_at=meeting.started_at or now,
                updated_at=meeting.ended_at or now
            )
            db.add(host_p)
            db.commit()
            db.refresh(host_p)
            print(f"[Seed] Created host participant for meeting '{meeting.title}' ({meeting.public_meeting_id})")

        # For ended meetings, seed sample participants and session logs if meeting was newly created
        if not existing_meeting and meeting.status == "ended":
            # Create Participant 1 (Host) session log
            s1 = ParticipantSession(
                participant_id=host_p.id,
                joined_at=meeting.started_at,
                left_at=meeting.ended_at
            )
            db.add(s1)

            # Create Participant 2 (External peer - Rohan Sharma)
            p2 = MeetingParticipant(
                meeting_id=meeting.id,
                display_name="Rohan Sharma",
                role="participant",
                is_muted=False,
                is_camera_on=False,
                created_at=meeting.started_at + datetime.timedelta(minutes=2),
                updated_at=meeting.ended_at
            )
            db.add(p2)
            db.commit()
            db.refresh(p2)

            # Rohan Sharma drops connection and rejoins
            s2_1 = ParticipantSession(
                participant_id=p2.id,
                joined_at=meeting.started_at + datetime.timedelta(minutes=2),
                left_at=meeting.started_at + datetime.timedelta(minutes=12) # Leaves early
            )
            s2_2 = ParticipantSession(
                participant_id=p2.id,
                joined_at=meeting.started_at + datetime.timedelta(minutes=15), # Rejoins 3 mins later
                left_at=meeting.ended_at
            )
            db.add(s2_1)
            db.add(s2_2)
            db.commit()
            print(f"[Seed] Seeded Rohan and Krishita participant sessions for meeting '{meeting.title}'")

    print("[Seed] Idempotent seeding completed successfully!")
