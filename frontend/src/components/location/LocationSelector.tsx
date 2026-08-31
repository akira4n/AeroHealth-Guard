'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, ChevronDown, X, Check, Loader2, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { listWilayah } from '@/lib/api';
import { Kelurahan } from '@/lib/types';

function subscribe() {
  return () => {};
}

export default function LocationSelector() {
  const { selectedKelurahan, selectKelurahanById } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      setSearchQuery('');
    },
    [selectKelurahanById]
  );

  // Real-time search filtered kelurahans
  const filteredKelurahans = useMemo(() => {
    if (!searchQuery.trim()) return kelurahans;
    const q = searchQuery.toLowerCase().trim();
    return kelurahans.filter(
      (k) =>
        k.nama_kelurahan.toLowerCase().includes(q) ||
        k.nama_kecamatan.toLowerCase().includes(q) ||
        k.kabupaten_kota.toLowerCase().includes(q)
    );
  }, [kelurahans, searchQuery]);

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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-emerald-950/10 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Sticky Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#143628]">Pilih Wilayah Pemantauan</h3>
                    <p className="text-[11px] sm:text-xs text-gray-500">17 Kabupaten/Kota & 3.264 Desa se-Sumsel</p>
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

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3.5">
                {/* Level 1: Kota / Kabupaten */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-gray-700">
                      1. Kabupaten / Kota ({cities.length})
                    </label>
                    {selectedCity && (
                      <span className="text-[10px] font-semibold text-[#1B4332] bg-emerald-50 px-2 py-0.5 rounded-md">
                        {selectedCity}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-gray-50/80 rounded-2xl border border-gray-200/80">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCity(city);
                        }}
                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border text-left transition-all cursor-pointer truncate ${
                          selectedCity === city
                            ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-700 hover:bg-emerald-50/50'
                        }`}
                        title={city}
                      >
                        {city.replace('Kabupaten ', 'Kab. ').replace('Kota ', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level 2: Kecamatan */}
                {selectedCity && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-gray-700">
                        2. Kecamatan ({districts.length})
                      </label>
                      {selectedDistrict && (
                        <span className="text-[10px] font-semibold text-[#2D6A4F] bg-emerald-50 px-2 py-0.5 rounded-md">
                          Kec. {selectedDistrict}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-gray-50/80 rounded-2xl border border-gray-200/80">
                      {districts.map((dist) => (
                        <button
                          key={dist}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrict(dist);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
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

                {/* Level 3: Kelurahan List with Live Search */}
                {selectedDistrict && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-gray-700">
                        3. Daftar Kelurahan / Desa ({filteredKelurahans.length})
                      </label>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ketik nama desa / kelurahan..."
                        className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:border-[#1B4332] focus:outline-hidden transition-all text-gray-800 placeholder:text-gray-400"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filtered Kelurahan Buttons */}
                    <div className="space-y-1 max-h-44 overflow-y-auto p-1 bg-gray-50/50 rounded-2xl border border-gray-100">
                      {isLoadingDropdown ? (
                        <div className="py-6 flex items-center justify-center text-gray-400 text-xs gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#1B4332]" />
                          <span>Memuat data kelurahan...</span>
                        </div>
                      ) : filteredKelurahans.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          {searchQuery
                            ? `Tidak ada desa bernama "${searchQuery}"`
                            : 'Tidak ada kelurahan pada kecamatan ini.'}
                        </p>
                      ) : (
                        filteredKelurahans.map((kel) => {
                          const isCurrent = selectedKelurahan?.id === kel.id;
                          return (
                            <button
                              key={kel.id}
                              type="button"
                              onClick={(e) => handleSelectKelurahan(kel, e)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                                  : 'bg-white border-gray-200/90 text-gray-800 hover:border-[#1B4332] hover:bg-emerald-50/40'
                              }`}
                            >
                              <span className="truncate pr-2">{kel.nama_kelurahan}</span>
                              {isCurrent && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
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
