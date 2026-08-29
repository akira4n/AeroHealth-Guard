# AeroHealth Guard - Python FastAPI AI/Spatial Microservice (Agent Guidelines)

## Gambaran Umum Proyek (Project Overview)
Layanan mikro Python ini adalah mesin komputasi spasial dan *data ingestion* utama untuk platform pemantauan kualitas udara hiperlokal **AeroHealth Guard** (kompetisi DSDC ANFORCOM 2026). 
Layanan ini bertanggung jawab untuk menarik data kualitas udara dari stasiun darat (WAQI, OpenAQ) dan data titik panas dari satelit (NASA FIRMS), kemudian menghitung estimasi ISPU per kelurahan menggunakan metode **Hotspot-Adjusted IDW**. Selain itu, layanan ini menghasilkan narasi *health advisory* menggunakan LLM secara *batch* dan menyimpannya ke database PostgreSQL + PostGIS. Semua operasi berjalan otomatis melalui penjadwalan *cron*.

## Required Reading
Sebelum melakukan perubahan kode, harap baca dokumen-dokumen berikut:
- [PRD (Product Requirements Document)](./docs/PRD.md)
- [SRS (Software Requirements Specification)](./docs/SRS.md)
- [Architecture Document](./docs/ARCHITECTURE.md)

## Tech Stack
- **Bahasa Pemrograman**: Python 3.11
- **Framework Web**: FastAPI (untuk expose health check dan manual trigger)
- **Komputasi Spasial**: SciPy, GeoPandas, Shapely
- **Database**: PostgreSQL dengan ekstensi PostGIS, diakses via `psycopg2` / `asyncpg`
- **Scheduler**: APScheduler (atau library *cron* sejenis)
- **HTTP Client**: `httpx` / `aiohttp` untuk pemanggilan API eksternal secara *asynchronous*

## Konvensi Kode (Coding Conventions)
- Ikuti standar **PEP 8** untuk formatting kode.
- Gunakan **Type Hints** secara konsisten di seluruh *functions* dan *methods* (`def calculate_idw(points: list[Point]) -> float:`).
- Tambahkan **Docstrings** pada setiap *module*, *class*, dan *function* yang memiliki kompleksitas logika tinggi.
- Gunakan bahasa Inggris untuk penamaan variabel, fungsi, kelas, dan komentar teknis.

## Struktur Direktori (Folder Structure)
```text
ai/
├── app/
│   ├── main.py              # FastAPI app entry + scheduler setup
│   ├── config.py            # Environment config
│   ├── scheduler/
│   │   └── cron_jobs.py     # APScheduler cron definitions
│   ├── ingestion/
│   │   ├── waqi_client.py   # WAQI API client
│   │   ├── openaq_client.py # OpenAQ API client
│   │   └── firms_client.py  # NASA FIRMS API client
│   ├── spatial/
│   │   ├── idw_engine.py    # Hotspot-Adjusted IDW calculation
│   │   └── geometry.py      # GeoPandas/Shapely utilities
│   ├── advisory/
│   │   ├── llm_client.py    # Gemini/Groq API client
│   │   ├── batch_generator.py # Batch advisory generation
│   │   └── fallback_templates.py # KLHK standard templates
│   ├── database/
│   │   ├── connection.py    # PostgreSQL connection pool
│   │   └── queries.py       # SQL queries for read/write
│   └── models/
│       └── schemas.py       # Pydantic models
├── tests/
├── requirements.txt
└── pyproject.toml
```

## Perintah Pengembangan (Development Commands)
- **Instalasi Dependencies**: `pip install -r requirements.txt` atau via poetry/pipenv.
- **Menjalankan Server (Dev)**: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- **Menjalankan Testing**: `pytest tests/ -v`

## Environment Variables
Sistem menggunakan *environment variables* berikut (harus disiapkan di `.env`):
- `DATABASE_URL`: String koneksi PostgreSQL (mis. `postgresql+asyncpg://user:pass@host/db`)
- `WAQI_API_KEY`: Token untuk akses WAQI API
- `OPENAQ_API_KEY`: Token untuk akses OpenAQ API (jika ada)
- `NASA_FIRMS_MAP_KEY`: Token untuk API NASA FIRMS
- `LLM_API_KEY`: Kunci API untuk Google Gemini atau Groq
- `CRON_SCHEDULE`: Jadwal cron (default: `0 */3 * * *` untuk tiap 3 jam)
