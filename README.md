# DSA in Motion

Hosted as a static site on GitHub Pages. Pushes to `main` deploy the `dist/` directory through the included GitHub Actions workflow. All asset URLs are relative, so repository Pages paths work without a build step.


A buildless, responsive learning app inspired by hft.md and organized around the 165-question Namaste DSA Sheet.

## Run locally

From this directory, run `python -m http.server 4173 --directory dist`, then open http://localhost:4173.

The deployable app is in `dist/`; there is no build step or package installation. Serve it over HTTP rather than opening index.html as a local file.

## Included

- All 165 source questions across 14 topics, with source practice/editorial/video links.
- Independently written statements, examples, approaches, complexity notes, and C++, JavaScript, and Python functions.
- 14 concept lessons with invariants, pitfalls, and short checks.
- 165 exact problem animations with editable JSON examples, meaningful state changes, replay, stepping, scrubbing, speed controls, and keyboard shortcuts.
- Searchable topic/question sidebar with current-question highlighting, independent scroll, live progress indicators, and a mobile drawer.
- All 495 snippets formatted with Prettier, Black, and clang-format; offline syntax highlighting, line numbers, copy, and optional wrapping.
- Search by question/company/topic, difficulty and topic filters, bookmarks, completion, personal notes, and light/dark themes.
- Browser-local progress; no account or cross-device synchronization.

Every question runs its own problem-specific animation. Topic pages use representative exact-question examples. The animation library exposes all 165 questions. There is no arbitrary code execution or online judge; copy solutions into the linked practice environment. Judge node classes and standard language setup may be required as noted in the UI.

## Verification

All 165 solutions have content and three implementations. Python/JavaScript syntax checks passed, and all C++ snippets compiled with standard judge node stubs under C++14. Representative examples and randomized tests passed across topics. All 165 default problem traces pass. All 2,006 emitted frames render, all 165 question routes load, all 495 code tabs preserve the displayed source, and all 14 topic routes and the full animation library pass DOM integration checks. Thousands of independent randomized comparisons cover search, pointers, lists, strings, greedy, heaps, DP and graph algorithms. Python formatting preserves each snippet's parsed AST. Browser checks covered navigation, search, language switching, custom inputs, saved notes/progress, mobile layout, and playback.

This is not an exhaustive proof of every solution on every judge. Check the problem's constraints and provided function signature when submitting.

## Sources

Question titles/order/difficulty/source links: https://namastedev.com/namaste-dsa-sheet (retrieved November 3, 2026).
Visual reference: https://hft.md/.
Original explanatory text, visualizers, UI implementation, and solution code authored for this app. Independent project; not affiliated with either source.

The source sheet's “Second Largest” row links to a digit-string problem. This app follows that linked problem and explains the mismatch.

## Client dependencies

Offline syntax highlighting uses highlight.js (BSD-3-Clause); see `dist/highlight-LICENSE.txt`. Formatters and bundling tools are authoring-only; the published app needs no package installation.

Live site: https://lakshyakumar90.github.io/dsa-in-motion/

