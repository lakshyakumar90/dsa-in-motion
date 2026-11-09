import { useEffect, useMemo, useState } from "react";
import { Accordion } from "@radix-ui/react-accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ArrowDown, ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, ExternalLink } from "lucide-react";
import { AnimationPlayer } from "@/components/visualizer/AnimationPlayer";
import { CodeViewer } from "@/components/CodeViewer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadSolution, problems } from "@/lib/data";
import { readStorage, writeStorage } from "@/lib/utils";
import { approachKindLabel } from "@/algorithms/traceRegistry";
import type { Approach, Solution } from "@/types/problem";

const fallbackApproach = (name: string, solution: NonNullable<(typeof problems)[number]["solution"]>): Approach => ({
  name, type: "optimal", idea: solution.idea, pros: [], cons: [], steps: solution.steps,
  time: solution.time, timeExplanation: "", space: solution.space, spaceExplanation: "",
  cpp: solution.cpp, js: solution.js, python: solution.python,
});

export function ProblemPage({ problemId }: { problemId: string }) {
  const problem = problems.find((item) => item.id === problemId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [solution, setSolution] = useState<Solution>();
  const [revision, setRevision] = useState(0);
  const [note, setNote] = useState(() => readStorage<Record<string, string>>("dsa-motion-notes", {})[problemId] ?? "");
  const approaches = useMemo(() => solution ? (solution.approaches?.length ? solution.approaches : [fallbackApproach(problem?.name ?? "Solution", solution)]) : [], [problem?.name, solution]);
  const approach = approaches[Math.min(selectedIndex, approaches.length - 1)];
  useEffect(() => { let current = true; setSelectedIndex(0); setSolution(undefined); setNote(readStorage<Record<string, string>>("dsa-motion-notes", {})[problemId] ?? ""); if (problem) void loadSolution(problem.name).then((value) => { if (current) setSolution(value); }); return () => { current = false; }; }, [problemId]);
  if (!problem) return <div className="empty-state large">Problem not found. <a href="#questions">Return to the question sheet.</a></div>;
  if (!solution || !approach) return <div className="loading-state">Loading the problem solution…</div>;

  const progress = readStorage<Record<string, boolean>>("dsa-motion-progress", {});
  const bookmarks = readStorage<Record<string, boolean>>("dsa-motion-bookmarks", {});
  function updateFlag(key: "dsa-motion-progress" | "dsa-motion-bookmarks") {
    const data = readStorage<Record<string, boolean>>(key, {});
    writeStorage(key, { ...data, [problemId]: !data[problemId] });
    setRevision((value) => value + 1);
  }
  function updateNote(value: string) { setNote(value); const data = readStorage<Record<string, string>>("dsa-motion-notes", {}); writeStorage("dsa-motion-notes", { ...data, [problemId]: value }); }
  const nextProblem = problems[problems.findIndex((item) => item.id === problem.id) + 1];
  const previousProblem = problems[problems.findIndex((item) => item.id === problem.id) - 1];
  void revision;

  return <div className="problem-layout">
    <aside className="problem-sidebar"><a href="#questions" className="sidebar-heading"><ArrowLeft size={15} /> All questions</a><label className="sidebar-topic-title">{problem.topicTitle}</label>{problems.filter((item) => item.topicIndex === problem.topicIndex).map((item, index) => <a className={item.id === problem.id ? "sidebar-problem active" : "sidebar-problem"} href={`#question/${item.id}`} key={item.id}><span>{String(index + 1).padStart(2, "0")}</span>{item.name}</a>)}</aside>
    <article className="problem-content"><div className="breadcrumbs"><a href="#questions">Question sheet</a><span>/</span><a href={`#topic/${problem.topicIndex}`}>{problem.topicTitle}</a><span>/</span>{problem.questionIndex + 1}</div><span className={`difficulty ${problem.level.toLowerCase()}`}>{problem.level}</span><h1 className="problem-title">{problem.name}</h1><p className="problem-statement">{solution.statement}</p><div className="problem-actions"><Button variant={progress[problem.id] ? "subtle" : "outline"} size="sm" onClick={() => updateFlag("dsa-motion-progress")} aria-pressed={!!progress[problem.id]}><Check size={15} />{progress[problem.id] ? "Understood" : "Mark understood"}</Button><Button variant={bookmarks[problem.id] ? "subtle" : "outline"} size="sm" onClick={() => updateFlag("dsa-motion-bookmarks")} aria-pressed={!!bookmarks[problem.id]}><Bookmark size={15} />{bookmarks[problem.id] ? "Bookmarked" : "Bookmark"}</Button><a className="external-link" href={problem.leetcode} target="_blank" rel="noreferrer">Open problem <ExternalLink size={14} /></a></div>
      <section className="approaches-section" aria-labelledby="approaches-title"><div className="section-heading compact"><div><span className="eyebrow">COMPARE STRATEGIES</span><h2 id="approaches-title">Solution approaches</h2></div><span className="approaches-count">{approaches.length} approaches</span></div><p className="section-intro">Choose a strategy to see its trade-offs, follow the walkthrough, and view its implementation.</p>
        <label className="select-label" htmlFor="approach-select-trigger">Choose an approach</label><Select value={String(selectedIndex)} onValueChange={(value) => setSelectedIndex(Number(value))}><SelectTrigger id="approach-select-trigger" aria-label="Choose an approach"><SelectValue /></SelectTrigger><SelectContent>{approaches.map((item, index) => <SelectItem key={`${item.type}-${index}`} value={String(index)}>{approachKindLabel(item.type)} · {item.name}</SelectItem>)}</SelectContent></Select>
        <div className="approach-detail"><div className="approach-detail-header"><div><span className={`approach-badge ${approach.type}`}>{approachKindLabel(approach.type)}</span><h3>{approach.name}</h3></div><div className="complexity-pills"><span>Time <strong>{approach.time}</strong></span><span>Space <strong>{approach.space}</strong></span></div></div><p className="approach-idea">{approach.idea}</p>
          <Accordion type="multiple" defaultValue={["steps"]} className="approach-accordion">
            <AccordionPrimitive.Item value="steps" className="accordion-item"><AccordionPrimitive.Header><AccordionPrimitive.Trigger className="accordion-trigger">Steps & walkthrough <span>{approach.steps.length} steps</span><ChevronDown size={15} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content className="accordion-content"><ol className="approach-steps">{approach.steps.map((step, index) => <li key={`${index}-${step}`}><span className="approach-step-number">STEP {String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol><div className="approach-example"><strong>Walkthrough example</strong><p>{approach.example || solution.example}</p></div></AccordionPrimitive.Content></AccordionPrimitive.Item>
            <AccordionPrimitive.Item value="tradeoffs" className="accordion-item"><AccordionPrimitive.Header><AccordionPrimitive.Trigger className="accordion-trigger">Advantages & trade-offs <ChevronDown size={15} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content className="accordion-content"><div className="tradeoff-columns"><div><strong>Advantages</strong><ul>{approach.pros.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>Trade-offs</strong><ul>{approach.cons.map((item) => <li key={item}>{item}</li>)}</ul></div></div><p><b>Time:</b> {approach.timeExplanation}</p><p><b>Space:</b> {approach.spaceExplanation}</p></AccordionPrimitive.Content></AccordionPrimitive.Item>
            <AccordionPrimitive.Item value="use" className="accordion-item"><AccordionPrimitive.Header><AccordionPrimitive.Trigger className="accordion-trigger">When to use this approach <ChevronDown size={15} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header><AccordionPrimitive.Content className="accordion-content"><p>{approach.type === "brute" ? "Useful as a simple baseline, for tiny inputs, or to confirm the problem logic." : approach.type === "better" ? "A middle ground when it reduces the brute force cost while keeping the reasoning approachable." : "Usually the preferred implementation when its complexity and constraints fit the problem."}</p></AccordionPrimitive.Content></AccordionPrimitive.Item>
          </Accordion>
        </div>
      </section>
      <section className="learning-section" aria-labelledby="animation-title"><div className="section-heading compact"><div><span className="eyebrow">WATCH THE STATE CHANGE</span><h2 id="animation-title">Algorithm animation</h2></div><span className="approaches-count">{approach.time} time · {approach.space} space</span></div><p className="section-intro">Step through the example, pause at a decision, and inspect the variables beside the visualization.</p><AnimationPlayer key={`${problem.id}-${selectedIndex}`} problemName={problem.name} approach={approach} approaches={approaches} selectedIndex={selectedIndex} onApproachChange={setSelectedIndex} /></section>
      <section className="learning-section" aria-labelledby="solution-code-title"><div className="section-heading compact"><div><h2 id="solution-code-title">Full solution</h2></div></div><p className="section-intro">Explore the complete implementation for the selected approach.</p><CodeViewer approach={approach} /></section>
      <section className="learning-section" aria-labelledby="complexity-overview-title"><div className="section-heading compact"><div><span className="eyebrow">UNDERSTAND THE TRADE-OFF</span><h2 id="complexity-overview-title">Complexity analysis</h2></div></div><p className="section-intro">Trace the loops and extra storage in the selected implementation to understand these bounds.</p>
        <section className="complexity-breakdown" aria-labelledby="complexity-title"><div><span className="eyebrow">READ THE COST FROM THE CODE</span><h3 id="complexity-title">Why these complexity bounds?</h3><p>Follow the work this selected implementation repeats and the extra memory it keeps as the input grows.</p></div><div className="complexity-reasons"><article><div><span>Time complexity</span><strong>{approach.time}</strong></div><p>{approach.timeExplanation || "Count how many times the main operation can run as the input grows, including any nested loops or recursive calls."}</p></article><article><div><span>Space complexity</span><strong>{approach.space}</strong></div><p>{approach.spaceExplanation || "Count the additional storage created by this implementation; the input itself is not counted unless the algorithm copies or expands it."}</p></article></div></section>
        <div className="problem-resources" aria-label="More learning resources">{problem.blog && <a href={problem.blog} target="_blank" rel="noreferrer">Read editorial <ExternalLink size={13} /></a>}{problem.video && <a href={problem.video} target="_blank" rel="noreferrer">Watch explanation <ExternalLink size={13} /></a>}{problem.companies.length > 0 && <span>Asked at: {problem.companies.join(", ")}</span>}</div></section>
      <section className="learning-section personal-notes"><div className="section-heading compact"><div><span className="eyebrow">SAVE A REMINDER</span><h2>Your notes</h2></div></div><textarea value={note} onChange={(event) => updateNote(event.target.value)} placeholder="What clue will help you recognize this problem next time?" aria-label="Your personal notes" /></section>
      <div className="problem-next-links">{previousProblem ? <a href={`#question/${previousProblem.id}`}><ArrowLeft size={15} /> {previousProblem.name}</a> : <span />} {nextProblem ? <a href={`#question/${nextProblem.id}`}>{nextProblem.name} <ArrowRight size={15} /></a> : <a href="#questions">Back to question sheet <ArrowDown size={15} /></a>}</div>
    </article>
  </div>;
}
