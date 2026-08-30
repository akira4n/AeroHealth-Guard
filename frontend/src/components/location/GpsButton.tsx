'use client';

import React from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function GpsButton() {
  const { isLoadingLocation, detectUserLocation } = useApp();

  return (
    <button
      type="button"
      onClick={detectUserLocation}
      disabled={isLoadingLocation}
      className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-emerald-950/10 bg-white/90 shadow-md backdrop-blur-md transition-all hover:bg-emerald-50/80 active:scale-95 disabled:opacity-60 cursor-pointer pointer-events-auto"
      title="Deteksi lokasi saya saat ini via GPS"
    >
      {isLoadingLocation ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#1B4332]" />
      ) : (
        <Navigation className="h-5 w-5 text-[#1B4332]" />
      )}
    </button>
  );
}
