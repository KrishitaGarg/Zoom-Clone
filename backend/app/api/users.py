# API router exposing endpoints related to Users.
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.get("/default", response_model=UserResponse)
def get_default_user(db: Session = Depends(get_db)):
    """
    Retrieves the pre-seeded default application user.
    Simulates a 'currently logged in' session context.
    """
    default_email = "krishita@example.com"
    user = db.query(User).filter(User.email == default_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Default application user not found. Please run the seeding scripts."
        )
    return user
