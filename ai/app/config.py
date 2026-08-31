from functools import lru_cache
from typing import Optional
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application runtime configuration loaded from environment variables."""

    # Server settings
    ENV: str = "development"
    AI_PORT: int = Field(default=8000, validation_alias=AliasChoices("AI_PORT", "PORT_AI"))
    HOST: str = "0.0.0.0"

    # Database settings
    DATABASE_URL: str = (
        "postgresql://aerohealth:aerohealth_secure_pass@localhost:5432/aerohealth_db"
    )

    # Ingestion API Tokens (WAQI, OpenAQ, NASA FIRMS)
    WAQI_API_TOKEN: Optional[str] = None
    OPENAQ_API_KEY: Optional[str] = None
    NASA_FIRMS_MAP_KEY: Optional[str] = None

    # LLM API Keys (Gemini, Groq)
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    # Cron Job Scheduling (Hours)
    CRON_INTERVAL_HOURS: int = 3

    # Pilot Region Coordinates (South Sumatra Bounding Box)
    PILOT_BBOX: tuple[float, float, float, float] = (
        98.0,   # min_lon (west)
        -5.0,   # min_lat (south)
        107.0,  # max_lon (east)
        -1.5    # max_lat (north)
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached singleton instance of Settings."""
    return Settings()
