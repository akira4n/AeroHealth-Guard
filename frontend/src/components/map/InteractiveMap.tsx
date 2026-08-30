'use client';

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { useApp } from '@/context/AppContext';
import MapViewController from './MapViewController';
import KelurahanPolygonLayer from './KelurahanPolygon';
import HotspotMarkerLayer from './HotspotMarker';
import ShelterMarkerLayer from './ShelterMarker';
import UserLocationMarker from './UserLocationMarker';

// Bounding box constraint to keep map focused within Indonesia region
const INDONESIA_BOUNDS: LatLngBoundsExpression = [
  [-12.0, 94.0],
  [7.5, 142.0]
];

export default function InteractiveMap() {
  const { mapCenter, mapZoom } = useApp();

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        minZoom={6}
        maxZoom={20}
        maxBounds={INDONESIA_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        scrollWheelZoom={true}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={20}
        />

        <MapViewController />
        <KelurahanPolygonLayer />
        <HotspotMarkerLayer />
        <ShelterMarkerLayer />
        <UserLocationMarker />
      </MapContainer>
    </div>
  );
}
