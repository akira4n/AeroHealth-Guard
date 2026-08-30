-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "kelurahan" (
    "id" SERIAL NOT NULL,
    "kode_kemendagri" VARCHAR(20) NOT NULL,
    "nama_kelurahan" VARCHAR(100) NOT NULL,
    "nama_kecamatan" VARCHAR(100) NOT NULL,
    "kabupaten_kota" VARCHAR(100) NOT NULL,
    "provinsi" VARCHAR(100) NOT NULL DEFAULT 'Sumatera Selatan',
    "geom" geometry(Polygon, 4326) NOT NULL,

    CONSTRAINT "kelurahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stasiun_ispu" (
    "id" SERIAL NOT NULL,
    "source_id" VARCHAR(100) NOT NULL,
    "nama_stasiun" VARCHAR(150) NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,
    "ispu_val" INTEGER DEFAULT 0,
    "pm25_val" DOUBLE PRECISION DEFAULT 0.0,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stasiun_ispu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_hotspots" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "frp" DOUBLE PRECISION DEFAULT 0.0,
    "confidence" VARCHAR(20),
    "acquired_at" TIMESTAMP(6) NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,

    CONSTRAINT "active_hotspots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_ispu_kelurahan" (
    "id" SERIAL NOT NULL,
    "kelurahan_id" INTEGER NOT NULL,
    "ispu_score" INTEGER NOT NULL,
    "kategori" VARCHAR(50) NOT NULL,
    "primary_pollutant" VARCHAR(20) DEFAULT 'PM2.5',
    "advisory_text" TEXT,
    "hotspot_detected" BOOLEAN DEFAULT false,
    "calculated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_ispu_kelurahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelurahan_symptom_summary" (
    "id" SERIAL NOT NULL,
    "kelurahan_id" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count_batuk" INTEGER NOT NULL DEFAULT 0,
    "count_mata_perih" INTEGER NOT NULL DEFAULT 0,
    "count_sesak" INTEGER NOT NULL DEFAULT 0,
    "count_normal" INTEGER NOT NULL DEFAULT 0,
    "total_laporan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kelurahan_symptom_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clean_shelters" (
    "id" SERIAL NOT NULL,
    "kelurahan_id" INTEGER,
    "nama_tempat" VARCHAR(150) NOT NULL,
    "alamat" TEXT NOT NULL,
    "fasilitas" VARCHAR(100) DEFAULT 'Ruang Ber-AC & Air Bersih',
    "location" geometry(Point, 4326) NOT NULL,

    CONSTRAINT "clean_shelters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kelurahan_kode_kemendagri_key" ON "kelurahan"("kode_kemendagri");

-- CreateIndex
CREATE UNIQUE INDEX "stasiun_ispu_source_id_key" ON "stasiun_ispu"("source_id");

-- CreateIndex
CREATE INDEX "idx_log_kelurahan_time" ON "log_ispu_kelurahan"("kelurahan_id", "calculated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_symptom_kelurahan" ON "kelurahan_symptom_summary"("kelurahan_id", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "kelurahan_symptom_summary_kelurahan_id_tanggal_key" ON "kelurahan_symptom_summary"("kelurahan_id", "tanggal");

-- Create Spatial GIST Indexes
CREATE INDEX IF NOT EXISTS "idx_kelurahan_geom" ON "kelurahan" USING GIST("geom");
CREATE INDEX IF NOT EXISTS "idx_stasiun_location" ON "stasiun_ispu" USING GIST("location");
CREATE INDEX IF NOT EXISTS "idx_hotspot_location" ON "active_hotspots" USING GIST("location");
CREATE INDEX IF NOT EXISTS "idx_shelter_location" ON "clean_shelters" USING GIST("location");

-- AddForeignKey
ALTER TABLE "log_ispu_kelurahan" ADD CONSTRAINT "log_ispu_kelurahan_kelurahan_id_fkey" FOREIGN KEY ("kelurahan_id") REFERENCES "kelurahan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelurahan_symptom_summary" ADD CONSTRAINT "kelurahan_symptom_summary_kelurahan_id_fkey" FOREIGN KEY ("kelurahan_id") REFERENCES "kelurahan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clean_shelters" ADD CONSTRAINT "clean_shelters_kelurahan_id_fkey" FOREIGN KEY ("kelurahan_id") REFERENCES "kelurahan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
