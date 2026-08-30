const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data geospasial AeroHealth Guard...');

  // 1. Bersihkan data lama secara bertahap (cascade)
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE kelurahan_symptom_summary, log_ispu_kelurahan, clean_shelters, active_hotspots, stasiun_ispu, kelurahan RESTART IDENTITY CASCADE;`
  );

  console.log('🧹 Tabel berhasil dibersihkan.');

  // 2. Seed Master Data Kelurahan (Polygon PostGIS SRID 4326)
  const kelurahans = [
    {
      kode: '16.71.04.1001',
      nama: 'Kelurahan 16 Ilir',
      kecamatan: 'Ilir Timur I',
      kota: 'Kota Palembang',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.757 -2.986, 104.766 -2.986, 104.766 -2.993, 104.757 -2.993, 104.757 -2.986))'
    },
    {
      kode: '16.71.01.1002',
      nama: 'Kelurahan 26 Ilir',
      kecamatan: 'Bukit Kecil',
      kota: 'Kota Palembang',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.745 -2.988, 104.757 -2.988, 104.757 -2.996, 104.745 -2.996, 104.745 -2.988))'
    },
    {
      kode: '16.71.02.1005',
      nama: 'Kelurahan Demang Lebar Daun',
      kecamatan: 'Ilir Barat I',
      kota: 'Kota Palembang',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.720 -2.965, 104.750 -2.965, 104.750 -2.985, 104.720 -2.985, 104.720 -2.965))'
    },
    {
      kode: '16.71.10.1003',
      nama: 'Kelurahan Talang Kelapa',
      kecamatan: 'Alang-Alang Lebar',
      kota: 'Kota Palembang',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.675 -2.908, 104.705 -2.908, 104.705 -2.935, 104.675 -2.935, 104.675 -2.908))'
    },
    {
      kode: '16.71.06.1004',
      nama: 'Kelurahan Plaju Ulu',
      kecamatan: 'Plaju',
      kota: 'Kota Palembang',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.785 -2.995, 104.815 -2.995, 104.815 -3.025, 104.785 -3.025, 104.785 -2.995))'
    },
    {
      kode: '16.71.07.1001',
      nama: 'Kelurahan Sukarami',
      kecamatan: 'Sukarami',
      kota: 'Kota Palembang',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.700 -2.915, 104.735 -2.915, 104.735 -2.945, 104.700 -2.945, 104.700 -2.915))'
    },
    {
      kode: '16.10.01.1001',
      nama: 'Kelurahan Indralaya Indah',
      kecamatan: 'Indralaya',
      kota: 'Kabupaten Ogan Ilir',
      provinsi: 'Sumatera Selatan',
      wkt: 'POLYGON((104.620 -3.210, 104.660 -3.210, 104.660 -3.250, 104.620 -3.250, 104.620 -3.210))'
    }
  ];

  for (const k of kelurahans) {
    await prisma.$executeRaw`
      INSERT INTO kelurahan (kode_kemendagri, nama_kelurahan, nama_kecamatan, kabupaten_kota, provinsi, geom)
      VALUES (${k.kode}, ${k.nama}, ${k.kecamatan}, ${k.kota}, ${k.provinsi}, ST_GeomFromText(${k.wkt}, 4326));
    `;
  }
  console.log(`✅ ${kelurahans.length} Kelurahan berhasil di-seed dengan poligon PostGIS.`);

  // Ambil mapping kelurahan ID
  const dbKelurahans =
    await prisma.$queryRaw`SELECT id, nama_kelurahan FROM kelurahan ORDER BY id ASC;`;
  const kelMap = {};
  dbKelurahans.forEach((row) => {
    kelMap[row.nama_kelurahan] = row.id;
  });

  // 3. Seed Master Stasiun ISPU Darat
  const stasiuns = [
    {
      source_id: 'STA-PLB-01',
      nama: 'Stasiun BMKG Kenten Palembang',
      lng: 104.783,
      lat: -2.936,
      ispu: 145,
      pm25: 58.4
    },
    {
      source_id: 'STA-PLB-02',
      nama: 'Stasiun BPLH Simpang Boom Baru',
      lng: 104.772,
      lat: -2.973,
      ispu: 178,
      pm25: 72.1
    },
    {
      source_id: 'STA-OI-01',
      nama: 'Stasiun Pemkab Ogan Ilir Indralaya',
      lng: 104.645,
      lat: -3.228,
      ispu: 215,
      pm25: 98.6
    }
  ];

  for (const s of stasiuns) {
    await prisma.$executeRaw`
      INSERT INTO stasiun_ispu (source_id, nama_stasiun, location, ispu_val, pm25_val, last_synced)
      VALUES (${s.source_id}, ${s.nama}, ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326), ${s.ispu}, ${s.pm25}, NOW());
    `;
  }
  console.log(`✅ ${stasiuns.length} Stasiun Pemantau ISPU berhasil di-seed.`);

  // 4. Seed Titik Api Aktif Satelit NASA FIRMS
  const hotspots = [
    {
      lat: -3.052,
      lng: 104.825,
      frp: 85.5,
      confidence: 'high',
      acquired_at: new Date()
    },
    {
      lat: -3.125,
      lng: 104.74,
      frp: 142.3,
      confidence: 'high',
      acquired_at: new Date()
    },
    {
      lat: -3.195,
      lng: 104.68,
      frp: 42.0,
      confidence: 'nominal',
      acquired_at: new Date()
    }
  ];

  for (const h of hotspots) {
    await prisma.$executeRaw`
      INSERT INTO active_hotspots (latitude, longitude, frp, confidence, acquired_at, location)
      VALUES (${h.lat}, ${h.lng}, ${h.frp}, ${h.confidence}, ${h.acquired_at}, ST_SetSRID(ST_MakePoint(${h.lng}, ${h.lat}), 4326));
    `;
  }
  console.log(`✅ ${hotspots.length} Titik Api Aktif NASA FIRMS berhasil di-seed.`);

  // 5. Seed Clean Air Shelters
  const shelters = [
    {
      kel_nama: 'Kelurahan Demang Lebar Daun',
      nama: 'RSUP Dr. Mohammad Hoesin Palembang',
      alamat: 'Jl. Jend. Sudirman KM 3.5, Palembang',
      fasilitas: 'Ruang IGD & Poliklinik Ber-AC dengan HEPA Filter',
      lng: 104.742,
      lat: -2.969
    },
    {
      kel_nama: 'Kelurahan 26 Ilir',
      nama: 'Palembang Icon Mall (Clean Air Lounge)',
      alamat: 'Jl. POM IX, Lorok Pakjo / 26 Ilir, Palembang',
      fasilitas: 'Atrium & Lounge Mall Ber-AC Terbuka untuk Publik',
      lng: 104.751,
      lat: -2.989
    },
    {
      kel_nama: 'Kelurahan Demang Lebar Daun',
      nama: 'Gedung Perpustakaan Daerah Sumsel',
      alamat: 'Jl. Demang Lebar Daun No. 47, Palembang',
      fasilitas: 'Ruang Baca Tertutup Ber-AC & Air Bersih',
      lng: 104.73,
      lat: -2.972
    },
    {
      kel_nama: 'Kelurahan Plaju Ulu',
      nama: 'Puskesmas Pembina Plaju',
      alamat: 'Jl. DI Panjaitan, Plaju, Palembang',
      fasilitas: 'Klinik Ber-AC & Tabung Oksigen Siaga',
      lng: 104.795,
      lat: -3.008
    },
    {
      kel_nama: 'Kelurahan Indralaya Indah',
      nama: 'Gedung Serbaguna Kampus Unsri Indralaya',
      alamat: 'Jl. Raya Palembang-Prabumulih KM 32, Indralaya',
      fasilitas: 'Aula Tertutup Ber-AC & Titik Evakuasi Udara Bersih',
      lng: 104.65,
      lat: -3.225
    }
  ];

  for (const sh of shelters) {
    const kelId = kelMap[sh.kel_nama] || null;
    await prisma.$executeRaw`
      INSERT INTO clean_shelters (kelurahan_id, nama_tempat, alamat, fasilitas, location)
      VALUES (${kelId}, ${sh.nama}, ${sh.alamat}, ${sh.fasilitas}, ST_SetSRID(ST_MakePoint(${sh.lng}, ${sh.lat}), 4326));
    `;
  }
  console.log(`✅ ${shelters.length} Fasilitas Clean Air Shelter berhasil di-seed.`);

  // 6. Seed Log ISPU & AI Advisory Awal
  const ispuLogs = [
    {
      kel_nama: 'Kelurahan 16 Ilir',
      score: 168,
      kategori: 'Tidak Sehat',
      pollutant: 'PM2.5',
      hotspot: true,
      advisory:
        'Kualitas udara saat ini TIDAK SEHAT (ISPU 168) akibat asap kiriman dan tingginya partikulat PM2.5. Terdeteksi titik api aktif dalam radius 8 km. Seluruh warga disarankan membatasi aktivitas luar ruang dan wajib menggunakan masker N95/KF94.'
    },
    {
      kel_nama: 'Kelurahan 26 Ilir',
      score: 155,
      kategori: 'Tidak Sehat',
      pollutant: 'PM2.5',
      hotspot: false,
      advisory:
        'Kualitas udara berada pada kategori TIDAK SEHAT. Hindari olahraga luar ruangan di sekitar kawasan Kambang Iwak. Tutup ventilasi rumah dan nyalakan penjernih udara jika ada.'
    },
    {
      kel_nama: 'Kelurahan Demang Lebar Daun',
      score: 142,
      kategori: 'Tidak Sehat',
      pollutant: 'PM2.5',
      hotspot: false,
      advisory:
        'Kualitas udara TIDAK SEHAT. Kelompok sensitif (lansia, balita, penderita asma) rentan mengalami iritasi pernapasan. Manfaatkan shelter ber-AC seperti RSUP Moh Hoesin jika mengalami sesak.'
    },
    {
      kel_nama: 'Kelurahan Talang Kelapa',
      score: 88,
      kategori: 'Sedang',
      pollutant: 'PM2.5',
      hotspot: false,
      advisory:
        'Kualitas udara tergolong SEDANG (ISPU 88). Kondisi masih dapat diterima untuk aktivitas umum, namun penderita gangguan pernapasan disarankan tetap waspada jika ada bau asap tercium.'
    },
    {
      kel_nama: 'Kelurahan Plaju Ulu',
      score: 185,
      kategori: 'Tidak Sehat',
      pollutant: 'PM2.5',
      hotspot: true,
      advisory:
        'PERINGATAN DINI KUALITAS UDARA: ISPU 185 mendekati Sangat Tidak Sehat akibat kedekatan dengan titik api di kawasan Rambutan (FRP 85.5 MW). Kenakan masker pelindung dan segera kunjungi Puskesmas Plaju jika mengalami sesak napas akut.'
    },
    {
      kel_nama: 'Kelurahan Sukarami',
      score: 95,
      kategori: 'Sedang',
      pollutant: 'PM2.5',
      hotspot: false,
      advisory:
        'Kualitas udara SEDANG. Angin membawa sebagian partikulat ke arah utara. Aman untuk aktivitas normal dengan tetap menjaga hidrasi tubuh.'
    },
    {
      kel_nama: 'Kelurahan Indralaya Indah',
      score: 228,
      kategori: 'Sangat Tidak Sehat',
      pollutant: 'PM2.5',
      hotspot: true,
      advisory:
        'STATUS DARURAT KABUT ASAP: ISPU 228 (Sangat Tidak Sehat) akibat kebakaran lahan aktif di Pemulutan dan Indralaya Utara. Jarak pandang menurun drastis. DILARANG beraktivitas di luar ruangan. Segera evakuasi ke shelter udara bersih terdekat!'
    }
  ];

  for (const log of ispuLogs) {
    const kelId = kelMap[log.kel_nama];
    if (kelId) {
      await prisma.logIspuKelurahan.create({
        data: {
          kelurahan_id: kelId,
          ispu_score: log.score,
          kategori: log.kategori,
          primary_pollutant: log.pollutant,
          hotspot_detected: log.hotspot,
          advisory_text: log.advisory,
          calculated_at: new Date()
        }
      });
    }
  }
  console.log(`✅ ${ispuLogs.length} Log ISPU & AI Advisory berhasil di-seed.`);

  // 7. Seed Citizen Symptom Summary Awal (Hari Ini)
  const today = new Date();
  const symptoms = [
    { kel_nama: 'Kelurahan 16 Ilir', batuk: 14, mata: 22, sesak: 8, normal: 5 },
    { kel_nama: 'Kelurahan 26 Ilir', batuk: 9, mata: 15, sesak: 4, normal: 8 },
    { kel_nama: 'Kelurahan Demang Lebar Daun', batuk: 7, mata: 11, sesak: 3, normal: 12 },
    { kel_nama: 'Kelurahan Talang Kelapa', batuk: 3, mata: 4, sesak: 1, normal: 18 },
    { kel_nama: 'Kelurahan Plaju Ulu', batuk: 20, mata: 35, sesak: 12, normal: 4 },
    { kel_nama: 'Kelurahan Sukarami', batuk: 5, mata: 6, sesak: 2, normal: 15 },
    { kel_nama: 'Kelurahan Indralaya Indah', batuk: 42, mata: 68, sesak: 27, normal: 3 }
  ];

  for (const sym of symptoms) {
    const kelId = kelMap[sym.kel_nama];
    if (kelId) {
      const total = sym.batuk + sym.mata + sym.sesak + sym.normal;
      await prisma.kelurahanSymptomSummary.create({
        data: {
          kelurahan_id: kelId,
          tanggal: today,
          count_batuk: sym.batuk,
          count_mata_perih: sym.mata,
          count_sesak: sym.sesak,
          count_normal: sym.normal,
          total_laporan: total
        }
      });
    }
  }
  console.log(`✅ ${symptoms.length} Ringkasan Gejala Warga (Citizen Sensing) berhasil di-seed.`);

  console.log('🎉 Seeding database spasial AeroHealth Guard SELESAI dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
