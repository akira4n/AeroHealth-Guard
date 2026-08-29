# AeroHealth Guard - Backend Service Developer Instructions

Selamat datang di repositori layanan backend Express.js untuk **AeroHealth Guard**. File ini bertujuan untuk memandu AI coding agents dan developer yang berpartisipasi dalam proyek DSDC ANFORCOM 2026.

## Project Overview
**AeroHealth Guard** adalah platform pemantauan kualitas udara (ISPU) hiperlokal berbasis kelurahan yang mengintegrasikan data *active hotspot* NASA FIRMS, edukasi kesehatan berbasis LLM (Large Language Model), dan sistem *crowdsourcing* laporan gejala kesehatan (*citizen sensing*).

Layanan backend ini bertindak sebagai API gateway utama untuk melayani permintaan dari *frontend* Next.js. Layanan ini murni berperan dalam manajemen data melalui PostgreSQL/PostGIS (menggunakan Prisma ORM) dan tidak melakukan komputasi spasial berat maupun pemanggilan LLM secara langsung (tugas tersebut di-*handle* oleh *microservice* Python via cron job).

## Required Reading
Sebelum melakukan perubahan kode, harap baca dokumen-dokumen berikut untuk memahami konteks sistem secara keseluruhan:
- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Software Requirements Specification (SRS)](./docs/SRS.md)
- [Architecture Document](./docs/ARCHITECTURE.md)

## Tech Stack Summary
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma ORM
- **Database:** PostgreSQL 16 + PostGIS
- **Architecture Pattern:** Layered Architecture + Repository Pattern

## Coding Conventions
- **Bahasa:** Gunakan Bahasa Inggris untuk seluruh penamaan variabel, fungsi, *class*, nama file, dan komentar teknis. Dokumen pengguna dan spesifikasi menggunakan Bahasa Indonesia.
- **Linter/Formatter:** Wajib menggunakan ESLint dan Prettier. Pastikan tidak ada *lint errors* sebelum *commit*.
- **Naming Conventions:**
  - *CamelCase* untuk nama variabel, fungsi, dan method (e.g., `getKelurahanList`, `ispuScore`).
  - *PascalCase* untuk nama *Class* (e.g., `KelurahanController`, `IspuService`).
  - *Kebab-case* untuk nama file (e.g., `kelurahan-controller.js`, `ispu-service.js`).
  - Konstanta menggunakan huruf kapital dengan *underscore* (e.g., `MAX_RETRY_COUNT`).
- **Asynchronous Code:** Gunakan `async/await` daripada *raw Promises* atau *callbacks*. Selalu *wrap* fungsi *controller* dengan `try/catch` atau *wrapper middleware* untuk menangani *error*.

## Folder Structure
Proyek ini mengadopsi pola **Layered Architecture** dengan **Repository Pattern**:

```
backend/
├── src/
│   ├── controllers/    # Route handlers, HTTP response mapping, input validation
│   ├── services/       # Business logic layer
│   ├── repositories/   # Data access layer (Prisma queries, PostGIS logic)
│   ├── routes/         # Express route definitions (mounting controllers)
│   ├── middlewares/    # Middleware (auth, rate-limit, error handler)
│   ├── utils/          # Helper functions, constants, logger
│   ├── config/         # Environment variables configuration & DB connection
│   └── app.js          # Express app entry point (setup)
├── prisma/
│   └── schema.prisma   # Prisma schema definition
├── tests/              # Unit & Integration tests
├── docs/               # Dokumentasi sistem (PRD, SRS, Architecture)
└── package.json
```

## Development Workflow
- **Jalankan server dev:** `npm run dev`
- **Linting:** `npm run lint` / `npm run lint:fix`
- **Testing:** `npm test`
- **Prisma Commands:**
  - `npx prisma generate` (setelah mengubah `schema.prisma`)
  - `npx prisma migrate dev` (menerapkan perubahan skema ke DB lokal)
  - `npx prisma studio` (untuk membuka GUI manajemen *database*)

## Environment Variables
Sistem bergantung pada *environment variables* berikut (buat file `.env` di *root* direktori):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/aerohealth_db?schema=public
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```
