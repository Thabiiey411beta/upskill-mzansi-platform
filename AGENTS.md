# AGENTS

This repository follows an agent-friendly pattern for modular LLM features.

- `ai/SKILL.md` contains skill instructions for the career assistant and parsers.
- Edge Functions (e.g. `supabase/functions/` or `/api/`) should host HTTP endpoints that call the LLM/Gemini and return structured JSON.
- Use managed agent patterns to orchestrate CV parsing, cover-letter generation, and skill-gap analysis.

Developer notes:

- Keep prompts and JSON schemas in `src/lib/ai.ts` for version control and easy testing.
- Do not commit secrets into source. Use environment variables and secrets manager for API keys.
