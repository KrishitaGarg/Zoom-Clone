# Pydantic schemas for validating and serializing Meeting objects.
import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150, description="The title of the meeting")
    description: Optional[str] = Field(None, description="Optional meeting description/agenda")

class MeetingCreateInstant(BaseModel):
    # For instant meetings, we might want to let them pass a custom title,
    # otherwise we default to 'Instant Meeting' in the service layer.
    title: Optional[str] = Field(None, max_length=150)
    host_id: int = Field(..., description="Database ID of the host initiating the meeting")

class MeetingCreateScheduled(MeetingBase):
    host_id: int = Field(..., description="Database ID of the host scheduling the meeting")
    scheduled_start: datetime.datetime = Field(..., description="UTC scheduled starting timestamp")
    duration_minutes: int = Field(..., ge=15, le=120, description="Meeting duration options (15, 30, 45, 60, 90, 120)")

    @field_validator("scheduled_start")
    @classmethod
    def validate_scheduled_start(cls, value: datetime.datetime) -> datetime.datetime:
        """Ensures the scheduled meeting starts in the future and normalizes to naive UTC."""
        # Convert any timezone offset to UTC and drop tzinfo to ensure it's written as naive UTC in SQLite
        if value.tzinfo is not None:
            value = value.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        else:
            value = value.replace(tzinfo=None)
            
        now_utc = datetime.datetime.utcnow()
        if value < now_utc - datetime.timedelta(minutes=5): # 5 min grace period for minor clock drift
            raise ValueError("The scheduled start date and time cannot be in the past.")
        return value

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, value: int) -> int:
        """Validates that duration matches one of the standard Zoom dropdown options."""
        allowed_durations = [15, 30, 45, 60, 90, 120]
        if value not in allowed_durations:
            raise ValueError(f"Duration must be one of the permitted options: {allowed_durations} minutes.")
        return value

class MeetingResponse(MeetingBase):
    id: int
    public_meeting_id: str
    host_id: int
    meeting_type: str
    status: str
    scheduled_start: Optional[datetime.datetime] = None
    duration_minutes: Optional[int] = None
    started_at: Optional[datetime.datetime] = None
    ended_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    # Dynamically generated at response time based on FRONTEND_URL in service
    invite_url: Optional[str] = None
    host_participant_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class MeetingListResponse(BaseModel):
    upcoming: List[MeetingResponse]
    recent: List[MeetingResponse]
    
    model_config = ConfigDict(from_attributes=True)
