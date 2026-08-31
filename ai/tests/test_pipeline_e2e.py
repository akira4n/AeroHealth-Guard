import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.scheduler.cron_jobs import run_full_pipeline, get_pipeline_status, init_scheduler, shutdown_scheduler


@pytest.mark.asyncio
async def test_pipeline_execution_e2e():
    """
    Verify complete end-to-end execution of the pipeline:
    Ingestion -> Spatial IDW -> Batch LLM Advisory -> Results format.
    """
    status = await run_full_pipeline()

    assert status.status == "completed"
    assert status.stations_synced > 0
    assert status.hotspots_synced > 0
    assert status.kelurahans_calculated > 0
    assert status.advisories_generated > 0
    assert status.duration_seconds is not None
    assert status.duration_seconds >= 0.0


@pytest.mark.asyncio
async def test_api_pipeline_trigger_endpoint():
    """Verify POST /api/pipeline/trigger returns success acknowledgement."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/pipeline/trigger")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "status" in data


@pytest.mark.asyncio
async def test_api_pipeline_status_endpoint():
    """Verify GET /api/pipeline/status returns valid PipelineStatus model."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/pipeline/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "stations_synced" in data
        assert "kelurahans_calculated" in data


@pytest.mark.asyncio
async def test_api_pipeline_scheduler_endpoint():
    """Verify GET /api/pipeline/scheduler returns timezone and job list."""
    init_scheduler()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/pipeline/scheduler")
        assert response.status_code == 200
        data = response.json()
        assert data["timezone"] == "Asia/Jakarta"
        assert "jobs" in data
    shutdown_scheduler()
