'use client';

import { useState, useCallback } from 'react';

export interface GeolocationCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface UseGeolocationReturn {
  coords: GeolocationCoords | null;
  isLocating: boolean;
  error: string | null;
  getLocation: () => Promise<GeolocationCoords | null>;
}

/**
 * Custom hook untuk mengakses HTML5 Geolocation API dengan penanganan error dan fallback
 */
export function useGeolocation(): UseGeolocationReturn {
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback((): Promise<GeolocationCoords | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const errorMsg = 'Peramban Anda tidak mendukung fitur Geolocation GPS.';
        setError(errorMsg);
        resolve(null);
        return;
      }

      setIsLocating(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: GeolocationCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCoords(newCoords);
          setIsLocating(false);
          setError(null);
          resolve(newCoords);
        },
        (err) => {
          setIsLocating(false);
          let errorMsg = 'Gagal mendeteksi lokasi GPS.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Izin akses lokasi ditolak. Silakan pilih wilayah secara manual.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Informasi lokasi perangkat tidak tersedia saat ini.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Waktu permintaan lokasi GPS habis. Silakan coba lagi.';
              break;
          }
          setError(errorMsg);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  return {
    coords,
    isLocating,
    error,
    getLocation
  };
}
