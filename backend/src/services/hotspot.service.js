const hotspotRepository = require('../repositories/hotspot.repository');

/**
 * Menentukan kategori intensitas pelepasan energi termal (Fire Radiative Power - FRP)
 * @param {number} frp
 * @returns {{ category: string, label: string }}
 */
const getFrpIntensityCategory = (frp = 0) => {
  if (frp >= 100) {
    return {
      category: 'High',
      label: 'Tinggi (Kebakaran Lahan Sangat Intens)'
    };
  }
  if (frp >= 30) {
    return {
      category: 'Medium',
      label: 'Sedang (Kebakaran Menengah)'
    };
  }
  return {
    category: 'Low',
    label: 'Rendah (Titik Api Kecil/Awal)'
  };
};

/**
 * Menentukan status tingkat bahaya karhutla wilayah
 * @param {number} totalHotspots
 * @param {number} highIntensityCount
 * @returns {{ level: string, status_badge: string, description: string }}
 */
const getThreatLevel = (totalHotspots, highIntensityCount) => {
  if (totalHotspots === 0) {
    return {
      level: 'Normal',
      status_badge: 'success',
      description:
        'Kondisi aman. Tidak terdeteksi anomali termal titik api aktif di wilayah sasaran.'
    };
  }
  if (totalHotspots <= 5 && highIntensityCount === 0) {
    return {
      level: 'Waspada',
      status_badge: 'warning',
      description:
        'Terdeteksi beberapa titik api aktif dengan intensitas pelepasan energi panas terkendali.'
    };
  }
  if (totalHotspots <= 15) {
    return {
      level: 'Siaga',
      status_badge: 'danger',
      description:
        'Peningkatan sebaran titik api aktif. Waspadai pergerakan asap dan penurunan kualitas udara.'
    };
  }
  return {
    level: 'Darurat',
    status_badge: 'critical',
    description:
      'STATUS DARURAT KARHUTLA: Terdeteksi sebaran titik api aktif masif dengan intensitas energi tinggi.'
  };
};

class HotspotService {
  /**
   * Mengambil daftar titik api aktif untuk visualisasi marker pada peta Leaflet
   * @param {{ min_frp?: number, confidence?: string, limit?: number }} filters
   * @returns {Promise<Object>}
   */
  async getActiveHotspots(filters = {}) {
    const rawHotspots = await hotspotRepository.findActiveHotspots(filters);

    const hotspots = rawHotspots.map((item) => {
      const frpVal = item.frp ?? 0;
      const intensity = getFrpIntensityCategory(frpVal);

      return {
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        coordinates: [item.longitude, item.latitude],
        frp: frpVal,
        intensity_category: intensity.category,
        intensity_label: intensity.label,
        confidence: item.confidence || 'nominal',
        acquired_at: item.acquired_at,
        location: item.location_geojson
      };
    });

    return {
      total: hotspots.length,
      filters_applied: {
        min_frp: filters.min_frp !== undefined ? parseFloat(filters.min_frp) : 0,
        confidence: filters.confidence || 'all',
        limit: parseInt(filters.limit || 100, 10)
      },
      hotspots
    };
  }

  /**
   * Mengambil ringkasan statistik pemantauan titik api satelit NASA FIRMS
   * @returns {Promise<Object>}
   */
  async getHotspotStats() {
    const stats = await hotspotRepository.getHotspotSummaryStats();
    const threat = getThreatLevel(stats.total_hotspots, stats.high_intensity_count);

    return {
      summary: {
        total_active_hotspots: stats.total_hotspots,
        high_intensity_count: stats.high_intensity_count,
        high_confidence_count: stats.high_confidence_count,
        nominal_confidence_count: stats.nominal_confidence_count,
        max_frp_mw: stats.max_frp,
        avg_frp_mw: stats.avg_frp,
        last_satellite_sync: stats.last_sync
      },
      threat_assessment: threat
    };
  }
}

module.exports = new HotspotService();
