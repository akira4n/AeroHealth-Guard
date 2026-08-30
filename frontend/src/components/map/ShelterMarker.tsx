'use client';

import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getNearbyShelters } from '@/lib/api';
import { ShelterItem } from '@/lib/types';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

/**
 * Creates custom HTML DivIcon with SVG Building2 icon for Clean Air Shelters
 */
function createShelterIcon() {
  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: linear-gradient(135deg, #1B4332, #2D6A4F); box-shadow: 0 4px 10px rgba(27, 67, 50, 0.35); display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
          <path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-shelter-div-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
}

export default function ShelterMarkerLayer() {
  const { activeLayers, userCoords } = useApp();
  const [shelters, setShelters] = useState<ShelterItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadShelters() {
      try {
        const lat = userCoords?.lat || DEFAULT_MAP_CENTER[0];
        const lng = userCoords?.lng || DEFAULT_MAP_CENTER[1];
        const data = await getNearbyShelters(lat, lng, 10);
        if (isMounted) {
          setShelters(data.shelters);
        }
      } catch (err) {
        console.error('[ShelterMarkerLayer Error]', err);
      }
    }
    loadShelters();
    return () => {
      isMounted = false;
    };
  }, [userCoords?.lat, userCoords?.lng]);

  if (!activeLayers.shelters || shelters.length === 0) {
    return null;
  }

  return (
    <>
      {shelters.map((shelter) => (
        <Marker
          key={`shelter-${shelter.id}`}
          position={[shelter.latitude, shelter.longitude]}
          icon={createShelterIcon()}
        >
          <Popup className="custom-leaflet-popup">
            <div className="p-1 max-w-[240px]">
              <div className="flex items-center gap-1.5 font-bold text-sm text-[#143628] mb-1">
                <Building2 className="h-4 w-4 text-[#1B4332]" />
                <span>Clean Air Shelter</span>
              </div>
              <h4 className="font-bold text-xs text-gray-900 mb-1">{shelter.nama_tempat}</h4>
              <p className="text-[11px] text-gray-500 mb-2 leading-tight">{shelter.alamat}</p>

              <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 text-xs mb-3">
                <span className="font-semibold text-emerald-900 block mb-0.5">
                  Fasilitas Bersih:
                </span>
                <span className="text-emerald-800 text-[11px] leading-snug block">
                  {shelter.fasilitas}
                </span>
                {shelter.distance_formatted && (
                  <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                    Jarak: ~{shelter.distance_formatted}
                  </span>
                )}
              </div>

              {shelter.google_maps_url && (
                <a
                  href={shelter.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-[#1B4332] hover:bg-[#143628] text-white text-xs font-semibold py-1.5 px-3 rounded-xl transition-all shadow-xs text-center"
                >
                  Buka Rute Google Maps →
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
