# Phase 1: Repository Audit, Bug Fixes & Architecture Refactor

## Baseline Audit Summary
- **Repository**: `lakshyakumar90/dsa-in-motion` (React 19, Vite 7, TypeScript 5.9, Tailwind CSS v4, Vitest 3).
- **Curriculum**: 14 topics, 165 questions.
- **Baseline Test Status**: 10/11 passed, **1 failed** (`src/components/visualizer/LogicPanel.test.tsx > does not suggest a source-line match for conceptual traces`).
- **Root Cause of LogicPanel Bug**: `LogicPanel` called `getLogicView` unconditionally even when `mode === "conceptual"`, causing `inferActiveSourceLine` to highlight a C++ line and hiding the conceptual-mode disclaimer.
- **Data Coverage Audit**:
  - `brute` + `optimal` only: 72 questions
  - `better` + `optimal` only: 86 questions
  - `brute` + `optimal` + `optimal` (duplicate): 1 question
  - Complete `brute` + `better` + `optimal`: 6 questions
- **CSS Audit**: `src/styles/globals.css` had 864 lines of layered overrides across 5 redesign iterations, with duplicate `:root` declarations and conflicting layout heights.

## Phase 1 Changes
1. Created dedicated `upgrade` branch from `main`.
2. Authored `IMPLEMENTATION_PLAN.md` with 5 structured phases.
3. Reorganized `src/` into feature-first folders (`src/features/{home,questions,topics,problems,notes,playground,visualizer/visualizers}`, `src/components/{layout,shared,ui}`, `src/styles/{tokens,layout,components,visualizer,globals}.css`).
4. Fixed `LogicPanel.tsx` conceptual-mode handling so line highlighting is suppressed and the explicit disclaimer is rendered when `mode === "conceptual"`.
