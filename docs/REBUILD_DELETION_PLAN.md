# Simplifii-OS v2 Rebuild — Deletion Plan

**Created:** 13 May 2026  
**Branch:** v2-rebuild-canvas-first  
**Status:** PLAN ONLY. Nothing deleted yet. Awaiting approval.

This plan classifies every file in `src/` against the v2 product spec (PRODUCT_SPEC.md, PRODUCT_SPEC_TIER_UPDATE.md, PRODUCT_SPEC_INCLUSION_AND_MOAT.md). Files not listed here (e.g. `public/`, `scripts/`, `docs/`, config files) are out of scope for this pass.

---

## KEEP

Files that survive the rebuild. Some need cleanup but their core logic maps to a v2 screen or service.

| File | Reason |
|------|--------|
| `src/core/EventBus.js` | Architecture layer 5: bridges spine events to HistoryOfThought and telemetry |
| `src/core/Events.js` | Single source of truth for CustomEvent name constants; needed by EventBus |
| `src/core/ExecutiveSpine.js` | Architecture layer 2: focus sessions, idle detection, Pareto routing |
| `src/core/HistoryOfThought.js` | Architecture layer 3: encrypted event log powering the Work Provenance Record |
| `src/core/LiteralMode.js` | Architecture layer 4: render-time vocab transformer (spec section 13 explicit keep) |
| `src/core/SovereignRouter.js` | Architecture layer 1: tier resolution, theme hydration, capability registry |
| `src/theme/tokens.js` | Design token single source of truth; Obsidian aesthetic lives here |
| `src/frontend/hooks/useIngestion.js` | PDF-to-course ingestion pipeline; core to v2 canvas Sources panel |
| `src/frontend/BionicText.js` | Accessibility reading mode; spec requires it (WCAG 2.2 AA floor) |
| `src/frontend/ConfirmDialog.js` | Generic modal dialog utility; reusable across v2 screens |
| `src/frontend/SettingsContext.js` | React context for user preferences; survives (needs dead CustomEvent cleanup) |
| `src/frontend/ProjectContext.js` | React context holding courses, blocks, active state; central data store |
| `src/frontend/PreviewPane.js` | View-only A4 document render; maps to v2 canvas Panel 4 (Preview) |
| `src/lib/supabaseClient.js` | Supabase client initialisation; auth and storage depend on it |
| `src/lib/storage.js` | Supabase storage upload helpers for PDFs; needed by ingestion |
| `src/contexts/AuthContext.js` | Supabase auth session provider; v2 sign-in screen needs this |
| `src/index.js` | React entry point |
| `src/setupProxy.js` | CRA dev-server COOP header for Google OAuth popups |
| `src/services/BriefService.js` | Maps extracted text to workspace blocks; core to canvas Brief panel |
| `src/services/ChatService.js` | Ollama chat wrapper; maps to v2 canvas Tutor panel |
| `src/services/DocumentAIService.js` | Three-tier PDF extraction (GCP, pdfjs, fallback); core ingestion dependency |
| `src/services/ExportService.js` | PDF generation for Work Provenance Record and submission export |
| `src/services/IndexedDBService.js` | Local IndexedDB CRUD for blocks, PDFs, ghost assets; offline backbone |
| `src/services/KnowledgeGraphService.js` | Entity extraction from text; feeds tagging and sources panel |
| `src/services/MicroStepService.js` | Micro-step generation for executive function support; core scaffolding |
| `src/services/RewriteService.js` | Elevate/Synthesise/Logic rewrite layer; canvas writing tools |
| `src/services/SovereignReconciler.js` | Cross-document fuzzy matcher; canonical assessment reconciliation |
| `src/services/TierParameters.js` | Regex heuristics per academic tier for brief extraction |
| `src/services/TemporalFilter.js` | Schedule alignment stub (minimal code, safe to keep) |
| `src/services/TranslationService.js` | Translation API; used by ResourceIngestor for multilingual ingestion |
| `src/services/UDLAuditService.js` | UDL 3.0 barrier scanner for curriculum text; accessibility compliance |
| `src/services/VerificationService.js` | Project context audit before unlocking drafting; validation gate |
| `src/utils/GroundingLoader.js` | Two-source PDF loader (build-time + IndexedDB); feeds ingestion |
| `src/backend/LMSConnector.js` | LMS data fetch simulation; planned for real LTI integration |

---

## DELETE

Files that do not map to any v2 screen, are on the explicit kill list, or will be rebuilt from scratch.

| File | Reason |
|------|--------|
| `src/frontend/AIAvatar.js` | Kill list: Three.js AIAvatar (react-three-fiber Canvas) |
| `src/frontend/AuraHUD.js` | Kill list: AURA voice / floating HUD overlay |
| `src/frontend/AuraLayer.js` | Kill list: AURA chat panel with voice synthesis (speakSystemMessage) |
| `src/frontend/AskAura.js` | Kill list: AURA chat popup with speech toggle |
| `src/frontend/AvatarVault.js` | Kill list: Five archetype SVG avatars tied to AURA system |
| `src/frontend/SteeringDrawer.js` | Kill list: Steering dials (Persona, Scaffolding, Grit, LOD sliders) |
| `src/frontend/HistoryVaultUnlock.js` | Kill list: Vault passphrase gate modal |
| `src/frontend/NeuroProfiler.js` | Kill list: Neuro-profiling onboarding wizard (EEG/Neural/Bio-Sovereignty) |
| `src/frontend/SovereignCell.js` | Kill list: "Sovereign User" course card with Brain/FlaskConical icons |
| `src/frontend/PillarGallery.js` | Kill list: "Pillar" language gallery using SovereignCell |
| `src/frontend/IdleNudge.js` | Tied to killed AURA avatar system; idle detection stays in ExecutiveSpine |
| `src/frontend/DevInsightsPanel.js` | Debug surface (Reddit/Discord mock insights); not in v2 spec |
| `src/frontend/SupportBridge.js` | Kill list: SOS email/support modal with BrainCircuit icon |
| `src/frontend/ZenTools.js` | Pomodoro/breathing/lofi player; not in v2's 5 screens |
| `src/frontend/CourseTrack.js` | Kill list: Gamified island progress tracker (Trophy/Star/Palmtree) |
| `src/frontend/GraphView.js` | Knowledge graph visualisation; not in v2's 5 screens |
| `src/frontend/Humaniser.js` | AI text humaniser stub; not in v2 spec |
| `src/frontend/FloatingResourceCard.js` | Kill list: Drag Research URL stub button |
| `src/frontend/SmartIntake.js` | Legacy intake wizard with neuro-suggest; replaced by v2 setup screen |
| `src/frontend/LinearCanvas.js` | Old canvas (speakSystemMessage, persona response, ZenTools); v2 canvas is 4-panel |
| `src/frontend/CognitiveArchive.js` | Right sidebar ghost asset store; not in v2's 4-panel layout |
| `src/frontend/SmViewer.js` | .sm (Simplifii-Markdown) three-tier viewer; replaced by v2 canvas |
| `src/frontend/EssayScorer.js` | Mock rubric scorer (random HD grade); stub not in v2 spec |
| `src/frontend/MathsStepEditor.js` | Step-by-step maths solver; not in v2's 5 screens |
| `src/frontend/AccessibilityVault.js` | Accessibility settings with speakSystemMessage; rebuilt into v2 Settings |
| `src/frontend/UniversalOnboarding.js` | Multi-step onboarding (StartIgnition, IdentityGate, etc.); replaced by v2 setup |
| `src/backend/NeuralAuditPipeline.js` | Kill list: Hardcoded neural scan pipeline |
| `src/services/NeuralService.js` | Kill list: Web Bluetooth BCI gateway for neural band hardware |
| `src/services/AuthService.js` | Kill list: Mock Google auth with zero imports; replaced by AuthContext |
| `src/services/CognitiveTelemetry.js` | Kill list: Passive cognitive shadow profiler (Bio-Sovereignty/ToneHUD) |
| `src/services/PersonaEngine.js` | Persona registry with speech rates/greetings; tied to killed AURA system |
| `src/services/MessagingHub.js` | Kill list: Voice synthesis (speakSystemMessage) and webhook simulation |
| `src/services/SheetsService.js` | Google Sheets cognitive ledger logger; telemetry surface not in v2 |
| `src/services/AuraTagWriter.js` | Cognitive friction score + AURA tag computation; tied to killed AURA |
| `src/services/MasterEngine.js` | Feature registry with lazy-loaded modules + mock Gemini; replaced by v2 architecture |
| `src/core/Personas.js` | 21-persona registry for AURA HUD (dot colours, pulse speeds); tied to killed AURA |
| `src/streams/homeschool/Dashboard.js` | Stream skeleton; v2 has one unified course list home screen |
| `src/streams/primary/Dashboard.js` | Stream skeleton with quest/XP gamification; kill list |
| `src/streams/secondary/Dashboard.js` | Stream skeleton with streak grid; kill list |
| `src/streams/tafe/Dashboard.js` | Stream skeleton; v2 has one unified course list home screen |

---

## UNCERTAIN

Files that need your decision. Each has a specific question.

| File | Question |
|------|----------|
| `src/App.js` | Root component wiring providers and routing. Will need full rewrite for v2's 5-screen router, but the provider nesting pattern (Auth, Settings, Project) is reusable. **Keep as shell to rewrite, or delete and start fresh?** |
| `src/frontend/MasterDashboard.js` | Main orchestrator importing ~30 components (most being deleted). Contains stage management and view routing. **Keep as shell for the v2 home screen, or delete and rebuild?** |
| `src/frontend/LandingPage.js` | Current sign-in screen with Google OAuth and password fields. V2 sign-in is simpler (magic link + password) but auth flow wiring may be salvageable. **Rewrite in place or delete?** |
| `src/frontend/DashboardNav.js` | Top navigation bar (70px header, brand, ingestion status). V2 needs a nav but layout differs. **Rewrite in place or delete?** |
| `src/frontend/SemesterSidebar.js` | Left sidebar with course list and task cards. V2 course list is structurally different (cards + priority panel). **Rewrite in place or delete?** |
| `src/frontend/InstitutionalContext.js` | React context for learning outcomes, referencing style, rubric criteria (15 lines). **Does this fold into ProjectContext, or keep separate?** |
| `src/frontend/SimplifiiStudio.js` | Tri-column NotebookLM-style cockpit (Sources, Cockpit, AURA). Closest existing code to v2's 4-panel canvas but layout differs. **Salvage the source/chat wiring, or delete?** |
| `src/frontend/Scaffolder.js` | Tiered support engine rendering assessment briefs into scaffolds. Scaffolding concept survives but the multi-tier UI is being flattened. **Keep the logic and strip the UI, or delete?** |
| `src/frontend/ResourceIngestor.js` | Evidence formula slot filler with translation and entity extraction. V2 canvas has a Sources panel that may reuse this. **Keep or rebuild from scratch?** |
| `src/frontend/AuthoringCockpit.js` | Stage 04 active task view with 5-step Pareto workflow. V2 canvas is different but Pareto step rendering could be reused. **Delete the component but extract Pareto logic first?** |
| `src/frontend/TaskCard.js` | Course/task card with "Start Sprint" button. V2 course list uses cards. Simple enough to keep but sprint concept may change. **Keep or delete?** |
| `src/frontend/EffortTracker.js` | Hook tracking keystroke metrics (burst count, deletions, pulse level). Feeds telemetry. Not on kill list but not explicitly in v2 spec. **Is per-block effort tracking still wanted?** |

---

## Summary

| Category | Count |
|----------|-------|
| KEEP | 34 files |
| DELETE | 40 files |
| UNCERTAIN | 12 files |
| **Total** | **86 files** |

**Next step:** Resolve the 12 UNCERTAIN files, then execute deletions in a single commit.
