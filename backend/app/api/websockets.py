"""WebSocket endpoint for authoritative meeting room state."""
import json
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant, ParticipantSession
from app.realtime.connection_manager import connection_manager

router = APIRouter(tags=["realtime"])


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_room_socket(websocket: WebSocket, meeting_id: str, participant_id: int | None = Query(None)):
    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.public_meeting_id == meeting_id).first()
        participant = None
        if meeting and participant_id is not None:
            participant = db.query(MeetingParticipant).join(
                ParticipantSession, ParticipantSession.participant_id == MeetingParticipant.id
            ).filter(
                MeetingParticipant.id == participant_id,
                MeetingParticipant.meeting_id == meeting.id,
                MeetingParticipant.removed_at.is_(None),
                ParticipantSession.left_at.is_(None),
            ).first()
    finally:
        db.close()

    if not meeting or (participant_id is not None and not participant):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    await connection_manager.connect(meeting_id, websocket, participant_id)
    if not await connection_manager.send_room_state(meeting_id, websocket):
        connection_manager.disconnect(meeting_id, websocket, participant_id)
        return

    try:
        # REST owns mutations. WebRTC messages are only targeted signaling data.
        while True:
            raw_message = await websocket.receive_text()
            if participant_id is None:
                continue
            try:
                message = json.loads(raw_message)
                message_type = message.get("type")
                target_id = int(message.get("target_participant_id"))
            except (TypeError, ValueError, json.JSONDecodeError):
                continue
            if message_type in {"webrtc_offer", "webrtc_answer", "ice_candidate"}:
                await connection_manager.forward_signaling(meeting_id, participant_id, target_id, message)
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.disconnect(meeting_id, websocket, participant_id)
