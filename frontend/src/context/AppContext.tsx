'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode
} from 'react';
import { KelurahanDetail, IspuDetail } from '@/lib/types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants';
import { locateKelurahan, getKelurahanDetail, getIspuKelurahan } from '@/lib/api';
import { useGeolocation, GeolocationCoords } from '@/hooks/useGeolocation';

export type ActiveTab = 'ispu' | 'shelters' | 'symptoms';

export interface MapLayers {
  ispuPolygons: boolean;
  hotspots: boolean;
  shelters: boolean;
}

export interface AppContextType {
  // State
  selectedKelurahan: KelurahanDetail | null;
  ispuDetail: IspuDetail | null;
  userCoords: GeolocationCoords | null;
  isWithinCoverage: boolean;
  coverageMessage: string | null;
  mapCenter: [number, number];
  mapZoom: number;
  activeLayers: MapLayers;
  activeTab: ActiveTab;
  isLoadingLocation: boolean;
  isLoadingIspu: boolean;
  error: string | null;

  // Actions
  selectKelurahanById: (id: number) => Promise<void>;
  detectUserLocation: () => Promise<void>;
  toggleLayer: (layer: keyof MapLayers) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setMapCenterAndZoom: (center: [number, number], zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedKelurahan, setSelectedKelurahan] = useState<KelurahanDetail | null>(null);
  const [ispuDetail, setIspuDetail] = useState<IspuDetail | null>(null);
  const [userCoords, setUserCoords] = useState<GeolocationCoords | null>(null);
  const [isWithinCoverage, setIsWithinCoverage] = useState<boolean>(true);
  const [coverageMessage, setCoverageMessage] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DEFAULT_MAP_ZOOM);
  const [activeLayers, setActiveLayers] = useState<MapLayers>({
    ispuPolygons: true,
    hotspots: true,
    shelters: true
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('ispu');
  const [isLoadingIspu, setIsLoadingIspu] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isLocating, getLocation } = useGeolocation();
  const hasInitializedRef = useRef(false);

  /**
   * Fetch kelurahan spatial boundary and current ISPU estimation
   */
  const selectKelurahanById = useCallback(async (id: number) => {
    setIsLoadingIspu(true);
    setError(null);

    try {
      const [kelurahanData, ispuData] = await Promise.all([
        getKelurahanDetail(id),
        getIspuKelurahan(id)
      ]);

      setSelectedKelurahan(kelurahanData);
      setIspuDetail(ispuData);

      if (kelurahanData.centroid?.coordinates) {
        const [lng, lat] = kelurahanData.centroid.coordinates;
        setMapCenter([lat, lng]);
        setMapZoom(14);
      }
    } catch (err: any) {
      console.error('[selectKelurahanById Error]', err);
      setError(err.message || 'Gagal memuat data kelurahan dan ISPU.');
    } finally {
      setIsLoadingIspu(false);
    }
  }, []);

  /**
   * Detect user GPS coordinates and match with administrative boundaries
   */
  const detectUserLocation = useCallback(async () => {
    setError(null);
    setCoverageMessage(null);

    const coords = await getLocation();
    if (!coords) {
      setSelectedKelurahan((curr) => {
        if (!curr) {
          void selectKelurahanById(1);
        }
        return curr;
      });
      return;
    }

    setUserCoords(coords);

    try {
      const locateResult = await locateKelurahan(coords.lat, coords.lng);

      if (locateResult.is_within_coverage && locateResult.kelurahan) {
        setIsWithinCoverage(true);
        await selectKelurahanById(locateResult.kelurahan.id);
      } else {
        setIsWithinCoverage(false);
        setCoverageMessage(
          locateResult.message ||
            'Lokasi GPS Anda saat ini berada di luar cakupan pilot Sumatera Selatan. Menampilkan wilayah percontohan Palembang.'
        );
        setSelectedKelurahan((curr) => {
          if (!curr) {
            void selectKelurahanById(1);
          }
          return curr;
        });
      }
    } catch (err: any) {
      console.error('[detectUserLocation Error]', err);
      setError('Gagal mencocokkan koordinat dengan basis data wilayah.');
      setSelectedKelurahan((curr) => {
        if (!curr) {
          void selectKelurahanById(1);
        }
        return curr;
      });
    }
  }, [getLocation, selectKelurahanById]);

  /**
   * Toggle map layer visibility
   */
  const toggleLayer = useCallback((layer: keyof MapLayers) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  /**
   * Set map center coordinates and zoom level
   */
  const setMapCenterAndZoom = useCallback((center: [number, number], zoom?: number) => {
    setMapCenter(center);
    if (zoom !== undefined) {
      setMapZoom(zoom);
    }
  }, []);

  /**
   * Zoom In map action
   */
  const zoomIn = useCallback(() => {
    setMapZoom((prev) => Math.min(prev + 1, 20));
  }, []);

  /**
   * Zoom Out map action
   */
  const zoomOut = useCallback(() => {
    setMapZoom((prev) => Math.max(prev - 1, 6));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial mount: Trigger automatic GPS location detection
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initLoad = async () => {
        await detectUserLocation();
      };
      void initLoad();
    }
  }, [detectUserLocation]);

  const value: AppContextType = {
    selectedKelurahan,
    ispuDetail,
    userCoords,
    isWithinCoverage,
    coverageMessage,
    mapCenter,
    mapZoom,
    activeLayers,
    activeTab,
    isLoadingLocation: isLocating,
    isLoadingIspu,
    error,
    selectKelurahanById,
    detectUserLocation,
    toggleLayer,
    setActiveTab,
    setMapCenterAndZoom,
    zoomIn,
    zoomOut,
    clearError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp harus digunakan di dalam komponen <AppProvider>');
  }
  return context;
}
