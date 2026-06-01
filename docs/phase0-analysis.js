/**
 * Phase 0 Analysis — kdu-study
 *
 * ═══════════════════════════════════════════════════════════════
 * 1. APP STRUCTURE
 * ═══════════════════════════════════════════════════════════════
 *
 * React 19 + Vite 8, PWA, mobile-first (460px column).
 * Tabs: Today | Papers | MCQ | SEQ | Cases | Graph | Review | Sync
 * Single-entry: index.html → main.jsx → App.jsx
 * Data banks loaded as globals from public/ JS files:
 *   - window.KDU_BANK        → 133 scored MCQs (questions.js)
 *   - window.KDU_SEQ_BANK    → SEQ papers (seqBank.js)
 *   - window.KDU_OCR_MCQ_BANK→ 795 OCR MCQs (ocrMcqBank.js)
 *   - window.KDU_CASE_BANK   → 829 cases (caseBank.js)
 *   - window.KDU_RAG_INDEX   → RAG chunks (ragIndex.js)
 *
 * ═══════════════════════════════════════════════════════════════
 * 2. AI CALL LOCATIONS
 * ═══════════════════════════════════════════════════════════════
 *
 * src/ai/client.js          — all AI functions:
 *   kimiChat()              → POST /api/moonshot/v1/chat/completions (proxied by Vite)
 *   transcribeAudio(blob)   → POST /api/groq/openai/v1/audio/transcriptions (proxied)
 *   makeSeqPrompt()         → plain-text prompt for SEQ marking
 *   makeMcqExplainPrompt()  → per-statement MCQ explanation prompt
 *   makeCaseSystemPrompt()  → system prompt for live case AI
 *
 * src/screens/McqPractice.jsx → kimiChat(makeMcqExplainPrompt(...))
 * src/screens/SeqPractice.jsx → kimiChat(makeSeqPrompt(...))
 * src/screens/Cases.jsx       → kimiChat([makeCaseSystemPrompt, ...history])
 * src/ai/useVoiceRecorder.js  → transcribeAudio(blob)  ← ONLY Groq path now
 *
 * NEW (from previous work):
 * src/ai/prompts.js          → buildMcqTutorPrompt etc (compact, JSON-requesting)
 * src/ai/parseResponse.js    → JSON parser with fallback
 * src/ai/toolPlanner.js      → tool suggestion rules
 *
 * ═══════════════════════════════════════════════════════════════
 * 3. STORAGE / SAVE SCHEMA
 * ═══════════════════════════════════════════════════════════════
 *
 * IndexedDB: "kdu-finals-rpg" / "keyval" store (idb-keyval)
 * Keys (MUST NOT CHANGE):
 *   kdu_v2_settings   → {name, subject, intake, dailyGoal, examDate, syncEndpoint, passphrase}
 *   kdu_v2_profile    → {xp, streak, lastDay, total, mcqDone, seqDone, gold, sanity, hearts, badges}
 *   kdu_v2_attempts   → {[qid]: AttemptRecord}
 *   kdu_v2_notes      → {[qid]: {text, updatedAt}}
 *   kdu_v2_seq        → {[qid]: {answer, mark, feedback, updatedAt}}
 *   kdu_v2_cases      → {[caseId]: {transcript, plan, feedback, at, title, subject}}
 *   kdu_v2_log        → [{id, kind, subject, correct, percent, at}]  capped 2000
 *
 * Legacy fallback: localStorage → same keys, migrates on first load.
 * Sync: Cloudflare Worker KV, last-write-wins per record, SHA-256 passphrase auth.
 *
 * ═══════════════════════════════════════════════════════════════
 * 4. DATA BANK STRUCTURE
 * ═══════════════════════════════════════════════════════════════
 *
 * KDU_BANK:        { [subject]: [{n, stem, type:"mr"|"sbr", options:{A:...}, answer:{A:bool}|"A", expl}] }
 * KDU_SEQ_BANK:    [{id, subject, title, kind:"SEQ", questions:[{id, stem, marks, subs:[{label,prompt,marks}]}]}]
 *                  ⚠ Uses `subs`, NOT `subquestions` — SEQ UI currently reads `question.subs` (CORRECT)
 *                  ⚠ BUT normalizer.js uses `subquestions` — already handled by normalize()
 * KDU_OCR_MCQ_BANK:[{id, subject, title, kind:"MCQ", questions:[...]}]  — answer keys not fully trusted
 * KDU_CASE_BANK:   [{id, subject, title, text}]  — text = raw case sheet markdown
 * KDU_RAG_INDEX:   [{id, title, text, subject?}]  — guideline/reference chunks
 *
 * ═══════════════════════════════════════════════════════════════
 * 5. GRAPH STRUCTURE
 * ═══════════════════════════════════════════════════════════════
 *
 * src/graph/knowledgeGraph.js → buildKnowledgeGraph() — topic co-occurrence model
 *   Nodes: paper, question, topic, case, rag
 *   Edges: contains, mentions, weak-topic, co, case-topic, rag-topic
 *   Grows from practised questions/notes/cases only (Obsidian-style)
 *
 * src/graph/GraphView.jsx → Cytoscape force layout
 *   MAX 80 topic nodes, 320 co-occurrence edges
 *   Subject-colored circles, size = weight
 *   Tap node → highlight neighbours
 *
 * src/graph/d3Model.js (new) → semantic edges from AI, node types (disease/drug/etc)
 *   applyGraphUpdates() merges AI graphUpdates[] into d3Graph state in App
 *   toD3Format() for future D3 rendering
 *
 * ═══════════════════════════════════════════════════════════════
 * 6. BUGS / MISMATCHES FOUND
 * ═══════════════════════════════════════════════════════════════
 *
 * ✅ FIXED: SEQ UI uses `question.subs` — normalizer now maps subs→subquestions.
 *    SeqPractice.jsx now reads `const subs = question.subs ?? question.subquestions ?? []`
 *
 * ⚠ TODO: useVoiceRecorder only knows about Groq — no settings context.
 *    Fix: Pass settings into useVoiceRecorder, or expose a transcriber function from outside.
 *
 * ⚠ TODO: DEFAULT_SETTINGS in saveStore.js missing new feature flag keys.
 *    Fix: Extend DEFAULT_SETTINGS (additive, backward safe).
 *
 * ⚠ TODO: Settings UI only shows sync config — no STT provider, no feature flags.
 *    Fix: Extend Settings.jsx screen.
 *
 * ⚠ TODO: kimiChat prompts in client.js still use old verbose format.
 *    New prompts.js exists but client.js fallback prompts still used in legacy path.
 *    Fix: Keep both; new screens use prompts.js, old client.js can stay as fallback.
 *
 * ⚠ TODO: No Cloudflare STT path exists yet.
 *    Fix: Phase 2.
 *
 * ⚠ TODO: No Cloudflare Worker backend folder.
 *    Fix: Phase 7.
 *
 * ═══════════════════════════════════════════════════════════════
 * 7. SAFE FIRST FILES TO CHANGE
 * ═══════════════════════════════════════════════════════════════
 *
 * Phase 2 (STT):
 *   src/ai/transcribe.js      (NEW — provider-aware transcriber)
 *   src/ai/useVoiceRecorder.js (MODIFY — accept settings/transcriber)
 *   src/storage/saveStore.js  (MODIFY — add new DEFAULT_SETTINGS keys, additive only)
 *   src/screens/Settings.jsx  (MODIFY — add STT + feature flag UI)
 *   cloudflare/worker-stt/worker.js  (NEW — Workers AI Whisper Worker)
 *   cloudflare/worker-stt/wrangler.toml.example  (NEW)
 *   tests/transcribe.test.mjs (NEW)
 *
 * Phase 7 (API Worker):
 *   cloudflare/kdu-api-worker/worker.js  (NEW)
 *   cloudflare/kdu-api-worker/wrangler.toml.example  (NEW)
 *   cloudflare/kdu-api-worker/.env.example  (NEW)
 *
 * Safe to ignore for now:
 *   public/*.js data banks (large, not to be touched)
 *   src/storage/ (only additive changes to DEFAULT_SETTINGS)
 *   App.jsx routing (only additive props)
 *
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY
 * ═══════════════════════════════════════════════════════════════
 *
 * The app is clean and well-structured. Previous work (normalizer, prompts, parser,
 * d3Model, reviewEngine, AiFeedbackCard, WeakConceptCard) is all in place and tested.
 *
 * Phase 2 is the next safe step: add Cloudflare STT as an optional provider
 * behind a settings flag, without removing the Groq path.
 */
