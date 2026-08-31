import logging
from typing import Optional
import asyncpg
from app.config import get_settings

logger = logging.getLogger("aerohealth.database")

_pool: Optional[asyncpg.Pool] = None


async def init_db_pool() -> asyncpg.Pool:
    """Initialize asyncpg connection pool to PostgreSQL/PostGIS database."""
    global _pool
    if _pool is not None:
        return _pool

    settings = get_settings()
    logger.info(f"Connecting to database at {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    
    try:
        _pool = await asyncpg.create_pool(
            dsn=settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60,
            max_inactive_connection_lifetime=300
        )
        logger.info("Database connection pool successfully created.")
        return _pool
    except Exception as e:
        logger.warning(f"Could not connect to database on startup: {e}. Microservice will run with offline simulation fallback if needed.")
        return None


async def close_db_pool() -> None:
    """Gracefully close database connection pool on shutdown."""
    global _pool
    if _pool is not None:
        logger.info("Closing database connection pool...")
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed.")


def get_db_pool() -> Optional[asyncpg.Pool]:
    """Retrieve the active asyncpg connection pool."""
    return _pool


async def check_db_health() -> bool:
    """Verify database responsiveness via SELECT 1."""
    if _pool is None:
        return False
    try:
        async with _pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            return result == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
