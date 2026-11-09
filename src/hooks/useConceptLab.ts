import { useCallback, useEffect, useMemo, useState } from "react";
import type { ConceptFrame, LabInput } from "@/types/animation";
import { ensureConceptLabs, getConceptLabRegistry } from "@/algorithms/traceRegistry";

function parseDefaultInput(id: string): LabInput {
  const spec = getConceptLabRegistry()[id];
  if (!spec) return [];
  if (spec.textInput) return spec.input;
  if (spec.singleInput) return Number(spec.input);
  if (spec.intervalInput) return spec.input.split(",").map((entry) => entry.split("-").map(Number));
  return spec.input.split(",").map(Number);
}

export function useConceptLab(id: string) {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState<LabInput>(() => parseDefaultInput(id));
  const [target, setTarget] = useState<number | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1800);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { let alive = true; void ensureConceptLabs().then(() => { if (alive) { const model = getConceptLabRegistry()[id]; setInput(parseDefaultInput(id)); setTarget(model.param ?? undefined); setReady(true); } }).catch((cause: unknown) => { if (alive) setError(cause instanceof Error ? cause.message : "Could not load the concept model."); }); return () => { alive = false; }; }, [id]);
  const inputKey = JSON.stringify(input);
  const generated = useMemo(() => {
    if (!ready) return { frames: [] as ConceptFrame[], error: null as string | null };
    try { const model = getConceptLabRegistry()[id]; return { frames: model.trace(JSON.parse(inputKey) as LabInput, target), error: null }; }
    catch (cause) { return { frames: [] as ConceptFrame[], error: cause instanceof Error ? cause.message : "This input cannot be visualized." }; }
  }, [ready, id, inputKey, target]);
  const frames = generated.frames;
  useEffect(() => { setIndex(0); setStarted(false); setPlaying(false); setError(null); }, [frames]);
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => { if (current >= frames.length - 1) { setPlaying(false); return current; } return current + 1; }), speed);
    return () => window.clearInterval(timer);
  }, [playing, frames.length, speed]);
  const initialFrame = useMemo<ConceptFrame | undefined>(() => {
    if (!frames.length) return undefined;
    const values = typeof input === "number" ? [input] : typeof input === "string" ? Array.from(input) : input;
    return { a: values, kind: frames[0].kind, text: "This is the original input before any steps have run. Press Play or Next step to begin." };
  }, [frames, input]);
  const frame = started ? frames[index] : initialFrame;
  const reset = useCallback(() => { setIndex(0); setStarted(false); setPlaying(false); }, []);
  const seek = useCallback((value: number) => { setIndex(Math.max(0, Math.min(frames.length - 1, value))); setStarted(true); setPlaying(false); }, [frames.length]);
  const start = useCallback(() => { if (!frames.length) return; setStarted(true); setIndex((current) => current >= frames.length - 1 ? 0 : current); setPlaying(frames.length > 1); }, [frames.length]);
  const next = useCallback(() => { if (!started) { setStarted(true); setPlaying(false); setIndex(0); } else seek(index + 1); }, [started, seek, index]);
  const previous = useCallback(() => { if (index > 0) seek(index - 1); else { setStarted(false); setPlaying(false); setIndex(0); } }, [index, seek]);
  const restore = useCallback(() => { setInput(parseDefaultInput(id)); setTarget(getConceptLabRegistry()[id]?.param ?? undefined); setError(null); }, [id]);
  return { spec: ready ? getConceptLabRegistry()[id] : undefined, frames, frame, index, started, speed, playing, error: generated.error ?? error, input, target, setInput, setTarget, setSpeed, reset, seek, next, previous, start, restore, setPlaying, setError };
}
