'use client';

import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Droplets,
  DoorClosed,
  Footprints
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function AdvisoryCard() {
  const { ispuDetail, setActiveTab } = useApp();

  if (!ispuDetail) {
    return null;
  }

  const isSevere =
    ispuDetail.kategori === 'Tidak Sehat' ||
    ispuDetail.kategori === 'Sangat Tidak Sehat' ||
    ispuDetail.kategori === 'Berbahaya';

  return (
    <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-[#1B4332]">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-sm text-[#143628]">Panduan Mitigasi Kesehatan</h3>
        </div>

        {/* AI Generator Pill */}
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            ispuDetail.is_ai_generated
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {ispuDetail.is_ai_generated ? 'Rekomendasi AI' : 'Standar KLHK'}
        </span>
      </div>

      {/* Narrative Advisory Text */}
      <div className="bg-[#FBFBFA] p-3.5 rounded-2xl border border-[#E5EAE3] text-xs text-[#2D4037] leading-relaxed">
        {ispuDetail.advisory_text}
      </div>

      {/* Actionable Protective Chips */}
      <div>
        <span className="text-[11px] font-bold text-gray-500 block mb-2">
          Langkah Perlindungan Diri:
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/80 text-emerald-950">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
            <span className="text-[11px] font-medium leading-tight">Wajib Masker N95/KF94</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/80 text-emerald-950">
            <DoorClosed className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
            <span className="text-[11px] font-medium leading-tight">Tutup Jendela & Pintu</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/80 text-emerald-950">
            <Footprints className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
            <span className="text-[11px] font-medium leading-tight">Batasi Olahraga Luar</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100/80 text-emerald-950">
            <Droplets className="h-4 w-4 shrink-0 text-[#2D6A4F]" />
            <span className="text-[11px] font-medium leading-tight">Perbanyak Minum Air</span>
          </div>
        </div>
      </div>

      {/* Emergency Evacuation Banner if Severe */}
      {isSevere && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-semibold text-[11px] leading-tight">
              Merasa sesak atau mata perih parah?
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('shelters')}
            className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Cari Shelter →
          </button>
        </div>
      )}
    </div>
  );
}
