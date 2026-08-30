'use client';

import React, { useEffect, useState } from 'react';
import { Users, TrendingUp, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getSymptomKelurahan } from '@/lib/api';
import { SymptomKelurahanResponse } from '@/lib/types';

export default function CommunityStats({ refreshKey }: { refreshKey?: number }) {
  const { selectedKelurahan } = useApp();
  const kelurahanId = selectedKelurahan?.id;

  const [stats, setStats] = useState<SymptomKelurahanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!kelurahanId) return;
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getSymptomKelurahan(kelurahanId as number);
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        console.error('[CommunityStats Error]', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [kelurahanId, refreshKey]);

  if (isLoading || !stats) {
    return (
      <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
          <span>Memuat wawasan komunitas...</span>
        </div>
      </div>
    );
  }

  const { summary, percentages, community_insight } = stats;

  return (
    <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#2D6A4F]" />
          <h3 className="font-bold text-sm text-[#143628]">Wawasan Kesehatan Komunitas</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <TrendingUp className="h-3 w-3" />
          <span>Real-Time</span>
        </div>
      </div>

      {/* Community Insight Phrase Banner */}
      <div className="p-3.5 rounded-2xl bg-[#F4F6F0] border border-emerald-950/5 text-xs font-medium text-[#1A2E26] leading-relaxed">
        {community_insight}
      </div>

      {/* Symptoms Percentage Breakdown */}
      <div className="space-y-2.5 text-xs">
        {/* Mata Perih */}
        <div>
          <div className="flex justify-between font-semibold mb-1 text-gray-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Mata Perih
            </span>
            <span className="text-amber-700">
              {percentages.mata_perih_pct}% ({summary.count_mata_perih})
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${percentages.mata_perih_pct}%` }}
            />
          </div>
        </div>

        {/* Batuk */}
        <div>
          <div className="flex justify-between font-semibold mb-1 text-gray-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Batuk / Tenggorokan
            </span>
            <span className="text-rose-700">
              {percentages.batuk_pct}% ({summary.count_batuk})
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${percentages.batuk_pct}%` }}
            />
          </div>
        </div>

        {/* Sesak Napas */}
        <div>
          <div className="flex justify-between font-semibold mb-1 text-gray-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> Sesak Napas
            </span>
            <span className="text-purple-700">
              {percentages.sesak_pct}% ({summary.count_sesak})
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${percentages.sesak_pct}%` }}
            />
          </div>
        </div>

        {/* Normal */}
        <div>
          <div className="flex justify-between font-semibold mb-1 text-gray-700">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Kondisi Normal
            </span>
            <span className="text-emerald-700">
              {percentages.normal_pct}% ({summary.count_normal})
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percentages.normal_pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Total Reports */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
        <span>Total partisipasi warga hari ini:</span>
        <strong className="text-gray-700 font-bold">{summary.total_laporan} Laporan</strong>
      </div>
    </div>
  );
}
