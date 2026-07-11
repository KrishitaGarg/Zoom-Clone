# Pydantic validation schemas for Meeting participants and their sessions.
import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class ParticipantSessionBase(BaseModel):
    participant_id: int
    joined_at: datetime.datetime
    left_at: Optional[datetime.datetime] = None

class ParticipantSessionResponse(ParticipantSessionBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class ParticipantBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=50, description="The visible display name in the meeting room")
    role: str = Field("participant", description="Role of the user in the session: host or participant")
    is_muted: bool = Field(False, description="Microphone mute state")
    is_camera_on: bool = Field(True, description="Camera active state")

class ParticipantCreate(ParticipantBase):
    meeting_id: int = Field(..., description="The internal database ID of the meeting")

class ParticipantJoinRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=50, description="Display name when entering a meeting")

class ParticipantUpdateState(BaseModel):
    is_muted: Optional[bool] = None
    is_camera_on: Optional[bool] = None

class ParticipantResponse(ParticipantBase):
    id: int
    meeting_id: int
    removed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    # Nested session logs for connection history tracking
    sessions: List[ParticipantSessionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
