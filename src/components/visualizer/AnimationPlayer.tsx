import { useEffect, useMemo, useState } from "react";
import NumberFlow from "@number-flow/react";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer";
import type { Approach } from "@/types/problem";
import { getLogicView, LogicPanel } from "./LogicPanel";
import { ArrayVisualizer } from "./ArrayVisualizer";
import { GraphVisualizer } from "./GraphVisualizer";
import { MatrixVisualizer } from "./MatrixVisualizer";
import { StepExplanation } from "./StepExplanation";
import { prettyValue } from "@/lib/animationUtils";
import { Button } from "@/components/ui/button";
import type { AnimationFrame } from "@/types/animation";
import { approachKindLabel } from "@/algorithms/traceRegistry";

function resultFromFrame(frame: NonNullable<ReturnType<typeof useAnimationPlayer>["frame"]>) {
  const resultArray = frame.arrays?.find((array) => isResultArray(array.label));
  if (resultArray) return { label: `${resultArray.label} · live`, value: resultArray.values ?? [] };
  const variables = frame.vars ?? {};
  // Explicit result state wins over intermediate values such as a candidate
  // profit, which can change while the best answer remains the same.
  if (variables.result !== undefined) return { label: "Result so far", value: variables.result };
  const resultKey = Object.keys(variables).find((key) => /result|output|answers?|returns?|solutions?|profit|total|count|best|found|sum|ways|matches|area|water|valid|length|diameter|distance|cost|minimum|maximum|surviv/i.test(key) && variables[key] !== undefined);
  if (resultKey) return { label: `${resultKey} so far`, value: variables[resultKey] };
  if (frame.output !== undefined) return { label: "Returned result", value: frame.output };
  return undefined;
}

function isResultArray(label = "") {
  return /result|output|answer|merged|moved values|sorted visits|window maxima|itinerary|topological order|partition lengths|days to wait|valid prefix|unique|retained prefix|kept values/i.test(label);
}

function LiveResultPanel({ problemName, frame, initialFrame, frames, index, started }: { problemName: string; frame: AnimationFrame; initialFrame: AnimationFrame; frames: AnimationFrame[]; index: number; started: boolean }) {
  // Compare with the preceding algorithm frame, not the last frame the viewer
  // happened to visit. Seeking backwards must not invent a result change.
  let previous = resultFromFrame(initialFrame);
  if (started) for (let i = 0; i < index; i++) previous = resultFromFrame(frames[i]) ?? previous;
  const tracked = resultFromFrame(frame) ?? previous;
  const changedNow = started && !!tracked && prettyValue(tracked.value) !== (previous ? prettyValue(previous.value) : "");
  if (problemName === "Best Time to Buy and Sell Stocks") {
    const variables = frame.vars ?? {};
    const bestProfit = Number(variables.maxProfit ?? tracked?.value ?? 0);
    const buyDay = variables.bestBuyDay;
    const sellDay = variables.bestSellDay;
    const hasTrade = Number.isInteger(buyDay) && Number.isInteger(sellDay);
    const prices = frame.arrays?.find((array) => array.label === "prices")?.values ?? [];
    const candidate = variables.profit ?? variables.candidate;
    const candidateBuyDay = variables.buy ?? variables.minPriceDay;
    const candidateSellDay = variables.sell ?? variables.day;
    const hasCandidateTrade = candidate !== undefined && Number.isInteger(candidateBuyDay) && Number.isInteger(candidateSellDay) && Number(candidateBuyDay) < Number(candidateSellDay);
    return <aside className="live-result-panel stock-result-panel" data-changed={changedNow} aria-live="polite">
      <div className="result-panel-heading"><span>Best transaction so far</span><strong>Profit <b>{Number.isFinite(bestProfit) ? <NumberFlow value={bestProfit} /> : prettyValue(bestProfit)}</b></strong></div>
      <div className="stock-result-table-wrap"><table className="stock-result-table"><thead><tr><th scope="col">Status</th><th scope="col">Buy day</th><th scope="col">Buy price</th><th scope="col">Sell day</th><th scope="col">Sell price</th><th scope="col">Profit</th></tr></thead><tbody>
        {hasTrade ? <tr className="stock-best-row"><th scope="row">Best</th><td>Day {Number(buyDay) + 1}</td><td>{prettyValue(prices[Number(buyDay)])}</td><td>Day {Number(sellDay) + 1}</td><td>{prettyValue(prices[Number(sellDay)])}</td><td className="stock-profit-cell">{prettyValue(bestProfit)}</td></tr> : <tr><th scope="row">Best</th><td colSpan={5}>No profitable pair found yet.</td></tr>}
        {hasCandidateTrade && <tr className="stock-candidate-row"><th scope="row">Checking</th><td>Day {Number(candidateBuyDay) + 1}</td><td>{prettyValue(prices[Number(candidateBuyDay)])}</td><td>Day {Number(candidateSellDay) + 1}</td><td>{prettyValue(prices[Number(candidateSellDay)])}</td><td>{prettyValue(candidate)}</td></tr>}
      </tbody></table></div>
      <p>{candidate !== undefined ? `Current candidate: ${prettyValue(candidate)} · ` : ""}{!started ? "The best valid transaction will update as the trace runs." : changedNow ? "The best result changed in this step." : "Best transaction is unchanged in this step."}</p>
    </aside>;
  }
  return <aside className="live-result-panel" data-changed={changedNow} aria-live="polite">
    <span>{tracked?.label ?? "Result tracker"}</span>
    {tracked && Array.isArray(tracked.value) ? <div className="result-output-array" role="list" aria-label={`${tracked.label.replace(/\s· live$/, "")} values`}>{tracked.value.length ? tracked.value.map((value, cellIndex) => <div className="result-output-cell" role="listitem" key={`${cellIndex}-${prettyValue(value)}`}><strong>{prettyValue(value)}</strong><small>index {cellIndex}</small></div>) : <p className="result-empty">No values have been written yet.</p>}</div> : tracked ? <strong className="result-scalar">{typeof tracked.value === "number" && Number.isFinite(tracked.value) ? <NumberFlow value={tracked.value} /> : prettyValue(tracked.value)}</strong> : <strong className="result-placeholder">—</strong>}
    <p>{!started ? tracked ? "Ready · the result will update as the algorithm runs." : "No result has been produced yet." : changedNow ? "Result changed in this step." : tracked ? "No result change in this step." : "No result has been produced yet."}</p>
  </aside>;
}

export function AnimationPlayer({ problemName, approach, approaches, selectedIndex = 0, onApproachChange }: { problemName: string; approach: Approach; approaches: Approach[]; selectedIndex?: number; onApproachChange?: (index: number) => void }) {
  const player = useAnimationPlayer(problemName, approach, approaches);
  const [inputDraft, setInputDraft] = useState("{}");
  const [inputError, setInputError] = useState<string | null>(null);
  useEffect(() => setInputDraft(JSON.stringify(player.input, null, 2)), [player.input]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && (event.target.isContentEditable || !!event.target.closest("input, textarea, select, button, a, [role='tab'], [role='slider']")))) return;
      if (event.code === "Space") { event.preventDefault(); player.status === "playing" ? player.pause() : player.play(); }
      else if (event.key === "ArrowRight") { event.preventDefault(); player.next(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); player.previous(); }
      else if (event.key === "Home") { event.preventDefault(); player.reset(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [player.play, player.pause, player.next, player.previous, player.reset, player.status]);
  const frame = player.frame;
  const logic = frame ? getLogicView(problemName, approach, frame) : undefined;
  const logicLine = logic?.active === undefined ? undefined : logic.lines[logic.active - 1]?.sourceLine ?? logic.active;
  const progressGroups = useMemo(() => {
    const count = player.frames.length;
    if (!count) return [];
    // Keep the navigation rail readable even for long traces: each segment
    // represents one frame for short traces, or a small range for long ones.
    const groupCount = Math.min(count, 48);
    return Array.from({ length: groupCount }, (_, index) => {
      const start = Math.floor(index * count / groupCount);
      const end = Math.max(start, Math.ceil((index + 1) * count / groupCount) - 1);
      return { start, end, label: start === end ? `Go to step ${start + 1}` : `Go to steps ${start + 1} through ${end + 1}` };
    });
  }, [player.frames.length]);
  return <section className="player-shell" aria-label={`${problemName} animation player`}>
    <div className="player-heading"><div><span className="live-dot" /><strong>{problemName}</strong><span className="approach-meta">{approach.time} time · {approach.space} space</span></div>{onApproachChange && <label className="player-approach">Approach<select value={selectedIndex} onChange={(event) => onApproachChange(Number(event.target.value))} aria-label="Animation approach">{approaches.map((item, index) => <option key={`${item.type}-${index}`} value={index}>{approachKindLabel(item.type)} · {item.name.replace(/^Approach\s+\d+:\s*/, "")}</option>)}</select></label>}<span className={`trace-mode ${player.mode}`}>{player.mode === "conceptual" ? "Conceptual walkthrough" : "Algorithm trace"}</span></div>
    {player.error ? <div className="error-state" role="alert">{player.error}</div> : !frame ? <div className="loading-state">Loading the algorithm trace…</div> : <>
      <div className="player-progress" role="group" aria-label="Step overview">
        <span className="progress-caption">{player.started ? `Step ${player.index + 1} of ${player.frames.length}` : `${player.frames.length} steps`}</span>
        <div className="progress-track">{progressGroups.map((group) => <button type="button" key={group.start} className={group.start <= (player.started ? player.index : -1) ? "visited" : ""} data-current={group.start <= player.index && group.end >= player.index && player.started} onClick={() => player.seek(group.start)} aria-label={group.label} title={group.label}><span /></button>)}</div>
      </div>
      <div className="player-content">
        <div className="visual-column">
          <div className="visual-frame-stage"><div className="visual-frame-layout"><div className={`visual-frame-stack${frame.nodes?.length ? " graph-frame-stack" : ""}`}>
            {frame.nodes?.length ? <div className="graph-support-layout">
              <GraphVisualizer nodes={frame.nodes} edges={frame.edges ?? []} label={frame.graphLabel} />
              {!!(frame.arrays ?? []).filter((array) => !isResultArray(array.label)).length && <div className="graph-support-arrays" aria-label="Supporting traversal state">
                {(frame.arrays ?? []).filter((array) => !isResultArray(array.label)).map((array, index) => <ArrayVisualizer array={array} key={`${array.label ?? "array"}-${index}`} />)}
              </div>}
            </div> : (frame.arrays ?? []).filter((array) => !isResultArray(array.label)).map((array, index) => <ArrayVisualizer array={array} key={`${array.label ?? "array"}-${index}`} />)}
            {frame.matrix && <MatrixVisualizer matrix={frame.matrix} />}
          </div><LiveResultPanel problemName={problemName} frame={frame} initialFrame={player.initialFrame} frames={player.frames} index={player.index} started={player.started} /></div></div>
        </div>
        <aside className="lesson-side-rail">
          <div className="lesson-code-stage"><LogicPanel problemName={problemName} approach={approach} frame={frame} mode={player.mode} /></div>
          <div className="frame-inspector-stage"><aside className="frame-inspector"><span className="inspector-kicker">STATE AT STEP {player.started ? player.index + 1 : 0}</span>
            <dl className="frame-vars">{Object.entries(frame.vars ?? (!player.started ? { m: player.input.m, n: player.input.n } : {})).filter(([, value]) => value !== undefined && (value === null || typeof value !== "object")).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{prettyValue(value)}</dd></div>)}
              <div><dt>time</dt><dd>{approach.time}</dd></div><div><dt>space</dt><dd>{approach.space}</dd></div>
            </dl>
            <div className="inspector-notes" aria-label="Step details">
              {frame.why && <details><summary>Why</summary><p>{frame.why}</p></details>}
              {frame.cost && <details><summary>Cost</summary><p>{frame.cost}</p></details>}
              {frame.insight && <details><summary>Remember</summary><p>{frame.insight}</p></details>}
            </div>
          </aside></div>
        </aside>
      </div>
      <StepExplanation frame={frame} index={player.index} total={player.frames.length} started={player.started} logicLine={logicLine} />
      <div className="playback" aria-label="Animation playback controls">
        <div className="playback-actions">
          <Button variant="ghost" size="icon" onClick={player.reset} aria-label="Restart"><RotateCcw size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={player.previous} disabled={!player.started} aria-label="Previous step"><StepBack size={16} /></Button>
          <Button size="icon" onClick={player.status === "playing" ? player.pause : player.play} aria-label={player.status === "playing" ? "Pause animation" : "Play animation"}>{player.status === "playing" ? <Pause size={15} /> : <Play size={15} />}</Button>
          <Button variant="ghost" size="icon" onClick={player.next} disabled={player.started && player.index >= player.frames.length - 1} aria-label="Next step"><StepForward size={16} /></Button>
        </div>
        <input className="timeline" type="range" min="0" max={Math.max(0, player.frames.length - 1)} value={player.index} onChange={(event) => player.seek(Number(event.target.value))} aria-label="Animation timeline" />
        <span className="frame-count">{player.started ? `${player.index + 1} / ${player.frames.length}` : `Ready · 0 / ${player.frames.length}`}</span>
        <label className="speed-select">Speed <select value={player.speed} onChange={(event) => player.setSpeed(Number(event.target.value))} aria-label="Playback speed"><option value="3000">0.5×</option><option value="1800">1×</option><option value="900">2×</option></select></label>
      </div>
      <details className="input-editor"><summary>Change the example input</summary><div className="input-editor-content"><p>Edit the JSON data, then rebuild the frames using the same original trace logic.</p><textarea value={inputDraft} onChange={(event) => setInputDraft(event.target.value)} spellCheck={false} aria-label="Animation example JSON" /><div className="input-actions"><Button variant="outline" size="sm" onClick={() => { try { const parsed: unknown = JSON.parse(inputDraft); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Input must be a JSON object."); player.setInput(parsed as Record<string, unknown>); setInputError(null); } catch (cause) { setInputError(cause instanceof Error ? cause.message : "Invalid JSON."); } }}>Run this input</Button><Button variant="ghost" size="sm" onClick={() => { player.restoreInput(); setInputError(null); }}>Restore default</Button><span role="alert">{inputError}</span></div></div></details>
    </>}
  </section>;
}
