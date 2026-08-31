from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class StationData(BaseModel):
    """Ground monitoring station observation data."""
    source_id: str = Field(..., description="Unique source identifier (e.g. waqi:9101)")
    nama_stasiun: str = Field(..., description="Station display name")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    ispu_val: Optional[int] = Field(default=0, ge=0)
    pm25_val: Optional[float] = Field(default=0.0, ge=0.0)
    last_synced: datetime = Field(default_factory=datetime.utcnow)


class HotspotData(BaseModel):
    """Active fire hotspot detected by satellite sensors (NASA FIRMS)."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    frp: float = Field(default=0.0, ge=0.0, description="Fire Radiative Power in MW")
    confidence: Optional[str] = Field(default="nominal", description="Confidence level (low/nominal/high)")
    acquired_at: datetime = Field(default_factory=datetime.utcnow)


class KelurahanSpatial(BaseModel):
    """Kelurahan master entity with precalculated centroid coordinates."""
    id: int
    kode_kemendagri: str
    nama_kelurahan: str
    nama_kecamatan: str
    kabupaten_kota: str
    centroid_lat: float
    centroid_lng: float


class IdwResult(BaseModel):
    """Output of Hotspot-Adjusted IDW calculation for a single kelurahan."""
    kelurahan_id: int
    ispu_score: int = Field(..., ge=0)
    kategori: str = Field(..., description="Baik, Sedang, Tidak Sehat, Sangat Tidak Sehat, Berbahaya")
    primary_pollutant: str = Field(default="PM2.5")
    hotspot_detected: bool = Field(default=False)
    hotspot_penalty: float = Field(default=0.0)
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class AdvisoryResult(BaseModel):
    """AI or fallback health advisory text for a kelurahan."""
    kelurahan_id: int
    advisory_text: str
    is_ai_generated: bool = True


class PipelineStatus(BaseModel):
    """Execution state and metrics of the ingestion and computation pipeline."""
    status: str = Field(default="idle", description="idle, running, completed, failed")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    stations_synced: int = 0
    hotspots_synced: int = 0
    kelurahans_calculated: int = 0
    advisories_generated: int = 0
    error_message: Optional[str] = None


class HealthResponse(BaseModel):
    """Service health check response payload."""
    status: str = "ok"
    service: str = "aerohealth-guard-ai"
    version: str = "1.0.0"
    environment: str
    database: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    last_pipeline_status: Optional[Dict[str, Any]] = None
