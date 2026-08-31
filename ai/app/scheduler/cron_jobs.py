import asyncio
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.models.schemas import PipelineStatus, KelurahanSpatial, StationData
from app.database.connection import get_db_pool
from app.database.queries import (
    fetch_kelurahan_spatial_list,
    upsert_stations,
    replace_active_hotspots,
    batch_insert_ispu_logs,
)
from app.ingestion.waqi_client import fetch_waqi_stations
from app.ingestion.openaq_client import fetch_openaq_stations
from app.ingestion.firms_client import fetch_firms_hotspots
from app.spatial.idw_engine import calculate_hotspot_adjusted_idw
from app.advisory.batch_generator import generate_batch_advisories

logger = logging.getLogger("aerohealth.scheduler")

# In-memory execution tracker
_pipeline_status = PipelineStatus(status="idle")
_scheduler: Optional[AsyncIOScheduler] = None

# Fallback kelurahan centroids for standalone / offline testing (17 Kabupaten/Kota se-Sumsel)
MOCK_KELURAHAN_CENTROIDS = [
    # 1. Palembang
    KelurahanSpatial(id=1, kode_kemendagri="16.71.04.1001", nama_kelurahan="16 Ilir (Ampera)", nama_kecamatan="Ilir Timur I", kabupaten_kota="Kota Palembang", centroid_lat=-2.9880, centroid_lng=104.7610),
    KelurahanSpatial(id=2, kode_kemendagri="16.71.01.1002", nama_kelurahan="26 Ilir (Kambang Iwak)", nama_kecamatan="Bukit Kecil", kabupaten_kota="Kota Palembang", centroid_lat=-2.9910, centroid_lng=104.7500),
    KelurahanSpatial(id=3, kode_kemendagri="16.71.02.1005", nama_kelurahan="Demang Lebar Daun", nama_kecamatan="Ilir Barat I", kabupaten_kota="Kota Palembang", centroid_lat=-2.9740, centroid_lng=104.7350),
    KelurahanSpatial(id=4, kode_kemendagri="16.71.06.1004", nama_kelurahan="Plaju Ulu", nama_kecamatan="Plaju", kabupaten_kota="Kota Palembang", centroid_lat=-3.0100, centroid_lng=104.8020),
    KelurahanSpatial(id=5, kode_kemendagri="16.71.08.1001", nama_kelurahan="15 Ulu (Jakabaring)", nama_kecamatan="Jakabaring", kabupaten_kota="Kota Palembang", centroid_lat=-3.0280, centroid_lng=104.7910),
    # 2. Ogan Ilir
    KelurahanSpatial(id=6, kode_kemendagri="16.10.01.1001", nama_kelurahan="Indralaya Indah (Unsri)", nama_kecamatan="Indralaya", kabupaten_kota="Kabupaten Ogan Ilir", centroid_lat=-3.2300, centroid_lng=104.6420),
    KelurahanSpatial(id=7, kode_kemendagri="16.10.02.1001", nama_kelurahan="Pemulutan (Gambut)", nama_kecamatan="Pemulutan", kabupaten_kota="Kabupaten Ogan Ilir", centroid_lat=-3.1350, centroid_lng=104.7230),
    # 3. OKI
    KelurahanSpatial(id=8, kode_kemendagri="16.02.05.1001", nama_kelurahan="Kayuagung", nama_kecamatan="Kota Kayuagung", kabupaten_kota="Kabupaten Ogan Komering Ilir", centroid_lat=-3.4150, centroid_lng=104.8480),
    KelurahanSpatial(id=9, kode_kemendagri="16.02.06.1001", nama_kelurahan="Pedamaran (Gambut OKI)", nama_kecamatan="Pedamaran", kabupaten_kota="Kabupaten Ogan Komering Ilir", centroid_lat=-3.5300, centroid_lng=104.9150),
    # 4. Banyuasin
    KelurahanSpatial(id=10, kode_kemendagri="16.07.01.1001", nama_kelurahan="Pangkalan Balai", nama_kecamatan="Banyuasin III", kabupaten_kota="Kabupaten Banyuasin", centroid_lat=-2.9000, centroid_lng=104.3830),
    # 5. Muba
    KelurahanSpatial(id=11, kode_kemendagri="16.06.01.1001", nama_kelurahan="Sekayu", nama_kecamatan="Sekayu", kabupaten_kota="Kabupaten Musi Banyuasin", centroid_lat=-2.9050, centroid_lng=103.8550),
    # 6. Muara Enim
    KelurahanSpatial(id=12, kode_kemendagri="16.03.01.1001", nama_kelurahan="Pasar Muara Enim", nama_kecamatan="Muara Enim", kabupaten_kota="Kabupaten Muara Enim", centroid_lat=-3.6600, centroid_lng=103.7980),
    # 7. Prabumulih
    KelurahanSpatial(id=13, kode_kemendagri="16.74.01.1001", nama_kelurahan="Pasar Prabumulih", nama_kecamatan="Prabumulih Utara", kabupaten_kota="Kota Prabumulih", centroid_lat=-3.4450, centroid_lng=104.2450),
    # 8. PALI
    KelurahanSpatial(id=14, kode_kemendagri="16.12.01.1001", nama_kelurahan="Talang Ubi", nama_kecamatan="Talang Ubi", kabupaten_kota="Kabupaten Penukal Abab Lematang Ilir", centroid_lat=-3.3250, centroid_lng=103.8850),
    # 9. Lahat
    KelurahanSpatial(id=15, kode_kemendagri="16.04.01.1001", nama_kelurahan="Pasar Baru", nama_kecamatan="Lahat", kabupaten_kota="Kabupaten Lahat", centroid_lat=-3.8050, centroid_lng=103.5420),
    # 10. Pagar Alam
    KelurahanSpatial(id=16, kode_kemendagri="16.72.01.1001", nama_kelurahan="Pagar Alam (Dempo)", nama_kecamatan="Pagar Alam Utara", kabupaten_kota="Kota Pagar Alam", centroid_lat=-4.0500, centroid_lng=103.2480),
    # 11. Empat Lawang
    KelurahanSpatial(id=17, kode_kemendagri="16.11.01.1001", nama_kelurahan="Tebing Tinggi", nama_kecamatan="Tebing Tinggi", kabupaten_kota="Kabupaten Empat Lawang", centroid_lat=-3.6000, centroid_lng=103.0920),
    # 12. Musi Rawas
    KelurahanSpatial(id=18, kode_kemendagri="16.05.01.1001", nama_kelurahan="Muara Beliti", nama_kecamatan="Muara Beliti", kabupaten_kota="Kabupaten Musi Rawas", centroid_lat=-3.2750, centroid_lng=103.0620),
    # 13. Muratara
    KelurahanSpatial(id=19, kode_kemendagri="16.13.01.1001", nama_kelurahan="Rupit", nama_kecamatan="Rupit", kabupaten_kota="Kabupaten Musi Rawas Utara", centroid_lat=-2.8200, centroid_lng=102.8880),
    # 14. Lubuklinggau
    KelurahanSpatial(id=20, kode_kemendagri="16.73.01.1001", nama_kelurahan="Pasar Pemiri", nama_kecamatan="Lubuklinggau Barat II", kabupaten_kota="Kota Lubuklinggau", centroid_lat=-3.3050, centroid_lng=102.8720),
    # 15. OKU (Baturaja)
    KelurahanSpatial(id=21, kode_kemendagri="16.01.01.1001", nama_kelurahan="Baturaja Lama", nama_kecamatan="Baturaja Timur", kabupaten_kota="Kabupaten Ogan Komering Ulu", centroid_lat=-4.1400, centroid_lng=104.1780),
    # 16. OKU Timur
    KelurahanSpatial(id=22, kode_kemendagri="16.08.01.1001", nama_kelurahan="Martapura", nama_kecamatan="Martapura", kabupaten_kota="Kabupaten Ogan Komering Ulu Timur", centroid_lat=-4.3350, centroid_lng=104.3580),
    # 17. OKU Selatan
    KelurahanSpatial(id=23, kode_kemendagri="16.09.01.1001", nama_kelurahan="Muaradua (Danau Ranau)", nama_kecamatan="Muaradua", kabupaten_kota="Kabupaten Ogan Komering Ulu Selatan", centroid_lat=-4.5400, centroid_lng=104.1150),
]


async def run_full_pipeline() -> PipelineStatus:
    """
    Execute the entire AeroHealth Guard spatial computation & AI pipeline:
    1. Ingestion: Fetch latest data from WAQI, OpenAQ, and NASA FIRMS concurrently.
    2. Database Sync: Upsert ground stations and refresh active hotspots in PostGIS.
    3. Spatial Engine: Compute Hotspot-Adjusted IDW ISPU scores for all kelurahans.
    4. AI Advisory: Generate batch LLM mitigation recommendations per ISPU category.
    5. Database Sink: Batch insert results to log_ispu_kelurahan.
    """
    global _pipeline_status
    start_time = datetime.utcnow()
    
    _pipeline_status = PipelineStatus(
        status="running",
        started_at=start_time,
        error_message=None,
    )
    logger.info("=== Starting AeroHealth Guard Spatial & AI Pipeline ===")

    try:
        pool = get_db_pool()

        # Step 1: Concurrent Data Ingestion
        logger.info("1/5 Ingesting data from external sensors and satellites...")
        waqi_task = fetch_waqi_stations()
        openaq_task = fetch_openaq_stations()
        firms_task = fetch_firms_hotspots()

        waqi_stations, openaq_stations, hotspots = await asyncio.gather(
            waqi_task, openaq_task, firms_task
        )

        # Merge and deduplicate stations
        all_stations: List[StationData] = []
        seen_source_ids = set()
        for st in waqi_stations + openaq_stations:
            if st.source_id not in seen_source_ids:
                seen_source_ids.add(st.source_id)
                all_stations.append(st)

        _pipeline_status.stations_synced = len(all_stations)
        _pipeline_status.hotspots_synced = len(hotspots)
        logger.info(f"Ingested {len(all_stations)} stations and {len(hotspots)} active hotspots.")

        # Step 2: Sync stations & hotspots to Database (if DB available)
        if pool is not None:
            try:
                await upsert_stations(pool, all_stations)
                await replace_active_hotspots(pool, hotspots)
                logger.info("2/5 Successfully synced stations and hotspots to PostgreSQL/PostGIS.")
            except Exception as db_sync_err:
                logger.warning(f"Database sync warning: {db_sync_err}. Continuing pipeline with in-memory data.")

        # Step 3: Fetch Kelurahan Master Centroids
        kelurahans: List[KelurahanSpatial] = []
        if pool is not None:
            try:
                kelurahans = await fetch_kelurahan_spatial_list(pool)
            except Exception as kel_err:
                logger.warning(f"Failed to fetch kelurahans from DB: {kel_err}. Using fallback centroids.")

        if not kelurahans:
            kelurahans = MOCK_KELURAHAN_CENTROIDS
            logger.info(f"Using {len(kelurahans)} baseline kelurahan centroids.")

        # Step 4: Spatial Hotspot-Adjusted IDW Computation
        logger.info("3/5 Computing Hotspot-Adjusted IDW spatial interpolation...")
        idw_results = calculate_hotspot_adjusted_idw(
            kelurahans=kelurahans,
            stations=all_stations,
            hotspots=hotspots,
            power=2.0,
            r_max_km=10.0,
            alpha=1.5,
            penalty_cap=150.0,
        )
        _pipeline_status.kelurahans_calculated = len(idw_results)

        # Step 5: Batch AI Health Advisory Generation
        logger.info("4/5 Generating AI health advisory recommendations...")
        advisories = await generate_batch_advisories(idw_results)
        _pipeline_status.advisories_generated = len(advisories)

        advisory_dict = {a.kelurahan_id: a.advisory_text for a in advisories}

        # Step 6: Database Sink (log_ispu_kelurahan)
        if pool is not None:
            logger.info("5/5 Sinking calculated ISPU logs to database...")
            log_records = [
                {
                    "kelurahan_id": r.kelurahan_id,
                    "ispu_score": r.ispu_score,
                    "kategori": r.kategori,
                    "primary_pollutant": r.primary_pollutant,
                    "advisory_text": advisory_dict.get(r.kelurahan_id, ""),
                    "hotspot_detected": r.hotspot_detected,
                    "calculated_at": r.calculated_at,
                }
                for r in idw_results
            ]
            try:
                inserted_count = await batch_insert_ispu_logs(pool, log_records)
                logger.info(f"Successfully recorded {inserted_count} ISPU logs to PostgreSQL.")
            except Exception as log_err:
                logger.warning(f"Database logging warning: {log_err}.")

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        _pipeline_status.status = "completed"
        _pipeline_status.completed_at = end_time
        _pipeline_status.duration_seconds = round(duration, 2)

        logger.info(
            f"=== Pipeline Completed Successfully in {round(duration, 2)}s "
            f"({len(idw_results)} kelurahans computed, {len(all_stations)} stations, {len(hotspots)} hotspots) ==="
        )
        return _pipeline_status

    except Exception as exc:
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        error_msg = f"{str(exc)}\n{traceback.format_exc()}"

        _pipeline_status.status = "failed"
        _pipeline_status.completed_at = end_time
        _pipeline_status.duration_seconds = round(duration, 2)
        _pipeline_status.error_message = str(exc)

        logger.error(f"Pipeline execution failed: {error_msg}")
        return _pipeline_status


def get_pipeline_status() -> PipelineStatus:
    """Retrieve the current/last pipeline status."""
    return _pipeline_status


def init_scheduler() -> AsyncIOScheduler:
    """
    Initialize APScheduler with 3-hour cron schedule (8 cycles per day WIB).
    Schedule: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 (UTC+7).
    """
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    _scheduler = AsyncIOScheduler()

    # 8 cycles per day: every 3 hours (UTC+7 / Asia/Jakarta)
    trigger = CronTrigger(
        hour="0,3,6,9,12,15,18,21",
        minute="0",
        timezone="Asia/Jakarta",
    )

    _scheduler.add_job(
        func=run_full_pipeline,
        trigger=trigger,
        id="aerohealth_pipeline_3h",
        name="AeroHealth Guard 3-Hour ISPU & AI Pipeline",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )

    _scheduler.start()
    logger.info("APScheduler started with 3-hour cron job interval (Asia/Jakarta).")
    return _scheduler


def shutdown_scheduler() -> None:
    """Gracefully shutdown APScheduler."""
    global _scheduler
    if _scheduler is not None:
        logger.info("Shutting down APScheduler...")
        _scheduler.shutdown(wait=False)
        _scheduler = None


def get_scheduler_info() -> Dict[str, Any]:
    """Retrieve scheduler metadata and upcoming run times."""
    if _scheduler is None:
        return {"status": "inactive", "jobs": []}

    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": str(job.next_run_time) if job.next_run_time else None,
            "trigger": str(job.trigger),
        })

    return {
        "status": "running" if _scheduler.running else "paused",
        "timezone": "Asia/Jakarta",
        "interval_cycles": "8 cycles/day (every 3 hours: 00, 03, 06, 09, 12, 15, 18, 21 WIB)",
        "jobs": jobs,
    }
