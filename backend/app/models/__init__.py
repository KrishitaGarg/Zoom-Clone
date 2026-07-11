# Registers all database models for seamless auto-discovery and table generation.
from app.core.database import Base
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import MeetingParticipant, ParticipantSession

__all__ = ["Base", "User", "Meeting", "MeetingParticipant", "ParticipantSession"]
