import { useEffect, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { AnimationPlayer } from "@/components/visualizer/AnimationPlayer";
import { curriculum, loadSolution, problems, topics } from "@/lib/data";
import { Button } from "@/components/ui/button";
import type { Approach, Solution } from "@/types/problem";

const representativeNames = ["Find Largest Number in an Array", "Trapping Rain Water", "Reverse Linked List", "Longest Substring Without Repeating Characters", "Valid Parentheses", "Binary Search", "Trapping Rain Water", "Level Order Traversal", "Search in a BST", "Kth Largest Element in an Array", "Subsets - The Power Set", "Non Overlapping Intervals", "Climbing Stairs", "Find if Path Exists in Graph"];

function TopicRepresentative({ problemName }: { problemName: string }) {
  const [solution, setSolution] = useState<Solution>();
  useEffect(() => { let current = true; void loadSolution(problemName).then((value) => { if (current) setSolution(value); }); return () => { current = false; }; }, [problemName]);
  const approaches: Approach[] = solution?.approaches?.length ? solution.approaches : solution ? [{ ...solution, name: problemName, type: "optimal", pros: [], cons: [], timeExplanation: "", spaceExplanation: "" }] : [];
  const approach = approaches.find((item) => item.type === "optimal") ?? approaches[0];
  if (!approach) return <p className="loading-state">Loading the representative example…</p>;
  return <><p className="section-intro">{solution?.idea}</p><AnimationPlayer problemName={problemName} approach={approach} approaches={approaches} /></>;
}

export function TopicPage({ topicIndex }: { topicIndex: number }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const topic = topics[topicIndex];
  if (!topic) return <div className="empty-state large">Topic not found.</div>;
  const topicProblems = problems.filter((problem) => problem.topicIndex === topicIndex);
  return <section className="topic-page"><div className="breadcrumbs"><a href="#home">Learn</a><span>/</span>Topic {topicIndex + 1}</div><div className="page-heading"><span className="eyebrow">TOPIC {String(topicIndex + 1).padStart(2, "0")} · {topicProblems.length} QUESTIONS</span><h1>{topic.title}</h1><p>{topic.short}</p></div><section className="topic-model-section"><div className="section-heading compact"><div><span className="eyebrow">MOVE THE IDEA AROUND</span><h2>See it in an example</h2></div></div><TopicRepresentative problemName={representativeNames[topicIndex]} /></section><div className="concept-grid"><article className="concept-main"><span className="eyebrow"><Lightbulb size={14} /> THE CORE IDEA</span><h2>{topic.idea}</h2><div className="invariant-box"><strong>Invariant to remember</strong><p>{topic.invariant}</p></div><h3>Build the intuition</h3><ol className="concept-steps">{topic.explain.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol><div className="pitfall"><strong>Common pitfall</strong><p>{topic.pitfall}</p></div>{topic.quiz && <div className="topic-quiz"><span className="eyebrow">QUICK CHECK</span><h3>{topic.quiz}</h3><div className="quiz-options">{topic.options.map((option, index) => <Button variant={answer === index ? (index === topic.answer ? "subtle" : "outline") : "outline"} key={option} onClick={() => setAnswer(index)}>{option}</Button>)}</div>{answer !== null && <p className={answer === topic.answer ? "quiz-feedback correct" : "quiz-feedback"}>{answer === topic.answer ? "Correct." : "Not quite."} {topic.why}</p>}</div>}</article><aside className="topic-question-panel"><span className="eyebrow">PRACTICE THIS IDEA</span><h2>Questions in this topic</h2>{topicProblems.map((problem, index) => <a className="topic-question-link" href={`#question/${problem.id}`} key={problem.id}><span className="topic-question-index">{String(index + 1).padStart(2, "0")}</span><span>{problem.name}<small>{problem.level}</small></span><ArrowRight size={15} /></a>)}<a className="topic-sheet-link" href="#questions">Open full question sheet <ArrowRight size={15} /></a></aside></div><footer className="topic-footer"><a href={`#topic/${(topicIndex + topics.length - 1) % topics.length}`}>← Previous topic</a><a href={`#topic/${(topicIndex + 1) % topics.length}`}>Next topic →</a></footer><span className="sr-only">{curriculum.topics[topicIndex]?.name}</span></section>;
}
