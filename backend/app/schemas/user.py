# Pydantic schemas for data validation and response formatting for Users.
import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    name: str
    email: EmailStr
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime

    # Enable reading attributes from SQLAlchemy models directly (Pydantic v2)
    model_config = ConfigDict(from_attributes=True)
