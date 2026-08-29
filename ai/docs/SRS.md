# Software Requirements Specification (SRS) - AI/Spatial Microservice

## Kebutuhan Fungsional (Functional Requirements)
- **REQ-AI-01 (Data Ingestion)**: Sistem harus menarik data observasi dari API WAQI, OpenAQ, dan NASA FIRMS.
- **REQ-AI-02 (Data Cleaning)**: Sistem harus menyaring data null atau anomali negatif sebelum digunakan.
- **REQ-AI-03 (Spatial Computation)**: Sistem harus menghitung nilai estimasi ISPU per kelurahan.
- **REQ-AI-04 (LLM Integration)**: Sistem harus memanggil API LLM dengan pengelompokan (batching) berdasarkan kategori ISPU.
- **REQ-AI-05 (Database Sink)**: Sistem harus mencatat (*upsert*/*insert*) hasil pipeline ke PostgreSQL.
- **REQ-AI-06 (Automated Execution)**: Sistem harus berjalan secara otomatis mengikuti konfigurasi jadwal.

## Spesifikasi Matematis — Hotspot-Adjusted IDW

Estimasi ISPU untuk suatu kelurahan dihitung berdasarkan penggabungan dua komponen: Baseline kualitas udara stasiun dan dampak tambahan (*penalty*) dari titik panas sekitar.

Rumus Utama:
`ISPU_final(s0) = ISPU_IDW(s0) + Delta_hotspot(s0)`

### Komponen 1: Baseline IDW
`ISPU_IDW(s0) = Σ(1 / d(s0,si)^p × Z(si)) / Σ(1 / d(s0,si)^p)`
- `Z(si)` = Nilai ISPU pada stasiun darat `i`
- `d(s0,si)` = Jarak *Euclidean* antara centroid kelurahan dan stasiun
- `p = 2` (parameter kekuatan, umum digunakan dalam IDW)
- `N` = Jumlah stasiun aktif

### Komponen 2: Hotspot Penalty
`Delta_hotspot(s0) = min(150, Σ(α × FRP_j / d(s0,hj)))` untuk semua `hj` dimana `d(s0,hj) <= Rmax`, jika tidak ada titik api maka `0`.
- `FRP_j` = *Fire Radiative Power* dalam MW
- `d(s0,hj)` = Jarak dari centroid kelurahan ke titik api `hj` (km)
- `Rmax = 10` km (radius dampak maksimal)
- `α = 1.5` (konstanta kalibrasi polutan asap)
- Maksimal penalti dibatasi (`cap`) pada 150 agar nilai akhir tetap realistis.

## Spesifikasi API Eksternal
1. **WAQI API**: Endpoint `https://api.waqi.info/feed/geo:{lat};{lng}/`. Respons akan diekstrak untuk nilai PM2.5, PM10, dan indeks gabungan.
2. **OpenAQ API v2**: Endpoint `https://api.openaq.org/v2/locations`. Parameter `radius` digunakan untuk area pantau.
3. **NASA FIRMS API**: Endpoint FIRMS *Area of Interest* (CSV). Dibutuhkan data MODIS dan VIIRS dengan filter *confidence level* > 50%.
4. **LLM API (Gemini/Groq)**: Menggunakan REST API untuk menghasilkan narasi Markdown singkat (max 50-70 kata).

## Spesifikasi Penjadwalan (Cron Schedule)
Sistem menggunakan modul APScheduler. Jadwal diatur untuk berjalan 8 siklus per hari pada waktu spesifik WIB (UTC+7):
`00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00`
Proses dijadwalkan secara *non-overlapping*. Jika satu siklus tertahan, siklus berikutnya akan di-skip atau diantrekan tergantung policy scheduler.

## Spesifikasi Prompt LLM & Fallback
**Prompt Template:**
```text
Anda adalah asisten kesehatan lingkungan. Buatkan pesan imbauan kesehatan (maksimal 3 kalimat) 
untuk warga di area dengan kualitas udara kategori {KATEGORI_ISPU}.
Polutan dominan adalah {POLUTAN}.
Status titik api terdekat: {STATUS_HOTSPOT} (Ada/Tidak ada).
Gunakan bahasa Indonesia baku dan komunikatif.
```

**Mekanisme Fallback:**
Jika API LLM *timeout* atau melebihi *rate limit*, sistem akan menggunakan `fallback_templates.py`:
- *Baik*: "Udara hari ini bersih, sangat baik untuk beraktivitas di luar ruangan."
- *Sedang*: "Kualitas udara cukup baik, aman untuk aktivitas normal, namun kelompok sensitif perlu berhati-hati."
- *Tidak Sehat*: "Kualitas udara menurun. Kurangi aktivitas fisik di luar dan pertimbangkan memakai masker."
- *Sangat Tidak Sehat / Berbahaya*: "Berbahaya. Tetaplah berada di dalam ruangan. Tutup pintu dan jendela. Gunakan masker N95 jika terpaksa keluar."

## Validasi Data & Penanganan Kesalahan (Error Handling)
- **Data Null**: Nilai stasiun yang hilang diabaikan dalam perhitungan sigma IDW.
- **Geometri Invalid**: Kelurahan yang data koordinat centroid-nya hilang/rusak (*None*) tidak dihitung dan dilogorkan sebagai `WARNING`.
- **API Failure**: Menggunakan *Exponential Backoff* maksimal 3 percobaan (retries).
- **Transaction Rollback**: Jika terjadi kegagalan sistematis saat penyimpanan hasil perhitungan kelurahan, *rollback* database akan dilakukan untuk mencegah ketidakkonsistenan sebagian data.
