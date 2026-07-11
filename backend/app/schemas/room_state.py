"""Schemas used for the authoritative real-time meeting room snapshot."""
from typing import List
from pydantic import BaseModel, ConfigDict


class RoomStateMeeting(BaseModel):
    public_meeting_id: str
    title: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class RoomStateParticipant(BaseModel):
    id: int
    display_name: str
    role: str
    is_muted: bool
    is_camera_on: bool

    model_config = ConfigDict(from_attributes=True)


class RoomStateMessage(BaseModel):
    type: str = "room_state"
    meeting: RoomStateMeeting
    participants: List[RoomStateParticipant]
