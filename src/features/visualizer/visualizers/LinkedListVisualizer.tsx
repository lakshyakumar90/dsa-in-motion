import type { ArrayFrame, GraphEdge, GraphNode } from "@/types/animation";

interface LinkedListVisualizerProps {
  array?: ArrayFrame;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  vars?: Record<string, unknown>;
  label?: string;
  reversed?: boolean;
  hasCycle?: boolean;
}

export function LinkedListVisualizer({
  array,
  nodes,
  edges,
  vars,
  label,
  reversed = false,
  hasCycle = false,
}: LinkedListVisualizerProps) {
  // Support BOTH array-encoded lists AND node/edge-encoded lists (like Reverse Linked List)
  const items = nodes?.length
    ? nodes.map((n, idx) => ({
        id: String(n.id),
        value: n.label,
        index: idx,
        isActive: n.state === "active",
        isDone: n.state === "done" || n.state === "visited",
      }))
    : (array?.values ?? []).map((val, idx) => ({
        id: String(idx),
        value: String(val),
        index: idx,
        isActive: Boolean(array?.active?.includes(idx)),
        isDone: Boolean(array?.done?.includes(idx)),
      }));

  // Combine explicit array pointers with pointer variables from frame.vars
  const pointersByIdx = new Map<number, string[]>();
  const addPtr = (idx: number, name: string) => {
    if (idx < 0 || idx >= items.length) return;
    const list = pointersByIdx.get(idx) ?? [];
    if (!list.includes(name)) list.push(name);
    pointersByIdx.set(idx, list);
  };

  for (const [name, idx] of Object.entries(array?.pointers ?? {})) {
    if (typeof idx === "number") addPtr(idx, name);
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      if (!/^(head|tail|prev|curr|current|next|slow|fast|p1|p2|left|right|node|ptr)$/i.test(k)) continue;
      if (typeof v === "number" && Number.isInteger(v)) {
        // Treat integer pointer vars as 0-based node indices first
        if (v >= 0 && v < items.length) addPtr(v, k);
        else {
          const byVal = items.findIndex((it) => it.value === String(v));
          if (byVal >= 0) addPtr(byVal, k);
        }
      } else if (typeof v === "string") {
        const byVal = items.findIndex((it) => it.value === v || it.id === v);
        if (byVal >= 0) addPtr(byVal, k);
      }
    }
  }

  // Detect reversed edges or cycle edges when nodes/edges are supplied
  const edgeMap = new Map<number, { reversed: boolean; active: boolean }>();
  let detectedCycle = hasCycle;
  if (nodes?.length && edges?.length) {
    const idToIdx = new Map(nodes.map((n, i) => [String(n.id), i]));
    for (const e of edges) {
      const from = idToIdx.get(String(e.from));
      const to = idToIdx.get(String(e.to));
      if (from === undefined || to === undefined) continue;
      if (to < from - 1) detectedCycle = true;
      if (to === from - 1) {
        edgeMap.set(to, { reversed: true, active: e.state === "active" || e.state === true });
      } else if (to === from + 1) {
        edgeMap.set(from, { reversed: false, active: e.state === "active" || e.state === true });
      }
    }
  }

  const title = label ?? array?.label ?? "Linked List";

  return (
    <section className="viz-panel ll-viz-panel" aria-label={title}>
      <h3>
        {title}
        <span className="viz-legend">node [val | next] · pointer rewiring</span>
      </h3>
      {items.length ? (
        <div className="ll-scroll">
          <div className="ll-chain" role="list" aria-label={`${title} nodes`}>
            {items.map((item, idx) => {
              const nodePtrs = pointersByIdx.get(idx) ?? [];
              const stateClass = item.isActive ? "is-active" : item.isDone ? "is-done" : "";
              const edgeInfo = edgeMap.get(idx);
              const isEdgeReversed = edgeInfo ? edgeInfo.reversed : reversed && item.isDone;
              const isEdgeActive = edgeInfo ? edgeInfo.active : item.isActive;

              return (
                <div className="ll-segment" key={`${item.id}-${idx}`} role="listitem">
                  <div className={`ll-node-wrap ${stateClass}`}>
                    <div className="ll-pointer-row" aria-label={nodePtrs.length ? `Pointers: ${nodePtrs.join(", ")}` : undefined}>
                      {nodePtrs.map((name) => (
                        <span key={name} className={`ll-ptr-tag ptr-${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`}>
                          {name} ↓
                        </span>
                      ))}
                    </div>
                    <div className="ll-node">
                      <div className="ll-node-val">
                        <strong>{item.value}</strong>
                        <small>#{idx}</small>
                      </div>
                      <div className="ll-node-next" aria-hidden="true">
                        <span className="ll-next-dot" />
                        <small>next</small>
                      </div>
                    </div>
                  </div>
                  {idx < items.length - 1 && (
                    <div className={`ll-connector ${isEdgeReversed ? "is-reversed" : isEdgeActive ? "is-active" : ""}`} aria-hidden="true">
                      <svg width="36" height="20" viewBox="0 0 36 20">
                        <line x1="2" y1="10" x2="28" y2="10" stroke="currentColor" strokeWidth="2.2" />
                        <polyline points="22,4 30,10 22,16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="ll-connector" aria-hidden="true">
              <svg width="26" height="20" viewBox="0 0 26 20">
                <line x1="2" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
                <polyline points="15,5 21,10 15,15" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </div>
            <div className={`ll-null-badge ${detectedCycle ? "is-cycle" : ""}`}>
              {detectedCycle ? "↺ CYCLE" : "NULL"}
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-state">Empty list (head → NULL)</p>
      )}
    </section>
  );
}
