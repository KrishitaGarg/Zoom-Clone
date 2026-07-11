# API router handling Zoom-style meeting requests and operations.
import os
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant, ParticipantSession
from app.schemas.meeting import (
    MeetingResponse, MeetingCreateInstant, MeetingCreateScheduled
)
from app.schemas.participant import ParticipantResponse, ParticipantJoinRequest
from app.services.meeting_service import MeetingService
from app.realtime.connection_manager import connection_manager

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"]
)

def format_meeting_response(meeting: Meeting, db: Session = None) -> MeetingResponse:
    """
    Helper function to transform an SQLAlchemy Meeting model into a Pydantic MeetingResponse.
    Dynamically injects the derived Zoom-style shareable invite URL and host_participant_id.
    """
    if not meeting:
        return None
    
    resp = MeetingResponse.model_validate(meeting)
    resp.invite_url = f"{settings.FRONTEND_URL}/meeting/{meeting.public_meeting_id}"
    
    from sqlalchemy.orm import object_session
    session = db or object_session(meeting)
    if session:
        host_participant = session.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.role == "host",
            MeetingParticipant.removed_at.is_(None)
        ).first()
        if host_participant:
            resp.host_participant_id = host_participant.id
            
    return resp

@router.post("/instant", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_instant_meeting(
    payload: MeetingCreateInstant,
    db: Session = Depends(get_db)
):
    """
    Registers a new instant meeting in the database.
    Instantly marks status as 'live' and starts the session.
    """
    meeting = MeetingService.create_instant_meeting(
        db=db,
        host_id=payload.host_id,
        custom_title=payload.title
    )
    return format_meeting_response(meeting)

@router.post("/schedule", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_scheduled_meeting(
    payload: MeetingCreateScheduled,
    db: Session = Depends(get_db)
):
    """
    Saves a future scheduled meeting, ensuring times are valid.
    """
    meeting = MeetingService.create_scheduled_meeting(
        db=db,
        host_id=payload.host_id,
        title=payload.title,
        description=payload.description,
        scheduled_start=payload.scheduled_start,
        duration_minutes=payload.duration_minutes
    )
    return format_meeting_response(meeting)

@router.get("", response_model=List[MeetingResponse])
def get_all_meetings(db: Session = Depends(get_db)):
    """
    Fetches a full inventory list of registered meetings.
    """
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    return [format_meeting_response(m) for m in meetings]

@router.get("/upcoming", response_model=List[MeetingResponse])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    """
    Dynamically retrieves scheduled meetings starting in the future.
    """
    meetings = MeetingService.get_upcoming_meetings(db)
    return [format_meeting_response(m) for m in meetings]

@router.get("/recent", response_model=List[MeetingResponse])
def get_recent_meetings(db: Session = Depends(get_db)):
    """
    Dynamically retrieves past scheduled meetings or completed meetings.
    """
    meetings = MeetingService.get_recent_meetings(db)
    return [format_meeting_response(m) for m in meetings]

@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """
    Verifies and returns a specific meeting by public_meeting_id.
    """
    meeting = MeetingService.get_meeting_by_public_id(db, meeting_id)
    return format_meeting_response(meeting)

@router.post("/{meeting_id}/join", response_model=ParticipantResponse)
async def join_meeting(
    meeting_id: str,
    payload: ParticipantJoinRequest,
    db: Session = Depends(get_db)
):
    """
    Registers or rejoins a user as an active participant inside the meeting room.
    Validates display name and current meeting status.
    """
    display_name = payload.display_name.strip()
    if not display_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display name is a required field."
        )

    # Invoke service registration
    participant = MeetingService.join_meeting(
        db=db,
        public_id=meeting_id,
        display_name=display_name
    )
    await connection_manager.broadcast_room_state(meeting_id)
    return participant

@router.get("/{meeting_id}/participants", response_model=List[ParticipantResponse])
def get_meeting_participants(meeting_id: str, db: Session = Depends(get_db)):
    """
    Lists active, unremoved participants in the meeting room.
    """
    meeting = MeetingService.get_meeting_by_public_id(db, meeting_id)
    participants = db.query(MeetingParticipant).join(
        ParticipantSession, ParticipantSession.participant_id == MeetingParticipant.id
    ).filter(
        MeetingParticipant.meeting_id == meeting.id,
        MeetingParticipant.removed_at.is_(None),
        ParticipantSession.left_at.is_(None)
    ).distinct().all()
    return participants

@router.patch("/{meeting_id}/end", response_model=MeetingResponse)
async def end_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """
    Ends an active meeting session, disconnecting active participants.
    """
    meeting = MeetingService.end_meeting(db, meeting_id)
    await connection_manager.broadcast_room_state(meeting_id)
    return format_meeting_response(meeting)
