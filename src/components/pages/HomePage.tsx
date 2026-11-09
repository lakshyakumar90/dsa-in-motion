import { ArrowLeft, ArrowRight, Code2, Layers3, Sparkles } from "lucide-react";
import { useState } from "react";
import { topics, curriculum } from "@/lib/data";
import { ConceptLab } from "@/components/visualizer/ConceptLab";
import { Button } from "@/components/ui/button";

const featuredModels = ["water", "binary", "tree", "linked", "dp", "graph"];

export function HomePage() {
  const [modelIndex, setModelIndex] = useState(0);
  const modelId = featuredModels[modelIndex];
  return <div className="home-page">
    <section className="hero"><div className="hero-copy"><span className="eyebrow"><Sparkles size={14} /> A visual DSA learning space</span><h1>Learn DSA<br /><em>in motion.</em></h1><p>Build intuition by watching algorithms work through real examples. Explore the idea, follow each state, then read the code.</p><div className="hero-actions"><a className="primary-link" href="#topic/0">Start learning <ArrowRight size={16} /></a><a className="text-link" href="#questions">Browse the question sheet</a></div><div className="hero-meta">165 questions <span /> 14 topics <span /> C++ · JavaScript · Python</div></div><div className="hero-visual"><ConceptLab key={modelId} modelId={modelId} compact /><div className="hero-model-picker"><span>Featured model {String(modelIndex + 1).padStart(2, "0")} / {featuredModels.length}</span><div className="hero-model-actions"><Button variant="outline" size="icon" onClick={() => setModelIndex((value) => (value + featuredModels.length - 1) % featuredModels.length)} aria-label="Previous featured model"><ArrowLeft size={15} /></Button><Button variant="outline" size="icon" onClick={() => setModelIndex((value) => (value + 1) % featuredModels.length)} aria-label="Next featured model"><ArrowRight size={15} /></Button></div></div><div className="hero-note"><Code2 size={15} /> Follow the state. Understand the decision.</div></div></section>
    <section className="home-stats" aria-label="Application contents"><div><strong>165</strong><span>practice questions</span></div><div><strong>14</strong><span>learning topics</span></div><div><strong>3</strong><span>solution languages</span></div></section>
    <section className="topic-section"><div className="section-heading"><div><span className="eyebrow">The learning path</span><h2>Start with the idea.<br />Stay for the insight.</h2></div><p>Go topic by topic, or jump straight to the question you are working on. Each problem links its explanation, solution approaches, code, and animation.</p></div><div className="topic-grid">{topics.map((topic, index) => <a className="topic-card" href={`#topic/${index}`} key={topic.title}><div className="topic-card-top"><span>TOPIC {String(index + 1).padStart(2, "0")}</span><span>{curriculum.topics[index]?.resources.length ?? 0} questions</span></div><div className="topic-glyph"><Layers3 size={20} /><span>{String(index + 1).padStart(2, "0")}</span></div><h3>{topic.title}</h3><p>{topic.short}</p><span className="card-link">Explore topic <ArrowRight size={14} /></span></a>)}</div></section>
  </div>;
}
