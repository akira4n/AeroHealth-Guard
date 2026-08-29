# AeroHealth Guard - Frontend Service

AeroHealth Guard adalah platform web responsif (Mobile-First) yang menyediakan pemantauan kualitas udara hiperlokal. Proyek ini dikembangkan untuk kompetisi perangkat lunak DSDC ANFORCOM 2026. Frontend ini bertanggung jawab untuk menampilkan peta interaktif kualitas udara, titik api (hotspot), rekomendasi kesehatan berbasis konteks, pencari lokasi tempat penampungan (shelter), serta pelaporan gejala kesehatan warga dalam 1-klik.

## Required Reading
Agen AI harus membaca dokumen berikut sebelum memodifikasi kode:
- [Product Requirements Document (PRD)](./docs/PRD.md)
- [Software Requirements Specification (SRS)](./docs/SRS.md)
- [Architecture Document](./docs/ARCHITECTURE.md)

## Tech Stack
- Framework: Next.js 14+ (App Router, SSR/CSR hybrid)
- Styling: Tailwind CSS
- Maps: Leaflet.js via `react-leaflet`
- Language: TypeScript
- API Client: Fetch API / Axios

## Coding Conventions
- Gunakan TypeScript strict mode.
- Gunakan Tailwind classes untuk styling. Hindari CSS custom kecuali diperlukan.
- Penamaan komponen: PascalCase (contoh: `SymptomWidget.tsx`).
- Mobile-First design: gunakan utility class secara default untuk mobile, dan prefix md/lg untuk breakpoint yang lebih besar.

## Folder Structure
```
frontend/
├── src/
│   └── app/              # Next.js App Router
│       ├── layout.tsx     # Root layout
│       ├── page.tsx       # Home/Map page
│       └── globals.css    # Tailwind imports
├── components/
│   ├── map/              # Map-related components
│   │   ├── MapContainer.tsx
│   │   ├── KelurahanPolygon.tsx
│   │   ├── HotspotMarker.tsx
│   │   ├── ShelterMarker.tsx
│   │   └── InfoCard.tsx
│   ├── advisory/         # Health advisory
│   │   └── AdvisoryCard.tsx
│   ├── symptoms/         # Citizen sensing
│   │   ├── SymptomWidget.tsx
│   │   └── CommunityStats.tsx
│   ├── shelter/          # Shelter locator
│   │   └── ShelterList.tsx
│   ├── location/         # Location selection
│   │   └── LocationSelector.tsx
│   └── ui/               # Shared UI primitives
├── lib/
│   ├── api.ts            # API client functions
│   ├── constants.ts      # ISPU colors, categories
│   └── types.ts          # TypeScript interfaces
├── hooks/
│   ├── useGeolocation.ts
│   └── useLocalStorage.ts
└── public/
```

## Development Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables
- `NEXT_PUBLIC_API_URL`: Base URL backend Express.js (contoh: `http://localhost:5000/api`)
- `NEXT_PUBLIC_MAPBOX_TOKEN` (opsional jika menggunakan tile dari Mapbox)
