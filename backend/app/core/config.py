# Custom configuration module using Pydantic Settings to validate environment parameters.
import os
import json
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Name of the project displayed in interactive API documentation
    PROJECT_NAME: str = "Zoom Clone API"
    
    # Debug state
    DEBUG: bool = True
    
    # Database URL, default is local SQLite database file named zoom.db
    DATABASE_URL: str = "sqlite:///./zoom.db"
    
    # Frontend URL configuration to construct shareable invite links dynamically
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Allowed CORS Origins, default permits localhost on 3000 (standard Next.js)
    # Stored as a JSON-encoded string to handle list configuration via env
    CORS_ORIGINS: str = '["http://localhost:3000", "http://127.0.0.1:3000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        """Parses CORS_ORIGINS from JSON string to Python string list."""
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]

    class Config:
        # Specifies environment configuration source path
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instantiate singleton configuration settings object
settings = Settings()
