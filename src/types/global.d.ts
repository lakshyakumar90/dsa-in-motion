import type { AnimationFrame, ConceptLabSpec, TraceSpec } from "./animation";

declare global {
  var PROBLEM_TRACES: Record<string, TraceSpec>;
  var buildApproachTrace: (
    name: string,
    approach: Record<string, unknown>,
    approaches: Record<string, unknown>[],
    input: Record<string, unknown>,
  ) => TraceSpec;
  var LABS: Record<string, ConceptLabSpec>;
  var __DSA_RUNTIME_READY__: Promise<void> | undefined;
}

export {};
