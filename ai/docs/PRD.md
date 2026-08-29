# Product Requirements Document (PRD) - AI/Spatial Microservice

## Tujuan dan Sasaran Layanan
Layanan mikro AI/Spatial Python ini berfungsi sebagai *"otak backend"* dalam sistem AeroHealth Guard. Tujuannya adalah untuk mengumpulkan data kualitas udara dan titik panas (*hotspots*) dari berbagai sumber eksternal, melakukan kalkulasi spasial tingkat lanjut untuk mengestimasi nilai Indeks Standar Pencemar Udara (ISPU) secara hiperlokal (resolusi tingkat kelurahan), serta menghasilkan saran kesehatan (health advisory) dengan bantuan *Large Language Model* (LLM).

## Gambaran Umum Data Pipeline
Pipeline beroperasi secara otomatis mengikuti jadwal cron dan melalui beberapa tahapan utama:
1. **Data Ingestion**: Menarik data kualitas udara dari stasiun pantau (WAQI, OpenAQ) dan data titik panas (NASA FIRMS).
2. **Spatial Computation**: Menggunakan koordinat stasiun, titik panas, dan *centroid* kelurahan untuk menghitung *Hotspot-Adjusted IDW* (Inverse Distance Weighting).
3. **Advisory Generation**: Mengelompokkan hasil kalkulasi berdasar kategori ISPU dan membuat *prompt* untuk LLM guna menghasilkan saran kesehatan secara *batch*.
4. **Data Persistance**: Menyimpan semua hasil mentah dan kalkulasi akhir ke dalam database PostgreSQL.

## Daftar Fitur
- **Automated Data Ingestion**: Sinkronisasi data dari berbagai API eksternal secara terjadwal.
- **Hotspot-Adjusted IDW Calculation**: Algoritma perhitungan spasial kustom yang memperhitungkan jarak stasiun serta penalti polusi dari titik api di sekitar.
- **LLM Health Advisory Generation**: Pembuatan narasi peringatan dan saran berbasis AI yang adaptif terhadap kategori polusi dan sumber polusi (seperti titik api terdekat).
- **Scheduled Operations (Cron)**: Menjalankan keseluruhan pipeline setiap 3 jam secara andal.

## Kriteria Penerimaan (Acceptance Criteria)
- **Ingestion**: Modul *ingestion* harus berhasil mengambil data dari ketiga sumber API eksternal dan menangani format respons yang berbeda.
- **Spatial Calc**: Algoritma IDW harus mengembalikan nilai ISPU yang wajar (cap maksimum 500) dan mengeksekusi perhitungan untuk seluruh kelurahan dalam waktu kurang dari 5 menit.
- **LLM Advisory**: Panggilan LLM harus dilakukan dalam *batch* berdasarkan kategori unik untuk menghemat biaya API.
- **Scheduling**: Pipeline harus terpicu secara akurat pada jam 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, dan 21:00 WIB tanpa tumpang tindih.

## Matriks Ketergantungan API Eksternal
| Provider | Fungsi | Tingkat Kekritisan | Limitasi / Keterangan |
| :--- | :--- | :--- | :--- |
| **WAQI API** | Data stasiun AQ utama | Sangat Tinggi | Rate limit: ~1000 req/hari (gratis) |
| **OpenAQ API** | Data stasiun sekunder | Tinggi | Bergantung pada ketersediaan node di area target |
| **NASA FIRMS** | Data titik api (MODIS/VIIRS) | Tinggi | Update frekuensi ~3-6 jam (latensi satelit) |
| **Gemini/Groq** | Generasi teks advisory | Sedang | Memiliki mekanisme *fallback* lokal jika API limit/down |

## Limitasi yang Diketahui (Known Limitations)
- **API Rate Limits**: Pemanggilan LLM dan API stasiun udara dibatasi oleh batasan *tier* gratis. Proses *batching* wajib diterapkan.
- **Satellite Latency**: Data NASA FIRMS memiliki latensi (*pass over time* satelit) yang dapat menunda deteksi titik api baru hingga 6 jam.

## Iterasi Mendatang (Future Iterations)
- Integrasi data curah hujan dan arah angin (meteorologi) ke dalam formula perhitungan polusi.
- Penerapan model *Machine Learning* untuk prediksi ISPU 24 jam ke depan.
- Optimasi kueri spasial menggunakan PostGIS secara penuh, memindahkan beberapa beban dari Python.
