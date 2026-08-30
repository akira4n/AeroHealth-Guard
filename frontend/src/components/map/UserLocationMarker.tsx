'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function createUserLocationIcon() {
  const html = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(16, 185, 129, 0.4); animation: pulse-ring 2.5s infinite;"></div>
      <div style="position: relative; width: 18px; height: 18px; border-radius: 9999px; background-color: #10B981; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-location-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
}

export default function UserLocationMarker() {
  const { userCoords } = useApp();

  if (!userCoords) {
    return null;
  }

  return (
    <Marker position={[userCoords.lat, userCoords.lng]} icon={createUserLocationIcon()}>
      <Popup className="custom-leaflet-popup">
        <div className="p-1 text-center">
          <div className="flex items-center justify-center gap-1 font-bold text-xs text-[#143628] mb-0.5">
            <Navigation className="h-3.5 w-3.5 text-emerald-600" />
            <span>Lokasi Anda Terdeteksi</span>
          </div>
          <p className="text-[10px] text-gray-500">
            {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}
