import React from 'react';
import { Shield } from 'lucide-react';
import MapContainerWrapper from '@/components/map/MapContainer';
import LocationSelector from '@/components/location/LocationSelector';
import GpsButton from '@/components/location/GpsButton';
import MapLayerControls from '@/components/map/MapLayerControls';
import ZoomControls from '@/components/map/ZoomControls';
import BottomSheetPanel from '@/components/layout/BottomSheetPanel';

export default function HomePage() {
  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#FBFBFA]">
      {/* ========================================================= */}
      {/* TOP FLOATING BAR (RESPONSIVE)                            */}
      {/* ========================================================= */}
      <header className="absolute top-4 left-4 right-4 lg:left-6 lg:right-6 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Brand Pill (Left Side, aligned with sidebar on desktop) */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-950/10 bg-white/90 px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-md backdrop-blur-md pointer-events-auto">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#1B4332] text-white shadow-inner shrink-0">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-[#143628] leading-none sm:leading-tight">
              AeroHealth Guard
            </h1>
            <p className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:block">
              Hyperlocal Air Quality & Health Sensing
            </p>
          </div>
        </div>

        {/* Desktop Header Controls (Wilayah Aktif + 1:1 GPS + 1:1 Layer + Zoom) */}
        <div className="hidden lg:flex items-center gap-2 pointer-events-auto">
          <LocationSelector />
          <GpsButton />
          <MapLayerControls />
        </div>

        {/* Mobile Header Right (Wilayah Aktif directly beside brand) */}
        <div className="lg:hidden flex items-center pointer-events-auto">
          <LocationSelector />
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE FLOATING ACTION BUTTONS (Beneath Wilayah Aktif)   */}
      {/* ========================================================= */}
      <div className="lg:hidden absolute top-18 right-4 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        {/* 1. GPS Auto-Detect Button (1:1) */}
        <GpsButton />

        {/* 2. Collapsible Map Layer Controls (1:1) */}
        <MapLayerControls />

        {/* 3. Custom Zoom Controls (1:1 Zoom In & Zoom Out) */}
        <ZoomControls />
      </div>

      {/* Desktop Zoom Controls (Bottom Right) */}
      <div className="hidden lg:block absolute bottom-6 right-6 z-20 pointer-events-auto">
        <ZoomControls />
      </div>

      {/* ========================================================= */}
      {/* FULL-SCREEN INTERACTIVE LEAFLET MAP                      */}
      {/* ========================================================= */}
      <div className="relative flex-1 h-full w-full">
        <MapContainerWrapper />
      </div>

      {/* ========================================================= */}
      {/* FLOATING RESPONSIVE CONTENT PANEL (DESKTOP / MOBILE)     */}
      {/* ========================================================= */}
      <BottomSheetPanel />
    </main>
  );
}
