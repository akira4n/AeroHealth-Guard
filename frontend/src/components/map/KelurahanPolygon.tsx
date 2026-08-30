'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Layer } from 'leaflet';
import { useApp } from '@/context/AppContext';
import { getIspuMap } from '@/lib/api';
import { IspuMapFeatureCollection, IspuFeature } from '@/lib/types';

export default function KelurahanPolygonLayer() {
  const { selectedKelurahan, selectKelurahanById, activeLayers } = useApp();
  const [mapData, setMapData] = useState<IspuMapFeatureCollection | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMapData() {
      try {
        const data = await getIspuMap();
        if (isMounted) {
          setMapData(data);
        }
      } catch (err) {
        console.error('[KelurahanPolygonLayer Error]', err);
      }
    }
    loadMapData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStyle = useCallback(
    (feature: any) => {
      const isSelected = selectedKelurahan?.id === feature?.properties?.kelurahan_id;
      const color = feature?.properties?.color || '#10B981';

      return {
        fillColor: color,
        fillOpacity: isSelected ? 0.65 : 0.4,
        color: isSelected ? '#143628' : color,
        weight: isSelected ? 3.5 : 1.8,
        dashArray: isSelected ? '' : '3',
        lineCap: 'round' as const,
        lineJoin: 'round' as const
      };
    },
    [selectedKelurahan?.id]
  );

  const onEachFeature = useCallback(
    (feature: IspuFeature, layer: Layer) => {
      const props = feature.properties;

      // Bind Tooltip modern
      const tooltipContent = `
        <div style="padding: 6px 10px; font-family: inherit; min-width: 130px;">
          <div style="font-weight: 700; font-size: 13px; color: #143628; margin-bottom: 2px;">
            ${props.nama_kelurahan}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
            ${props.nama_kecamatan}, ${props.kabupaten_kota}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-weight: 800; font-size: 14px; color: ${props.color};">
              ISPU ${props.ispu_score}
            </span>
            <span style="background-color: ${props.color}20; color: ${props.color}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; border: 1px solid ${props.color}40;">
              ${props.kategori}
            </span>
          </div>
        </div>
      `;

      layer.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'custom-leaflet-tooltip'
      });

      // Click Event
      layer.on({
        click: () => {
          selectKelurahanById(props.kelurahan_id);
        },
        mouseover: (e) => {
          const target = e.target;
          target.setStyle({
            fillOpacity: 0.75,
            weight: 3
          });
        },
        mouseout: (e) => {
          const target = e.target;
          const isSelected = selectedKelurahan?.id === props.kelurahan_id;
          target.setStyle({
            fillOpacity: isSelected ? 0.65 : 0.4,
            weight: isSelected ? 3.5 : 1.8
          });
        }
      });
    },
    [selectKelurahanById, selectedKelurahan?.id]
  );

  if (!activeLayers.ispuPolygons || !mapData) {
    return null;
  }

  return (
    <GeoJSON
      key={`geojson-layer-${selectedKelurahan?.id || 'all'}-${mapData.total_features}`}
      data={mapData as any}
      style={getStyle}
      onEachFeature={onEachFeature as any}
    />
  );
}
