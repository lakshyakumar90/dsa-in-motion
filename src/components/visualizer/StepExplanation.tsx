import { ArrowDown, ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import type { AnimationFrame } from "@/types/animation";
import { prettyValue } from "@/lib/animationUtils";

export function StepExplanation({ frame, index, total, started, logicLine }: { frame: AnimationFrame; index: number; total: number; started: boolean; logicLine?: number }) {
  const pointers = (frame.arrays ?? []).flatMap((array) => Object.entries(array.pointers ?? {}).map(([name, position]) => ({
    name,
    target: `${array.label ?? "Array"}[${position}]`,
    value: array.values?.[position],
  })));
  return <section className="step-explanation" aria-live="polite">
    <div className="step-overline"><Lightbulb size={15} /> {started ? `Step ${index + 1} of ${total}` : "Initial state · ready"}{started && logicLine !== undefined && <span className="step-line-badge">Line {logicLine}</span>}</div>
    <h3>{frame.title ?? (started ? `Step ${index + 1}` : "Before the algorithm starts")}</h3><p>{frame.message ?? "Follow the visual state to see what changed."}</p>
    <div className="step-flow" aria-label="Where the algorithm is looking">
      {!started ? <span><ArrowDown size={14} /> Input is unchanged. Press Play or Next step to begin.</span> : pointers.length ? pointers.map((pointer) => <span className="step-pointer" key={`${pointer.name}-${pointer.target}`}><ArrowRight size={14} /><strong>{pointer.name}</strong><span>points to</span><code>{pointer.target}{pointer.value !== undefined ? ` = ${prettyValue(pointer.value)}` : ""}</code></span>) : frame.output !== undefined ? <span><CheckCircle2 size={14} /> Result → {prettyValue(frame.output)}</span> : <span><ArrowDown size={14} /> Read the highlighted state below.</span>}
    </div>
  </section>;
}
