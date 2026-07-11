# SQLAlchemy database session initialization and utility functions for SQLite.
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Construct the SQLAlchemy database engine.
# check_same_thread is set to False specifically for SQLite to allow multi-threaded access in FastAPI.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False  # Set to True to log executed SQL queries in terminal logs
)

# Create a local session factory that will construct database sessions on demand.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Standard declarative Base for mapping models to SQLite database tables.
Base = declarative_base()

def get_db():
    """
    Dependency generator function that yields database session instances.
    Ensures that sessions are properly closed at the end of every request cycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
