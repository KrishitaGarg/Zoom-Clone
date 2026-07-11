# SQLAlchemy database model representing a Meeting (both instant and scheduled).
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Zoom-style unique public identifier (e.g. 849-245-7316)
    public_meeting_id = Column(String, unique=True, index=True, nullable=False)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign key link referencing the user who scheduled/launched this meeting
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # meeting_type allowed: "instant", "scheduled"
    meeting_type = Column(String, nullable=False)
    
    # status allowed: "scheduled", "live", "ended", "cancelled"
    status = Column(String, nullable=False)
    
    # UTC Timestamp when the meeting is scheduled to begin (only for scheduled type)
    scheduled_start = Column(DateTime, nullable=True)
    
    # Planned duration in minutes
    duration_minutes = Column(Integer, nullable=True)
    
    # Capture precise starting and ending times in UTC
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Database level check constraints to guarantee valid field values
    __table_args__ = (
        CheckConstraint("duration_minutes IS NULL OR duration_minutes > 0", name="chk_duration_minutes_positive"),
        CheckConstraint("meeting_type IN ('instant', 'scheduled')", name="chk_meeting_type_valid"),
        CheckConstraint("status IN ('scheduled', 'live', 'ended', 'cancelled')", name="chk_status_valid"),
        CheckConstraint("(meeting_type != 'scheduled') OR (scheduled_start IS NOT NULL)", name="chk_scheduled_start_required"),
    )

    # Relationships:
    # Many meetings belong to one User (Host).
    host = relationship("User", back_populates="meetings")
    
    # One meeting contains many MeetingParticipant records.
    # cascade delete-orphan guarantees that removing a meeting automatically deletes participants.
    participants = relationship(
        "MeetingParticipant", 
        back_populates="meeting", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"<Meeting id={self.id} public_id='{self.public_meeting_id}' title='{self.title}' status='{self.status}'>"
