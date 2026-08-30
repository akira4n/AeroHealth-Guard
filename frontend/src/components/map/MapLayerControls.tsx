'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Layers, Flame, Building2, Map as MapIcon, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function MapLayerControls() {
  const { activeLayers, toggleLayer } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative pointer-events-auto">
      {/* 1:1 Aspect Ratio Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-[#1B4332] text-white border-[#1B4332]'
            : 'bg-white/90 text-[#143628] border-emerald-950/10 hover:bg-emerald-50/80'
        }`}
        title="Pengaturan Layer Peta"
      >
        <Layers className="h-5 w-5" />
      </button>

      {/* Collapsible Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 sm:top-13 z-30 w-56 rounded-2xl border border-emerald-950/10 bg-white/95 p-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-100 mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Layer Peta
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {/* Toggle Poligon ISPU */}
            <button
              type="button"
              onClick={() => toggleLayer('ispuPolygons')}
              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeLayers.ispuPolygons
                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapIcon className="h-3.5 w-3.5 text-[#1B4332]" />
                <span>Kualitas Udara</span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${activeLayers.ispuPolygons ? 'bg-emerald-600' : 'bg-gray-300'}`}
              />
            </button>

            {/* Toggle Hotspots */}
            <button
              type="button"
              onClick={() => toggleLayer('hotspots')}
              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeLayers.hotspots
                  ? 'bg-rose-50 text-rose-950 border border-rose-200'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className="h-3.5 w-3.5 text-rose-600" />
                <span>Titik Api Satelit</span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${activeLayers.hotspots ? 'bg-rose-600' : 'bg-gray-300'}`}
              />
            </button>

            {/* Toggle Shelters */}
            <button
              type="button"
              onClick={() => toggleLayer('shelters')}
              className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeLayers.shelters
                  ? 'bg-teal-50 text-teal-950 border border-teal-200'
                  : 'bg-transparent text-gray-500 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-teal-700" />
                <span>Shelter Bersih</span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${activeLayers.shelters ? 'bg-teal-600' : 'bg-gray-300'}`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
