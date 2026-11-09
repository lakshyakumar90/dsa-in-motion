export type TraceMode = "execution" | "conceptual";
export type PlaybackStatus = "idle" | "playing" | "paused" | "completed";

export interface ArrayFrame {
  label?: string;
  values?: unknown[];
  active?: number[];
  done?: number[];
  range?: [number, number];
  pointers?: Record<string, number>;
  candidate?: number;
}

export interface MatrixFrame {
  label?: string;
  values: unknown[][];
  active?: [number, number][];
  done?: [number, number][];
}

export interface GraphNode {
  id: string | number;
  label: string;
  x?: number;
  y?: number;
  state?: string;
}

export interface GraphEdge {
  from: string | number;
  to: string | number;
  label?: string | number;
  state?: boolean | string;
  directed?: boolean;
}

export interface AnimationFrame {
  title?: string;
  message?: string;
  why?: string;
  cost?: string;
  insight?: string;
  arrays?: ArrayFrame[];
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  graphLabel?: string;
  matrix?: MatrixFrame;
  vars?: Record<string, unknown>;
  output?: unknown;
  /** Per-language source line actively responsible for this frame, when known. */
  codeLines?: Partial<Record<"cpp" | "js" | "python", number>>;
  [key: string]: unknown;
}

export interface TraceSpec {
  input: Record<string, unknown>;
  run: (input: Record<string, unknown>, emit: (frame: AnimationFrame) => void) => unknown;
}

export interface GeneratedTrace {
  input: Record<string, unknown>;
  output: unknown;
  frames: AnimationFrame[];
  mode: TraceMode;
}

export type LabInput = number[] | string | number | number[][];
export interface ConceptFrame {
  a: unknown[];
  kind?: string;
  active?: number[];
  secondary?: number[];
  done?: number;
  range?: [number, number];
  water?: number[];
  visited?: number[];
  stack?: string[];
  chosen?: number[];
  output?: unknown[];
  value?: number;
  text: string;
}
export interface ConceptLabSpec {
  title: string;
  topic: number;
  input: string;
  param?: number | null;
  paramLabel?: string;
  unit: string;
  description: string;
  textInput?: boolean;
  singleInput?: boolean;
  intervalInput?: boolean;
  trace: (input: LabInput, param?: number) => ConceptFrame[];
}
