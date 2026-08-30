'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook untuk mengelola state yang tersinkronisasi dengan browser localStorage
 * Menggunakan lazy initializer sehingga aman dari SSR error dan cascading render.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Gagal membaca key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((current) => {
          const valueToStore = value instanceof Function ? value(current) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`[useLocalStorage] Gagal menyimpan key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Helper hook khusus untuk proteksi spam pelaporan gejala 1-klik warga (1 kali per hari per kelurahan)
 * Memastikan prinsip Zero PII tanpa melacak identitas warga.
 */
export function useSymptomReportCooldown(kelurahanId?: number) {
  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = kelurahanId ? `aerohealth_report_${kelurahanId}_${todayStr}` : null;

  const [hasReportedToday, setHasReportedToday] = useState<boolean>(() => {
    if (!storageKey || typeof window === 'undefined') return false;
    try {
      const existing = window.localStorage.getItem(storageKey);
      return Boolean(existing);
    } catch {
      return false;
    }
  });

  const markAsReported = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ reported_at: new Date().toISOString() })
      );
      setHasReportedToday(true);
    } catch (error) {
      console.warn('Gagal mencatat cooldown di localStorage:', error);
    }
  }, [storageKey]);

  return {
    hasReportedToday,
    markAsReported
  };
}
