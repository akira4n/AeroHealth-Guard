"""Health advisory module integrating LLM providers and official KLHK fallback templates."""
from .fallback_templates import get_fallback_advisory
from .llm_client import generate_llm_advisory
from .batch_generator import generate_batch_advisories

__all__ = [
    "get_fallback_advisory",
    "generate_llm_advisory",
    "generate_batch_advisories",
]
