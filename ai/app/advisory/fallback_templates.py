import logging

logger = logging.getLogger("aerohealth.advisory.fallback")

KLHK_STANDARD_TEMPLATES = {
    "Baik": (
        "Kualitas udara di wilayah Anda dalam kategori Baik. Tingkat mutu udara sangat aman dan "
        "tidak memberikan dampak negatif bagi manusia, hewan, maupun tumbuhan. Sangat ideal untuk "
        "seluruh kegiatan di luar ruangan dan olahraga."
    ),
    "Sedang": (
        "Kualitas udara berada pada kategori Sedang. Mutu udara masih dapat diterima untuk aktivitas umum, "
        "namun kelompok sensitif (bayi, balita, lansia, dan penderita gangguan saluran pernapasan) "
        "disarankan mengurangi aktivitas fisik berat di luar ruangan dalam durasi yang lama."
    ),
    "Tidak Sehat": (
        "Kualitas udara Tidak Sehat akibat peningkatan polutan partikulat di udara. "
        "Masyarakat umum disarankan mengenakan masker standar N95/KF94 saat beraktivitas di luar, "
        "menutup ventilasi rumah, dan membatasi aktivitas luar ruang."
    ),
    "Sangat Tidak Sehat": (
        "Peringatan: Kualitas Udara Sangat Tidak Sehat. Paparan udara ini dapat memperparah penyakit paru "
        "dan jantung. Seluruh warga diimbau tetap berada di dalam ruangan, menggunakan pembersih udara (air purifier), "
        "dan segera menuju fasilitas Clean Air Shelter terdekat jika mengalami sesak napas."
    ),
    "Berbahaya": (
        "PERINGATAN BAHAYA KABUT ASAP DAN POLUSI EKSTREM. Kualitas udara tingkat berbahaya bagi seluruh populasi. "
        "Hindari seluruh aktivitas di luar ruangan, tutup rapat jendela dan pintu, basahi kain ventilasi, "
        "dan segera lakukan evakuasi medis ke fasilitas Clean Air Shelter terdekat jika terjadi gangguan kesehatan berat."
    ),
}

HOTSPOT_ALERT_SNIPPET = (
    " Terdeteksi titik api karhutla aktif di sekitar wilayah Anda yang berpotensi meningkatkan asap partikulat "
    "secara fluktuatif. Tingkatkan kewaspadaan terhadap bau asap."
)


def get_fallback_advisory(
    kategori: str,
    has_hotspot: bool = False,
    dominant_pollutant: str = "PM2.5"
) -> str:
    """
    Retrieve official KLHK standard mitigation advisory text for a given ISPU category.
    Appends fire hotspot alert if active fire points are in close proximity.
    """
    base_text = KLHK_STANDARD_TEMPLATES.get(
        kategori,
        KLHK_STANDARD_TEMPLATES["Sedang"]
    )

    if has_hotspot:
        return f"{base_text}{HOTSPOT_ALERT_SNIPPET}"
    return base_text
