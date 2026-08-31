# AeroHealth Guard 🛡️
> **Hyperlocal Respiratory Risk & Early Warning Engine**  
> *Target SDGs:* SDG 3 (*Good Health and Well-Being*) & SDG 11 (*Sustainable Cities and Communities*)

---

## 📌 Ringkasan Proyek

**AeroHealth Guard** adalah platform peringatan dini kualitas udara hiperlokal berbasis web responsif yang mengintegrasikan:
1. **Estimasi ISPU Hiperlokal Tingkat Desa/Kelurahan**: Menggunakan algoritma matematis **Hotspot-Adjusted IDW (Inverse Distance Weighting)** yang menggabungkan sensor darat (WAQI) dan penalti jarak titik api karhutla satelit (NASA FIRMS MODIS/VIIRS).
2. **Cakupan 100% Geospasial 3.264 Desa & Kelurahan se-Sumatera Selatan**: Poligon batas wilayah organik resmi BPS/BIG berlekuk alami.
3. **AI Health Advisory Generator**: Rekomendasi mitigasi kesehatan kontekstual berbasis LLM (Google Gemini & Groq) dengan fail-safe KLHK template.
4. **25+ Direktori Clean Air Shelter Resmi**: Lokasi fasilitas perlindungan udara bersih (RSUP, RSUD, Puskesmas 24 Jam, Aula Evakuasi Asap) dengan navigasi Google Maps.
5. **Citizen Health Sensing (Zero PII)**: Laporan agregat keluhan pernapasan warga harian secara anonim 1-klik.

---

## 🏗️ Arsitektur Sistem (Monorepo)

```
AeroHealth Guard/
├── frontend/    # Next.js + Tailwind CSS + Leaflet.js (Port 3000)
├── backend/     # Express.js API Gateway + Prisma ORM + PostgreSQL/PostGIS (Port 5000)
├── ai/          # Python 3.11 FastAPI + SciPy/NumPy + Ingestion + LLM Cron (Port 8000)
├── docker-compose.yml       # Production Full Stack Orchestration
├── docker-compose.dev.yml   # Development PostGIS Database Container
└── .env.example             # Master Environment Configuration Template
```

---

## Cara run app

---

### Run via Docker Compose

Pastikan **Docker** sudah ada di komputer Anda.

1. **Salin file env dan isi env dengan API Key kamu:**
   ```bash
   cp .env.example .env
   ```

2. **Jalankan seluruh service:**
   ```bash
   docker compose up --build -d
   ```

3. **Inisialisasi & Seeding Data Geospasial ke PostGIS:**
   Jalankan perintah seed berikut melalui Docker container backend:
   ```bash
   docker compose exec backend node prisma/seed.js
   ```
   *(Atau menggunakan `docker exec -it aerohealth_backend node prisma/seed.js`)*.

4. **Buka aplikasi di browser:**
   - 🌐 **Web Application:** [http://localhost:3000](http://localhost:3000)
   - 📡 **Express Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
   - 🤖 **FastAPI AI Microservice Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Run Local Development

Jika ingin menjalankan tanpa Docker penuh, ikuti langkah berikut:

#### 1. Persiapan Basis Data (PostgreSQL 16 + PostGIS)
Jalankan container database PostGIS via Docker:
```bash
docker compose -f docker-compose.dev.yml up -d
```
*(Atau gunakan instance PostgreSQL lokal di port 5432 dengan extension `postgis` aktif)*.

#### 2. Konfigurasi File `.env`
Salin template konfigurasi:
```bash
cp .env.example .env
```

#### 3. Menjalankan Backend (Express.js — Port 5000)
Buka terminal baru:
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

#### 4. Menjalankan AI & Spatial Microservice (Python FastAPI — Port 8000)
Buka terminal baru:
```bash
cd ai
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 5. Menjalankan Frontend (Next.js — Port 3000)
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```

Buka **[http://localhost:3000](http://localhost:3000)** di browser Anda.

---

## 🔄 Demonstrasi Sinkronisasi Real-Time NASA FIRMS & WAQI

Untuk mendemonstrasikan eksekusi pipeline komputasi spasial secara instan (on-demand):
```bash
curl -X POST http://localhost:8000/api/pipeline/trigger
```
Dalam waktu **~5–6 detik**, sistem akan memperbarui stasiun darat WAQI, mendeteksi titik api satelit NASA, mengkalkulasi ulang 3.264 desa se-Sumatera Selatan, dan menyinkronkan timestamp ke web secara *real-time*.

