import type { ArrayFrame } from "@/types/animation";
import { ArrowDown } from "lucide-react";
import { useLayoutEffect, useMemo, useRef } from "react";

interface PointerPosition { x: number; y: number }
const EMPTY_VALUES: unknown[] = [];

function stableValueKey(value: unknown): string {
  try { return `${typeof value}:${JSON.stringify(value)}`; }
  catch { return `${typeof value}:${String(value)}`; }
}

export function ArrayVisualizer({ array }: { array: ArrayFrame }) {
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

  // FLIP (First, Last, Invert, Play): when an algorithm swaps or shifts values,
  // measure each value's old and new cell and animate between those positions.
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

  // Keep pointer arrows attached to the real cell geometry, including when a
  // narrow screen wraps the array into multiple rows.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pointerEntries = Object.entries(array.pointers ?? {});
    const positionsPerCell = new Map<number, number>();
    for (const [, index] of pointerEntries) positionsPerCell.set(index, (positionsPerCell.get(index) ?? 0) + 1);
    const pointerLanes = Math.max(1, ...positionsPerCell.values());
    // Reserve enough headroom for collocated pointers so their labels stack
    // above the cells instead of falling into the row or overlapping each other.
    track.style.paddingTop = `${28 + (pointerLanes - 1) * 27}px`;
    const markers = new Map(Array.from(track.querySelectorAll<HTMLElement>("[data-pointer-name]"), (marker) => [marker.dataset.pointerName ?? "", marker]));
    const next = new Map<string, PointerPosition>();
    const laneByCell = new Map<number, number>();
    for (const [name, index] of pointerEntries) {
      const cell = track.querySelector<HTMLElement>(`[data-cell-index="${index}"]`);
      const marker = markers.get(name);
      if (!cell) continue;
      // offset geometry is layout based, so FLIP transforms on a moving cell
      // cannot pull the pointer away from the cell's final resting position.
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

  return <section className="viz-panel">
    <h3>{array.label ?? "Values"}{hasPointers && <span className="viz-legend">↓ shows the value each pointer checks</span>}</h3>
    {values.length ? <div ref={trackRef} className="array-track-wrap"><div className="array-track" role="list" aria-label={array.label ?? "Array values"}>
      {values.map((value, index) => {
        const pointers = Object.entries(array.pointers ?? {}).filter(([, valueIndex]) => valueIndex === index).map(([name]) => name);
        const state = array.active?.includes(index) ? "active" : array.done?.includes(index) ? "done" : array.range && index >= array.range[0] && index <= array.range[1] ? "in-range" : "";
        return <div className={`array-cell ${state}`} data-motion-key={valueKeys[index]} data-cell-index={index} role="listitem" aria-label={`${array.label ?? "Value"} index ${index}: ${String(value)}${pointers.length ? `, ${pointers.join(", ")}` : ""}`} key={valueKeys[index]}>
          <strong>{String(value)}</strong><small>index {index}</small>
        </div>;
      })}
    </div>{hasPointers && <div className="pointer-overlay" aria-hidden="true">{Object.entries(array.pointers ?? {}).map(([name]) => {
      return <div key={name} data-pointer-name={name} className="pointer-marker"><span>{name}</span><ArrowDown size={15} strokeWidth={2.5} /></div>;
    })}</div>}</div> : <p className="empty-state">This collection is empty at this step.</p>}
  </section>;
}
