'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wind, Building2, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp, ActiveTab } from '@/context/AppContext';
import InfoCard from '@/components/map/InfoCard';
import AdvisoryCard from '@/components/advisory/AdvisoryCard';
import ShelterList from '@/components/shelter/ShelterList';
import SymptomWidget from '@/components/symptoms/SymptomWidget';
import CommunityStats from '@/components/symptoms/CommunityStats';

const MIN_HEIGHT = 76;
const PEEK_HEIGHT = 320;

export default function BottomSheetPanel() {
  const { activeTab, setActiveTab } = useApp();
  const [symptomRefreshKey, setSymptomRefreshKey] = useState<number>(0);

  // Mobile Bottom Sheet State
  const [sheetHeight, setSheetHeight] = useState<number>(PEEK_HEIGHT);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [expandedHeight, setExpandedHeight] = useState<number>(560);

  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(PEEK_HEIGHT);
  const lastYRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  // Calculate dynamic expanded height based on viewport
  useEffect(() => {
    function updateExpandedHeight() {
      if (typeof window !== 'undefined') {
        setExpandedHeight(Math.floor(window.innerHeight * 0.8));
      }
    }
    updateExpandedHeight();
    window.addEventListener('resize', updateExpandedHeight);
    return () => window.removeEventListener('resize', updateExpandedHeight);
  }, []);

  const handleSymptomReportSuccess = () => {
    setSymptomRefreshKey((prev) => prev + 1);
  };

  const tabs: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'ispu', label: 'Kualitas Udara', icon: Wind },
    { id: 'shelters', label: 'Shelter Bersih', icon: Building2 },
    { id: 'symptoms', label: 'Lapor Gejala', icon: Activity }
  ];

  // Snap to a specific target height
  const snapTo = useCallback((targetHeight: number) => {
    setIsDragging(false);
    setSheetHeight(targetHeight);
  }, []);

  // Drag Gesture Physics
  const startDrag = (clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startHeightRef.current = sheetHeight;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  };

  const moveDrag = (clientY: number) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - clientY; // Moving UP increases height
    const newHeight = Math.max(
      MIN_HEIGHT,
      Math.min(expandedHeight, startHeightRef.current + deltaY)
    );

    const now = Date.now();
    const dt = now - lastTimeRef.current;
    if (dt > 10) {
      velocityRef.current = (lastYRef.current - clientY) / dt; // Positive = moving up
      lastYRef.current = clientY;
      lastTimeRef.current = now;
    }

    setSheetHeight(newHeight);
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const v = velocityRef.current;

    // Fast swipe detection
    if (v > 0.4) {
      // Swiped UP quickly
      if (sheetHeight < PEEK_HEIGHT + 20) {
        snapTo(PEEK_HEIGHT);
      } else {
        snapTo(expandedHeight);
      }
      return;
    } else if (v < -0.4) {
      // Swiped DOWN quickly
      if (sheetHeight > PEEK_HEIGHT - 20) {
        snapTo(PEEK_HEIGHT);
      } else {
        snapTo(MIN_HEIGHT);
      }
      return;
    }

    // Distance-based magnetic snapping
    const distMin = Math.abs(sheetHeight - MIN_HEIGHT);
    const distPeek = Math.abs(sheetHeight - PEEK_HEIGHT);
    const distExp = Math.abs(sheetHeight - expandedHeight);

    const minDist = Math.min(distMin, distPeek, distExp);
    if (minDist === distMin) {
      snapTo(MIN_HEIGHT);
    } else if (minDist === distPeek) {
      snapTo(PEEK_HEIGHT);
    } else {
      snapTo(expandedHeight);
    }
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    moveDrag(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  // Mouse Handlers for Desktop/Simulation dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      moveDrag(e.clientY);
    };

    const handleWindowMouseUp = () => {
      endDrag();
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  });

  const toggleExpand = () => {
    if (sheetHeight <= MIN_HEIGHT + 30) {
      snapTo(PEEK_HEIGHT);
    } else if (sheetHeight < expandedHeight - 40) {
      snapTo(expandedHeight);
    } else {
      snapTo(PEEK_HEIGHT);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP FLOATING SIDEBAR (lg and up)                   */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex flex-col absolute top-20 bottom-6 left-6 w-[430px] z-20 rounded-3xl border border-emerald-950/10 bg-white/92 shadow-2xl backdrop-blur-md overflow-hidden pointer-events-auto">
        {/* Top 3-Tab Pill Switcher */}
        <div className="p-3.5 border-b border-gray-100/80 bg-white/60">
          <div className="grid grid-cols-3 gap-1 bg-[#F4F6F0] p-1 rounded-2xl border border-emerald-950/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#1B4332] hover:bg-white/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'ispu' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoCard />
              <AdvisoryCard />
            </div>
          )}

          {activeTab === 'shelters' && (
            <div className="animate-in fade-in duration-200">
              <ShelterList />
            </div>
          )}

          {activeTab === 'symptoms' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <SymptomWidget onReportSuccess={handleSymptomReportSuccess} />
              <CommunityStats refreshKey={symptomRefreshKey} />
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. TRUE FLUID MOBILE BOTTOM SHEET DRAWER (< lg)           */}
      {/* ========================================================= */}
      <div
        style={{
          height: `${sheetHeight}px`,
          transition: isDragging ? 'none' : 'height 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-white/95 border-t border-emerald-950/10 shadow-2xl backdrop-blur-md rounded-t-3xl overflow-hidden pointer-events-auto will-change-[height]"
      >
        {/* Real-time Draggable Handle Header Area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="w-full flex items-center justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing select-none"
          title="Geser ke atas atau ke bawah secara bebas"
        >
          <div className="w-12 h-1.5 rounded-full bg-gray-300 hover:bg-gray-400 active:bg-[#1B4332] transition-colors" />
        </div>

        {/* Tab Switcher Bar (Always accessible in all height states) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="px-3.5 pb-2 flex items-center justify-between gap-2 border-b border-gray-100/80"
        >
          <div className="grid grid-cols-3 gap-1 bg-[#F4F6F0] p-1 rounded-2xl border border-emerald-950/5 flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (sheetHeight <= MIN_HEIGHT + 10) {
                      snapTo(PEEK_HEIGHT);
                    }
                  }}
                  className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#1B4332]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleExpand}
            className="p-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
            title="Ubah ukuran panel"
          >
            {sheetHeight >= expandedHeight - 40 ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Scrollable Mobile Cards Content (Visible when height > MIN_HEIGHT) */}
        <div
          className={`flex-1 overflow-y-auto p-4 space-y-4 transition-opacity duration-200 ${
            sheetHeight <= MIN_HEIGHT + 10 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {activeTab === 'ispu' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <InfoCard />
              <AdvisoryCard />
            </div>
          )}

          {activeTab === 'shelters' && (
            <div className="animate-in fade-in duration-200">
              <ShelterList />
            </div>
          )}

          {activeTab === 'symptoms' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <SymptomWidget onReportSuccess={handleSymptomReportSuccess} />
              <CommunityStats refreshKey={symptomRefreshKey} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
