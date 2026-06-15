# SKILL: Career Assistant & CV Parsing

Purpose: Provide instructions and prompt templates for CV parsing, cover letter generation, and skills gap analysis aligned to South African SETA frameworks.

Files of interest:

- `src/lib/ai.ts` — prompt templates and helper stubs.
- `AGENTS.md` — guidance for agent orchestration.

Usage:

- Deploy Edge Functions to proxy calls to Gemini/OpenAI and call these prompts with user-provided data.
- Return strict JSON as defined in the prompts to simplify downstream UI consumption.
