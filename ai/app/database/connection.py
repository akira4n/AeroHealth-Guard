import logging
from typing import Optional
import asyncpg
from app.config import get_settings

logger = logging.getLogger("aerohealth.database")

_pool: Optional[asyncpg.Pool] = None


async def init_db_pool() -> Optional[asyncpg.Pool]:
    """
    Initialize asyncpg connection pool to PostgreSQL/PostGIS database.
    Tries primary DATABASE_URL, and smart hostname candidates (db/localhost) if needed.
    """
    global _pool
    if _pool is not None:
        return _pool

    settings = get_settings()
    urls_to_try = [settings.DATABASE_URL]

    # Smart candidate fallback for container (db) vs host (localhost)
    if "localhost:5432" in settings.DATABASE_URL:
        urls_to_try.append(settings.DATABASE_URL.replace("localhost:5432", "db:5432"))
    elif "db:5432" in settings.DATABASE_URL:
        urls_to_try.append(settings.DATABASE_URL.replace("db:5432", "localhost:5432"))

    for dsn in urls_to_try:
        try:
            logger.info(f"Attempting connection to PostgreSQL/PostGIS at {dsn.split('@')[-1] if '@' in dsn else 'local'}")
            _pool = await asyncpg.create_pool(
                dsn=dsn,
                min_size=2,
                max_size=10,
                command_timeout=60,
                max_inactive_connection_lifetime=300
            )
            logger.info("Database connection pool successfully established.")
            return _pool
        except Exception as err:
            logger.warning(f"Connection attempt to {dsn.split('@')[-1] if '@' in dsn else 'local'} failed: {err}")
            continue

    logger.warning("Could not connect to database on this attempt. Microservice will run with offline simulation fallback if needed.")
    return None


async def ensure_db_pool() -> Optional[asyncpg.Pool]:
    """Retrieve the active pool or attempt reconnection dynamically."""
    global _pool
    if _pool is not None:
        return _pool
    return await init_db_pool()


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
    pool = await ensure_db_pool()
    if pool is None:
        return False
    try:
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            return result == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
