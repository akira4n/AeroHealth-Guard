const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const sumselWilayah = require('./sumsel_3264_kelurahan.json');

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Memulai proses seeding data geospasial 100% Seluruh ${sumselWilayah.length} Kelurahan/Desa se-Sumatera Selatan...`);

  // 1. Bersihkan data lama secara bertahap (cascade)
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE kelurahan_symptom_summary, log_ispu_kelurahan, clean_shelters, active_hotspots, stasiun_ispu, kelurahan RESTART IDENTITY CASCADE;`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE kelurahan ALTER COLUMN geom TYPE geometry(Geometry, 4326);`
  );

  console.log('🧹 Tabel berhasil dibersihkan dan tipe geom dikonfigurasi.');

  // 2. Master Batas Wilayah 3.264 Kelurahan Asli se-Sumsel (Batch insert chunks 500)
  console.log(`📥 Menyisipkan ${sumselWilayah.length} poligon desa/kelurahan ke PostGIS...`);
  const chunkSize = 200;
  for (let i = 0; i < sumselWilayah.length; i += chunkSize) {
    const chunk = sumselWilayah.slice(i, i + chunkSize);
    const valueClauses = chunk.map(
      (w) =>
        `('${w.kode.replace(/'/g, "''")}', '${w.nama.replace(/'/g, "''")}', '${w.kecamatan.replace(/'/g, "''")}', '${w.kota.replace(/'/g, "''")}', '${w.provinsi.replace(/'/g, "''")}', ST_GeomFromText('${w.wkt}', 4326))`
    );
    const rawSql = `INSERT INTO kelurahan (kode_kemendagri, nama_kelurahan, nama_kecamatan, kabupaten_kota, provinsi, geom) VALUES ${valueClauses.join(', ')};`;
    await prisma.$executeRawUnsafe(rawSql);
  }
  console.log(`✅ ${sumselWilayah.length} Kelurahan/Desa Resmi se-Sumatera Selatan berhasil di-seed ke PostGIS!`);

  // 3. Master Fasilitas Clean Air Shelter Resmi se-Sumatera Selatan (25 Faskes Kemenkes/BPBD)
  const shelters = [
    // Palembang
    {
      nama: 'RSUP Dr. Mohammad Hoesin (RSMH) Palembang',
      alamat: 'Jl. Jend. Sudirman KM 3.5, Palembang',
      fasilitas: 'IGD & Poliklinik Rujukan Utama Ber-AC dengan HEPA Filter & Oksigen Sentral',
      lng: 104.742,
      lat: -2.969
    },
    {
      nama: 'RSUD Siti Fatimah Az-Zahra Provinsi Sumsel',
      alamat: 'Jl. Kol. H. Burlian KM 6, Sukarami, Palembang',
      fasilitas: 'Klinik Respirasi Ber-AC, Ruang Isolasi ISPA & Oksigen Siaga',
      lng: 104.721,
      lat: -2.932
    },
    {
      nama: 'RSUD Palembang BARI',
      alamat: 'Jl. Panca Usaha No. 1, 5 Ulu, Seberang Ulu I, Palembang',
      fasilitas: 'Instalasi Gawat Darurat Ber-AC & Pelayanan Penyakit Paru 24 Jam',
      lng: 104.768,
      lat: -3.008
    },
    {
      nama: 'Puskesmas Pembina Plaju',
      alamat: 'Jl. DI Panjaitan, Plaju, Palembang',
      fasilitas: 'Poli ISPA Ber-AC & Ruang Oksigenasi Darurat',
      lng: 104.795,
      lat: -3.008
    },
    {
      nama: 'Puskesmas Merdeka Palembang',
      alamat: 'Jl. Merdeka No. 128, 19 Ilir / Bukit Kecil, Palembang',
      fasilitas: 'Puskesmas Rawat Inap Ber-AC & Nebulizer Siaga',
      lng: 104.752,
      lat: -2.988
    },
    {
      nama: 'Gedung Asrama Haji Sumsel (Aula Evakuasi Kabut Asap)',
      alamat: 'Jl. Kol. H. Burlian, Sukarami, Palembang',
      fasilitas: 'Aula Tertutup Berpendingin Udara & Pusat Penampungan Warga Terdampak Asap',
      lng: 104.712,
      lat: -2.925
    },
    {
      nama: 'Palembang Icon Clean Air Lounge',
      alamat: 'Jl. POM IX, Lorok Pakjo, Palembang',
      fasilitas: 'Atrium Tertutup Ber-AC Sentral dengan Filter Sirkulasi Udara Publik',
      lng: 104.748,
      lat: -2.982
    },

    // Ogan Ilir
    {
      nama: 'Gedung Serbaguna Kampus Unsri Indralaya',
      alamat: 'Jl. Raya Palembang-Prabumulih KM 32, Indralaya, Ogan Ilir',
      fasilitas: 'Aula Besar Ber-AC & Pusat Evakuasi Udara Bersih Mahasiswa dan Warga',
      lng: 104.652,
      lat: -3.226
    },
    {
      nama: 'RSUD Ogan Ilir (Tanjung Senai)',
      alamat: 'Kompleks Perkantoran Terpadu Tanjung Senai, Indralaya',
      fasilitas: 'IGD Ber-AC Siaga Bencana Karhutla & Fasilitas Terapi Oksigen',
      lng: 104.661,
      lat: -3.238
    },
    {
      nama: 'Puskesmas Rawat Inap Pemulutan',
      alamat: 'Jl. Raya Palembang-Kayuagung KM 15, Pemulutan',
      fasilitas: 'Ruang Tindakan Ber-AC & Pasokan Masker Medis / Tabung O2',
      lng: 104.721,
      lat: -3.125
    },

    // OKI
    {
      nama: 'RSUD Kayuagung Kab. OKI',
      alamat: 'Jl. Lintas Timur Lampung-Palembang, Kota Kayuagung, OKI',
      fasilitas: 'RS Rujukan Episentrum Karhutla, Ruang Isolasi Ber-AC & Oksigenasi Sentral',
      lng: 104.845,
      lat: -3.398
    },
    {
      nama: 'Puskesmas Cengal OKI',
      alamat: 'Jl. Raya Cengal No. 12, OKI',
      fasilitas: 'Posko Kesehatan Tanggap Bencana Asap Ber-AC & Oksigen Konsentrator',
      lng: 105.155,
      lat: -3.355
    },

    // Banyuasin
    {
      nama: 'RSUD Banyuasin',
      alamat: 'Jl. Palembang-Betung KM 42, Pangkalan Balai, Banyuasin',
      fasilitas: 'Ruang Gawat Darurat & Rawat Inap Ber-AC Khusus Gangguan Pernapasan',
      lng: 104.382,
      lat: -2.888
    },
    {
      nama: 'Puskesmas Sukajadi Banyuasin',
      alamat: 'Jl. Lintas Palembang-Betung KM 14, Sukajadi',
      fasilitas: 'Klinik Ber-AC, Ruang Oksigen & Distribusi Masker KF94',
      lng: 104.675,
      lat: -2.918
    },

    // Musi Banyuasin (Muba)
    {
      nama: 'RSUD Sekayu Muba',
      alamat: 'Jl. Kolonel Wahid Udin, Sekayu, Musi Banyuasin',
      fasilitas: 'RSUD Rujukan Unggulan Ber-AC dengan Fasilitas Paru Modern',
      lng: 103.845,
      lat: -2.895
    },

    // Muara Enim
    {
      nama: 'RSUD Dr. H. M. Rabain Muara Enim',
      alamat: 'Jl. Sultan Mahmud Badaruddin II No. 49, Muara Enim',
      fasilitas: 'IGD Respirasi Ber-AC & Ruang Terapi Inhalasi',
      lng: 103.795,
      lat: -3.652
    },
    {
      nama: 'RS Bukit Asam Medika Tanjung Enim',
      alamat: 'Jl. Raya Bukit Asam No. 1, Tanjung Enim',
      fasilitas: 'Fasilitas Kesehatan Ber-AC & Perlindungan Bahaya Debu/Asap Tambang',
      lng: 103.815,
      lat: -3.755
    },

    // Prabumulih
    {
      nama: 'RSUD Kota Prabumulih',
      alamat: 'Jl. Lingkar Timur, Kel. Gunung Ibul, Prabumulih',
      fasilitas: 'RSUD Tipe B Ber-AC dengan Ruang Rawat Paru & Oksigen Medis',
      lng: 104.245,
      lat: -3.442
    },

    // PALI
    {
      nama: 'RSUD Talang Ubi PALI',
      alamat: 'Jl. Pendopo-Talang Ubi, Handayani Mulya, PALI',
      fasilitas: 'Pusat Rujukan ISPA Ber-AC Kabupaten PALI',
      lng: 103.875,
      lat: -3.315
    },

    // Lahat
    {
      nama: 'RSUD Lahat',
      alamat: 'Jl. Letjen Harun Sohar No. 28, Lahat',
      fasilitas: 'Ruang Rawat Inap Ber-AC & Fasilitas Pengobatan Gangguan Paru',
      lng: 103.542,
      lat: -3.798
    },

    // Pagar Alam
    {
      nama: 'RSUD Besemah Kota Pagar Alam',
      alamat: 'Jl. Alamsyah Ratu Prawiranegara, Pagar Alam',
      fasilitas: 'RSUD Udara Sejuk Ber-AC dengan Layanan Gawat Darurat 24 Jam',
      lng: 103.245,
      lat: -4.045
    },

    // Lubuklinggau
    {
      nama: 'RSUD Siti Aisyah Kota Lubuklinggau',
      alamat: 'Jl. Lapter Silampari No. 1, Lubuklinggau',
      fasilitas: 'RS Rujukan Regional Sumsel Barat Ber-AC & Ruang Oksigenasi',
      lng: 102.875,
      lat: -3.298
    },

    // OKU (Baturaja)
    {
      nama: 'RSUD Dr. Ibnu Sutowo Baturaja',
      alamat: 'Jl. Dr. Moh. Hatta No. 1, Baturaja, OKU',
      fasilitas: 'RSUD Rujukan OKU Raya Ber-AC & Instalasi Gawat Darurat Lengkap',
      lng: 104.175,
      lat: -4.135
    },

    // OKU Timur
    {
      nama: 'RSUD Martapura OKU Timur',
      alamat: 'Jl. Tebat Sari, Martapura, OKU Timur',
      fasilitas: 'Fasilitas Shelter Udara Bersih & Klinik Pengobatan ISPA',
      lng: 104.352,
      lat: -4.332
    },

    // OKU Selatan
    {
      nama: 'RSUD Muaradua OKU Selatan',
      alamat: 'Jl. Raya Muaradua-Ranau KM 5, Muaradua',
      fasilitas: 'RSUD Ber-AC di Kawasan Wisata Ranau & Layanan Medis Siaga',
      lng: 104.112,
      lat: -4.535
    }
  ];

  for (const sh of shelters) {
    await prisma.$executeRaw`
      INSERT INTO clean_shelters (nama_tempat, alamat, fasilitas, location)
      VALUES (${sh.nama}, ${sh.alamat}, ${sh.fasilitas}, ST_SetSRID(ST_MakePoint(${sh.lng}, ${sh.lat}), 4326));
    `;
  }
  console.log(`✅ ${shelters.length} Fasilitas Clean Air Shelter Resmi se-Sumsel berhasil di-seed.`);

  // 4. Baseline Stasiun Pemantau Udara Darat
  const stasiuns = [
    {
      source_id: 'waqi:14904',
      nama: 'Stasiun Musi 2 Palembang',
      lng: 104.720,
      lat: -3.031,
      ispu: 165,
      pm25: 58.4
    },
    {
      source_id: 'waqi:14903',
      nama: 'Stasiun BMKG Talang Betutu Palembang',
      lng: 104.700,
      lat: -2.940,
      ispu: 148,
      pm25: 52.1
    },
    {
      source_id: 'waqi:plb_jakabaring',
      nama: 'Stasiun Jakabaring Sport City',
      lng: 104.789,
      lat: -3.018,
      ispu: 152,
      pm25: 54.0
    },
    {
      source_id: 'waqi:oi_indralaya',
      nama: 'Stasiun Pemkab Ogan Ilir - Indralaya',
      lng: 104.651,
      lat: -3.224,
      ispu: 188,
      pm25: 68.2
    },
    {
      source_id: 'waqi:oki_kayuagung',
      nama: 'Stasiun Pemantau OKI - Kayuagung',
      lng: 104.845,
      lat: -3.395,
      ispu: 210,
      pm25: 84.5
    },
    {
      source_id: 'waqi:banyuasin_pangkalan',
      nama: 'Stasiun Banyuasin - Pangkalan Balai',
      lng: 104.382,
      lat: -2.887,
      ispu: 135,
      pm25: 46.8
    },
    {
      source_id: 'waqi:muara_enim',
      nama: 'Stasiun Tanjung Enim Muara Enim',
      lng: 103.801,
      lat: -3.738,
      ispu: 115,
      pm25: 39.5
    },
    {
      source_id: 'waqi:prabumulih',
      nama: 'Stasiun Udara Kota Prabumulih',
      lng: 104.240,
      lat: -3.440,
      ispu: 142,
      pm25: 49.0
    }
  ];

  for (const s of stasiuns) {
    await prisma.$executeRaw`
      INSERT INTO stasiun_ispu (source_id, nama_stasiun, location, ispu_val, pm25_val, last_synced)
      VALUES (${s.source_id}, ${s.nama}, ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326), ${s.ispu}, ${s.pm25}, NOW());
    `;
  }
  console.log(`✅ ${stasiuns.length} Stasiun Pemantau ISPU berhasil di-seed.`);

  // 5. Titik Api Satelit NASA FIRMS
  const hotspots = [
    {
      lat: -3.385,
      lng: 105.124,
      frp: 78.5,
      confidence: 'high'
    },
    {
      lat: -3.211,
      lng: 104.982,
      frp: 45.0,
      confidence: 'nominal'
    },
    {
      lat: -2.854,
      lng: 104.298,
      frp: 92.4,
      confidence: 'high'
    },
    {
      lat: -3.021,
      lng: 104.835,
      frp: 28.0,
      confidence: 'nominal'
    }
  ];

  for (const h of hotspots) {
    await prisma.$executeRaw`
      INSERT INTO active_hotspots (latitude, longitude, frp, confidence, acquired_at, location)
      VALUES (${h.lat}, ${h.lng}, ${h.frp}, ${h.confidence}, NOW(), ST_SetSRID(ST_MakePoint(${h.lng}, ${h.lat}), 4326));
    `;
  }
  console.log(`✅ ${hotspots.length} Titik Api Satelit NASA FIRMS berhasil di-seed.`);

  // 6. Log ISPU & AI Advisory Awal untuk Seluruh 3.264 Kelurahan
  console.log('📊 Menghasilkan log ISPU & Citizen Health Sensing awal untuk 3.264 kelurahan...');
  await prisma.$executeRawUnsafe(`
    INSERT INTO log_ispu_kelurahan (kelurahan_id, ispu_score, kategori, primary_pollutant, advisory_text, hotspot_detected, calculated_at)
    SELECT 
      id,
      CASE 
        WHEN nama_kelurahan ILIKE '%Gambut%' OR nama_kelurahan ILIKE '%OKI%' OR nama_kelurahan ILIKE '%Plaju%' OR nama_kelurahan ILIKE '%Kertapati%' THEN 168
        ELSE 85
      END,
      CASE 
        WHEN nama_kelurahan ILIKE '%Gambut%' OR nama_kelurahan ILIKE '%OKI%' OR nama_kelurahan ILIKE '%Plaju%' OR nama_kelurahan ILIKE '%Kertapati%' THEN 'Tidak Sehat'
        ELSE 'Sedang'
      END,
      'PM2.5',
      CASE 
        WHEN nama_kelurahan ILIKE '%Gambut%' OR nama_kelurahan ILIKE '%OKI%' OR nama_kelurahan ILIKE '%Plaju%' OR nama_kelurahan ILIKE '%Kertapati%' 
        THEN 'Kualitas udara di wilayah ' || nama_kelurahan || ' berada pada kategori TIDAK SEHAT (ISPU 168). Warga disarankan mengenakan masker N95/KF94 saat beraktivitas di luar ruangan dan manfaatkan shelter ber-AC terdekat jika mengalami sesak napas.'
        ELSE 'Kualitas udara di wilayah ' || nama_kelurahan || ' berada pada kategori SEDANG (ISPU 85). Udara dapat diterima untuk aktivitas normal dengan tetap menjaga hidrasi tubuh.'
      END,
      CASE 
        WHEN nama_kelurahan ILIKE '%Gambut%' OR nama_kelurahan ILIKE '%OKI%' OR nama_kelurahan ILIKE '%Plaju%' OR nama_kelurahan ILIKE '%Kertapati%' THEN TRUE
        ELSE FALSE
      END,
      NOW()
    FROM kelurahan;
  `);

  // 7. Citizen Symptom Summary
  await prisma.$executeRawUnsafe(`
    INSERT INTO kelurahan_symptom_summary (kelurahan_id, tanggal, count_batuk, count_mata_perih, count_sesak, count_normal, total_laporan)
    SELECT id, CURRENT_DATE, 8, 14, 5, 12, 39
    FROM kelurahan;
  `);

  console.log(`✅ Log ISPU & Ringkasan Gejala Warga (Citizen Sensing) berhasil di-seed untuk 3.264 kelurahan!`);
  console.log('🎉 Seeding 100% Seluruh 3.264 Desa/Kelurahan Resmi se-Sumatera Selatan SELESAI DENGAN SUKSES!');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
