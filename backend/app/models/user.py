# SQLAlchemy database model representing a User (Host of meetings).
import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationship: One user can host many meetings.
    meetings = relationship("Meeting", back_populates="host", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} name='{self.name}' email='{self.email}'>"
