import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database.connection import init_db_pool, close_db_pool, check_db_health
from app.models.schemas import HealthResponse, PipelineStatus
from app.scheduler.cron_jobs import (
    init_scheduler,
    shutdown_scheduler,
    run_full_pipeline,
    get_pipeline_status,
    get_scheduler_info,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aerohealth.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for database pooling and scheduler."""
    logger.info("Initializing AeroHealth Guard AI & Spatial Microservice...")
    await init_db_pool()
    init_scheduler()
    yield
    logger.info("Shutting down AeroHealth Guard AI & Spatial Microservice...")
    shutdown_scheduler()
    await close_db_pool()


settings = get_settings()

app = FastAPI(
    title="AeroHealth Guard - AI & Spatial Microservice",
    description="Hyperlocal ISPU Spatial Estimation Engine (Hotspot-Adjusted IDW) & AI Health Advisories",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Info"])
async def root():
    """Service root information and metadata."""
    return {
        "service": "AeroHealth Guard AI/Spatial Engine",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "pipeline_schedule": "Every 3 hours (00, 03, 06, 09, 12, 15, 18, 21 WIB)"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """System health check endpoint verifying database connectivity."""
    db_healthy = await check_db_health()
    status_obj = get_pipeline_status()
    
    return HealthResponse(
        status="ok" if db_healthy else "degraded",
        service="aerohealth-guard-ai",
        version="1.0.0",
        environment=settings.ENV,
        database="connected" if db_healthy else "disconnected/offline",
        last_pipeline_status=status_obj.model_dump(),
    )


@app.post("/api/pipeline/trigger", tags=["Pipeline Control"])
async def trigger_pipeline_manually(background_tasks: BackgroundTasks):
    """
    Manually trigger the full spatial computation and AI advisory pipeline.
    Runs asynchronously in the background.
    """
    current_status = get_pipeline_status()
    if current_status.status == "running":
        return {
            "message": "Pipeline is already actively running.",
            "status": current_status.model_dump()
        }

    background_tasks.add_task(run_full_pipeline)
    return {
        "message": "AeroHealth Guard spatial & AI pipeline triggered successfully in background.",
        "status": "initiated"
    }


@app.get("/api/pipeline/status", response_model=PipelineStatus, tags=["Pipeline Control"])
async def get_current_pipeline_status():
    """Retrieve execution metrics and status of the last pipeline run."""
    return get_pipeline_status()


@app.get("/api/pipeline/scheduler", tags=["Pipeline Control"])
async def get_scheduler_status():
    """Retrieve APScheduler cron configuration, next run times, and timezone."""
    return get_scheduler_info()
