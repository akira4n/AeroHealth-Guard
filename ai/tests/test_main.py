import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    """Verify GET / returns basic service information."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "AeroHealth Guard AI/Spatial Engine"
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_health_endpoint():
    """Verify GET /health returns health payload schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "environment" in data
        assert "database" in data
