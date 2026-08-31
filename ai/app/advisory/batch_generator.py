import asyncio
import logging
from typing import List, Dict, Tuple
from app.models.schemas import IdwResult, AdvisoryResult
from app.advisory.fallback_templates import get_fallback_advisory
from app.advisory.llm_client import generate_llm_advisory

logger = logging.getLogger("aerohealth.advisory.batch")


async def generate_batch_advisories(idw_results: List[IdwResult]) -> List[AdvisoryResult]:
    """
    Generate tailored health advisory narratives for a list of kelurahan IDW results.
    
    Optimized Category Batching (SRS REQ-AI-04):
    Instead of calling the LLM once per kelurahan (which would trigger rate limits and high latency),
    kelurahans are partitioned into unique (kategori, hotspot_detected, primary_pollutant) groups.
    The LLM is invoked once per unique group concurrently via asyncio.gather.
    """
    if not idw_results:
        return []

    # Step 1: Group kelurahan IDs and scores by unique condition signature
    # Signature: (kategori, hotspot_detected, primary_pollutant)
    groups: Dict[Tuple[str, bool, str], List[IdwResult]] = {}
    for res in idw_results:
        key = (res.kategori, res.hotspot_detected, res.primary_pollutant)
        if key not in groups:
            groups[key] = []
        groups[key].append(res)

    logger.info(
        f"Partitioned {len(idw_results)} kelurahans into {len(groups)} unique advisory batch groups."
    )

    # Step 2: Generate advisory for each unique group concurrently
    async def process_group(
        key: Tuple[str, bool, str],
        items: List[IdwResult]
    ) -> Tuple[Tuple[str, bool, str], str, bool]:
        kategori, has_hotspot, polutan = key
        avg_score = int(sum(r.ispu_score for r in items) / len(items))

        # Try LLM generation first
        llm_text = await generate_llm_advisory(
            kategori=kategori,
            avg_score=avg_score,
            dominant_pollutant=polutan,
            has_hotspot=has_hotspot
        )

        if llm_text:
            return key, llm_text, True

        # Fallback to official KLHK template if LLM is unavailable or failed
        fallback_text = get_fallback_advisory(
            kategori=kategori,
            has_hotspot=has_hotspot,
            dominant_pollutant=polutan
        )
        return key, fallback_text, False

    tasks = [process_group(key, items) for key, items in groups.items()]
    group_results = await asyncio.gather(*tasks)

    # Step 3: Create lookup map from group key -> (advisory_text, is_ai_generated)
    advisory_lookup = {
        key: (text, is_ai)
        for key, text, is_ai in group_results
    }

    # Step 4: Assemble complete AdvisoryResult list per kelurahan
    results: List[AdvisoryResult] = []
    for res in idw_results:
        key = (res.kategori, res.hotspot_detected, res.primary_pollutant)
        advisory_text, is_ai = advisory_lookup[key]

        results.append(
            AdvisoryResult(
                kelurahan_id=res.kelurahan_id,
                advisory_text=advisory_text,
                is_ai_generated=is_ai
            )
        )

    ai_count = sum(1 for r in results if r.is_ai_generated)
    logger.info(
        f"Generated advisories for {len(results)} kelurahans "
        f"({ai_count} via AI LLM, {len(results) - ai_count} via official KLHK template)."
    )
    return results
