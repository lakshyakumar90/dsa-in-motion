import { useEffect, useMemo, useState } from "react";
import { AnimationPlayer } from "@/features/visualizer/AnimationPlayer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadSolution, problems } from "@/lib/data";
import type { Approach, Solution } from "@/types/problem";

export function PlaygroundPage() {
  const [problemId, setProblemId] = useState(problems[0]?.id ?? "");
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [solution, setSolution] = useState<Solution>();
  const problem = problems.find((item) => item.id === problemId) ?? problems[0];

  useEffect(() => {
    let current = true;
    setSolution(undefined);
    setSelectedIndex(2);
    if (problem) void loadSolution(problem.name).then((value) => { if (current) setSolution(value); });
    return () => { current = false; };
  }, [problem?.id]);

  const approaches = useMemo<Approach[]>(() => solution?.approaches?.length ? solution.approaches : solution && problem ? [{ ...solution, name: problem.name, type: "optimal", pros: [], cons: [], timeExplanation: "", spaceExplanation: "" }] : [], [problem, solution]);
  const safeIndex = Math.min(selectedIndex, Math.max(0, approaches.length - 1));
  const approach = approaches[safeIndex];

  return (
    <section className="playground-page">
      <div className="page-heading">
        <span className="eyebrow">INTERACTIVE PLAYGROUND · 165 × 3 APPROACHES</span>
        <h1>Choose an algorithm.<br /><em>Follow the state.</em></h1>
        <p>Switch between Brute Force, Better, and Optimal animations for any of the 165 problems. Edit the JSON input and inspect every DS visualizer live.</p>
      </div>
      <div className="playground-picker">
        <label htmlFor="playground-problem">Choose a problem</label>
        <Select value={problem?.id ?? ""} onValueChange={setProblemId}>
          <SelectTrigger id="playground-problem"><SelectValue /></SelectTrigger>
          <SelectContent>
            {problems.map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.name} · {item.topicTitle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <a href={`#question/${problem?.id}`}>Open explanation and code ↗</a>
      </div>
      {problem && approach ? (
        <AnimationPlayer
          key={`${problem.id}-${safeIndex}`}
          problemName={problem.name}
          approach={approach}
          approaches={approaches}
          selectedIndex={safeIndex}
          onApproachChange={setSelectedIndex}
        />
      ) : (
        <div className="loading-state">Loading problem data…</div>
      )}
    </section>
  );
}
