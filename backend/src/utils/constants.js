/**
 * ISPU Standard Categories (KLHK) & Constants
 */

const ISPU_CATEGORIES = {
  BAIK: {
    name: 'Baik',
    min: 0,
    max: 50,
    color: '#00E400',
    description:
      'Tingkat kualitas udara yang sangat baik, tidak memberikan efek negatif terhadap manusia, hewan, dan tumbuhan.'
  },
  SEDANG: {
    name: 'Sedang',
    min: 51,
    max: 100,
    color: '#FFFF00',
    description:
      'Tingkat kualitas udara masih dapat diterima pada kesehatan manusia, hewan, dan tumbuhan.'
  },
  TIDAK_SEHAT: {
    name: 'Tidak Sehat',
    min: 101,
    max: 200,
    color: '#FF0000',
    description: 'Tingkat kualitas udara yang bersifat merugikan pada manusia, hewan, dan tumbuhan.'
  },
  SANGAT_TIDAK_SEHAT: {
    name: 'Sangat Tidak Sehat',
    min: 201,
    max: 300,
    color: '#8F3F97',
    description:
      'Tingkat kualitas udara yang dapat meningkatkan resiko kesehatan pada sejumlah segmen populasi yang terpapar.'
  },
  BERBAHAYA: {
    name: 'Berbahaya',
    min: 301,
    max: 500,
    color: '#7E0023',
    description:
      'Tingkat kualitas udara yang dapat merugikan kesehatan serius pada populasi secara menyeluruh.'
  }
};

const KLHK_FALLBACK_ADVISORY = {
  Baik: 'Kualitas udara baik. Nikmati aktivitas di luar ruangan dengan leluasa. Tetap jaga kebersihan lingkungan.',
  Sedang:
    'Kualitas udara dapat diterima. Kelompok sensitif (anak-anak, lansia, penderita asma) disarankan mengurangi aktivitas fisik berat di luar ruangan jika mulai merasakan gejala.',
  'Tidak Sehat':
    'Kualitas udara tidak sehat. Kurangi aktivitas luar ruangan yang berkepanjangan. Gunakan masker standar (N95/KF94) bila harus beraktivitas di luar, dan tutup ventilasi rumah.',
  'Sangat Tidak Sehat':
    'Kualitas udara sangat tidak sehat! Hindari semua aktivitas fisik di luar ruangan. Seluruh warga wajib mengenakan masker penyaring partikel. Manfaatkan Clean Air Shelter terdekat jika diperlukan.',
  Berbahaya:
    'DARURAT KUALITAS UDARA! Bahaya serius bagi seluruh populasi. Tetap di dalam ruangan berfilter udara atau segera evakuasi ke Clean Air Shelter terdekat yang ber-AC.'
};

const SYMPTOM_TYPES = ['batuk', 'mata_perih', 'sesak', 'normal'];

module.exports = {
  ISPU_CATEGORIES,
  KLHK_FALLBACK_ADVISORY,
  SYMPTOM_TYPES
};
