/**
 * Standar respons API backend
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  errors?: Record<string, unknown>;
}

/**
 * GeoJSON types
 */
export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'Point';
  coordinates: any;
}

export interface CentroidPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Entity Kelurahan
 */
export interface Kelurahan {
  id: number;
  kode_kemendagri: string;
  nama_kelurahan: string;
  nama_kecamatan: string;
  kabupaten_kota: string;
  provinsi?: string;
}

export interface KelurahanDetail extends Kelurahan {
  geometry?: GeoJSONGeometry;
  centroid?: CentroidPoint;
}

export interface LocateResponse {
  is_within_coverage: boolean;
  message?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  kelurahan?: KelurahanDetail;
}

export interface WilayahListResponse {
  level: 'kota' | 'kecamatan' | 'kelurahan';
  total: number;
  items: string[] | Kelurahan[];
}

/**
 * Entity ISPU & Spatial Heatmap
 */
export type IspuCategory = 'Baik' | 'Sedang' | 'Tidak Sehat' | 'Sangat Tidak Sehat' | 'Berbahaya';

export interface IspuFeatureProperties {
  kelurahan_id: number;
  kode_kemendagri: string;
  nama_kelurahan: string;
  nama_kecamatan: string;
  kabupaten_kota: string;
  provinsi?: string;
  ispu_score: number;
  kategori: IspuCategory;
  color: string;
  primary_pollutant: string;
  hotspot_detected: boolean;
  calculated_at: string | null;
  centroid?: CentroidPoint;
}

export interface IspuFeature {
  type: 'Feature';
  id: number;
  properties: IspuFeatureProperties;
  geometry: GeoJSONGeometry;
}

export interface IspuMapFeatureCollection {
  type: 'FeatureCollection';
  total_features: number;
  features: IspuFeature[];
}

export interface IspuDetail {
  id?: number;
  kelurahan_id: number;
  nama_kelurahan: string;
  nama_kecamatan: string;
  kabupaten_kota: string;
  provinsi?: string;
  ispu_score: number;
  kategori: IspuCategory;
  color: string;
  primary_pollutant: string;
  hotspot_detected: boolean;
  advisory_text: string;
  is_ai_generated: boolean;
  calculated_at: string | null;
  geometry?: GeoJSONGeometry;
  centroid?: CentroidPoint;
}

export interface IspuHistoryItem {
  id: number;
  kelurahan_id: number;
  ispu_score: number;
  kategori: IspuCategory;
  primary_pollutant: string;
  hotspot_detected: boolean;
  calculated_at: string;
  color: string;
}

export interface IspuHistoryResponse {
  kelurahan_id: number;
  total: number;
  history: IspuHistoryItem[];
}

/**
 * Entity Hotspot NASA FIRMS
 */
export type FrpIntensityCategory = 'Low' | 'Medium' | 'High';

export interface HotspotItem {
  id: number;
  latitude: number;
  longitude: number;
  coordinates: [number, number]; // [longitude, latitude]
  frp: number;
  intensity_category: FrpIntensityCategory;
  intensity_label: string;
  confidence: 'nominal' | 'high' | string;
  acquired_at: string;
  location?: GeoJSONGeometry;
}

export interface HotspotsListResponse {
  total: number;
  filters_applied: {
    min_frp: number;
    confidence: string;
    limit: number;
  };
  hotspots: HotspotItem[];
}

export interface ThreatAssessment {
  level: 'Normal' | 'Waspada' | 'Siaga' | 'Darurat';
  status_badge: 'success' | 'warning' | 'danger' | 'critical';
  description: string;
}

export interface HotspotStatsResponse {
  summary: {
    total_active_hotspots: number;
    high_intensity_count: number;
    high_confidence_count: number;
    nominal_confidence_count: number;
    max_frp_mw: number;
    avg_frp_mw: number;
    last_satellite_sync: string | null;
  };
  threat_assessment: ThreatAssessment;
}

/**
 * Entity Clean Air Shelter
 */
export interface ShelterItem {
  id: number;
  nama_tempat: string;
  alamat: string;
  fasilitas: string;
  kelurahan_id: number;
  nama_kelurahan?: string;
  nama_kecamatan?: string;
  kabupaten_kota?: string;
  latitude: number;
  longitude: number;
  coordinates: [number, number];
  distance_meters?: number;
  distance_km?: number;
  distance_formatted?: string;
  google_maps_url?: string;
  location?: GeoJSONGeometry;
}

export interface NearbySheltersResponse {
  total: number;
  user_coordinates: {
    latitude: number;
    longitude: number;
  };
  shelters: ShelterItem[];
}

export interface KelurahanSheltersResponse {
  kelurahan_id: number;
  nama_kelurahan: string;
  total: number;
  shelters: ShelterItem[];
}

/**
 * Entity Citizen Health Sensing
 */
export type SymptomType = 'batuk' | 'mata_perih' | 'sesak' | 'normal';

export interface SymptomCountSummary {
  total_laporan: number;
  count_batuk: number;
  count_mata_perih: number;
  count_sesak: number;
  count_normal: number;
}

export interface SymptomPercentages {
  batuk_pct: number;
  mata_perih_pct: number;
  sesak_pct: number;
  normal_pct: number;
}

export interface SymptomKelurahanResponse {
  kelurahan_id: number;
  nama_kelurahan: string;
  nama_kecamatan?: string;
  kabupaten_kota?: string;
  date: string;
  summary: SymptomCountSummary;
  percentages: SymptomPercentages;
  dominant_symptom: string;
  community_insight: string;
}

export interface SymptomReportResponse extends SymptomKelurahanResponse {
  reported_symptom: SymptomType;
}

export interface GlobalSymptomSummaryResponse {
  date: string;
  summary: {
    total_batuk: number;
    total_mata_perih: number;
    total_sesak: number;
    total_normal: number;
    total_laporan: number;
    total_kelurahan_melapor: number;
  };
  percentages: SymptomPercentages;
  dominant_symptom: string;
  community_insight: string;
}
