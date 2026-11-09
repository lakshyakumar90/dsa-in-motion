# DSA in Motion

An interactive DSA learning app with 165 questions across 14 topics, solution approaches, code in three languages, and step-by-step visualizations. The React application is built with TypeScript, Vite, Tailwind CSS, Radix UI primitives, and local shadcn-style components.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Vite prints the local URL after startup. To create and preview the production build:

```bash
npm run build
npm run preview
```

The production build is written to `react-build/`. It intentionally does not overwrite `dist/`, which remains the existing vanilla application and its reference trace source.

## Project structure

- `src/app/` — hash navigation, app shell, and theme provider.
- `src/components/` — page layouts, code viewer, visualizers, and reusable UI primitives.
- `src/hooks/` — React playback and concept-lab state.
- `src/data/` — question, topic, curriculum, and solution data.
- `src/algorithms/traceRegistry.ts` — typed boundary for loading and normalizing trace output.
- `src/types/` — application, problem, and animation contracts.
- `dist/` — preserved legacy app, reference algorithm traces, and concept-lab definitions.
- `react-build/` — generated output (ignored by Git).

The React pages, state, controls, and visualization rendering are implemented in TypeScript. The original problem-trace and concept-lab definitions remain JavaScript in `dist/` and are loaded by the typed trace adapter to preserve their exact logic and emitted frames. They do not render or control the React UI. This boundary keeps animation behavior faithful while retaining the legacy app as a runnable reference.

## Features

- 165 source questions, grouped into 14 topics, with difficulty, company tags, and practice/editorial/video links.
- Search and filters for question, topic, company, difficulty, completion, and bookmarks.
- Topic lessons, invariants, pitfalls, quizzes, and interactive concept models.
- Problem descriptions and selectable brute-force, better, and optimal approaches.
- A distinction between exact execution traces and conceptual walkthroughs for non-optimal approaches.
- React animation controls: play/pause, restart, previous/next, timeline, speed, and editable example inputs.
- Array, matrix, graph, pointer, linked-list, interval, stack, tree, and other concept visualizations.
- C++, JavaScript, and Python code with syntax highlighting, line numbers, copy, and wrapping controls.
- Browser-local completion, bookmarks, personal notes, and a persistent light/dark theme.
- A self-hosted DM Sans typeface, shared type and spacing scales, responsive layouts, and reduced-motion support.

## Validation

```bash
npm run typecheck
npm run test
npm run e2e
npm run build
```

Unit tests compare generated frames and outputs against all 165 preserved reference traces and exercise the concept models. Playwright covers question browsing, approach selection, playback, theme persistence, topic lessons, and common viewport widths.

## Data and attribution

Question titles, order, difficulty, and source links: [Namaste DSA Sheet](https://namastedev.com/namaste-dsa-sheet) (retrieved November 3, 2026). Visual reference: [hft.md](https://hft.md/). Explanatory text, visualizers, UI, and solution code were authored for this app. This independent project is not affiliated with either source.

The sheet's “Second Largest” row links to a digit-string problem. The app follows the linked problem and explains the mismatch.

Offline syntax highlighting uses highlight.js (BSD-3-Clause); see `dist/highlight-LICENSE.txt`. No backend, account, online judge, or arbitrary code execution is used. Some judge submissions require standard headers or judge-provided node types, as noted in the code viewer.
