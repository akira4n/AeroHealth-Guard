# Software Requirements Specification (SRS) - Frontend AeroHealth Guard

## 1. Functional Requirements

| ID | Deskripsi | Prioritas |
| --- | --- | --- |
| REQ-FE-01 | Sistem harus merender peta menggunakan Leaflet.js dengan basemap gratis (misal: OpenStreetMap). | Tinggi |
| REQ-FE-02 | Sistem harus mewarnai polygon kelurahan berdasarkan nilai ISPU sesuai standar KLHK. | Tinggi |
| REQ-FE-03 | Sistem harus meminta izin geolokasi browser saat aplikasi pertama kali dimuat. | Tinggi |
| REQ-FE-04 | Jika geolokasi ditolak, sistem menyediakan dropdown kaskade (Kota, Kecamatan, Kelurahan) untuk lokasi manual. | Tinggi |
| REQ-FE-05 | Sistem harus menampilkan markah titik api (🔥) dari data NASA FIRMS dengan popup informasi *Fire Radiative Power* (FRP). | Menengah |
| REQ-FE-06 | Sistem harus menyediakan 4 tombol untuk pelaporan gejala kesehatan yang mengirim permintaan POST ke backend. | Tinggi |
| REQ-FE-07 | Sistem harus menyimpan status pelaporan pengguna di `localStorage` selama 24 jam untuk mencegah spam. | Tinggi |
| REQ-FE-08 | Sistem harus menampilkan daftar *shelter* terdekat lengkap dengan jarak dan tombol "Arahkan" (membuka Google Maps). | Menengah |

## 2. Component Specifications

### 2.1 MapContainer
- **Props**: `initialCenter`, `zoomLevel`, `polygonsData`, `hotspotsData`, `sheltersData`.
- **State**: `selectedKelurahan`, `mapCenter`.
- **Deskripsi**: Komponen *wrapper* untuk `react-leaflet`. Mengatur interaksi zoom dan pan.

### 2.2 KelurahanPolygon
- **Props**: `geoJson`, `ispuValue`, `onClick`.
- **Deskripsi**: Merender bentuk polygon. Warna *fill* ditentukan dari `ispuValue`.

### 2.3 SymptomWidget
- **State**: `hasReported` (boolean), `loading` (boolean).
- **Deskripsi**: Mengelola logika klik tombol, pemanggilan API POST `/api/symptoms/report`, dan set `localStorage`.

## 3. API Integration Specs

- `GET /api/kelurahan/locate?lat=&lng=`
  - **Kapan**: Saat GPS sukses didapatkan.
  - **Response**: Data kelurahan tempat pengguna berada saat ini.
- `GET /api/ispu/map`
  - **Kapan**: Saat initial load peta untuk menampilkan semua kelurahan.
- `GET /api/hotspots/active`
  - **Kapan**: Saat pengguna mengaktifkan layer titik api.
- `POST /api/symptoms/report`
  - **Payload**: `{ kelurahanId: string, symptomType: string }`
  - **Error State**: Jika gagal, tampilkan toast error "Gagal mengirim laporan".

## 4. Geolocation Flow
1. Komponen `MapContainer` memanggil custom hook `useGeolocation()`.
2. Browser memunculkan *prompt* izin lokasi.
3. **Success**: Lintang/Bujur didapat, `MapContainer` memusatkan peta (panTo), lalu memanggil `/api/kelurahan/locate`.
4. **Denied/Error**: Hook mengembalikan *error*, UI memunculkan *toast* "Lokasi tidak tersedia" dan membuka modal `LocationSelector`.

## 5. LocalStorage Spam Prevention Logic
- Key: `ag_symptom_report_<kelurahan_id>`
- Value: *Timestamp* (UNIX Epoch).
- Saat tombol diklik:
  - Cek apakah key ada dan (sekarang - timestamp) < 86400000 ms (24 jam).
  - Jika ya: Tampilkan *toast* "Anda sudah melaporkan gejala hari ini."
  - Jika tidak: Lanjutkan *request* API, jika sukses, set nilai dengan *timestamp* saat ini.

## 6. ISPU Color Mapping Table
| Kategori | Rentang ISPU | Kode Warna Hex |
| --- | --- | --- |
| Baik | 0 - 50 | `#00E400` |
| Sedang | 51 - 100 | `#FFFF00` |
| Tidak Sehat | 101 - 200 | `#FF0000` |
| Sangat Tidak Sehat | 201 - 300 | `#8F3F97` |
| Berbahaya | > 300 | `#7E0023` |

## 7. Responsive Breakpoints (Tailwind)
- **Mobile (Default)**: Layar < 768px. Peta *full screen*, panel informasi di-*swipe* dari bawah (*Bottom Sheet*).
- **Tablet (md: `768px`)**: Panel informasi melayang di sisi kiri layar dengan lebar 350px.
- **Desktop (lg: `1024px`)**: Panel informasi memiliki lebar 400px, menambahkan kontrol layer peta yang lebih detail.

## 8. Performance Requirements
- **First Contentful Paint (FCP)**: < 1.8 detik pada jaringan 4G.
- **Bundle Size**: Komponen peta Leaflet dimuat secara *lazy loading* (dinamis) untuk mengurangi ukuran *bundle* awal (memanfaatkan `next/dynamic` dengan `ssr: false`).
