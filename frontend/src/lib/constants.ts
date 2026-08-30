import { IspuCategory, SymptomType } from './types';

/**
 * Koordinat default pusat peta (Kota Palembang, Sumatera Selatan)
 */
export const DEFAULT_MAP_CENTER: [number, number] = [-2.985, 104.755];
export const DEFAULT_MAP_ZOOM = 12;

/**
 * Konfigurasi kategori dan warna resmi ISPU (Standar KLHK)
 */
export interface IspuCategoryConfig {
  kategori: IspuCategory;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeClass: string;
  description: string;
}

export const ISPU_CATEGORIES: Record<IspuCategory, IspuCategoryConfig> = {
  Baik: {
    kategori: 'Baik',
    min: 0,
    max: 50,
    color: '#10B981',
    bgColor: '#ECFDF5',
    textColor: '#065F46',
    borderColor: '#A7F3D0',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description:
      'Tingkat kualitas udara sangat baik, tidak memberikan efek negatif terhadap manusia maupun lingkungan.'
  },
  Sedang: {
    kategori: 'Sedang',
    min: 51,
    max: 100,
    color: '#FBBF24',
    bgColor: '#FFFBEB',
    textColor: '#92400E',
    borderColor: '#FDE68A',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description:
      'Kualitas udara masih dapat diterima, namun kelompok rentan disarankan mengurangi aktivitas luar ruang yang berat.'
  },
  'Tidak Sehat': {
    kategori: 'Tidak Sehat',
    min: 101,
    max: 200,
    color: '#EF4444',
    bgColor: '#FEF2F2',
    textColor: '#991B1B',
    borderColor: '#FECACA',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    description:
      'Kualitas udara bersifat merugikan pada manusia, hewan, dan tumbuhan. Warga wajib memakai masker saat di luar.'
  },
  'Sangat Tidak Sehat': {
    kategori: 'Sangat Tidak Sehat',
    min: 201,
    max: 300,
    color: '#8F3F97',
    bgColor: '#FAF5FF',
    textColor: '#6B21A8',
    borderColor: '#E9D5FF',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description:
      'Tingkat kualitas udara yang dapat meningkatkan sensitivitas pada penderita asma dan risiko gangguan pernapasan massal.'
  },
  Berbahaya: {
    kategori: 'Berbahaya',
    min: 301,
    max: 500,
    color: '#7E0023',
    bgColor: '#FFF1F2',
    textColor: '#881337',
    borderColor: '#FECDD3',
    badgeClass: 'bg-rose-950 text-rose-100 border-rose-800',
    description:
      'Kondisi udara sangat berbahaya bagi seluruh populasi! Hindari semua aktivitas di luar ruang dan evakuasi ke shelter.'
  }
};

/**
 * Pilihan opsi gejala untuk Citizen Health Sensing (1-klik)
 */
export interface SymptomOption {
  id: SymptomType;
  label: string;
  sublabel: string;
  iconName: string;
  colorClass: string;
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: 'mata_perih',
    label: 'Mata Perih',
    sublabel: 'Iritasi asap / debu',
    iconName: 'Eye',
    colorClass: 'hover:border-amber-400 hover:bg-amber-50/70 text-amber-900'
  },
  {
    id: 'batuk',
    label: 'Batuk / Tenggorokan',
    sublabel: 'Gatal & kering',
    iconName: 'Activity',
    colorClass: 'hover:border-rose-400 hover:bg-rose-50/70 text-rose-900'
  },
  {
    id: 'sesak',
    label: 'Sesak Napas',
    sublabel: 'Sulit bernapas lega',
    iconName: 'HeartPulse',
    colorClass: 'hover:border-purple-400 hover:bg-purple-50/70 text-purple-900'
  },
  {
    id: 'normal',
    label: 'Kondisi Normal',
    sublabel: 'Bernapas segar & aman',
    iconName: 'Smile',
    colorClass: 'hover:border-emerald-400 hover:bg-emerald-50/70 text-emerald-900'
  }
];

/**
 * Helper untuk mendapatkan badge config berdasarkan skor ISPU
 */
export function getIspuCategoryByScore(score: number): IspuCategoryConfig {
  if (score <= 50) return ISPU_CATEGORIES['Baik'];
  if (score <= 100) return ISPU_CATEGORIES['Sedang'];
  if (score <= 200) return ISPU_CATEGORIES['Tidak Sehat'];
  if (score <= 300) return ISPU_CATEGORIES['Sangat Tidak Sehat'];
  return ISPU_CATEGORIES['Berbahaya'];
}
