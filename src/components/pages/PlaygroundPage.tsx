import { useEffect, useMemo, useState } from "react";
import { AnimationPlayer } from "@/components/visualizer/AnimationPlayer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadSolution, problems } from "@/lib/data";
import type { Approach, Solution } from "@/types/problem";

export function PlaygroundPage() {
  const [problemId, setProblemId] = useState(problems[0]?.id ?? "");
  const [solution, setSolution] = useState<Solution>();
  const problem = problems.find((item) => item.id === problemId) ?? problems[0];
  useEffect(() => { let current = true; setSolution(undefined); if (problem) void loadSolution(problem.name).then((value) => { if (current) setSolution(value); }); return () => { current = false; }; }, [problem?.id]);
  const approaches = useMemo<Approach[]>(() => solution?.approaches?.length ? solution.approaches : solution && problem ? [{ ...solution, name: problem.name, type: "optimal", pros: [], cons: [], timeExplanation: "", spaceExplanation: "" }] : [], [problem, solution]);
  const approach = approaches.find((item) => item.type === "optimal") ?? approaches[0];
  return <section className="playground-page"><div className="page-heading"><span className="eyebrow">INTERACTIVE PLAYGROUND</span><h1>Choose an algorithm.<br /><em>Follow the state.</em></h1><p>Explore an animation from any of the 165 questions. Change the example input and use the controls to move through its trace.</p></div><div className="playground-picker"><label htmlFor="playground-problem">Choose a problem</label><Select value={problem?.id ?? ""} onValueChange={setProblemId}><SelectTrigger id="playground-problem"><SelectValue /></SelectTrigger><SelectContent>{problems.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.topicTitle}</SelectItem>)}</SelectContent></Select><a href={`#question/${problem?.id}`}>Open explanation and code ↗</a></div>{problem && approach ? <AnimationPlayer key={problem.id} problemName={problem.name} approach={approach} approaches={approaches} /> : <div className="loading-state">Loading problem data…</div>}</section>;
}
