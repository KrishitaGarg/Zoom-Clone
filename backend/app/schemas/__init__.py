# Aggregates schemas to provide unified import interfaces across routers and services.
from app.schemas.user import UserBase, UserCreate, UserResponse
from app.schemas.meeting import MeetingBase, MeetingCreateInstant, MeetingCreateScheduled, MeetingResponse, MeetingListResponse
from app.schemas.participant import (
    ParticipantBase, ParticipantCreate, ParticipantResponse, 
    ParticipantSessionBase, ParticipantSessionResponse,
    ParticipantUpdateState, ParticipantJoinRequest
)

__all__ = [
    "UserBase", "UserCreate", "UserResponse",
    "MeetingBase", "MeetingCreateInstant", "MeetingCreateScheduled", "MeetingResponse", "MeetingListResponse",
    "ParticipantBase", "ParticipantCreate", "ParticipantResponse",
    "ParticipantSessionBase", "ParticipantSessionResponse", "ParticipantUpdateState", "ParticipantJoinRequest"
]
