# SQLAlchemy database models representing meeting participants and their connection session histories.
import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, index=True)
    
    # FK linking back to the associated Meeting
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    
    display_name = Column(String, nullable=False)
    
    # role allowed: "host", "participant"
    role = Column(String, default="participant", nullable=False)
    
    is_muted = Column(Boolean, default=False, nullable=False)
    is_camera_on = Column(Boolean, default=True, nullable=False)
    
    # Tracks if the host has removed this participant from the meeting
    removed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('host', 'participant')", name="chk_role_valid"),
    )

    # Relationships:
    # Many participants connect to one Meeting.
    meeting = relationship("Meeting", back_populates="participants")
    
    # One participant can establish multiple connection sessions (joining, leaving, and rejoining).
    sessions = relationship(
        "ParticipantSession", 
        back_populates="participant", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<MeetingParticipant id={self.id} display_name='{self.display_name}' role='{self.role}'>"


class ParticipantSession(Base):
    __tablename__ = "participant_sessions"

    id = Column(Integer, primary_key=True, index=True)
    
    # FK pointing back to the MeetingParticipant model
    participant_id = Column(Integer, ForeignKey("meeting_participants.id", ondelete="CASCADE"), nullable=False)
    
    # Connection logging timestamps in UTC
    joined_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)

    # Relationship:
    # Many connection logs trace back to one single MeetingParticipant.
    participant = relationship("MeetingParticipant", back_populates="sessions")

    def __repr__(self) -> str:
        return f"<ParticipantSession id={self.id} joined_at='{self.joined_at}' left_at='{self.left_at}'>"
