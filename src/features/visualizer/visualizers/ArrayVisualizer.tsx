import type { ArrayFrame } from "@/types/animation";
import { ArrowDown } from "lucide-react";
import { useLayoutEffect, useMemo, useRef } from "react";

export type ArrayVisualVariant = "array" | "string" | "binary-search" | "sliding-window" | "dp-array";

interface PointerPosition { x: number; y: number }
const EMPTY_VALUES: unknown[] = [];

function stableValueKey(value: unknown): string {
  try { return `${typeof value}:${JSON.stringify(value)}`; }
  catch { return `${typeof value}:${String(value)}`; }
}

export function ArrayVisualizer({ array, variant = "array" }: { array: ArrayFrame; variant?: ArrayVisualVariant }) {
  const values = array.values ?? EMPTY_VALUES;
  const trackRef = useRef<HTMLDivElement>(null);
  const previousRects = useRef(new Map<string, DOMRect>());
  const firstPointerLayout = useRef(true);
  const pointerSignature = JSON.stringify(array.pointers ?? {});
  const valueKeys = useMemo(() => {
    const occurrences = new Map<string, number>();
    return values.map((value) => {
      const base = stableValueKey(value);
      const occurrence = occurrences.get(base) ?? 0;
      occurrences.set(base, occurrence + 1);
      return `${base}#${occurrence}`;
    });
  }, [array.values]);
  const hasPointers = Object.keys(array.pointers ?? {}).length > 0;

  // Derive active window/search bounds from explicit range or lo/hi / left/right pointers
  const inferredRange = useMemo<[number, number] | undefined>(() => {
    if (array.range) return array.range;
    const p = array.pointers ?? {};
    const lo = p.lo ?? p.low ?? p.left ?? p.l ?? p.L ?? p.start;
    const hi = p.hi ?? p.high ?? p.right ?? p.r ?? p.R ?? p.end;
    if (typeof lo === "number" && typeof hi === "number" && lo <= hi) return [lo, hi];
    return undefined;
  }, [array.range, array.pointers]);

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

  // Multi-lane pointer arrows anchored to cell geometry
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pointerEntries = Object.entries(array.pointers ?? {});
    const positionsPerCell = new Map<number, number>();
    for (const [, index] of pointerEntries) positionsPerCell.set(index, (positionsPerCell.get(index) ?? 0) + 1);
    const pointerLanes = Math.max(1, ...positionsPerCell.values());
    track.style.paddingTop = `${28 + (pointerLanes - 1) * 27}px`;
    const markers = new Map(Array.from(track.querySelectorAll<HTMLElement>("[data-pointer-name]"), (marker) => [marker.dataset.pointerName ?? "", marker]));
    const next = new Map<string, PointerPosition>();
    const laneByCell = new Map<number, number>();
    for (const [name, index] of pointerEntries) {
      const cell = track.querySelector<HTMLElement>(`[data-cell-index="${index}"]`);
      const marker = markers.get(name);
      if (!cell) continue;
      const lane = laneByCell.get(index) ?? 0;
      laneByCell.set(index, lane + 1);
      const position = { x: cell.offsetLeft + cell.offsetWidth / 2, y: cell.offsetTop - 27 - lane * 27 };
      if (marker) {
        if (firstPointerLayout.current) marker.style.transition = "none";
        marker.style.transform = `translate3d(calc(${position.x}px - 50%), ${position.y}px, 0)`;
      }
      next.set(name, position);
    }
    if (firstPointerLayout.current && next.size) {
      firstPointerLayout.current = false;
      void track.offsetHeight;
      const raf = window.requestAnimationFrame(() => {
        for (const marker of markers.values()) marker.style.transition = "";
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [pointerSignature, valueKeys]);

  const variantHint =
    variant === "binary-search"
      ? "dimmed = eliminated half · highlighted = active search range"
      : variant === "sliding-window"
        ? "bracketed = active [L..R] window"
        : variant === "string"
          ? "character tiles · 0-indexed"
          : variant === "dp-array"
            ? "1D DP state table · dp[i]"
            : hasPointers
              ? "↓ shows the value each pointer checks"
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
              const pointers = Object.entries(array.pointers ?? {}).filter(([, valueIndex]) => valueIndex === index).map(([name]) => name);
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
                <div
                  className={`array-cell ${state}`}
                  data-motion-key={valueKeys[index]}
                  data-cell-index={index}
                  role="listitem"
                  aria-label={`${array.label ?? "Value"} index ${index}: ${String(value)}${pointers.length ? `, ${pointers.join(", ")}` : ""}`}
                  key={valueKeys[index]}
                >
                  <strong>{String(value)}</strong>
                  <small>{variant === "dp-array" ? `dp[${index}]` : `index ${index}`}</small>
                </div>
              );
            })}
          </div>
          {hasPointers && (
            <div className="pointer-overlay" aria-hidden="true">
              {Object.entries(array.pointers ?? {}).map(([name]) => (
                <div key={name} data-pointer-name={name} className="pointer-marker">
                  <span>{name}</span>
                  <ArrowDown size={15} strokeWidth={2.5} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="empty-state">This collection is empty at this step.</p>
      )}
    </section>
  );
}
