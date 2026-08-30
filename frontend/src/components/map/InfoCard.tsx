'use client';

import React from 'react';
import { Wind, Flame, Clock, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getIspuCategoryByScore } from '@/lib/constants';

export default function InfoCard() {
  const { selectedKelurahan, ispuDetail, isLoadingIspu } = useApp();

  if (isLoadingIspu || !selectedKelurahan) {
    return (
      <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center py-8 gap-2 text-xs text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#1B4332]" />
          <span>Memperbarui data kualitas udara...</span>
        </div>
      </div>
    );
  }

  const score = ispuDetail?.ispu_score ?? 0;
  const categoryConfig = getIspuCategoryByScore(score);

  return (
    <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-[#2D6A4F] uppercase tracking-wider block mb-0.5">
            Status Kualitas Udara
          </span>
          <h2 className="text-lg font-extrabold text-[#143628] leading-tight">
            {selectedKelurahan.nama_kelurahan}
          </h2>
          <p className="text-xs text-gray-500">
            Kec. {selectedKelurahan.nama_kecamatan}, {selectedKelurahan.kabupaten_kota}
          </p>
        </div>

        {/* Hotspot Detection Badge */}
        {ispuDetail?.hotspot_detected && (
          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 animate-pulse">
            <Flame className="h-3.5 w-3.5 text-rose-600" />
            <span>Titik Api Aktif</span>
          </div>
        )}
      </div>

      {/* Main ISPU Gauge & Score Card */}
      <div
        className="rounded-2xl p-4 border transition-colors flex items-center justify-between"
        style={{
          backgroundColor: categoryConfig.bgColor,
          borderColor: categoryConfig.borderColor
        }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-600 mb-0.5">
            Indeks Standar Pencemar Udara
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-black tracking-tight"
              style={{ color: categoryConfig.color }}
            >
              {score}
            </span>
            <span className="text-xs font-bold text-gray-500">ISPU</span>
          </div>
          <span className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <Wind className="h-3.5 w-3.5 text-gray-400" />
            Polutan Utama:{' '}
            <strong className="text-gray-700">{ispuDetail?.primary_pollutant || 'PM2.5'}</strong>
          </span>
        </div>

        {/* Category Pill */}
        <div className="text-right">
          <span
            className="inline-block px-3 py-1.5 rounded-xl font-extrabold text-xs tracking-wide shadow-xs"
            style={{
              backgroundColor: categoryConfig.color,
              color: score > 50 && score <= 100 ? '#1A2E26' : '#FFFFFF'
            }}
          >
            {ispuDetail?.kategori || categoryConfig.kategori}
          </span>
        </div>
      </div>

      {/* Short Category Description */}
      <p className="text-xs text-gray-600 leading-relaxed">{categoryConfig.description}</p>

      {/* Footer Timestamp */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Kalkulasi IDW + FIRMS:{' '}
          {ispuDetail?.calculated_at
            ? new Date(ispuDetail.calculated_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              }) + ' WIB'
            : 'Terkini'}
        </span>
        <span className="font-semibold text-emerald-800">Standar KLHK</span>
      </div>
    </div>
  );
}
