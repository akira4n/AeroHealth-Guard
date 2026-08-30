'use client';

import React, { useState } from 'react';
import { Eye, Activity, HeartPulse, Smile, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useSymptomReportCooldown } from '@/hooks/useLocalStorage';
import { reportSymptom } from '@/lib/api';
import { SymptomType } from '@/lib/types';
import { SYMPTOM_OPTIONS } from '@/lib/constants';

const ICON_MAP = {
  Eye: Eye,
  Activity: Activity,
  HeartPulse: HeartPulse,
  Smile: Smile
};

export default function SymptomWidget({ onReportSuccess }: { onReportSuccess?: () => void }) {
  const { selectedKelurahan } = useApp();
  const kelurahanId = selectedKelurahan?.id;

  const { hasReportedToday, markAsReported } = useSymptomReportCooldown(kelurahanId);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedChoice, setSelectedChoice] = useState<SymptomType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReport = async (symptom: SymptomType) => {
    if (!kelurahanId || hasReportedToday || isSubmitting) return;

    setIsSubmitting(true);
    setSelectedChoice(symptom);

    try {
      await reportSymptom(kelurahanId, symptom);
      markAsReported();
      setSuccessMessage('Laporan Anda berhasil dicatat secara anonim!');
      if (onReportSuccess) {
        onReportSuccess();
      }
    } catch (err) {
      console.error('[handleReport Error]', err);
      alert('Gagal mengirimkan laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasReportedToday) {
    return (
      <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-950">
          <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-xs">Terima Kasih atas Partisipasi Anda!</h4>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Laporan kondisi fisik harian Anda untuk {selectedKelurahan?.nama_kelurahan} telah
              tersimpan. Data Anda membantu validasi kualitas udara warga.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-emerald-950/10 bg-white/95 p-5 shadow-lg backdrop-blur-md space-y-4">
      {/* Widget Header */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Activity className="h-4 w-4 text-[#2D6A4F]" />
          <h3 className="font-bold text-sm text-[#143628]">Citizen Health Sensing</h3>
        </div>
        <p className="text-xs text-gray-500">
          Bagaimana kondisi fisik yang Anda rasakan di{' '}
          {selectedKelurahan?.nama_kelurahan || 'wilayah ini'} saat ini?
        </p>
      </div>

      {/* 4 Interactive 1-Click Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {SYMPTOM_OPTIONS.map((opt) => {
          const IconComponent = ICON_MAP[opt.iconName as keyof typeof ICON_MAP] || Activity;
          const isSelected = selectedChoice === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleReport(opt.id)}
              disabled={isSubmitting || hasReportedToday}
              className={`flex flex-col items-start p-3 rounded-2xl border transition-all text-left group cursor-pointer active:scale-95 disabled:opacity-50 ${opt.colorClass} bg-white shadow-xs hover:shadow-md`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-white group-hover:shadow-xs transition-colors">
                  <IconComponent className="h-4 w-4" />
                </div>
                {isSubmitting && isSelected && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              <span className="font-bold text-xs text-gray-900 block leading-tight">
                {opt.label}
              </span>
              <span className="text-[10px] text-gray-500 leading-none mt-0.5">{opt.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Zero PII Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 pt-1">
        <Shield className="h-3 w-3 text-emerald-700" />
        <span>1-klik tanpa registrasi & tanpa menyimpan data pribadi (Zero PII).</span>
      </div>
    </div>
  );
}
