'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, X, Check, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { listWilayah } from '@/lib/api';
import { Kelurahan } from '@/lib/types';

function subscribe() {
  return () => {};
}

export default function LocationSelector() {
  const { selectedKelurahan, selectKelurahanById } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  // Cascading Selection State
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [kelurahans, setKelurahans] = useState<Kelurahan[]>([]);

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [isLoadingDropdown, setIsLoadingDropdown] = useState<boolean>(false);

  // Load cities on modal open
  useEffect(() => {
    if (!isModalOpen) return;

    let isMounted = true;
    async function loadCities() {
      setIsLoadingDropdown(true);
      try {
        const res = await listWilayah();
        if (isMounted && res.level === 'kota') {
          const cityList = res.items as string[];
          setCities(cityList);
          if (cityList.length > 0 && !selectedCity) {
            setSelectedCity(cityList[0]);
          }
        }
      } catch (err) {
        console.error('[loadCities Error]', err);
      } finally {
        if (isMounted) setIsLoadingDropdown(false);
      }
    }

    void loadCities();
    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedCity]);

  // Load districts when selectedCity changes
  useEffect(() => {
    if (!isModalOpen || !selectedCity) return;

    let isMounted = true;
    async function loadDistricts() {
      setIsLoadingDropdown(true);
      try {
        const res = await listWilayah(selectedCity);
        if (isMounted && res.level === 'kecamatan') {
          const districtList = res.items as string[];
          setDistricts(districtList);
          if (districtList.length > 0) {
            setSelectedDistrict(districtList[0]);
          } else {
            setSelectedDistrict('');
            setKelurahans([]);
          }
        }
      } catch (err) {
        console.error('[loadDistricts Error]', err);
      } finally {
        if (isMounted) setIsLoadingDropdown(false);
      }
    }

    void loadDistricts();
    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedCity]);

  // Load kelurahans when selectedDistrict changes
  useEffect(() => {
    if (!isModalOpen || !selectedCity || !selectedDistrict) return;

    let isMounted = true;
    async function loadKelurahans() {
      setIsLoadingDropdown(true);
      try {
        const res = await listWilayah(selectedCity, selectedDistrict);
        if (isMounted && res.level === 'kelurahan') {
          setKelurahans(res.items as Kelurahan[]);
        }
      } catch (err) {
        console.error('[loadKelurahans Error]', err);
      } finally {
        if (isMounted) setIsLoadingDropdown(false);
      }
    }

    void loadKelurahans();
    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedCity, selectedDistrict]);

  const handleSelectKelurahan = useCallback(
    async (kelurahan: Kelurahan, e: React.MouseEvent) => {
      e.stopPropagation();
      await selectKelurahanById(kelurahan.id);
      setIsModalOpen(false);
    },
    [selectKelurahanById]
  );

  return (
    <>
      {/* Location Selector Pill Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className="flex items-center gap-2 rounded-2xl border border-emerald-950/10 bg-white/90 px-3.5 py-2 text-xs font-bold text-[#143628] shadow-md backdrop-blur-md hover:bg-emerald-50/80 active:scale-95 transition-all cursor-pointer pointer-events-auto"
      >
        <MapPin className="h-4 w-4 text-[#2D6A4F] shrink-0" />
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-gray-500 font-normal leading-none">Wilayah Aktif</span>
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {selectedKelurahan ? `${selectedKelurahan.nama_kelurahan}` : 'Pilih Wilayah...'}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-0.5 shrink-0" />
      </button>

      {/* Cascading Selection Modal with React Portal to document.body */}
      {isClient &&
        isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#143628]">Pilih Wilayah Pemantauan</h3>
                    <p className="text-xs text-gray-500">Pilih Kota, Kecamatan, dan Kelurahan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cascading Dropdown Selectors */}
              <div className="space-y-4">
                {/* Level 1: Kota / Kabupaten */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    1. Kabupaten / Kota
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCity(city);
                        }}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                          selectedCity === city
                            ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level 2: Kecamatan */}
                {selectedCity && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      2. Kecamatan
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-gray-50/70 rounded-xl border border-gray-100">
                      {districts.map((dist) => (
                        <button
                          key={dist}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrict(dist);
                          }}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                            selectedDistrict === dist
                              ? 'bg-[#2D6A4F] text-white font-semibold shadow-xs'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {dist}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Level 3: Kelurahan List */}
                {selectedDistrict && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      3. Daftar Kelurahan / Desa
                    </label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                      {isLoadingDropdown ? (
                        <div className="py-6 flex items-center justify-center text-gray-400 text-xs gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
                          <span>Memuat data kelurahan...</span>
                        </div>
                      ) : kelurahans.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          Tidak ada kelurahan pada kecamatan ini.
                        </p>
                      ) : (
                        kelurahans.map((kel) => {
                          const isCurrent = selectedKelurahan?.id === kel.id;
                          return (
                            <button
                              key={kel.id}
                              type="button"
                              onClick={(e) => handleSelectKelurahan(kel, e)}
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-gray-200 text-gray-800 hover:border-[#1B4332] hover:bg-gray-50'
                              }`}
                            >
                              <span>{kel.nama_kelurahan}</span>
                              {isCurrent && <Check className="h-4 w-4 text-emerald-600" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
