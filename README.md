# DSA in Motion

An interactive data structures and algorithms learning app with 165 questions across 14 topics. It includes selectable brute force, better, and optimal solutions, step-by-step visualizations, synchronized code highlighting, and C++, JavaScript, and Python implementations.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Deploy on Cloudflare Pages

Configure the Cloudflare Pages project with:

- **Build command:** `npm run build`
- **Build output directory:** `react-build`
- **Root directory:** `/` (the repository root)

The build creates the production site in `react-build/`. The former checked-in `dist/` site has been removed. The trace definitions needed by the React application now live in `src/reference-traces/` and are bundled during the build.

## Features

- 165 questions organized into 14 topics, with search and filters.
- Brute force, better, and optimal approaches with complexity explanations.
- Step-by-step algorithm animations with synchronized code-line highlighting and playback controls.
- Array, matrix, graph, tree, linked-list, pointer, interval, and other visualizations.
- C++, JavaScript, and Python solutions with syntax highlighting.
- Topic lessons, concept labs, quizzes, and editable examples.
- Browser-local bookmarks, progress, notes, and theme preference.
- Responsive layouts, DM Sans typography, and reduced-motion support.

## Project structure

- `src/app/` — application shell, navigation, and theme provider.
- `src/components/` — pages, code viewer, visualizers, and UI components.
- `src/hooks/` — animation playback and concept-lab state.
- `src/data/` — question, topic, curriculum, and solution data.
- `src/algorithms/traceRegistry.ts` — typed trace generation and normalization.
- `src/reference-traces/` — reference trace and concept-lab definitions used by the visualizers.
- `src/types/` — application, problem, and animation contracts.
- `react-build/` — generated production output; excluded from Git.

## Development checks

```bash
npm run typecheck
npm run test
npm run e2e
npm run build
```

## Data and attribution

Question titles, order, difficulty, and source links are based on the [Namaste DSA Sheet](https://namastedev.com/namaste-dsa-sheet) (retrieved November 3, 2026). The visual reference is [hft.md](https://hft.md/). Explanatory text, visualizers, UI, and solution code were authored for this app. This independent project is not affiliated with either source.

The sheet's “Second Largest” row links to a digit-string problem. This app follows the linked problem and explains the mismatch.

Offline syntax highlighting uses highlight.js (BSD-3-Clause), included as an npm dependency. The app has no backend, account system, online judge, or arbitrary code execution. Some judge submissions require standard headers or judge-provided node types, as noted in the code viewer.