# Agent Instructions — KDU Study Island

You are working on **KDU Study Island**, a fresh rebuild of the KDU final MBBS study app into a mobile-first, game-flavoured study experience.

This project is not a generic coding playground. Every change must protect the study workflow, preserve exam usefulness, and move the app toward the agreed **KDU Finals Island** vision.

## North Star

Build a serious MBBS finals study app wrapped in a calm, beautiful, tropical survival-island interface.

The app should feel inspired by retro island-survival games such as Tinker Island, but it must remain original and educational. Do not copy copyrighted game art, characters, logos, screens, or exact layouts.

The experience should feel like:

- final exam survival island
- daily mission board
- Study Forest growth
- weak concepts as danger zones
- MCQs as supplies / fruit / resources
- SEQs and clinical cases as hut / clinic building
- SRS reviews as returning enemies
- Topic Atlas as island map
- Sync / backup as supply crate or boat

The tone is **premium, playful, exam-focused, and not childish**.

## Permanent Safety Rule

The old working app lives in:

```text
SeriousSeran/kdu-study
```

This repo is the rebuild playground:

```text
SeriousSeran/kdu-study-island
```

Never assume destructive changes are acceptable. Before large rewrites, preserve a rollback path with a branch, PR, or clearly documented commit. Prefer additive migration over deleting working features.

## Preferred Stack Direction

Use:

- Vite
- React
- KAPLAY first for lightweight game scenes
- Phaser only later if complex tilemaps / combat / heavy 2D game systems become necessary
- Plain CSS / design tokens first before adding heavy UI dependencies

React should handle text-heavy study screens, forms, lists, MCQs, SEQs, cases, SRS, and settings.

KAPLAY should handle living island scenes, animated hero panels, reward animations, forest growth, danger zones, and simple game-feel interactions.

Do **not** put the entire study app inside KAPLAY/Phaser. The study app must remain readable, accessible, and maintainable.

## Design Direction

Follow the generated visual direction:

- tropical pixel-art island aesthetic
- ocean blue / teal background
- lush green forest accents
- warm parchment task cards
- sand / beige panels
- coral or red for danger / weak topics
- purple for SRS
- rounded mobile-first cards
- chunky but readable game-like headings
- high legibility for medical study content

Keep the UI mobile-first. Seran mainly uses mobile.

Avoid overloading screens. Beautiful, clear, fast.

## Phase 1 Scope

Phase 1 is **not** a full RPG.

Phase 1 should deliver:

1. A safe Vite + React + KAPLAY scaffold.
2. A KDU Finals Island home screen shell.
3. A dashboard that preserves the current study structure:
   - exam countdown
   - Continue Learning
   - Today's Survival Tasks
   - 20 Daily MCQs
   - 1 Clinical SEQ or Case
   - Weak Review Clearance
   - Study Forest card
   - Practice Bank stats
   - Written Prep stats
   - Live OSCE stats
   - SRS Scheduler stats
   - Clinical Topic Atlas
   - bottom nav: Today, Papers, Cases, Atlas, Forest, Graph, Review, Sync
4. A small starter asset system, preferably SVG or CSS pixel-art placeholders first.
5. No loss of existing data/storage migration path.

## Data and Migration Rules

Do not casually break the existing KDU save schema. The current app uses IndexedDB/local storage patterns and has MCQ, SEQ, cases, review, and sync logic.

When migrating old features:

- copy or adapt one domain at a time
- keep old logic readable
- write notes when schemas change
- add import/export safety if storage changes
- never discard MCQ/SEQ/case banks unless explicitly instructed

## Coding Workflow Prompts

Use AI as a thinking partner, not just a code generator. For every meaningful coding task, apply these modes internally:

### 1. Refactor without breaking behavior

When refactoring, preserve outputs and public behavior unless the task explicitly requests a behavior change.

Prompt pattern:

```text
Refactor this for readability and maintainability without changing behavior.
```

### 2. Debug with root-cause thinking

When errors appear, identify likely root cause, affected file, and smallest safe fix.

Prompt pattern:

```text
Explain why this may throw, identify the root cause, and suggest the smallest safe fix.
```

### 3. Generate tests for critical logic

For scoring, SRS, storage, sync, and migration code, prefer tests.

Prompt pattern:

```text
Generate unit tests for this function, including edge cases and regression cases.
```

### 4. Write self-documenting code

Use clear names. Add comments only where they explain intent, constraints, or non-obvious decisions.

Prompt pattern:

```text
Add meaningful comments explaining why this exists, not obvious line-by-line comments.
```

### 5. Optimize only after clarity

Do not prematurely optimize UI or algorithms. If optimizing, state the tradeoff.

Prompt pattern:

```text
Optimize this while preserving the same logic and explain the complexity improvement.
```

### 6. Explain framework choices

When using React, Vite, KAPLAY, or Phaser APIs, prefer current official docs and concise examples.

Prompt pattern:

```text
Explain this framework pattern simply, then show the production-ready version.
```

### 7. Translate carefully

When converting old code into the new architecture, preserve functionality first, then improve style.

Prompt pattern:

```text
Convert this old module into the new structure while preserving functionality.
```

### 8. Maintain documentation

When adding major systems, update README or project notes.

Prompt pattern:

```text
Generate concise markdown documentation for this module: purpose, inputs, outputs, and gotchas.
```

### 9. Review every major change

Before committing big changes, review for readability, naming consistency, edge cases, accessibility, and mobile layout.

Prompt pattern:

```text
Review this change for readability, naming, mobile UX, edge cases, and possible regressions.
```

### 10. Build reusable prompt/workflow patterns

Prefer reusable components, utilities, and conventions over one-off hacks.

Prompt pattern:

```text
Turn this into a reusable project pattern so future screens follow the same style.
```

## Development Guardrails

Before editing files:

1. Identify current file structure.
2. Identify whether the change is scaffold, UI-only, data logic, storage, or game engine logic.
3. Avoid mixing unrelated changes in one commit.
4. Prefer small commits with clear messages.
5. Keep the app buildable after each major step.

Before deleting files:

1. Confirm they are unused.
2. Prefer moving/replacing after migration.
3. Mention what rollback path exists.

Before adding dependencies:

1. Explain why the dependency is needed.
2. Prefer lightweight choices.
3. Avoid libraries that complicate mobile performance.

## Current Rebuild Identity

Use these names consistently unless instructed otherwise:

- Product: **KDU Finals Island**
- Repo: **kdu-study-island**
- Old backup repo: **kdu-study**
- Dashboard task card: **Today's Survival Tasks**
- Focus feature: **Study Forest**
- Weak-topic area: **Danger Zones**
- Daily completion: **Safe Day**

## User Preferences

Seran wants fast, practical progress and visual quality. Explanations should be direct. For medical study features, preserve exam orientation and mechanisms. For app-building, move safely but do not over-explain basic coding unless asked.

The user likes the generated tropical pixel-art mockup and wants the rebuild to follow that aesthetic closely.

## Definition of Done for Early Work

A change is not done unless:

- it keeps or improves mobile usability
- it does not destroy the old study workflow
- it has a clear rollback path
- it matches the KDU Finals Island direction
- it is readable enough for future AI/coding agents to continue
