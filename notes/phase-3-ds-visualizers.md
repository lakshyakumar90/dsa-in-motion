# Phase 3: Data-Structure-Specific Visualizers

## Architecture
Created `src/algorithms/dsClassifier.ts` to map all 165 problems across 14 topics to their canonical visualization paradigm, and built `src/features/visualizer/VisualizerRouter.tsx` to dispatch frames to 7 specialized visualizers:

1. **ArrayVisualizer (`array`, `string`, `binary-search`, `sliding-window`, `dp-array`)**
   - FLIP-animated contiguous cells with multi-lane pointer arrows.
   - Binary Search dims eliminated halves outside `[lo..hi]`.
   - Sliding Window highlights the active `[L..R]` range.
   - 1D DP renders `dp[i]` indexed labels.
2. **LinkedListVisualizer (`linked-list`)**
   - Split `[val | next]` node boxes with `#idx` tags, animated SVG arrows, `NULL` / `↺ CYCLE` terminators, and color-coded pointer badges (`head`, `prev`, `curr`, `slow`, `fast`).
3. **StackQueueVisualizer (`stack-queue`)**
   - Vertical LIFO Stack well with glowing `TOP` badge and `BOTTOM` wall.
   - Horizontal FIFO Queue channel with `FRONT ←` and `← REAR` directional tags.
4. **TreeVisualizer (`tree`, `bst`, `heap`)**
   - Hierarchical SVG tree with depth level bands (`L0`, `L1`, `L2`, ...), smooth cubic Bezier parent-child curves, root halo, and automatic Heap array-to-tree dual rendering with `[i]` index annotations.
5. **GraphVisualizer (`graph`)**
   - Directed & undirected graph canvas with weighted edge pills, active/visited state legend, and bottom traversal queue/stack tray.
6. **MatrixDPVisualizer (`dp-matrix`)**
   - Indexed 2D DP/Grid table with `r0..rN` / `c0..cM` headers, active/solved legend, and animated value transitions.
7. **BacktrackingVisualizer (`backtracking`)**
   - Active recursion path breadcrumb trail (`ROOT → D1 → D2 ...`) paired with candidate branch choice cards.
