import type { AnimationFrame, ArrayFrame } from "@/types/animation";
import { classifyDataStructure, type DataStructureKind } from "@/algorithms/dsClassifier";
import { ArrayVisualizer } from "./visualizers/ArrayVisualizer";
import { LinkedListVisualizer } from "./visualizers/LinkedListVisualizer";
import { StackQueueVisualizer } from "./visualizers/StackQueueVisualizer";
import { TreeVisualizer } from "./visualizers/TreeVisualizer";
import { GraphVisualizer } from "./visualizers/GraphVisualizer";
import { MatrixDPVisualizer } from "./visualizers/MatrixDPVisualizer";
import { BacktrackingVisualizer } from "./visualizers/BacktrackingVisualizer";

export function isResultArrayLabel(label = "") {
  return /result|output|answer|merged|moved values|sorted visits|window maxima|itinerary|topological order|partition lengths|days to wait|valid prefix|unique|retained prefix|kept values/i.test(label);
}

interface VisualizerRouterProps {
  problemName: string;
  frame: AnimationFrame;
  dsKind?: DataStructureKind;
}

export function VisualizerRouter({ problemName, frame, dsKind }: VisualizerRouterProps) {
  const meta = classifyDataStructure(problemName);
  const kind = dsKind ?? meta.kind;
  const nonResultArrays = (frame.arrays ?? []).filter((arr) => !isResultArrayLabel(arr.label));

  // 1. Tree / BST / Heap
  if (kind === "tree" || kind === "bst" || kind === "heap") {
    const isHeap = kind === "heap";
    const isBst = kind === "bst";
    const heapArray = isHeap
      ? nonResultArrays.find((a) => /heap|pq|priority|stones|nums/i.test(a.label ?? "")) ?? nonResultArrays[0]
      : undefined;
    const hasNodes = Boolean(frame.nodes?.length);

    return (
      <div className="visual-frame-stack graph-frame-stack">
        <div className="graph-support-layout">
          <TreeVisualizer
            nodes={hasNodes ? frame.nodes : undefined}
            edges={hasNodes ? frame.edges : undefined}
            heapArray={!hasNodes ? heapArray : undefined}
            label={frame.graphLabel ?? meta.shortLabel}
            isBst={isBst}
            isHeap={isHeap}
          />
          {nonResultArrays.length > 0 && (
            <div className="graph-support-arrays" aria-label="Supporting traversal state">
              {nonResultArrays.map((arr, idx) =>
                /stack|queue|bfs|dfs/i.test(arr.label ?? "") ? (
                  <StackQueueVisualizer array={arr} key={`${arr.label ?? "sq"}-${idx}`} />
                ) : (
                  <ArrayVisualizer array={arr} variant="array" key={`${arr.label ?? "arr"}-${idx}`} />
                )
              )}
            </div>
          )}
        </div>
        {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
      </div>
    );
  }

  // 2. Graph (or any frame with explicit nodes/edges)
  if (kind === "graph" || frame.nodes?.length) {
    return (
      <div className="visual-frame-stack graph-frame-stack">
        <div className="graph-support-layout">
          <GraphVisualizer nodes={frame.nodes ?? []} edges={frame.edges ?? []} label={frame.graphLabel} />
          {nonResultArrays.length > 0 && (
            <div className="graph-support-arrays" aria-label="Supporting traversal state">
              {nonResultArrays.map((arr, idx) =>
                /queue|stack|frontier/i.test(arr.label ?? "") ? (
                  <StackQueueVisualizer array={arr} key={`${arr.label ?? "sq"}-${idx}`} />
                ) : (
                  <ArrayVisualizer array={arr} variant="array" key={`${arr.label ?? "arr"}-${idx}`} />
                )
              )}
            </div>
          )}
        </div>
        {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
      </div>
    );
  }

  // 3. Linked List
  if (kind === "linked-list") {
    const isReversing = /reverse/i.test(problemName) || /reverse/i.test(frame.title ?? "");
    const hasCycle = /cycle/i.test(problemName) && /cycle|meet|detected/i.test(`${frame.title ?? ""} ${frame.message ?? ""}`);
    return (
      <div className="visual-frame-stack">
        {nonResultArrays.map((arr, idx) => (
          <LinkedListVisualizer
            key={`${arr.label ?? "ll"}-${idx}`}
            array={arr}
            reversed={isReversing}
            hasCycle={hasCycle}
          />
        ))}
        {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
      </div>
    );
  }

  // 4. Stack & Queues
  if (kind === "stack-queue") {
    const stackQueueArrays: ArrayFrame[] = [];
    const inputArrays: ArrayFrame[] = [];
    for (const arr of nonResultArrays) {
      if (/stack|queue|deque|min|s1|s2|q1|q2|bracket|mono/i.test(arr.label ?? "")) {
        stackQueueArrays.push(arr);
      } else {
        inputArrays.push(arr);
      }
    }
    const primaryIsQueue = /queue|rotting/i.test(problemName);
    return (
      <div className="visual-frame-stack">
        {inputArrays.map((arr, idx) => (
          <ArrayVisualizer array={arr} variant="array" key={`in-${arr.label ?? idx}-${idx}`} />
        ))}
        {stackQueueArrays.length > 0 ? (
          <div className="sq-pair-grid">
            {stackQueueArrays.map((arr, idx) => (
              <StackQueueVisualizer
                key={`sq-${arr.label ?? idx}-${idx}`}
                array={arr}
                mode={/queue|q1|q2/i.test(arr.label ?? "") ? "queue" : /stack|s1|s2|min/i.test(arr.label ?? "") ? "stack" : primaryIsQueue ? "queue" : "stack"}
              />
            ))}
          </div>
        ) : (
          !inputArrays.length && !frame.matrix && <p className="empty-state">No stack or queue items yet.</p>
        )}
        {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
      </div>
    );
  }

  // 5. Backtracking
  if (kind === "backtracking") {
    return (
      <div className="visual-frame-stack">
        {nonResultArrays.length > 0 && <BacktrackingVisualizer arrays={nonResultArrays} vars={frame.vars} />}
        {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
      </div>
    );
  }

  // 6. Dynamic Programming / Matrix
  if (kind === "dp-matrix") {
    return (
      <div className="visual-frame-stack">
        {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
        {nonResultArrays.map((arr, idx) => (
          <ArrayVisualizer
            array={arr}
            variant={/dp|memo|ways|cost|table|tails/i.test(arr.label ?? "") ? "dp-array" : "array"}
            key={`${arr.label ?? "dp"}-${idx}`}
          />
        ))}
      </div>
    );
  }

  // 7. Array, String, Binary Search, Sliding Window, Greedy
  const arrayVariant =
    kind === "binary-search"
      ? "binary-search"
      : kind === "sliding-window"
        ? "sliding-window"
        : kind === "string"
          ? "string"
          : "array";

  return (
    <div className="visual-frame-stack">
      {nonResultArrays.map((arr, idx) => (
        <ArrayVisualizer array={arr} variant={arrayVariant} key={`${arr.label ?? "array"}-${idx}`} />
      ))}
      {frame.matrix && <MatrixDPVisualizer matrix={frame.matrix} />}
    </div>
  );
}
