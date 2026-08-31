import pytest
from app.advisory.fallback_templates import get_fallback_advisory, KLHK_STANDARD_TEMPLATES
from app.advisory.batch_generator import generate_batch_advisories
from app.models.schemas import IdwResult


def test_klhk_fallback_templates_completeness():
    """Verify all 5 KLHK categories have defined templates."""
    categories = ["Baik", "Sedang", "Tidak Sehat", "Sangat Tidak Sehat", "Berbahaya"]
    for cat in categories:
        text = get_fallback_advisory(cat, has_hotspot=False)
        assert len(text) > 40
        assert cat.lower() in text.lower() or "mutu udara" in text.lower()


def test_fallback_hotspot_alert_appended():
    """Verify hotspot warning snippet is appended when has_hotspot is True."""
    normal_text = get_fallback_advisory("Sedang", has_hotspot=False)
    hotspot_text = get_fallback_advisory("Sedang", has_hotspot=True)

    assert len(hotspot_text) > len(normal_text)
    assert "karhutla" in hotspot_text.lower() or "titik api" in hotspot_text.lower()


@pytest.mark.asyncio
async def test_batch_generator_partitioning():
    """
    Verify that 50 kelurahans with 3 categories are partitioned into unique groups
    and all 50 kelurahans receive a populated AdvisoryResult.
    """
    mock_idw_results = []
    # 20 Baik without hotspot
    for i in range(1, 21):
        mock_idw_results.append(
            IdwResult(
                kelurahan_id=i,
                ispu_score=40,
                kategori="Baik",
                hotspot_detected=False
            )
        )
    # 20 Sedang without hotspot
    for i in range(21, 41):
        mock_idw_results.append(
            IdwResult(
                kelurahan_id=i,
                ispu_score=75,
                kategori="Sedang",
                hotspot_detected=False
            )
        )
    # 10 Tidak Sehat WITH hotspot
    for i in range(41, 51):
        mock_idw_results.append(
            IdwResult(
                kelurahan_id=i,
                ispu_score=145,
                kategori="Tidak Sehat",
                hotspot_detected=True,
                hotspot_penalty=45.0
            )
        )

    advisories = await generate_batch_advisories(mock_idw_results)

    assert len(advisories) == 50
    for adv in advisories:
        assert adv.kelurahan_id > 0
        assert len(adv.advisory_text) > 30

    # Verify hotspot alert is included for kelurahans 41-50
    assert "titik api" in advisories[45].advisory_text.lower() or "karhutla" in advisories[45].advisory_text.lower()
