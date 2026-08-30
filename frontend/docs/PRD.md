# Product Requirements Document (PRD) - Frontend AeroHealth Guard

## 1. Product Vision and Goals

AeroHealth Guard bertujuan untuk memberikan informasi kualitas udara yang sangat lokal dan _real-time_ kepada masyarakat, dilengkapi dengan peringatan dini titik api dan rekomendasi kesehatan. Visi utama kami adalah memberdayakan warga untuk melindungi kesehatan mereka di tengah ancaman polusi udara.

## 2. Target Users

- Masyarakat umum yang ingin mengetahui kualitas udara di daerah mereka.
- Kelompok rentan (anak-anak, lansia, penderita asma) yang membutuhkan rekomendasi aktivitas.
- Warga yang ingin berpartisipasi melaporkan dampak polusi terhadap kesehatan mereka.

## 3. Feature List & Acceptance Criteria

### 3.1 Peta Interaktif (Map View)

- **Feature**: Peta layar penuh yang menampilkan polygon kelurahan dengan warna berdasarkan ISPU.
- **AC**: Pengguna dapat melihat polygon kelurahan, penanda titik api, dan penanda _clean air shelter_. Peta dapat digeser dan di-zoom.

### 3.2 Info & Advisory Card

- **Feature**: Popup atau panel yang muncul saat polygon kelurahan diklik.
- **AC**: Menampilkan nama kelurahan, nilai ISPU, kategori, status titik api, waktu _update_ terakhir, dan teks rekomendasi kesehatan (Advisory Card).

### 3.3 Symptom Widget (Citizen Sensing)

- **Feature**: 4 tombol pelaporan gejala (Batuk, Mata Perih, Sesak Napas, Udara Bersih).
- **AC**: Pelaporan terjadi dalam 1 klik tanpa login. Dibatasi 1 kali sehari per perangkat.

### 3.4 Community Stats

- **Feature**: Menampilkan persentase keluhan gejala di suatu kelurahan.
- **AC**: Data ditampilkan dalam format persentase (contoh: "65% warga mengeluhkan mata perih").

### 3.5 Shelter Locator

- **Feature**: Daftar dan penanda peta untuk lokasi udara bersih.
- **AC**: Menampilkan nama _shelter_, jarak dari pengguna, dan tombol navigasi ke Google Maps.

### 3.6 Location Selection

- **Feature**: Auto-deteksi lokasi (GPS) dan pilihan manual (Dropdown).
- **AC**: Saat aplikasi dibuka, GPS diminta. Jika ditolak/gagal, tampilkan _dropdown cascade_ (Kota -> Kecamatan -> Kelurahan).

## 4. User Flows

1. Buka Aplikasi -> Izin Lokasi diminta.
2. Jika Izin diberikan -> Peta langsung zoom ke kelurahan pengguna saat ini.
3. Jika Izin ditolak -> Tampil _dropdown_ pemilihan lokasi manual.
4. Di Peta -> Klik sebuah kelurahan -> Muncul _Info Card_ dan _Advisory Card_.
5. Di panel informasi -> Pengguna dapat melaporkan gejala via _Symptom Widget_.
6. Jika perlu _shelter_ -> Klik ikon _shelter_ di peta atau daftar -> Navigasi ke Google Maps.

## 5. UI/UX Requirements

- **Color System (Standar KLHK)**:
  - Baik (0-50): Hijau `#00E400`
  - Sedang (51-100): Kuning `#FFFF00`
  - Tidak Sehat (101-200): Merah `#FF0000`
  - Sangat Tidak Sehat (201-300): Ungu `#8F3F97`
  - Berbahaya (>300): Hitam `#7E0023`
- **Responsive**: Menggunakan pendekatan _Mobile-First_. Komponen peta menjadi _full-screen_ dengan panel _overlay_ di bagian bawah pada layar _mobile_.
- **Accessibility**: Kontras warna yang cukup pada teks, label ARIA pada tombol.

## 6. Known Limitations

- Tidak mendukung penggunaan _offline_ (membutuhkan koneksi untuk memuat peta dan data).
- _Spam prevention_ pelaporan gejala hanya menggunakan `localStorage`, sehingga dapat dilewati dengan membuka _incognito mode_ atau menghapus data _browser_.
