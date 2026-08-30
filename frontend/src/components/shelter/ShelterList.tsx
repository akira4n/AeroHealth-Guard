'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Navigation, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getNearbyShelters } from '@/lib/api';
import { ShelterItem } from '@/lib/types';
import { DEFAULT_MAP_CENTER } from '@/lib/constants';

export default function ShelterList() {
  const { userCoords, selectedKelurahan } = useApp();
  const [shelters, setShelters] = useState<ShelterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadShelters() {
      setIsLoading(true);
      try {
        const lat = userCoords?.lat || DEFAULT_MAP_CENTER[0];
        const lng = userCoords?.lng || DEFAULT_MAP_CENTER[1];
        const data = await getNearbyShelters(lat, lng, 10);
        if (isMounted) {
          setShelters(data.shelters);
        }
      } catch (err) {
        console.error('[ShelterList Error]', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadShelters();
    return () => {
      isMounted = false;
    };
  }, [userCoords?.lat, userCoords?.lng, selectedKelurahan?.id]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#1B4332]" />
          <span>Mencari fasilitas Clean Air Shelter terdekat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Building2 className="h-4 w-4 text-[#2D6A4F]" />
            <h3 className="font-bold text-sm text-[#143628]">Clean Air Shelter Locator</h3>
          </div>
          <p className="text-xs text-gray-500">
            Tempat penampungan ber-AC & filter udara untuk evakuasi saat kualitas udara buruk.
          </p>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 shrink-0">
          <Building2 className="h-3 w-3" />
          <span>{shelters.length} Lokasi</span>
        </div>
      </div>

      {/* Shelter Cards List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {shelters.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            Tidak ditemukan shelter di sekitar lokasi ini.
          </p>
        ) : (
          shelters.map((shelter) => (
            <div
              key={shelter.id}
              className="p-3.5 rounded-2xl border border-gray-100 bg-[#FBFBFA] hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-2xs space-y-2.5"
            >
              {/* Card Title & Distance Badge */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs text-[#143628] leading-snug">
                  {shelter.nama_tempat}
                </h4>
                {shelter.distance_formatted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#1B4332] text-white px-2 py-0.5 rounded-full shrink-0">
                    <Navigation className="h-2.5 w-2.5" />
                    {shelter.distance_formatted}
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start gap-1.5 text-[11px] text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                <span className="leading-tight">{shelter.alamat}</span>
              </div>

              {/* Facilities Description */}
              <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/70 text-[11px] text-emerald-900">
                <strong className="block font-semibold text-[10px] text-emerald-800 mb-0.5">
                  Fasilitas Udara Bersih:
                </strong>
                <span className="leading-snug block">{shelter.fasilitas}</span>
              </div>

              {/* Direct Google Maps Navigation Button */}
              {shelter.google_maps_url && (
                <a
                  href={shelter.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full bg-[#1B4332] hover:bg-[#143628] active:scale-98 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-xs"
                >
                  <span>Navigasi Rute Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
