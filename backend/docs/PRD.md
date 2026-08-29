# Product Requirements Document (PRD)
## AeroHealth Guard - Backend Service

## 1. Product Overview and Goals
**AeroHealth Guard** adalah platform pemantauan Indeks Standar Pencemar Udara (ISPU) hiperlokal yang ditujukan untuk kompetisi perangkat lunak (DSDC ANFORCOM 2026). Platform ini memberikan estimasi kualitas udara pada tingkat kelurahan, visualisasi titik api (hotspot) aktif dari data satelit NASA FIRMS, serta edukasi kesehatan berbasis Large Language Model (LLM) yang disesuaikan dengan konteks polusi lokal. Selain itu, sistem menyediakan fitur *citizen health sensing* di mana masyarakat dapat melaporkan gejala kesehatan secara anonim, yang diagregasi sebagai data kewaspadaan.

**Tujuan Proyek:**
- Memberikan informasi kualitas udara dan mitigasi kesehatan yang akurat dan sangat terjangkau secara spasial (tingkat kelurahan).
- Menjadi gerbang API utama (Express.js) yang cepat dan andal bagi aplikasi *frontend* Next.js.
- Memisahkan beban kerja analitik spasial (oleh Python) dan penyediaan data operasional (oleh Express.js).

## 2. Target Users
1. **Masyarakat Umum (Citizen):** Pengguna yang ingin mengetahui tingkat ISPU di daerahnya, mendapatkan peringatan dini (advisory), mencari lokasi *clean air shelter*, serta ikut berkontribusi melaporkan gejala kesehatan akibat polusi.
2. **Administrator / Pengambil Kebijakan:** Pihak yang memonitor kualitas udara makro dan distribusi penyakit/gejala kesehatan warga per kelurahan (melalui visualisasi peta).

## 3. User Stories
### API Kelurahan & ISPU
- **Sebagai pengguna,** saya ingin melihat tingkat polusi udara (ISPU) saat ini di kelurahan saya agar dapat bersiap sebelum beraktivitas di luar rumah.
- **Sebagai pengguna,** saya ingin mendapatkan rekomendasi kesehatan (*health advisory*) spesifik untuk tingkat polusi saat ini di lokasi saya agar saya dapat mengambil tindakan preventif yang tepat.
- **Sebagai aplikasi (Frontend),** saya perlu bisa mencari kelurahan berdasarkan titik koordinat GPS (lat, lng) pengguna saat ini secara instan.
- **Sebagai aplikasi (Frontend),** saya ingin memuat seluruh data agregat ISPU per kelurahan untuk ditampilkan di atas peta (heatmap) polusi udara tingkat kota.

### Hotspots & Shelters
- **Sebagai pengguna,** saya ingin melihat titik-titik api (hotspots) kebakaran hutan atau lahan di sekitar agar mengetahui potensi asap polusi.
- **Sebagai pengguna (saat kondisi udara sangat buruk),** saya ingin mengetahui fasilitas shelter udara bersih terdekat beserta jaraknya dari lokasi saya.

### Citizen Health Sensing
- **Sebagai pengguna,** saya ingin melaporkan gejala kesehatan saya (batuk, mata perih, sesak napas) secara cepat dan anonim.
- **Sebagai warga/peneliti,** saya ingin melihat ringkasan gejala kesehatan warga di suatu kelurahan untuk menyadari dampak nyata dari polusi di sekitar.

## 4. Feature List with Acceptance Criteria

| Fitur | Deskripsi | Acceptance Criteria |
|---|---|---|
| **Pencarian Kelurahan via GPS** | Mendapatkan data wilayah kelurahan dari koordinat GPS (Reverse Geocoding dengan PostGIS ST_Contains). | - Input: latitude, longitude.<br>- Output: Data kelurahan (ID, nama, dll).<br>- Response time < 100ms.<br>- Menghandle jika koordinat di luar wilayah cakupan. |
| **Daftar Kelurahan** | Endpoint untuk menampilkan daftar wilayah berjenjang (Kota -> Kecamatan -> Kelurahan) untuk dropdown. | - Input (opsional): kota, kecamatan.<br>- Output: list kelurahan/kecamatan terkait. |
| **ISPU per Kelurahan** | Mengambil data ISPU, polutan utama, dan rekomendasi kesehatan terbaru untuk kelurahan tertentu. | - Input: ID Kelurahan.<br>- Output: skor ISPU, kategori warna, health advisory.<br>- Fallback: Jika LLM advisory kosong, kirimkan template default dari KLHK. |
| **Data Map ISPU** | Endpoint untuk menginisialisasi peta heatmap seluruh kota dengan nilai polusi per kelurahan. | - Output: array data kelurahan + ISPU terkini.<br>- Waktu respons < 200ms. |
| **Hotspot Satelit** | Data titik api (hotspots) yang aktif (mis. dalam 24-48 jam terakhir) dari NASA FIRMS. | - Output: List koordinat titik api (lat, lng, FRP, confidence). |
| **Shelter Udara Bersih Terdekat** | Fitur pencarian shelter ber-AC/hepa filter berdasarkan koordinat dengan limit tertentu (menggunakan ST_DistanceSphere). | - Input: latitude, longitude, limit (opsional).<br>- Output: Daftar shelter beserta perkiraan jarak (meter/km). |
| **Pelaporan Gejala (Symptom)** | Menerima laporan gejala dari masyarakat. Data di-UPSERT ke agregat harian (anonim). | - Input: Pilihan gejala (batuk, sesak, dll), ID Kelurahan.<br>- Proses: Menambahkan +1 ke kolom gejala (counter). Tidak menyimpan data diri pengirim.<br>- Output: Status sukses. |
| **Statistik Gejala Kelurahan** | Menampilkan total laporan gejala harian untuk suatu kelurahan. | - Input: ID Kelurahan.<br>- Output: Total laporan, persentase gejala. |

## 5. API Endpoint Summary Table
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/kelurahan/locate` | Mencari kelurahan berdasarkan lat & lng (ST_Contains). |
| GET | `/api/kelurahan/list` | Mendapatkan daftar kelurahan (opsi filter kota/kecamatan). |
| GET | `/api/ispu/kelurahan/:id` | Mengambil info ISPU terbaru dan *advisory* kelurahan. |
| GET | `/api/ispu/map` | Data sebaran ISPU kelurahan untuk visualisasi heatmap peta. |
| GET | `/api/hotspots/active` | Daftar titik api NASA FIRMS yang saat ini aktif. |
| GET | `/api/shelters/nearby` | Mencari shelter terdekat (ST_DistanceSphere). |
| POST | `/api/symptoms/report` | Submit laporan gejala masyarakat secara anonim. |
| GET | `/api/symptoms/kelurahan/:id`| Mendapatkan ringkasan statistik gejala pada kelurahan. |

## 6. Success Metrics
- **Performance:** Waktu respons API secara keseluruhan < 200ms pada persentil 95 (P95).
- **Spatial Queries:** Kueri PostGIS diselesaikan dalam waktu < 100ms.
- **Availability:** Layanan *backend* memiliki *uptime* 99.9%.
- **Security:** Tidak ada kebocoran Data Pribadi (PII) karena desain sistem bersifat agregat dan anonim.

## 7. Known Limitations
- Data ISPU yang disajikan adalah "estimasi" berdasarkan pemodelan spasial dari beberapa stasiun pemantauan resmi (di-kalkulasi oleh service Python), sehingga memiliki batas margin error.
- Pelaporan *citizen sensing* bersifat anonim, sehingga berisiko terkena *spam* (meskipun dibatasi dengan *rate limit* IP).

## 8. Future Iterations
- Implementasi sistem CAPTCHA/bot-protection untuk form *citizen sensing*.
- Integrasi Push Notification untuk memberi peringatan jika status ISPU di kelurahan *user* menembus kategori "Berbahaya".
- Fitur analisis tren historis ISPU mingguan/bulanan.
