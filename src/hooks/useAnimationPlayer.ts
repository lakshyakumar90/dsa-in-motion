import { useCallback, useEffect, useMemo, useState } from "react";
import { createTrace, ensureTraceRuntime } from "@/algorithms/traceRegistry";
import type { AnimationFrame, PlaybackStatus, TraceMode } from "@/types/animation";
import type { Approach } from "@/types/problem";

function makeInitialFrame(input: Record<string, unknown>, first?: AnimationFrame): AnimationFrame {
  // Keep a graph's original topology, but remove traversal highlights and arrows.
  if (first?.nodes?.length) return {
    title: "Initial graph",
    message: "This is the graph before the search starts. No nodes have been visited yet.",
    graphLabel: first.graphLabel,
    nodes: first.nodes.map((node) => ({ ...node, state: "muted" })),
    edges: (first.edges ?? []).map((edge) => ({ ...edge, state: "idle" })),
  };
  if (first?.matrix) return {
    title: "Initial table",
    message: "The table is shown before the first algorithm step changes its cells.",
    matrix: { ...first.matrix, active: [], done: [] },
  };

  const arrays = Object.entries(input).flatMap(([label, value]) => {
    if (typeof value === "string") return [{ label, values: [...value] }];
    if (Array.isArray(value) && value.every((item) => item === null || typeof item !== "object")) return [{ label, values: value }];
    return [];
  });
  const cleanArrays = arrays.length ? arrays : (first?.arrays ?? [])
    .filter((array) => (array.values?.length ?? 0) > 0)
    .map((array) => ({ ...array, active: [], done: [], range: undefined, pointers: undefined }));
  // Output collections exist from frame zero, even though they begin empty.
  // This keeps an array transformation's result visible beside its input
  // before the first algorithm operation has run.
  const emptyResultArrays = (first?.arrays ?? [])
    .filter((array) => /result|output|answer|merged|moved values|reversed result|sorted visits|window maxima|itinerary|topological order|partition lengths|days to wait|valid prefix|unique|retained prefix|kept values/i.test(array.label ?? ""))
    .map((array) => ({ label: array.label, values: [] as unknown[], active: [], done: [] }));
  return {
    title: "Initial input",
    message: "Nothing has run yet. Review the original values, then press Play or Next step to begin.",
    arrays: [...cleanArrays, ...emptyResultArrays],
  };
}

export interface AnimationState {
  frames: AnimationFrame[];
  frame: AnimationFrame | undefined;
  initialFrame: AnimationFrame;
  index: number;
  status: PlaybackStatus;
  started: boolean;
  speed: number;
  mode: TraceMode;
  input: Record<string, unknown>;
  error: string | null;
  setSpeed: (speed: number) => void;
  setInput: (input: Record<string, unknown>) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  restoreInput: () => void;
  previous: () => void;
  next: () => void;
  seek: (index: number) => void;
}

export function useAnimationPlayer(problemName: string, approach: Approach, approaches: Approach[]): AnimationState {
  const [ready, setReady] = useState(false);
  const defaultInput = useMemo(() => {
    const trace = globalThis.PROBLEM_TRACES?.[problemName];
    const input = trace ? structuredClone(trace.input) : {};
    // Match the ChaiCode Merge Sorted Array example so pointer and code-line
    // states can be compared directly with its walkthrough.
    if (problemName === "Merge Sorted Arrays") {
      input.nums1 = [1, 4, 7, 0, 0, 0];
      input.m = 3;
      input.nums2 = [2, 3, 6];
      input.n = 3;
    }
    // Match the public Remove Duplicates walkthrough's duplicate-heavy array
    // so the learner can see both append and skip operations immediately.
    if (problemName === "Remove Duplicates" && Array.isArray(input.nums)) input.nums = [1, 1, 2, 2, 2, 3, 4, 4];
    return input;
  }, [problemName, ready]);
  const [input, setInput] = useState<Record<string, unknown>>(defaultInput);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1800);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { let alive = true; void ensureTraceRuntime().then(() => { if (alive) setReady(true); }).catch((cause: unknown) => { if (alive) setError(cause instanceof Error ? cause.message : "Could not load the algorithm traces."); }); return () => { alive = false; }; }, []);
  useEffect(() => { if (ready) setInput(structuredClone(defaultInput)); }, [ready, problemName, defaultInput]);

  const inputKey = JSON.stringify(input);
  const trace = useMemo(() => {
    if (!ready) return null;
    try { return createTrace(problemName, approach, approaches, JSON.parse(inputKey) as Record<string, unknown>); }
    catch (cause) { return { error: cause instanceof Error ? cause.message : "Could not build this trace." }; }
  }, [ready, problemName, approach, approaches, inputKey]);
  const sourceFrames = trace && "frames" in trace ? trace.frames : [];
  // Keep the topology visible across narration/result-only frames. A handful
  // of tree and graph traces emit a final answer frame without repeating the
  // nodes, which used to make the diagram disappear at that point.
  const frames = useMemo(() => {
    const firstGraph = sourceFrames.find((candidate) => candidate.nodes?.length);
    if (!firstGraph?.nodes?.length) return sourceFrames;
    let graph: Pick<AnimationFrame, "nodes" | "edges" | "graphLabel"> & { nodes: NonNullable<AnimationFrame["nodes"]>; edges: NonNullable<AnimationFrame["edges"]> } = {
      nodes: firstGraph.nodes.map((node) => ({ ...node, state: "muted" })),
      edges: (firstGraph.edges ?? []).map((edge) => ({ ...edge, state: "idle" })),
      graphLabel: firstGraph.graphLabel,
    };
    return sourceFrames.map((candidate) => {
      if (candidate.nodes?.length) graph = {
        nodes: candidate.nodes,
        edges: candidate.edges ?? graph.edges,
        graphLabel: candidate.graphLabel ?? graph.graphLabel,
      };
      else if (candidate.edges) graph = { ...graph, edges: candidate.edges };
      return { ...candidate, ...graph };
    });
  }, [sourceFrames]);
  const mode: TraceMode = trace && "mode" in trace ? trace.mode : "execution";

  useEffect(() => { setIndex(0); setStatus("idle"); setStarted(false); setError(trace && "error" in trace ? trace.error : null); }, [trace]);
  useEffect(() => {
    if (status !== "playing" || frames.length < 2) return;
    // Schedule one frame at a time so rendering work never causes a repeating
    // interval to drift away from the selected playback speed.
    const timer = window.setTimeout(() => {
      if (index >= frames.length - 1) setStatus("completed");
      else setIndex(index + 1);
    }, speed);
    return () => window.clearTimeout(timer);
  }, [status, frames.length, speed, index]);

  const initialFrame = useMemo(() => makeInitialFrame(input, frames[0]), [inputKey, frames]);
  const frame = !ready || frames.length === 0 ? undefined : started ? frames[index] : initialFrame;

  const pause = useCallback(() => setStatus((value) => value === "playing" ? "paused" : value), []);
  const play = useCallback(() => {
    if (frames.length === 0) return;
    setIndex((current) => current >= frames.length - 1 ? 0 : current);
    setStarted(true);
    setStatus(frames.length < 2 ? "completed" : "playing");
  }, [frames.length]);
  const reset = useCallback(() => { setStatus("idle"); setStarted(false); setIndex(0); }, []);
  const restoreInput = useCallback(() => { setStatus("idle"); setStarted(false); setIndex(0); setInput(structuredClone(defaultInput)); }, [defaultInput]);
  const seek = useCallback((frameIndex: number) => { setStarted(true); setStatus("paused"); setIndex(Math.max(0, Math.min(frames.length - 1, frameIndex))); }, [frames.length]);
  const previous = useCallback(() => {
    if (index > 0) seek(index - 1);
    else { setStarted(false); setStatus("idle"); setIndex(0); }
  }, [seek, index]);
  const next = useCallback(() => {
    if (!started) { setStarted(true); setStatus("paused"); setIndex(0); }
    else seek(index + 1);
  }, [seek, index, started]);

  return { frames, frame, initialFrame, index, status, started, speed, mode, input, error, setSpeed, setInput: (nextInput) => { setStatus("idle"); setStarted(false); setIndex(0); setInput(nextInput); }, play, pause, reset, restoreInput, previous, next, seek };
}
