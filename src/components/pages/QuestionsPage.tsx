import { useMemo, useState } from "react";
import { Search, Bookmark, Check, ChevronDown } from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Accordion } from "@radix-ui/react-accordion";
import NumberFlow from "@number-flow/react";
import { problems } from "@/lib/data";
import { readStorage, writeStorage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type IdMap = Record<string, boolean>;

export function QuestionsPage() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [topic, setTopic] = useState("All");
  const [status, setStatus] = useState("All");
  const [revision, setRevision] = useState(0);
  const progress = readStorage<IdMap>("dsa-motion-progress", {});
  const bookmarks = readStorage<IdMap>("dsa-motion-bookmarks", {});
  const filtered = useMemo(() => problems.filter((problem) => {
    const search = `${problem.name} ${problem.topicTitle} ${problem.companies.join(" ")}`.toLowerCase();
    return (!query || search.includes(query.toLowerCase())) && (difficulty === "All" || problem.level === difficulty) && (topic === "All" || problem.topicTitle === topic) && (status === "All" || (status === "Understood" ? !!progress[problem.id] : status === "Bookmarked" ? !!bookmarks[problem.id] : !progress[problem.id]));
  }), [query, difficulty, topic, status, revision]);
  const grouped = useMemo(() => {
    const groups = new Map<number, { title: string; questions: typeof filtered }>();
    for (const problem of filtered) {
      const group = groups.get(problem.topicIndex) ?? { title: problem.topicTitle, questions: [] };
      group.questions.push(problem);
      groups.set(problem.topicIndex, group);
    }
    return Array.from(groups, ([topicIndex, group]) => ({ topicIndex, ...group }));
  }, [filtered]);
  function toggle(map: IdMap, key: string, storageKey: string) { const next = { ...map, [key]: !map[key] }; writeStorage(storageKey, next); setRevision((value) => value + 1); }
  return <section className="questions-page">
    <div className="page-heading"><span className="eyebrow">PRACTICE SHEET · 165 PROBLEMS</span><h1>Find your next<br /><em>“aha” moment.</em></h1><p>Search the question list, find your topic, and explore the solution and animation together.</p></div>
    <div className="filters"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions, topics, companies…" /></label><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Filter by difficulty"><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select><select value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Filter by topic"><option>All</option>{Array.from(new Set(problems.map((problem) => problem.topicTitle))).map((name) => <option key={name}>{name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option>All</option><option>Understood</option><option>Not understood</option><option>Bookmarked</option></select><span className="result-count"><NumberFlow value={filtered.length} /> found</span></div>
    {grouped.length ? <Accordion type="multiple" className="question-topic-accordion">
      {grouped.map(({ topicIndex, title, questions }) => {
        const understood = questions.filter((problem) => progress[problem.id]).length;
        return <AccordionPrimitive.Item value={`topic-${topicIndex}`} className="question-topic-item" key={topicIndex}>
          <AccordionPrimitive.Header><AccordionPrimitive.Trigger className="question-topic-trigger"><span className="question-topic-title">{title}</span><span className="question-topic-meta">{understood}/{questions.length} understood · {questions.length} questions</span><ChevronDown size={17} /></AccordionPrimitive.Trigger></AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="question-topic-content"><div className="question-list">{questions.map((problem) => <article className="question-row" key={problem.id}><Button variant="ghost" size="icon" aria-label={progress[problem.id] ? "Mark not understood" : "Mark understood"} aria-pressed={!!progress[problem.id]} onClick={() => toggle(progress, problem.id, "dsa-motion-progress")} className={progress[problem.id] ? "row-action is-done" : "row-action"}><Check size={15} /></Button><a href={`#question/${problem.id}`} className="question-name"><span>{problem.name}</span><small>{problem.topicTitle}</small></a><span className={`difficulty ${problem.level.toLowerCase()}`}>{problem.level}</span><Button variant="ghost" size="icon" aria-label={bookmarks[problem.id] ? "Remove bookmark" : "Bookmark"} aria-pressed={!!bookmarks[problem.id]} onClick={() => toggle(bookmarks, problem.id, "dsa-motion-bookmarks")} className={bookmarks[problem.id] ? "row-action is-bookmarked" : "row-action"}><Bookmark size={15} /></Button></article>)}</div></AccordionPrimitive.Content>
        </AccordionPrimitive.Item>;
      })}
    </Accordion> : <div className="empty-state large">No questions match these filters. Try another search or reset a filter.</div>}
  </section>;
}
