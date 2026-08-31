import logging
from typing import List, Dict, Any
from datetime import datetime
import asyncpg
from app.models.schemas import (
    KelurahanSpatial,
    StationData,
    HotspotData,
)

logger = logging.getLogger("aerohealth.database.queries")


async def fetch_kelurahan_spatial_list(pool: asyncpg.Pool) -> List[KelurahanSpatial]:
    """Retrieve all kelurahan administrative entities with centroid coordinates."""
    query = """
        SELECT 
            id,
            kode_kemendagri,
            nama_kelurahan,
            nama_kecamatan,
            kabupaten_kota,
            ST_Y(ST_Centroid(geom)) as centroid_lat,
            ST_X(ST_Centroid(geom)) as centroid_lng
        FROM kelurahan
        WHERE geom IS NOT NULL
        ORDER BY id ASC;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        return [
            KelurahanSpatial(
                id=r["id"],
                kode_kemendagri=r["kode_kemendagri"],
                nama_kelurahan=r["nama_kelurahan"],
                nama_kecamatan=r["nama_kecamatan"],
                kabupaten_kota=r["kabupaten_kota"],
                centroid_lat=float(r["centroid_lat"]),
                centroid_lng=float(r["centroid_lng"]),
            )
            for r in rows
            if r["centroid_lat"] is not None and r["centroid_lng"] is not None
        ]


async def fetch_active_stations(pool: asyncpg.Pool) -> List[StationData]:
    """Retrieve ground air monitoring stations with coordinates."""
    query = """
        SELECT 
            source_id,
            nama_stasiun,
            COALESCE(ispu_val, 0) as ispu_val,
            COALESCE(pm25_val, 0.0) as pm25_val,
            ST_Y(location) as latitude,
            ST_X(location) as longitude,
            last_synced
        FROM stasiun_ispu
        WHERE location IS NOT NULL;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        return [
            StationData(
                source_id=r["source_id"],
                nama_stasiun=r["nama_stasiun"],
                ispu_val=int(r["ispu_val"]),
                pm25_val=float(r["pm25_val"]),
                latitude=float(r["latitude"]),
                longitude=float(r["longitude"]),
                last_synced=r["last_synced"] or datetime.utcnow(),
            )
            for r in rows
            if r["latitude"] is not None and r["longitude"] is not None
        ]


async def fetch_active_hotspots(pool: asyncpg.Pool) -> List[HotspotData]:
    """Retrieve all current active fire hotspots."""
    query = """
        SELECT 
            latitude,
            longitude,
            COALESCE(frp, 0.0) as frp,
            COALESCE(confidence, 'nominal') as confidence,
            acquired_at
        FROM active_hotspots
        ORDER BY acquired_at DESC;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        return [
            HotspotData(
                latitude=float(r["latitude"]),
                longitude=float(r["longitude"]),
                frp=float(r["frp"]),
                confidence=r["confidence"],
                acquired_at=r["acquired_at"],
            )
            for r in rows
        ]


async def upsert_stations(pool: asyncpg.Pool, stations: List[StationData]) -> int:
    """Upsert ground station observation data into stasiun_ispu table."""
    if not stations:
        return 0

    query = """
        INSERT INTO stasiun_ispu (
            source_id, 
            nama_stasiun, 
            ispu_val, 
            pm25_val, 
            last_synced, 
            location
        ) VALUES (
            $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)
        )
        ON CONFLICT (source_id) DO UPDATE SET
            nama_stasiun = EXCLUDED.nama_stasiun,
            ispu_val = EXCLUDED.ispu_val,
            pm25_val = EXCLUDED.pm25_val,
            last_synced = EXCLUDED.last_synced,
            location = EXCLUDED.location;
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            records = [
                (
                    s.source_id,
                    s.nama_stasiun,
                    s.ispu_val,
                    s.pm25_val,
                    s.last_synced,
                    s.longitude,
                    s.latitude,
                )
                for s in stations
            ]
            await conn.executemany(query, records)
            return len(records)


async def replace_active_hotspots(pool: asyncpg.Pool, hotspots: List[HotspotData]) -> int:
    """Clear old hotspots and insert latest active hotspots."""
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("DELETE FROM active_hotspots;")
            if not hotspots:
                return 0

            query = """
                INSERT INTO active_hotspots (
                    latitude,
                    longitude,
                    frp,
                    confidence,
                    acquired_at,
                    location
                ) VALUES (
                    $1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($2, $1), 4326)
                );
            """
            records = [
                (
                    h.latitude,
                    h.longitude,
                    h.frp,
                    h.confidence,
                    h.acquired_at,
                )
                for h in hotspots
            ]
            await conn.executemany(query, records)
            return len(records)


async def batch_insert_ispu_logs(pool: asyncpg.Pool, logs: List[Dict[str, Any]]) -> int:
    """Batch insert calculated ISPU and AI advisories to log_ispu_kelurahan."""
    if not logs:
        return 0

    query = """
        INSERT INTO log_ispu_kelurahan (
            kelurahan_id,
            ispu_score,
            kategori,
            primary_pollutant,
            advisory_text,
            hotspot_detected,
            calculated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
        );
    """
    async with pool.acquire() as conn:
        async with conn.transaction():
            records = [
                (
                    item["kelurahan_id"],
                    item["ispu_score"],
                    item["kategori"],
                    item.get("primary_pollutant", "PM2.5"),
                    item.get("advisory_text", ""),
                    item.get("hotspot_detected", False),
                    item.get("calculated_at", datetime.utcnow()),
                )
                for item in logs
            ]
            await conn.executemany(query, records)
            return len(records)
