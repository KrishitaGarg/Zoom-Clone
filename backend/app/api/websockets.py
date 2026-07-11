"""WebSocket endpoint for authoritative meeting room state."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.realtime.connection_manager import connection_manager

router = APIRouter(tags=["realtime"])


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_room_socket(websocket: WebSocket, meeting_id: str):
    db = SessionLocal()
    try:
        exists = db.query(Meeting.id).filter(Meeting.public_meeting_id == meeting_id).first()
    finally:
        db.close()

    if not exists:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    await connection_manager.connect(meeting_id, websocket)
    if not await connection_manager.send_room_state(meeting_id, websocket):
        connection_manager.disconnect(meeting_id, websocket)
        return

    try:
        # This endpoint only transports snapshots; REST owns all mutations.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.disconnect(meeting_id, websocket)
