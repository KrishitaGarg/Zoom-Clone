# API router managing state updates and administrative removal of participants in meeting rooms.
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.participant import ParticipantResponse, ParticipantUpdateState
from app.services.meeting_service import MeetingService
from app.models.meeting import Meeting
from app.realtime.connection_manager import connection_manager


async def broadcast_participant_room(db: Session, participant) -> None:
    meeting = db.query(Meeting).filter(Meeting.id == participant.meeting_id).first()
    if meeting:
        await connection_manager.broadcast_room_state(meeting.public_meeting_id)

router = APIRouter(
    prefix="/participants",
    tags=["participants"]
)

@router.patch("/{participant_id}", response_model=ParticipantResponse)
async def update_participant_state(
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
    await broadcast_participant_room(db, participant)
    return participant

@router.patch("/{participant_id}/leave", response_model=ParticipantResponse)
async def leave_meeting(
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
    await broadcast_participant_room(db, participant)
    return participant

@router.delete("/{participant_id}", response_model=ParticipantResponse)
async def remove_participant(
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
    await broadcast_participant_room(db, participant)
    return participant
