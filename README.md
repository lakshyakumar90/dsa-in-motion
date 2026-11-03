# DSA in Motion

A buildless, responsive learning app inspired by hft.md and organized around the 165-question Namaste DSA Sheet.

## Run locally

From this directory, run `python -m http.server 4173 --directory dist`, then open http://localhost:4173.

The deployable app is in `dist/`; there is no build step or package installation. Serve it over HTTP rather than opening index.html as a local file.

## Included

- All 165 source questions across 14 topics, with source practice/editorial/video links.
- Independently written statements, examples, approaches, complexity notes, and C++, JavaScript, and Python functions.
- 14 concept lessons with invariants, pitfalls, and short checks.
- 13 interactive pattern labs with editable inputs, replay, stepping, scrubbing, speed controls, and draggable SVG views.
- Search by question/company/topic, difficulty and topic filters, bookmarks, completion, personal notes, and light/dark themes.
- Browser-local progress; no account or cross-device synchronization.

Labs demonstrate selected algorithms and topic patterns. Each question page identifies whether the lab matches its exact algorithm or is a related topic example. There is no arbitrary code execution or online judge; copy solutions into the linked practice environment. Judge node classes and standard language setup may be required as noted in the UI.

## Verification

All 165 solutions have content and three implementations. Python/JavaScript syntax checks passed, and all C++ snippets compiled with standard judge node stubs under C++14. Representative examples and randomized tests passed across topics. The app's 13 lab trace generators passed coverage checks, including 100 randomized rain-water maps. Browser checks covered navigation, search, language switching, custom inputs, saved notes/progress, mobile layout, and playback.

This is not an exhaustive proof of every solution on every judge. Check the problem's constraints and provided function signature when submitting.

## Sources

Question titles/order/difficulty/source links: https://namastedev.com/namaste-dsa-sheet (retrieved November 3, 2026).
Visual reference: https://hft.md/.
Original explanatory text, visualizers, UI implementation, and solution code authored for this app. Independent project; not affiliated with either source.

The source sheet's “Second Largest” row links to a digit-string problem. This app follows that linked problem and explains the mismatch.
