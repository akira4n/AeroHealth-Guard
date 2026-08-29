# Software Requirements Specification (SRS)
## AeroHealth Guard - Backend Service

## 1. Functional Requirements (REQ-F)

### REQ-F1: Manajemen & Lokasi Kelurahan
- **REQ-F1.1:** Sistem harus dapat menemukan satu entitas wilayah Kelurahan yang membungkus (*contains*) suatu titik koordinat (latitude, longitude) yang diberikan, menggunakan operasi spasial PostGIS (`ST_Contains`).
- **REQ-F1.2:** Sistem harus menyediakan daftar seluruh Kelurahan, mendukung *filtering* berdasarkan atribut Kota atau Kecamatan secara dinamis.

### REQ-F2: Informasi Kualitas Udara (ISPU)
- **REQ-F2.1:** Sistem harus mengembalikan status ISPU terkini (termasuk nilai numerik, kategori polusi, polutan dominan) untuk ID Kelurahan tertentu.
- **REQ-F2.2:** Sistem harus mengembalikan *health advisory* (teks rekomendasi kesehatan hasil LLM) pada *endpoint* spesifik ISPU Kelurahan. Jika kolom *advisory* bernilai *null*, sistem harus mengembalikan template standar dari Kementerian Lingkungan Hidup dan Kehutanan (KLHK).
- **REQ-F2.3:** Sistem harus dapat mengembalikan keseluruhan kumpulan data ISPU Kelurahan yang memiliki pembaruan terakhir untuk ditampilkan secara *bulk* pada peta di *frontend*.

### REQ-F3: Informasi Spasial Tambahan (Hotspots & Shelters)
- **REQ-F3.1:** Sistem harus mengembalikan data titik api (hotspot) aktif dari tabel `active_hotspots`.
- **REQ-F3.2:** Sistem harus mampu mencari dan mengurutkan fasilitas *Clean Air Shelter* terdekat dari sebuah koordinat menggunakan `ST_DistanceSphere`, dibatasi pada jumlah tertentu (*limit* default: 5).

### REQ-F4: Citizen Health Sensing
- **REQ-F4.1:** Sistem harus menyediakan fungsi POST (Create/Update) laporan gejala kesehatan. 
- **REQ-F4.2:** Sistem harus secara atomik menambahkan nilai pada *counter* kolom jenis gejala di tabel agregasi (`kelurahan_symptom_summary`) menggunakan mekanisme UPSERT (Update jika rekod tanggal dan lokasi sudah ada, atau Insert jika baru) pada database Postgres.
- **REQ-F4.3:** Sistem tidak boleh meminta dan menyimpan *Personally Identifiable Information* (PII) dari pengguna pengirim data gejala.

---

## 2. Non-Functional Requirements (NFR)

- **NFR-1 Performance:** 
  - Waktu respons maksimal keseluruhan API Gateway adalah 200ms di bawah beban normal.
  - Kueri yang memuat operasi PostGIS (`ST_Contains`, `ST_DistanceSphere`) wajib dieksekusi di bawah 100ms (didukung oleh *Spatial Index* GIST di PostgreSQL).
- **NFR-2 Security:**
  - Koneksi dari eksternal ke layanan wajib dienkripsi menggunakan HTTPS/TLS.
  - *Rate Limiting* seketat 100 request / menit / IP diberlakukan pada seluruh *endpoint* publik, khususnya pada endpoint POST pelaporan gejala, guna menekan ancaman *spam* atau *DDoS*.
  - Menghindari risiko injeksi SQL (Prisma ORM sudah menyediakan penanganan dasar untuk sanitasi).
- **NFR-3 Reliability:** Fallback mekanisme ketika *Health Advisory* LLM kosong sudah ditangani sesuai REQ-F2.2.

---

## 3. API Contracts (Spesifikasi Endpoint)

### 3.1 GET `/api/kelurahan/locate`
Mendapatkan info kelurahan berdasarkan koordinat (GPS) user.
- **Query Params:**
  - `lat` (float, required)
  - `lng` (float, required)
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": {
      "id": "3374151001",
      "nama": "Tembalang",
      "kecamatan": "Tembalang",
      "kota": "Semarang"
    }
  }
  ```
- **Response 404 Not Found:** `{"success": false, "message": "Location outside coverage"}`

### 3.2 GET `/api/ispu/kelurahan/:id`
Mendapatkan ringkasan ISPU dan *advisory* terkini per kelurahan.
- **Path Params:** `id` (string, kode_kemendagri kelurahan)
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": {
      "kelurahan_id": "3374151001",
      "ispu_score": 115,
      "kategori": "Tidak Sehat",
      "color_hex": "#FF0000",
      "primary_pollutant": "PM2.5",
      "advisory_text": "Gunakan masker N95 saat beraktivitas di luar. Kelompok sensitif (anak & lansia) disarankan berada di dalam ruangan tertutup.",
      "calculated_at": "2026-08-29T10:00:00Z"
    }
  }
  ```

### 3.3 GET `/api/shelters/nearby`
Mencari shelter terdekat.
- **Query Params:** `lat` (float), `lng` (float), `limit` (integer, default: 5)
- **Response 200 OK:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "nama_tempat": "Puskesmas Rowosari (Clean Room)",
        "alamat": "Jl. Rowosari No 10",
        "fasilitas": "AC, HEPA Filter, Oksigen",
        "distance_meters": 1200,
        "lat": -7.05,
        "lng": 110.45
      }
    ]
  }
  ```

### 3.4 POST `/api/symptoms/report`
Melaporkan gejala dari masyarakat (Upsert ke *daily summary*).
- **Request Body JSON:**
  ```json
  {
    "kelurahan_id": "3374151001",
    "symptom_type": "mata_perih" 
  }
  ```
  *(Valid enum: batuk, mata_perih, sesak, normal)*
- **Response 201 Created:**
  ```json
  {
    "success": true,
    "message": "Report successfully recorded."
  }
  ```
- **Response 429 Too Many Requests:** Bila batas *rate limit* IP tercapai.

---

## 4. Data Validation Rules
- `lat` harus bernilai antara -90 hingga 90.
- `lng` harus bernilai antara -180 hingga 180.
- `kelurahan_id` wajib menggunakan format String (umumnya berupa *kode Kemendagri* 10 digit, misal: "3374151001").
- `symptom_type` harus tervalidasi terhadap himpunan *enum* atau *allowed strings*.

## 5. Error Handling Strategy
- Format JSON respon error yang seragam di seluruh aplikasi:
  `{ "success": false, "error": "Jenis Error", "message": "Pesan deskriptif" }`
- Menggunakan *global error handling middleware* pada Express.js.
- Kesalahan validasi (misalnya `lat` bukan angka) me-return HTTP 400 Bad Request.
- Kesalahan server (koneksi database putus) me-return HTTP 500 Internal Server Error (namun detail log stack-trace di-*suppress* di environment produksi).

## 6. Rate Limiting Specification
- **Engine:** Menggunakan `express-rate-limit`.
- **Aturan:** Maksimal 100 *requests* setiap 1 menit (60 detik) untuk setiap alamat IP.
- **Identifikasi:** Menggunakan `req.ip` (atau header `X-Forwarded-For` jika di balik *load balancer* atau *reverse proxy* Nginx).

## 7. Database Interaction Patterns
- Prisma tidak secara *native* mendukung tipe geometri PostGIS pada versi dasarnya, sehingga operasi spasial (`ST_Contains`, `ST_DistanceSphere`) akan dijalankan menggunakan metode raw query (`prisma.$queryRaw`).
- Proses Insert laporan gejala (symptom) menggunakan fitur `prisma.kelurahan_symptom_summary.upsert()` agar menangani *race-condition* pencatatan data secara atomik pada baris data harian yang relevan.
