'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useApp } from '@/context/AppContext';

/**
 * Controller to synchronize Leaflet map viewport with AppContext state
 */
export default function MapViewController() {
  const map = useMap();
  const { mapCenter, mapZoom } = useApp();

  useEffect(() => {
    if (mapCenter) {
      map.flyTo(mapCenter, mapZoom, {
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
  }, [map, mapCenter, mapZoom]);

  return null;
}
