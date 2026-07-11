# API router managing state updates and administrative removal of participants in meeting rooms.
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.participant import ParticipantResponse, ParticipantUpdateState
from app.services.meeting_service import MeetingService

router = APIRouter(
    prefix="/participants",
    tags=["participants"]
)

@router.patch("/{participant_id}", response_model=ParticipantResponse)
def update_participant_state(
    participant_id: int,
    payload: ParticipantUpdateState,
    db: Session = Depends(get_db)
):
    """
    Updates the hardware track states (mute/unmute microphone, start/stop camera)
    for a specific participant.
    """
    participant = MeetingService.update_participant_state(
        db=db,
        participant_id=participant_id,
        is_muted=payload.is_muted,
        is_camera_on=payload.is_camera_on
    )
    return participant

@router.patch("/{participant_id}/leave", response_model=ParticipantResponse)
def leave_meeting(
    participant_id: int,
    db: Session = Depends(get_db)
):
    """
    Handles a participant leaving the meeting room, closing any active connection sessions.
    """
    participant = MeetingService.leave_meeting(
        db=db,
        participant_id=participant_id
    )
    return participant

@router.delete("/{participant_id}", response_model=ParticipantResponse)
def remove_participant(
    participant_id: int,
    db: Session = Depends(get_db)
):
    """
    Administrative host action to evict/remove a participant from a live meeting room.
    """
    participant = MeetingService.remove_participant(
        db=db,
        participant_id=participant_id
    )
    return participant
