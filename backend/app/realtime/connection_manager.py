"""Native WebSocket room-state broadcaster for a single FastAPI process."""
from collections import defaultdict
from typing import DefaultDict, Dict, List

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant, ParticipantSession
from app.schemas.room_state import RoomStateMeeting, RoomStateMessage, RoomStateParticipant


class ConnectionManager:
    """Tracks WebSockets by public meeting ID and sends DB-backed snapshots."""

    def __init__(self) -> None:
        self._connections: DefaultDict[str, List[WebSocket]] = defaultdict(list)
        self._participant_sockets: DefaultDict[str, Dict[int, WebSocket]] = defaultdict(dict)

    async def connect(self, meeting_id: str, websocket: WebSocket, participant_id: int | None = None) -> None:
        self._connections[meeting_id].append(websocket)
        if participant_id is not None:
            self._participant_sockets[meeting_id][participant_id] = websocket

    def disconnect(self, meeting_id: str, websocket: WebSocket, participant_id: int | None = None) -> None:
        connections = self._connections.get(meeting_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections:
            self._connections.pop(meeting_id, None)
        if participant_id is not None and self._participant_sockets.get(meeting_id, {}).get(participant_id) is websocket:
            self._participant_sockets[meeting_id].pop(participant_id, None)
        elif participant_id is None:
            for connected_participant_id, participant_socket in list(self._participant_sockets.get(meeting_id, {}).items()):
                if participant_socket is websocket:
                    self._participant_sockets[meeting_id].pop(connected_participant_id, None)
        if not self._participant_sockets.get(meeting_id):
            self._participant_sockets.pop(meeting_id, None)

    async def forward_signaling(self, meeting_id: str, sender_id: int, target_id: int, message: dict) -> bool:
        """Forward a WebRTC signal only to its intended active room socket."""
        target = self._participant_sockets.get(meeting_id, {}).get(target_id)
        if not target:
            return False
        try:
            await target.send_json({**message, "from_participant_id": sender_id})
            return True
        except Exception:
            self.disconnect(meeting_id, target, target_id)
            return False

    def _room_state(self, meeting_id: str) -> dict | None:
        """Read a fresh committed snapshot; never construct state from mutations."""
        db: Session = SessionLocal()
        try:
            meeting = db.query(Meeting).filter(Meeting.public_meeting_id == meeting_id).first()
            if not meeting:
                return None
            participants = (
                db.query(MeetingParticipant)
                .join(ParticipantSession, ParticipantSession.participant_id == MeetingParticipant.id)
                .filter(
                    MeetingParticipant.meeting_id == meeting.id,
                    MeetingParticipant.removed_at.is_(None),
                    ParticipantSession.left_at.is_(None),
                )
                .distinct()
                .order_by(MeetingParticipant.id)
                .all()
            )
            return RoomStateMessage(
                meeting=RoomStateMeeting.model_validate(meeting),
                participants=[RoomStateParticipant.model_validate(item) for item in participants],
            ).model_dump(mode="json")
        finally:
            db.close()

    async def send_room_state(self, meeting_id: str, websocket: WebSocket) -> bool:
        state = self._room_state(meeting_id)
        if state is None:
            return False
        try:
            await websocket.send_json(state)
            return True
        except Exception:
            self.disconnect(meeting_id, websocket)
            return False

    async def broadcast_room_state(self, meeting_id: str) -> None:
        state = self._room_state(meeting_id)
        if state is None:
            return
        # Iterate over a copy because failed sends remove connections safely.
        for websocket in list(self._connections.get(meeting_id, [])):
            try:
                await websocket.send_json(state)
            except Exception:
                self.disconnect(meeting_id, websocket)


connection_manager = ConnectionManager()
