'use client';

import React, { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Flame } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getActiveHotspots } from '@/lib/api';
import { HotspotItem } from '@/lib/types';

/**
 * Creates custom HTML DivIcon with SVG Flame icon for NASA FIRMS hotspots
 */
function createHotspotIcon(frp: number) {
  const isHigh = frp >= 100;
  const isMedium = frp >= 30;

  const bgGradient = isHigh
    ? 'linear-gradient(135deg, #DC2626, #7E0023)'
    : isMedium
      ? 'linear-gradient(135deg, #EA580C, #DC2626)'
      : 'linear-gradient(135deg, #F59E0B, #EA580C)';

  const ringColor = isHigh ? '#EF4444' : isMedium ? '#F97316' : '#FBBF24';

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: -4px; border-radius: 9999px; background-color: ${ringColor}40; animation: pulse-ring 2s infinite;"></div>
      <div style="position: relative; width: 28px; height: 28px; border-radius: 9999px; background: ${bgGradient}; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.4); display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF;">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hotspot-div-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
}

export default function HotspotMarkerLayer() {
  const { activeLayers } = useApp();
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadHotspots() {
      try {
        const data = await getActiveHotspots();
        if (isMounted) {
          setHotspots(data.hotspots);
        }
      } catch (err) {
        console.error('[HotspotMarkerLayer Error]', err);
      }
    }
    loadHotspots();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!activeLayers.hotspots || hotspots.length === 0) {
    return null;
  }

  return (
    <>
      {hotspots.map((hs) => (
        <Marker
          key={`hotspot-${hs.id}`}
          position={[hs.latitude, hs.longitude]}
          icon={createHotspotIcon(hs.frp)}
        >
          <Popup className="custom-leaflet-popup">
            <div className="p-1 max-w-[220px]">
              <div className="flex items-center gap-1.5 font-bold text-sm text-rose-950 mb-1">
                <Flame className="h-4 w-4 text-rose-600" />
                <span>Titik Api Satelit (NASA FIRMS)</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Terdeteksi anomali energi panas satelit.</p>

              <div className="space-y-1.5 text-xs bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 mb-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Energi Panas (FRP):</span>
                  <span className="font-bold text-rose-700">{hs.frp} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Intensitas:</span>
                  <span className="font-semibold text-rose-800">{hs.intensity_category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Keyakinan:</span>
                  <span className="font-medium capitalize text-gray-800">{hs.confidence}</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-400">
                Waktu Akuisisi:{' '}
                {new Date(hs.acquired_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}{' '}
                WIB
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
