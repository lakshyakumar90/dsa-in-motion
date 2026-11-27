import type { ArrayFrame } from "@/types/animation";

interface LinkedListVisualizerProps {
  array: ArrayFrame;
  reversed?: boolean;
  hasCycle?: boolean;
}

export function LinkedListVisualizer({ array, reversed = false, hasCycle = false }: LinkedListVisualizerProps) {
  const values = array.values ?? [];
  const pointers = array.pointers ?? {};
  const pointerEntries = Object.entries(pointers);

  return (
    <section className="viz-panel ll-viz-panel" aria-label={array.label ?? "Linked List"}>
      <h3>
        {array.label ?? "Linked List"}
        <span className="viz-legend">node [val | next] · pointer rewiring</span>
      </h3>
      {values.length ? (
        <div className="ll-scroll">
          <div className="ll-chain" role="list" aria-label={`${array.label ?? "Linked List"} nodes`}>
            {values.map((val, idx) => {
              const nodePtrs = pointerEntries
                .filter(([, pIdx]) => pIdx === idx)
                .map(([name]) => name);
              const isActive = array.active?.includes(idx);
              const isDone = array.done?.includes(idx);
              const stateClass = isActive ? "is-active" : isDone ? "is-done" : "";

              return (
                <div className="ll-segment" key={`${idx}-${String(val)}`} role="listitem">
                  <div className={`ll-node-wrap ${stateClass}`}>
                    {nodePtrs.length > 0 && (
                      <div className="ll-pointer-stack" aria-label={`Pointers at node ${idx}: ${nodePtrs.join(", ")}`}>
                        {nodePtrs.map((name) => (
                          <span key={name} className={`ll-ptr-tag ptr-${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`}>
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="ll-node">
                      <div className="ll-node-val">
                        <strong>{String(val)}</strong>
                        <small>#{idx}</small>
                      </div>
                      <div className="ll-node-next" aria-hidden="true">
                        <span className="ll-next-dot" />
                        <small>next</small>
                      </div>
                    </div>
                  </div>
                  {idx < values.length - 1 && (
                    <div className={`ll-connector ${reversed && isDone ? "is-reversed" : isActive ? "is-active" : ""}`} aria-hidden="true">
                      <svg width="34" height="18" viewBox="0 0 34 18">
                        <line x1="2" y1="9" x2="26" y2="9" stroke="currentColor" strokeWidth="2" />
                        <polyline points="21,4 28,9 21,14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="ll-connector" aria-hidden="true">
              <svg width="26" height="18" viewBox="0 0 26 18">
                <line x1="2" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 3" />
                <polyline points="15,5 21,9 15,13" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <div className={`ll-null-badge ${hasCycle ? "is-cycle" : ""}`}>
              {hasCycle ? "↺ CYCLE" : "NULL"}
            </div>
          </div>
        </div>
      ) : (
        <p className="empty-state">Empty list (head → NULL)</p>
      )}
    </section>
  );
}
