import type { ArrayFrame } from "@/types/animation";

interface BacktrackingVisualizerProps {
  arrays: ArrayFrame[];
  vars?: Record<string, unknown>;
}

export function BacktrackingVisualizer({ arrays, vars }: BacktrackingVisualizerProps) {
  const pathArray = arrays.find((a) => /path|curr|comb|perm|subset|chosen|stack|board|queens/i.test(a.label ?? ""));
  const candidatesArray = arrays.find((a) => a !== pathArray);
  const pathValues = pathArray?.values ?? [];
  const depth = typeof vars?.depth === "number" ? vars.depth : pathValues.length;

  return (
    <div className="bt-visualizer-stack">
      <section className="viz-panel bt-path-panel" aria-label="Active decision path">
        <h3>
          {pathArray?.label ?? "Active Recursion Path"}
          <span className="viz-legend">depth {depth} · choose → explore → undo</span>
        </h3>
        {pathValues.length ? (
          <div className="bt-trail" role="list" aria-label="Current recursion branch">
            <span className="bt-root-pill">ROOT</span>
            {pathValues.map((item, idx) => {
              const isLatest = idx === pathValues.length - 1;
              return (
                <div className="bt-step-wrap" key={`${idx}-${String(item)}`} role="listitem">
                  <span className="bt-branch-arrow" aria-hidden="true">→</span>
                  <div className={`bt-node-chip${isLatest ? " is-active" : ""}`}>
                    <small>D{idx + 1}</small>
                    <strong>{String(item)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bt-trail">
            <span className="bt-root-pill is-active">ROOT [ ]</span>
            <span className="bt-empty-hint">Ready to branch on first choice</span>
          </div>
        )}
      </section>

      {candidatesArray && (
        <section className="viz-panel bt-candidates-panel" aria-label={candidatesArray.label ?? "Candidates"}>
          <h3>
            {candidatesArray.label ?? "Decision Candidates"}
            <span className="viz-legend">highlighted = current branch choice</span>
          </h3>
          <div className="bt-choices-grid" role="list">
            {(candidatesArray.values ?? []).map((val, idx) => {
              const isActive = candidatesArray.active?.includes(idx);
              const isDone = candidatesArray.done?.includes(idx);
              return (
                <div
                  key={`${idx}-${String(val)}`}
                  role="listitem"
                  className={`bt-choice-card${isActive ? " is-active" : isDone ? " is-done" : ""}`}
                >
                  <strong>{String(val)}</strong>
                  <small>idx {idx}</small>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
