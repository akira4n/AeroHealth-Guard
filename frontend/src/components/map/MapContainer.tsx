'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Wind } from 'lucide-react';

/**
 * Dynamic import untuk InteractiveMap dengan opsi SSR dimatikan (ssr: false)
 * Mencegah error "window is not defined" pada runtime Next.js 16
 */
const DynamicInteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F4F6F0]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B4332]/10 text-[#1B4332] animate-bounce">
          <Wind className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#143628]">Memuat Peta Spasial...</h3>
          <p className="text-xs text-gray-500">Menghubungkan data ISPU, satelit & shelter</p>
        </div>
      </div>
    </div>
  )
});

export default function MapContainerWrapper() {
  return <DynamicInteractiveMap />;
}
