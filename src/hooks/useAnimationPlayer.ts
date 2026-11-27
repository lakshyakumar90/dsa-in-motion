import { useCallback, useEffect, useMemo, useState } from "react";
import { createTrace, ensureTraceRuntime } from "@/algorithms/traceRegistry";
import type { AnimationFrame, ArrayFrame, PlaybackStatus, TraceMode } from "@/types/animation";
import type { Approach } from "@/types/problem";

function makeInitialFrame(input: Record<string, unknown>, frames: AnimationFrame[]): AnimationFrame {
  const first = frames[0];
  const firstWithNodes = frames.find((f) => f.nodes?.length);
  const firstWithMatrix = frames.find((f) => f.matrix?.values?.length);
  const firstWithArrays = frames.find((f) => f.arrays?.some((a) => (a.values?.length ?? 0) > 0));

  // Extract scalar vars from input so the Live Variables card is populated before Play
  const inputScalars: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input ?? {})) {
    if (v !== undefined && (v === null || typeof v !== "object")) inputScalars[k] = v;
  }

  const baseMeta = {
    why: "Initial problem state before the first operation runs.",
    cost: "0 operations executed yet — press Play or Next step to trace.",
    insight: "Inspect the starting data structure and input parameters, then step forward.",
    vars: { ...inputScalars, ...(first?.vars ?? {}) },
  };

  // 1. Keep a tree, graph, or linked list's original topology visible immediately on load
  if (firstWithNodes?.nodes?.length) {
    const supportArrays: ArrayFrame[] = (firstWithNodes.arrays ?? [])
      .filter((a) => (a.values?.length ?? 0) > 0)
      .map((a) => ({ ...a, active: [], done: [], pointers: {} }));
    return {
      ...baseMeta,
      title: "Initial state",
      message: "Review the starting structure before the algorithm begins, then press Play or Next step.",
      graphLabel: firstWithNodes.graphLabel,
      nodes: firstWithNodes.nodes.map((node) => ({ ...node, state: "muted" })),
      edges: (firstWithNodes.edges ?? []).map((edge) => ({ ...edge, state: "idle" })),
      ...(supportArrays.length ? { arrays: supportArrays } : {}),
    };
  }

  // 2. Keep a 2D DP / grid matrix visible immediately on load
  if (firstWithMatrix?.matrix) {
    const supportArrays: ArrayFrame[] = (firstWithMatrix.arrays ?? [])
      .filter((a) => (a.values?.length ?? 0) > 0)
      .map((a) => ({ ...a, active: [], done: [], pointers: {} }));
    return {
      ...baseMeta,
      title: "Initial table",
      message: "Review the starting table before the first step updates its cells.",
      matrix: { ...firstWithMatrix.matrix, active: [], done: [] },
      ...(supportArrays.length ? { arrays: supportArrays } : {}),
    };
  }

  // 3. Extract primitive arrays / strings from input, falling back to first non-empty frame arrays
  const inputArrays: ArrayFrame[] = Object.entries(input ?? {}).flatMap(([label, value]) => {
    if (typeof value === "string" && value.length > 0) return [{ label, values: [...value] }];
    if (Array.isArray(value) && value.length > 0 && value.every((item) => item === null || typeof item !== "object")) {
      return [{ label, values: [...value] }];
    }
    return [];
  });

  const cleanArrays: ArrayFrame[] = inputArrays.length
    ? inputArrays
    : (firstWithArrays?.arrays ?? [])
        .filter((array) => (array.values?.length ?? 0) > 0)
        .map((array) => ({ ...array, active: [], done: [], range: undefined, pointers: undefined }));

  // 4. Scalar-only inputs (e.g., Sum, Power of Two, Climbing Stairs) — never leave canvas empty
  const fallbackScalarArrays: ArrayFrame[] =
    !cleanArrays.length && Object.keys(inputScalars).length > 0
      ? [{ label: "Input parameters", values: Object.entries(inputScalars).map(([k, v]) => `${k} = ${String(v)}`) }]
      : [];

  const emptyResultArrays: ArrayFrame[] = (first?.arrays ?? [])
    .filter((array) => /result|output|answer|merged|moved values|reversed result|sorted visits|window maxima|itinerary|topological order|partition lengths|days to wait|valid prefix|unique|retained prefix|kept values/i.test(array.label ?? ""))
    .map((array) => ({ label: array.label, values: [] as unknown[], active: [], done: [] }));

  return {
    ...baseMeta,
    title: "Initial input",
    message: "Nothing has run yet. Review the starting values, then press Play or Next step to begin.",
    arrays: [...cleanArrays, ...fallbackScalarArrays, ...emptyResultArrays],
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
    if (problemName === "Merge Sorted Arrays") {
      input.nums1 = [1, 4, 7, 0, 0, 0];
      input.m = 3;
      input.nums2 = [2, 3, 6];
      input.n = 3;
    }
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
    const timer = window.setTimeout(() => {
      if (index >= frames.length - 1) setStatus("completed");
      else setIndex(index + 1);
    }, speed);
    return () => window.clearTimeout(timer);
  }, [status, frames.length, speed, index]);

  const initialFrame = useMemo(() => makeInitialFrame(input, frames), [inputKey, frames]);
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
