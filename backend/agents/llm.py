import os
from crewai import LLM

phi_llm = LLM(
    model="claude-haiku-4-5-20251001",
    api_key=os.getenv("ANTHROPIC_API_KEY", ""),
)
