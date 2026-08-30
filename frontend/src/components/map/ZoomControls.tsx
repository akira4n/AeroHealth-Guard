'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ZoomControls({ className = '' }: { className?: string }) {
  const { zoomIn, zoomOut, mapZoom } = useApp();

  return (
    <div className={`flex flex-col gap-1.5 pointer-events-auto ${className}`}>
      {/* Zoom In (+) Button */}
      <button
        type="button"
        onClick={zoomIn}
        disabled={mapZoom >= 20}
        className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-emerald-950/10 bg-white/90 shadow-md backdrop-blur-md transition-all hover:bg-emerald-50/80 active:scale-95 disabled:opacity-40 cursor-pointer text-[#143628]"
        title="Perbesar Peta (+)"
        aria-label="Zoom In"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Zoom Out (-) Button */}
      <button
        type="button"
        onClick={zoomOut}
        disabled={mapZoom <= 6}
        className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-emerald-950/10 bg-white/90 shadow-md backdrop-blur-md transition-all hover:bg-emerald-50/80 active:scale-95 disabled:opacity-40 cursor-pointer text-[#143628]"
        title="Perkecil Peta (-)"
        aria-label="Zoom Out"
      >
        <Minus className="h-5 w-5" />
      </button>
    </div>
  );
}
