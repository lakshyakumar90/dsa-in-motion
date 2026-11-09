import { Fragment, useEffect, useState } from "react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GraphVisualizer } from "@/components/visualizer/GraphVisualizer";
import { ArrayVisualizer } from "@/components/visualizer/ArrayVisualizer";
import { AnimatedHeight } from "@/components/visualizer/AnimatedHeight";
import { useConceptLab } from "@/hooks/useConceptLab";
import type { ConceptFrame, LabInput } from "@/types/animation";

const graphLinks: [number, number][] = [[0,1],[0,2],[1,3],[1,4],[2,4],[3,5],[4,5],[4,6]];

function FrameVisual({ id, frame }: { id: string; frame: ConceptFrame }) {
  const isGraph = frame.kind === "tree" || frame.kind === "graph";
  if (isGraph) {
    const nodes = frame.a.map((value, index) => {
      const depth = Math.floor(Math.log2(index + 1));
      const rowStart = 2 ** depth - 1;
      const sibling = index - rowStart;
      const rowWidth = 2 ** depth;
      return { id: index, label: String(value), x: frame.kind === "graph" ? [85,215,215,365,365,515,515][index] ?? 515 : ((sibling + .5) / rowWidth) * 620 + 40, y: frame.kind === "graph" ? [165,70,260,70,260,120,285][index] ?? 285 : 40 + depth * 82, state: frame.active?.includes(index) ? "active" : frame.visited?.includes(index) ? "done" : "muted" };
    });
    const edges = (frame.kind === "graph" ? graphLinks : frame.a.flatMap((_, index) => [2 * index + 1, 2 * index + 2].filter((child) => child < frame.a.length).map((child) => [index, child] as [number, number]))).map(([from, to]) => {
      const isCurrentFlow = frame.kind === "graph"
        ? frame.active?.includes(from) && frame.visited?.includes(to) || frame.active?.includes(to) && frame.visited?.includes(from)
        : frame.active?.includes(to) && frame.visited?.includes(from);
      return { from, to, directed: frame.kind !== "graph", state: isCurrentFlow ? "active" : frame.visited?.includes(from) && frame.visited.includes(to) ? "done" : "idle" };
    });
    return <GraphVisualizer nodes={nodes} edges={edges} label={frame.kind === "graph" ? "Breadth-first graph search" : id === "heap" ? "Max heap structure" : "Tree node traversal"} />;
  }
  if (frame.kind === "intervals") {
    const items = frame.a as number[][];
    const max = Math.max(1, ...items.map((interval) => interval[1]));
    return <section className="viz-panel"><h3>Intervals arranged by finish time</h3><div className="interval-track">{items.map(([start, end], index) => <div className={`interval-row ${frame.chosen?.includes(index) ? "chosen" : frame.active?.includes(index) ? "active" : ""}`} key={`${start}-${end}-${index}`}><small>{index + 1}</small><span style={{ left: `${start / max * 100}%`, width: `${(end - start) / max * 100}%` }}><b>[{start}, {end}]</b></span></div>)}</div><div className="axis-labels"><span>0</span><span>{max}</span></div></section>;
  }
  if (id === "water") {
    const values = frame.a as number[];
    const max = Math.max(1, ...values.map((value, index) => value + (frame.water?.[index] ?? 0)));
    return <section className="viz-panel"><h3>Elevation · stored water · two pointers</h3><div className="water-bars">{values.map((value, index) => <div className="water-column" key={index}><div className="water-stack" style={{ height: `${Math.max(8, (value + (frame.water?.[index] ?? 0)) / max * 120)}px` }}><i className={frame.active?.includes(index) ? "pointer-mark" : ""} style={{ height: `${value / max * 120}px` }} /><b style={{ height: `${(frame.water?.[index] ?? 0) / max * 120}px` }} /></div><small>{value}</small><span>{index === frame.active?.[0] || index === frame.active?.[1] ? index === frame.active?.[0] ? "left →" : "← right" : ""}</span></div>)}</div><div className="water-total">Water trapped so far <strong>{frame.value ?? 0}</strong> units</div></section>;
  }
  const active = new Set(frame.active ?? []);
  const pointers: Record<string, number> = {};
  if (frame.kind === "linked" && frame.active?.length) pointers.curr = frame.active[0];
  if (frame.kind === "linked" && typeof frame.done === "number" && frame.done >= 0) pointers.prev = frame.done;
  if (frame.kind === "binary" && frame.active?.length) pointers.mid = frame.active[0];
  const range: [number, number] | undefined = frame.range;
  const completed = typeof frame.done === "number" && frame.done >= 0 ? frame.a.map((_, index) => index <= frame.done! ? index : -1).filter((index) => index >= 0) : [];
  return <div className="concept-visual-stack">{frame.kind === "linked" ? <section className="viz-panel"><h3>Linked list · arrows connect each node to its next node</h3><div className="linked-track"><div className="linked-track-row">{frame.a.map((value, index) => { const isDone = typeof frame.done === "number" && index <= frame.done; const labels = Object.entries(pointers).filter(([, position]) => position === index).map(([label]) => label).join(" / "); return <Fragment key={index}><div className={`array-cell ${active.has(index) ? "active" : isDone ? "done" : ""}`}><span className="pointer-label">{labels}</span><strong>{String(value)}</strong><small>node {index}</small></div>{index < frame.a.length - 1 && <span className={`linked-arrow ${typeof frame.done === "number" && index < frame.done ? "linked-reversed" : ""}`} aria-hidden="true">{typeof frame.done === "number" && index < frame.done ? "←" : "→"}</span>}</Fragment>; })}</div></div></section> : <ArrayVisualizer array={{ label: frame.kind === "dp" ? "Dynamic programming table" : frame.kind === "letters" ? "Input sequence · highlighted window" : "Input values · current operation", values: frame.a, active: frame.active, done: completed, range, pointers }} />}
    {frame.stack && <section className="viz-panel"><h3>Stack · top is the most recent opener</h3><div className="stack-values">{frame.stack.length ? frame.stack.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <small>empty</small>}</div></section>}
    {frame.chosen && frame.kind === "subsets" && <section className="viz-panel"><h3>Current subset decision path</h3><div className="stack-values">{frame.chosen.length ? frame.chosen.map((value, index) => <span key={`${value}-${index}`}>{value}</span>) : <small>empty subset</small>}</div><p className="lab-sub-caption">{Array.isArray(frame.output) ? `${frame.output.length} subsets recorded so far.` : "Choose or skip each value."}</p></section>}
    {frame.value !== undefined && <div className="result-output"><span>Current result</span><strong>{frame.value}</strong></div>}</div>;
}

function parseUserInput(raw: string, id: string, flags: { textInput?: boolean; singleInput?: boolean; intervalInput?: boolean }): LabInput {
  if (flags.textInput) { if (!raw || raw.length > 20) throw new Error("Enter 1–20 characters."); if (id === "stack" && /[^()[\]{}]/.test(raw)) throw new Error("Use only parentheses, square brackets, and braces."); return raw; }
  if (flags.singleInput) { const value = Number(raw); if (!Number.isInteger(value) || value < 0 || value > 12) throw new Error("Enter a whole number from 0 to 12."); return value; }
  if (flags.intervalInput) { const intervals = raw.split(",").map((chunk) => { const match = chunk.trim().match(/^(\d+)\s*-\s*(\d+)$/); if (!match || Number(match[1]) >= Number(match[2]) || Number(match[2]) > 30) throw new Error("Use intervals like 1-3,4-7 (maximum endpoint 30)."); return [Number(match[1]), Number(match[2])]; }); if (intervals.length > 10) throw new Error("Use at most 10 intervals."); return intervals; }
  const parts = raw.split(",");
  if (parts.some((part) => !part.trim())) throw new Error("Separate values with commas; empty entries are not allowed.");
  const values = parts.map((part) => Number(part.trim()));
  if (!values.length || values.length > 16 || values.some((value) => !Number.isFinite(value) || Math.abs(value) > 100)) throw new Error("Enter 1–16 numbers between −100 and 100.");
  if (id === "water" && values.some((value) => value < 0)) throw new Error("Heights must be nonnegative.");
  if (id === "subsets" && (values.length > 5 || new Set(values).size !== values.length)) throw new Error("Use 1–5 distinct values.");
  if (["tree", "heap", "bst"].includes(id) && values.length > 15) throw new Error("Use no more than 15 nodes.");
  return values;
}

export function ConceptLab({ modelId, compact = false }: { modelId: string; compact?: boolean }) {
  const lab = useConceptLab(modelId);
  const [inputDraft, setInputDraft] = useState("");
  useEffect(() => { if (lab.spec) setInputDraft(typeof lab.input === "string" || typeof lab.input === "number" ? String(lab.input) : Array.isArray(lab.input) && Array.isArray(lab.input[0]) ? (lab.input as number[][]).map((item) => item.join("-")).join(",") : (lab.input as number[]).join(",")); }, [lab.spec, lab.input]);
  if (lab.error) return <div className="error-state" role="alert">{lab.error}</div>;
  if (!lab.spec || !lab.frame) return <div className="loading-state">Preparing the concept model…</div>;
  return <section className={`concept-lab ${compact ? "compact" : ""}`} aria-label={`${lab.spec.title} concept model`}>
    <header className="concept-lab-header"><div><strong>{lab.spec.title}</strong><span>{lab.spec.description}</span></div><span>Interactive concept model</span></header>
    <div className="concept-lab-body"><div className="concept-lab-visual"><AnimatedHeight key={`${modelId}-visual`} contentKey={`${lab.started}-${lab.index}`} className="concept-visual-stage" holdGrowth><FrameVisual id={modelId} frame={lab.frame} /></AnimatedHeight><AnimatedHeight key={`${modelId}-caption`} contentKey={`${lab.started}-${lab.index}`} className="lab-caption-stage" holdGrowth><div className="lab-caption" aria-live="polite">{lab.frame.text}</div></AnimatedHeight></div>{!compact && <aside className="concept-lab-inspector"><span className="inspector-kicker">{lab.started ? "FOLLOW THE IDEA" : "INITIAL STATE"}</span><h3>{lab.spec.title}</h3><AnimatedHeight key={`${modelId}-inspector`} contentKey={`${lab.started}-${lab.index}`} className="lab-inspector-copy" holdGrowth><div><p>{lab.frame.text}</p>{lab.frame.value !== undefined && <div className="lab-inspector-value"><span>Current value</span><strong>{lab.frame.value}</strong></div>}</div></AnimatedHeight></aside>}</div>
    <div className="concept-lab-controls"><div className="playback-actions"><Button size="icon" variant="ghost" onClick={lab.reset} aria-label="Reset model to initial state"><RotateCcw size={15} /></Button><Button size="icon" variant="ghost" disabled={!lab.started} onClick={lab.previous} aria-label="Previous model step"><StepBack size={15} /></Button><Button size="sm" onClick={lab.playing ? () => lab.setPlaying(false) : lab.start}>{lab.playing ? <Pause size={14} /> : <Play size={14} />}{lab.playing ? "Pause" : "Play"}</Button><Button size="icon" variant="ghost" disabled={lab.started && lab.index >= lab.frames.length - 1} onClick={lab.next} aria-label="Next model step"><StepForward size={15} /></Button></div><input className="timeline" type="range" min={0} max={Math.max(0, lab.frames.length - 1)} value={lab.index} onChange={(event) => lab.seek(Number(event.target.value))} aria-label="Concept model progress" /><span className="frame-count">{lab.started ? `${lab.index + 1} / ${lab.frames.length}` : `Ready · 0 / ${lab.frames.length}`}</span><label className="speed-select">Speed <select value={lab.speed} onChange={(event) => lab.setSpeed(Number(event.target.value))} aria-label="Model playback speed"><option value={3000}>0.5×</option><option value={1800}>1×</option><option value={900}>2×</option></select></label></div>
    {!compact && <details className="input-editor"><summary>Change the model input</summary><div className="input-editor-content"><label htmlFor={`lab-input-${modelId}`}>{lab.spec.unit}</label><input id={`lab-input-${modelId}`} value={inputDraft} onChange={(event) => setInputDraft(event.target.value)} /><div className="input-actions"><Button size="sm" onClick={() => { try { lab.setInput(parseUserInput(inputDraft, modelId, lab.spec!)); lab.setError(null); } catch (cause) { lab.setError(cause instanceof Error ? cause.message : "Invalid model input."); } }}>Apply input</Button>{lab.spec.param !== undefined && lab.spec.param !== null && <label className="lab-target">{lab.spec.paramLabel ?? "Target"}<input type="number" value={lab.target ?? ""} onChange={(event) => { const raw = event.target.value; const value = Number(raw); if (!raw.trim() || !Number.isFinite(value)) { lab.setError("Enter a finite target number."); return; } if (modelId === "graph" && (!Number.isInteger(value) || value < 0 || value > 6)) { lab.setError("Destination must be an integer from 0 to 6."); return; } lab.setTarget(value); lab.setError(null); }} /></label>}<Button size="sm" variant="ghost" onClick={lab.restore}>Restore example</Button><span role="alert">{lab.error}</span></div></div></details>}
  </section>;
}
