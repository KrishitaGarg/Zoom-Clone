# Core business service layer orchestrating meeting lifecycle operations and database transitions.
import random
import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant, ParticipantSession
from app.models.user import User

class MeetingService:
    @staticmethod
    def generate_unique_meeting_id(db: Session) -> str:
        """
        Generates a unique, hyphenated Zoom-style meeting identifier: XXX-XXX-XXXX.
        Recursively queries the database to prevent collision.
        """
        max_attempts = 100
        for _ in range(max_attempts):
            part1 = random.randint(100, 999)
            part2 = random.randint(100, 999)
            part3 = random.randint(1000, 9999)
            public_id = f"{part1}-{part2}-{part3}"
            
            # Verify uniqueness in the database
            exists = db.query(Meeting).filter(Meeting.public_meeting_id == public_id).first()
            if not exists:
                return public_id
                
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique meeting ID due to multiple collisions."
        )

    @staticmethod
    def create_instant_meeting(db: Session, host_id: int, custom_title: str = None) -> Meeting:
        """
        Launches an instant meeting. Sets status to 'live' and starts_at to current UTC time.
        Creates a participant record for the host and initiates an active join session.
        """
        # Confirm that the host user exists
        host = db.query(User).filter(User.id == host_id).first()
        if not host:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Host user with ID {host_id} not found."
            )

        public_id = MeetingService.generate_unique_meeting_id(db)
        now = datetime.datetime.utcnow()
        
        # Instantiate and save the meeting
        meeting = Meeting(
            public_meeting_id=public_id,
            title=custom_title if custom_title else f"{host.name}'s Instant Meeting",
            host_id=host_id,
            meeting_type="instant",
            status="live",
            started_at=now,
            created_at=now,
            updated_at=now
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        # Automatically join the host into the meeting participant list as role 'host'
        host_participant = MeetingParticipant(
            meeting_id=meeting.id,
            display_name=host.name,
            role="host",
            is_muted=False,
            is_camera_on=True,
            created_at=now,
            updated_at=now
        )
        db.add(host_participant)
        db.commit()
        db.refresh(host_participant)

        # Open the active join session for the host
        host_session = ParticipantSession(
            participant_id=host_participant.id,
            joined_at=now
        )
        db.add(host_session)
        db.commit()

        return meeting

    @staticmethod
    def create_scheduled_meeting(db: Session, host_id: int, title: str, description: str, scheduled_start: datetime.datetime, duration_minutes: int) -> Meeting:
        """
        Saves a scheduled meeting for a future date and time.
        Also pre-creates the host participant record securely to prevent display-name hijacking.
        """
        # Confirm host exists
        host = db.query(User).filter(User.id == host_id).first()
        if not host:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Host user with ID {host_id} not found."
            )

        public_id = MeetingService.generate_unique_meeting_id(db)
        now = datetime.datetime.utcnow()

        meeting = Meeting(
            public_meeting_id=public_id,
            title=title,
            description=description,
            host_id=host_id,
            meeting_type="scheduled",
            status="scheduled",
            scheduled_start=scheduled_start,
            duration_minutes=duration_minutes,
            created_at=now,
            updated_at=now
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        # Create host participant for scheduled meeting with role="host"
        host_participant = MeetingParticipant(
            meeting_id=meeting.id,
            display_name=host.name,
            role="host",
            is_muted=False,
            is_camera_on=True,
            created_at=now,
            updated_at=now
        )
        db.add(host_participant)
        db.commit()

        return meeting

    @staticmethod
    def get_meeting_by_public_id(db: Session, public_id: str) -> Meeting:
        """
        Helper method to safely retrieve a meeting using its formatted public meeting ID.
        """
        # Clean formatting just in case the user input has stray spaces
        cleaned_id = public_id.strip()
        meeting = db.query(Meeting).filter(Meeting.public_meeting_id == cleaned_id).first()
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meeting not found. Please verify the Meeting ID."
            )
        return meeting

    @staticmethod
    def get_upcoming_meetings(db: Session) -> list[Meeting]:
        """
        Queries upcoming meetings: status is scheduled and start is in the future.
        """
        now = datetime.datetime.utcnow()
        return db.query(Meeting).filter(
            Meeting.status == "scheduled",
            Meeting.scheduled_start > now
        ).order_by(Meeting.scheduled_start.asc()).all()

    @staticmethod
    def get_recent_meetings(db: Session) -> list[Meeting]:
        """
        Queries completed meetings (status=ended) or scheduled ones that have passed.
        """
        now = datetime.datetime.utcnow()
        return db.query(Meeting).filter(
            (Meeting.status == "ended") |
            ((Meeting.status == "scheduled") & (Meeting.scheduled_start <= now))
        ).order_by(Meeting.created_at.desc()).all()

    @staticmethod
    def join_meeting(db: Session, public_id: str, display_name: str) -> MeetingParticipant:
        """
        Registers a user as a participant in an active meeting.
        Checks meeting status, enforces join-time restrictions, and logs active sessions.
        """
        meeting = MeetingService.get_meeting_by_public_id(db, public_id)
        
        # Block join attempts on completed meetings
        if meeting.status == "ended":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This meeting has already ended."
            )

        # Block join attempts on cancelled meetings
        if meeting.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This meeting has been cancelled and cannot be joined."
            )

        # If a scheduled meeting is requested, check starting time constraints
        if meeting.status == "scheduled":
            now = datetime.datetime.utcnow()
            # Allow joining at or after scheduled_start, or at most 10 minutes early.
            if meeting.scheduled_start > now:
                earliest_join_time = meeting.scheduled_start - datetime.timedelta(minutes=10)
                if now < earliest_join_time:
                    diff_seconds = int((meeting.scheduled_start - now).total_seconds())
                    diff_minutes = (diff_seconds // 60) + 1
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"This meeting is scheduled for a future time. You can only join up to 10 minutes before the scheduled start. Please wait {diff_minutes} minute(s)."
                    )
            
            # Transition status to live
            meeting.status = "live"
            meeting.started_at = now
            db.add(meeting)
            db.commit()

        now = datetime.datetime.utcnow()

        # Check if this participant is already registered to avoid duplicates (rejoining flow)
        participant = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.display_name == display_name,
            MeetingParticipant.removed_at.is_(None)
        ).first()

        if participant:
            # Participant exists, check if they have a pending active session
            active_session = db.query(ParticipantSession).filter(
                ParticipantSession.participant_id == participant.id,
                ParticipantSession.left_at.is_(None)
            ).first()
            
            if active_session:
                # Already connected, return participant model directly
                return participant
        else:
            # Create a new participant model
            # EVERY participant entering through public join endpoint receives role="participant"
            # preventing privilege spoofing. Host records are pre-created during meeting creation.
            participant = MeetingParticipant(
                meeting_id=meeting.id,
                display_name=display_name,
                role="participant",
                is_muted=False,
                is_camera_on=True,
                created_at=now,
                updated_at=now
            )
            db.add(participant)
            db.commit()
            db.refresh(participant)

        # Log a new connection session in the participant sessions history
        session = ParticipantSession(
            participant_id=participant.id,
            joined_at=now
        )
        db.add(session)
        db.commit()
        db.refresh(participant)

        return participant

    @staticmethod
    def leave_meeting(db: Session, participant_id: int) -> MeetingParticipant:
        """
        Gracefully handles a participant leaving the meeting room.
        Sets left_at for any open ParticipantSession records.
        """
        participant = db.query(MeetingParticipant).filter(MeetingParticipant.id == participant_id).first()
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant not found."
            )

        now = datetime.datetime.utcnow()
        participant.updated_at = now
        db.add(participant)

        # Terminate active sessions
        open_sessions = db.query(ParticipantSession).filter(
            ParticipantSession.participant_id == participant.id,
            ParticipantSession.left_at.is_(None)
        ).all()

        for s in open_sessions:
            s.left_at = now
            db.add(s)

        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def update_participant_state(db: Session, participant_id: int, is_muted: bool = None, is_camera_on: bool = None) -> MeetingParticipant:
        """
        Updates mic (muted) or camera state of a meeting participant.
        """
        participant = db.query(MeetingParticipant).filter(MeetingParticipant.id == participant_id).first()
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant not found."
            )
            
        if is_muted is not None:
            participant.is_muted = is_muted
        if is_camera_on is not None:
            participant.is_camera_on = is_camera_on
            
        participant.updated_at = datetime.datetime.utcnow()
        db.add(participant)
        db.commit()
        db.refresh(participant)
        return participant

    @staticmethod
    def end_meeting(db: Session, public_id: str) -> Meeting:
        """
        Ends an active meeting. Sets status to 'ended', logs ended_at UTC time,
        and gracefully terminates all open participant sessions.
        """
        meeting = MeetingService.get_meeting_by_public_id(db, public_id)
        if meeting.status == "ended":
            return meeting

        now = datetime.datetime.utcnow()
        meeting.status = "ended"
        meeting.ended_at = now
        meeting.updated_at = now
        db.add(meeting)

        # GRACEFUL SESSION CLOSURE: Fetch and close all open participant session tracks
        active_participants = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id
        ).all()

        for participant in active_participants:
            open_sessions = db.query(ParticipantSession).filter(
                ParticipantSession.participant_id == participant.id,
                ParticipantSession.left_at.is_(None)
            ).all()
            
            for s in open_sessions:
                s.left_at = now
                db.add(s)

        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def remove_participant(db: Session, participant_id: int) -> MeetingParticipant:
        """
        Host administrative action: removes a participant from the meeting room.
        Sets removed_at timestamp and terminates their active session.
        """
        participant = db.query(MeetingParticipant).filter(MeetingParticipant.id == participant_id).first()
        if not participant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant record not found."
            )

        now = datetime.datetime.utcnow()
        participant.removed_at = now
        participant.updated_at = now
        db.add(participant)

        # Instantly close their active session logs
        open_sessions = db.query(ParticipantSession).filter(
            ParticipantSession.participant_id == participant.id,
            ParticipantSession.left_at.is_(None)
        ).all()
        
        for s in open_sessions:
            s.left_at = now
            db.add(s)

        db.commit()
        db.refresh(participant)
        return participant
