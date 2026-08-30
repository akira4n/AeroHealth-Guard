import {
  ApiResponse,
  LocateResponse,
  WilayahListResponse,
  KelurahanDetail,
  IspuMapFeatureCollection,
  IspuDetail,
  IspuHistoryResponse,
  HotspotsListResponse,
  HotspotStatsResponse,
  NearbySheltersResponse,
  KelurahanSheltersResponse,
  SymptomType,
  SymptomReportResponse,
  SymptomKelurahanResponse,
  GlobalSymptomSummaryResponse
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const DEFAULT_CACHE_TTL_MS = 30_000; // 30 seconds in-memory cache TTL

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const apiCache = new Map<string, CacheEntry<any>>();

/**
 * Invalidate cached endpoints matching an optional pattern, or clear all
 */
export function invalidateApiCache(pattern?: string): void {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}

/**
 * Generic API fetch helper with automatic 30s in-memory caching for GET requests
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit, skipCache = false): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const isGet = !options?.method || options.method.toUpperCase() === 'GET';

  // Check cache for GET requests
  if (isGet && !skipCache) {
    const cached = apiCache.get(url);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });

    const json: ApiResponse<T> = await res.json();

    if (!res.ok || !json.success) {
      const errorMsg = json.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    // Save to in-memory cache
    if (isGet) {
      apiCache.set(url, {
        data: json.data,
        expiry: Date.now() + DEFAULT_CACHE_TTL_MS
      });
    }

    return json.data;
  } catch (error: any) {
    console.error(`[API Error: ${endpoint}]`, error.message);
    throw error;
  }
}

/**
 * 1. Geolocation & Administrative Boundaries
 */
export async function locateKelurahan(lat: number, lng: number): Promise<LocateResponse> {
  return fetchApi<LocateResponse>(`/kelurahan/locate?lat=${lat}&lng=${lng}`);
}

export async function listWilayah(kota?: string, kecamatan?: string): Promise<WilayahListResponse> {
  const params = new URLSearchParams();
  if (kota) params.append('kota', kota);
  if (kecamatan) params.append('kecamatan', kecamatan);

  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<WilayahListResponse>(`/kelurahan/list${query}`);
}

export async function getKelurahanDetail(id: number): Promise<KelurahanDetail> {
  return fetchApi<KelurahanDetail>(`/kelurahan/${id}`);
}

/**
 * 2. ISPU & Spatial Heatmap
 */
export async function getIspuMap(): Promise<IspuMapFeatureCollection> {
  return fetchApi<IspuMapFeatureCollection>('/ispu/map');
}

export async function getIspuKelurahan(id: number): Promise<IspuDetail> {
  return fetchApi<IspuDetail>(`/ispu/kelurahan/${id}`);
}

export async function getIspuHistory(
  kelurahanId: number,
  limit: number = 24
): Promise<IspuHistoryResponse> {
  return fetchApi<IspuHistoryResponse>(`/ispu/history/${kelurahanId}?limit=${limit}`);
}

/**
 * 3. Active Hotspots NASA FIRMS
 */
export async function getActiveHotspots(filters?: {
  min_frp?: number;
  confidence?: 'all' | 'nominal' | 'high';
  limit?: number;
}): Promise<HotspotsListResponse> {
  const params = new URLSearchParams();
  if (filters?.min_frp !== undefined) params.append('min_frp', filters.min_frp.toString());
  if (filters?.confidence) params.append('confidence', filters.confidence);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<HotspotsListResponse>(`/hotspots/active${query}`);
}

export async function getHotspotStats(): Promise<HotspotStatsResponse> {
  return fetchApi<HotspotStatsResponse>('/hotspots/stats');
}

/**
 * 4. Clean Air Shelter Locator
 */
export async function getNearbyShelters(
  lat: number,
  lng: number,
  limit: number = 5,
  maxDistanceKm?: number
): Promise<NearbySheltersResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    limit: limit.toString()
  });
  if (maxDistanceKm) params.append('max_distance_km', maxDistanceKm.toString());

  return fetchApi<NearbySheltersResponse>(`/shelters/nearby?${params.toString()}`);
}

export async function getSheltersByKelurahan(
  kelurahanId: number
): Promise<KelurahanSheltersResponse> {
  return fetchApi<KelurahanSheltersResponse>(`/shelters/kelurahan/${kelurahanId}`);
}

/**
 * 5. Citizen Health Sensing
 */
export async function reportSymptom(
  kelurahanId: number,
  symptom: SymptomType
): Promise<SymptomReportResponse> {
  const result = await fetchApi<SymptomReportResponse>('/symptoms/report', {
    method: 'POST',
    body: JSON.stringify({
      kelurahan_id: kelurahanId,
      symptom
    })
  });

  // Invalidate symptom cache so updated statistics load immediately
  invalidateApiCache('/symptoms');

  return result;
}

export async function getSymptomKelurahan(
  kelurahanId: number,
  skipCache = false
): Promise<SymptomKelurahanResponse> {
  return fetchApi<SymptomKelurahanResponse>(
    `/symptoms/kelurahan/${kelurahanId}`,
    undefined,
    skipCache
  );
}

export async function getGlobalSymptomSummary(): Promise<GlobalSymptomSummaryResponse> {
  return fetchApi<GlobalSymptomSummaryResponse>('/symptoms/summary');
}
