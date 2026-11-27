import type { ArrayFrame } from "@/types/animation";
import { ArrowDown } from "lucide-react";
import { useLayoutEffect, useMemo, useRef } from "react";

export type ArrayVisualVariant = "array" | "string" | "binary-search" | "sliding-window" | "dp-array";

const EMPTY_VALUES: unknown[] = [];

function stableValueKey(value: unknown): string {
  try { return `${typeof value}:${JSON.stringify(value)}`; }
  catch { return `${typeof value}:${String(value)}`; }
}

const POINTER_VAR_RE = /^(i|j|k|l|r|left|right|lo|hi|low|high|mid|slow|fast|start|end|read|write|w|p1|p2|buy|sell|minPriceDay|day)$/i;

export function ArrayVisualizer({
  array,
  variant = "array",
  vars,
}: {
  array: ArrayFrame;
  variant?: ArrayVisualVariant;
  vars?: Record<string, unknown>;
}) {
  const values = array.values ?? EMPTY_VALUES;
  const trackRef = useRef<HTMLDivElement>(null);
  const previousRects = useRef(new Map<string, DOMRect>());

  // Merge explicit pointers with index-valued pointer vars so Two Pointers,
  // Sliding Window, and Binary Search ALWAYS show visible pointer badges.
  const mergedPointers = useMemo(() => {
    const out: Record<string, number> = { ...(array.pointers ?? {}) };
    if (Object.keys(out).length === 0 && vars && values.length > 0) {
      for (const [key, val] of Object.entries(vars)) {
        if (POINTER_VAR_RE.test(key) && typeof val === "number" && Number.isInteger(val) && val >= 0 && val < values.length) {
          out[key] = val;
        }
      }
    }
    return out;
  }, [array.pointers, vars, values.length]);

  const valueKeys = useMemo(() => {
    const occurrences = new Map<string, number>();
    return values.map((value) => {
      const base = stableValueKey(value);
      const occurrence = occurrences.get(base) ?? 0;
      occurrences.set(base, occurrence + 1);
      return `${base}#${occurrence}`;
    });
  }, [array.values]);

  const hasPointers = Object.keys(mergedPointers).length > 0;

  const inferredRange = useMemo<[number, number] | undefined>(() => {
    if (array.range) return array.range;
    const lo = mergedPointers.lo ?? mergedPointers.low ?? mergedPointers.left ?? mergedPointers.l ?? mergedPointers.L ?? mergedPointers.start;
    const hi = mergedPointers.hi ?? mergedPointers.high ?? mergedPointers.right ?? mergedPointers.r ?? mergedPointers.R ?? mergedPointers.end;
    if (typeof lo === "number" && typeof hi === "number" && lo <= hi) return [lo, hi];
    return undefined;
  }, [array.range, mergedPointers]);

  // FLIP animation for swapped/shifted cells
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cells = Array.from(track.querySelectorAll<HTMLElement>("[data-motion-key]"));
    const nextRects = new Map<string, DOMRect>();
    const animations: { node: HTMLElement; x: number; y: number }[] = [];
    for (const cell of cells) {
      const key = cell.dataset.motionKey;
      if (!key) continue;
      const rect = cell.getBoundingClientRect();
      const previous = previousRects.current.get(key);
      if (previous && (Math.abs(previous.left - rect.left) > 1 || Math.abs(previous.top - rect.top) > 1)) {
        animations.push({ node: cell, x: previous.left - rect.left, y: previous.top - rect.top });
      }
      nextRects.set(key, rect);
    }
    previousRects.current = nextRects;
    if (animations.length) {
      for (const { node, x, y } of animations) {
        node.style.transition = "none";
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      void track.offsetHeight;
      const raf = window.requestAnimationFrame(() => {
        for (const { node } of animations) {
          node.style.transition = "";
          node.style.transform = "";
        }
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [valueKeys]);

  const variantHint =
    variant === "binary-search"
      ? "dimmed = eliminated half · highlighted = active [lo..hi] range"
      : variant === "sliding-window"
        ? "highlighted = active [L..R] window"
        : variant === "string"
          ? "character tiles · 0-indexed"
          : variant === "dp-array"
            ? "1D DP state table · dp[i]"
            : hasPointers
              ? "↓ shows active pointers"
              : "";

  return (
    <section className={`viz-panel array-variant-${variant}`}>
      <h3>
        {array.label ?? "Values"}
        {variantHint && <span className="viz-legend">{variantHint}</span>}
      </h3>
      {values.length ? (
        <div ref={trackRef} className="array-track-wrap">
          <div className="array-track" role="list" aria-label={array.label ?? "Array values"}>
            {values.map((value, index) => {
              const pointers = Object.entries(mergedPointers)
                .filter(([, valueIndex]) => valueIndex === index)
                .map(([name]) => name);
              const inRange = inferredRange ? index >= inferredRange[0] && index <= inferredRange[1] : false;
              const isEliminated = variant === "binary-search" && inferredRange !== undefined && !inRange;
              const state = array.active?.includes(index)
                ? "active"
                : array.done?.includes(index)
                  ? "done"
                  : inRange
                    ? "in-range"
                    : isEliminated
                      ? "eliminated"
                      : "";
              return (
                <div className="array-slot" key={valueKeys[index]}>
                  <div className="cell-pointer-stack" aria-hidden="true">
                    {pointers.map((name) => (
                      <span key={name} className={`cell-ptr-badge ptr-${name.toLowerCase()}`}>
                        {name}
                        <ArrowDown size={11} strokeWidth={2.5} />
                      </span>
                    ))}
                  </div>
                  <div
                    className={`array-cell ${state}`}
                    data-motion-key={valueKeys[index]}
                    data-cell-index={index}
                    role="listitem"
                    aria-label={`${array.label ?? "Value"} index ${index}: ${String(value)}${pointers.length ? `, ${pointers.join(", ")}` : ""}`}
                  >
                    <strong>{String(value)}</strong>
                    <small>{variant === "dp-array" ? `dp[${index}]` : `[${index}]`}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="empty-state">This collection is empty at this step.</p>
      )}
    </section>
  );
}
