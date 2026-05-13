# Local LLM Path — Privacy-First AI Inference [SPEC]

## What this is

Sovereign OS gives users the option to run all AI inference on their own machine via Ollama / Llama 3 / Mistral. Zero cloud. Zero data leaving the device. "AI that never leaves your machine" as a tier.

## Status

[SPEC] — derived from TempleOS-inspired directive 2026-05-15. New, not previously in roadmap.

## Why this matters

The privacy moat is the differentiator. Right now Sovereign promises:
- Local-first storage (IndexedDB)
- Zero analytics on content
- No data sales

But AI inference still hits Anthropic / OpenAI / Gemini servers. For maximum-privacy users (RHD researchers handling sensitive participant data, equity students, vulnerable users) that's a gap.

Local LLM closes the gap. Sovereign becomes the only academic writing tool where the AI runs entirely on the user's machine.

## Target users

### Maximum-fit
- RHD researchers handling participant data (ethics-approved confidentiality)
- Researchers working with Indigenous knowledge (data sovereignty requirements)
- Refugee/asylum-seeker students (legitimate threat models)
- Researchers in countries with hostile governments
- Privacy-maximalist users (a small but vocal community)

### Good-fit
- ADHD users who write in offline cafes / on trains / in airplanes
- Users on slow internet
- Users who want zero cost AI inference
- Tinkerers who run local LLMs already

### Less-fit (still supported via cloud option)
- Users with older hardware (local LLMs are RAM-hungry)
- Users on Windows with limited GPU
- Users who want fastest possible inference

## Tier policy

Local LLM is **a user choice**, not a tier-locked feature.

Every Sovereign tier supports:
- **Cloud inference (default)** — fast, full model capability, Anthropic-hosted
- **Local inference (opt-in)** — slower but fully private, runs on user's machine
- **Hybrid (advanced)** — sensitive content via local, general queries via cloud, user controls per-prompt

## Supported models (v1)

### Ollama as the runtime
- Open-source, MIT-licensed
- Mac (M-series excellent), Windows, Linux
- Easy install (single binary)
- Manages model downloads + memory

### Models supported initially
- **Llama 3 8B** — entry-level, runs on 16GB RAM
- **Llama 3 70B** — better quality, needs 64GB+ RAM (M2 Ultra or similar)
- **Mistral 7B** — fast, decent quality, 16GB RAM
- **Qwen 2.5 14B** — strong for academic writing, 32GB RAM
- **Phi 4** — Microsoft's small model, fast

### Models added later
- Llama 4 (when released, expected late 2026)
- Specialised academic-fine-tuned models if any emerge
- Custom Sovereign-fine-tuned model (future, expensive to build)

## Performance expectations

### On M2/M3 Mac Studio (Aaron's setup)
- Llama 3 8B: ~20-30 tokens/sec — fast enough
- Llama 3 70B: ~5-10 tokens/sec — usable but slower
- Mistral 7B: ~30-40 tokens/sec — fastest

### On M1 MacBook Air (entry-level)
- Llama 3 8B: ~10-15 tokens/sec — usable
- Mistral 7B: ~15-20 tokens/sec — better
- Llama 3 70B: not recommended

### On Windows with NVIDIA GPU
- Llama 3 8B: very fast with CUDA acceleration
- Llama 3 70B: needs RTX 4090 or similar
- Without GPU: too slow for real-time use

### On older hardware
- Recommendation: stick with cloud inference
- UI clearly indicates this rather than letting users have bad experience

## Architecture

### Service layer

```
src/services/inference/
├── InferenceService.js         # Router: cloud or local based on user setting
├── CloudInferenceAdapter.js    # Existing Anthropic/OpenAI calls
├── LocalInferenceAdapter.js    # NEW: Ollama HTTP calls
└── HybridInferenceRouter.js    # Per-prompt routing logic
```

### Local Inference Adapter

Ollama runs as local HTTP server on port 11434. Sovereign calls it:

```js
async function localInference({ model, messages, options }) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      model: model || 'llama3:8b',
      messages,
      stream: true,
      options: { temperature: 0.7, num_ctx: 8192 }
    })
  });
  // Stream tokens back to UI
}
```

### Setup flow

First-time local inference user:
1. Settings → "Use local AI"
2. Check if Ollama installed (test localhost:11434)
3. If not installed: instructions + download link
4. After install: choose model
5. Download model (one-time, 4-8GB)
6. Test inference (small prompt, confirm works)
7. Flag user as local-AI-enabled

### Failure modes

- Ollama not running: fallback to cloud with notification
- Model not downloaded: prompt to download
- Out of memory: fallback to smaller model
- Generation too slow: prompt to switch model or use cloud
- User explicit override: respect "local only, fail if cloud needed"

## Prompt engineering for local models

Local LLMs are smaller than Claude/GPT-4. Prompts need adaptation:

### What works well locally
- Citation insertion (small context, structured output)
- Sentence-level rewrites
- Voice DNA matching
- Brief simplification (already small context)
- Rubric translation
- Format detection
- Bionic decoration

### What needs careful prompting
- Long-context analysis (limit to 8K-32K tokens depending on model)
- Multi-step reasoning (chain-of-thought helps)
- Methodology decisions (may need user verification)
- Cross-document synthesis (may need to chunk)

### What stays cloud-only initially
- Complex multi-document research synthesis
- Long-context summarisation of full chapters
- Defence Mode hard-question generation (needs strong reasoning)
- AI-generated peer review responses

User chooses what's worth local vs cloud trade-off.

## Privacy guarantees (the marketing line)

With Local AI enabled:
- ✅ Your content never leaves your device
- ✅ No API keys to leak
- ✅ No telemetry on your prompts
- ✅ Works offline (after model downloaded)
- ✅ Free forever (no per-token cost)
- ⚠️ Slower than cloud
- ⚠️ Quality slightly below GPT-4/Claude on complex reasoning
- ⚠️ Requires capable hardware

## Pricing impact

### Local-AI-only tier (new)
- $9/month or $89/year
- Same features as Standard tier
- All inference local
- For privacy-maximalists
- Lower price reflects: no cloud inference cost

### Standard tier with optional local
- $25/month (unchanged)
- User chooses per-prompt or globally
- Best of both worlds

### Hybrid Pro tier (advanced)
- $39/month
- Per-prompt routing rules
- "Use local for all citations, cloud for synthesis"
- Power-user feature

## Build cost

### Phase 1 (1-week sprint) — Foundation
1. InferenceService router
2. LocalInferenceAdapter for Ollama
3. Settings UI for cloud/local toggle
4. Ollama setup flow + onboarding
5. Model selector + download UI
6. Streaming token display
7. Fallback logic to cloud

### Phase 2 (1-week sprint) — Polish
8. Prompt adaptations per model
9. Per-feature local vs cloud defaults
10. Hardware detection + recommendations
11. Performance monitoring
12. Error handling

### Phase 3 (later) — Hybrid Pro
13. Per-prompt routing rules
14. Cost analytics
15. Model performance comparisons
16. Custom model support

Total to ship core: 2-week sprint.

## Dependencies

- Tier architecture (must exist)
- All existing AI features (Brief Simplifier, Rubric Translator, etc) must be refactored to use InferenceService router
- Settings UI

## Risks

### Risk: Users on weak hardware have bad experience
Mitigation: hardware detection on setup. If 8GB RAM or older CPU, recommend cloud. Clear messaging.

### Risk: Maintenance burden of supporting multiple models
Mitigation: keep model list small. Llama 3 8B + Mistral 7B as primary. Test before adding more.

### Risk: Local models lag behind cloud quality
Mitigation: clear UX about trade-offs. Cloud always available as fallback. Quality gap narrowing every quarter as open models improve.

### Risk: Ollama upstream changes break integration
Mitigation: pin to specific Ollama API version. Test on Ollama releases.

## Why this matters strategically

### For users
- Genuine privacy promise
- No vendor lock-in
- Offline capability
- Free inference at scale

### For Sovereign as a business
- Differentiation no major competitor has (yet)
- Marketing line: "the only research tool that runs entirely on your machine"
- Lower cloud inference costs at scale (users paying $9/mo for local-only have ~$0 inference cost to us)
- Privacy-first positioning becomes architectural fact, not just claim
- Future-proof against AI provider pricing changes

### For Aaron specifically
- His participant data (when MRes/PhD interviews happen) can be processed locally
- Ethics-approved confidentiality preserved end-to-end
- Defence at viva: "I used Sovereign with local inference — no participant data ever left my Mac"
- This becomes a methodological strength in the thesis itself

## When to build this

**Not immediately.** Phase 0 foundation work comes first (Tier Architecture, Citation, Receipt, Ingestion, Comms).

Realistic queue position: Sprint 12-15 range, after Sovereign Research MVP ships and Aaron has 50-100 paying users.

Marketing position: announce capability publicly when shipping, not before.

## Notes added

- 2026-05-15: Created from TempleOS-inspired directive. The Ring 0 / hardware-direct framing translated into actual technical path.
- Local LLM path is one of the strongest moats available to Sovereign.
- Pairs with The Receipt feature — local inference + Receipt = airtight privacy story.
