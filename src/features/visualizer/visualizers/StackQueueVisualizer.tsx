import type { ArrayFrame } from "@/types/animation";

interface StackQueueVisualizerProps {
  array: ArrayFrame;
  mode?: "stack" | "queue";
}

function detectMode(label = "", explicit?: "stack" | "queue"): "stack" | "queue" {
  if (explicit) return explicit;
  if (/queue|bfs|deque|front|rear/i.test(label)) return "queue";
  return "stack";
}

export function StackQueueVisualizer({ array, mode }: StackQueueVisualizerProps) {
  const values = array.values ?? [];
  const resolvedMode = detectMode(array.label, mode);

  if (resolvedMode === "stack") {
    const reversed = [...values].map((value, origIdx) => ({ value, origIdx })).reverse();
    return (
      <section className="viz-panel sq-viz-panel sq-stack-panel" aria-label={array.label ?? "Stack"}>
        <h3>
          {array.label ?? "Stack"}
          <span className="viz-legend">LIFO · push & pop at TOP</span>
        </h3>
        {reversed.length ? (
          <div className="sq-stack-well" role="list" aria-label={`${array.label ?? "Stack"} elements`}>
            {reversed.map(({ value, origIdx }, visualIdx) => {
              const isTop = visualIdx === 0;
              const isActive = array.active?.includes(origIdx) || isTop;
              const isDone = array.done?.includes(origIdx);
              return (
                <div
                  key={`${origIdx}-${String(value)}`}
                  role="listitem"
                  className={`sq-stack-item${isTop ? " is-top" : ""}${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                >
                  <span className="sq-slot-idx">#{origIdx}</span>
                  <strong>{String(value)}</strong>
                  {isTop && <span className="sq-badge">TOP</span>}
                </div>
              );
            })}
            <div className="sq-stack-base">BOTTOM</div>
          </div>
        ) : (
          <div className="sq-empty-well">Stack is empty</div>
        )}
      </section>
    );
  }

  return (
    <section className="viz-panel sq-viz-panel sq-queue-panel" aria-label={array.label ?? "Queue"}>
      <h3>
        {array.label ?? "Queue"}
        <span className="viz-legend">FIFO · dequeue FRONT ← enqueue REAR</span>
      </h3>
      {values.length ? (
        <div className="sq-queue-lane-wrap">
          <span className="sq-edge-tag front">FRONT ←</span>
          <div className="sq-queue-lane" role="list" aria-label={`${array.label ?? "Queue"} elements`}>
            {values.map((value, idx) => {
              const isFront = idx === 0;
              const isRear = idx === values.length - 1;
              const isActive = array.active?.includes(idx);
              const isDone = array.done?.includes(idx);
              return (
                <div
                  key={`${idx}-${String(value)}`}
                  role="listitem"
                  className={`sq-queue-item${isFront ? " is-front" : ""}${isRear ? " is-rear" : ""}${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                >
                  <strong>{String(value)}</strong>
                  <small>{isFront ? "front" : isRear ? "rear" : `#${idx}`}</small>
                </div>
              );
            })}
          </div>
          <span className="sq-edge-tag rear">← REAR</span>
        </div>
      ) : (
        <div className="sq-empty-well">Queue is empty</div>
      )}
    </section>
  );
}
