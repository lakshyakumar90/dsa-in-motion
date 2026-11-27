import { ArrowLeft, ArrowRight, BookMarked, Code2, Layers3, Sparkles } from "lucide-react";
import { useState } from "react";
import { topics, curriculum } from "@/lib/data";
import { ConceptLab } from "@/features/visualizer/ConceptLab";
import { Button } from "@/components/ui/button";
import { topicNotes } from "@/data/topicNotes";

const featuredModels = ["water", "binary", "tree", "linked", "dp", "graph"];

export function HomePage() {
  const [modelIndex, setModelIndex] = useState(0);
  const modelId = featuredModels[modelIndex];
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> VISUAL DSA PREP · INSPIRED BY CHAICODE</span>
          <h1>Learn DSA<br /><em>in motion.</em></h1>
          <p>
            Master all 165 interview problems with tailored data-structure animations, side-by-side Brute Force → Better → Optimal approaches, and illustrated pattern notes.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#topic/0">Start learning <ArrowRight size={16} /></a>
            <a className="text-link" href="#questions">Practice sheet (165)</a>
            <a className="text-link" href="#notes"><BookMarked size={13} /> Illustrated notes</a>
          </div>
          <div className="hero-meta">
            165 questions <span /> 495 approaches <span /> 7 DS visualizers <span /> C++ · JS · Python
          </div>
        </div>
        <div className="hero-visual">
          <ConceptLab key={modelId} modelId={modelId} compact />
          <div className="hero-model-picker">
            <span>Featured model {String(modelIndex + 1).padStart(2, "0")} / {featuredModels.length}</span>
            <div className="hero-model-actions">
              <Button variant="outline" size="icon" onClick={() => setModelIndex((value) => (value + featuredModels.length - 1) % featuredModels.length)} aria-label="Previous featured model"><ArrowLeft size={15} /></Button>
              <Button variant="outline" size="icon" onClick={() => setModelIndex((value) => (value + 1) % featuredModels.length)} aria-label="Next featured model"><ArrowRight size={15} /></Button>
            </div>
          </div>
          <div className="hero-note"><Code2 size={15} /> Follow the state. Compare Brute → Better → Optimal.</div>
        </div>
      </section>

      <section className="home-stats home-stats-4" aria-label="Application contents">
        <div><strong>165</strong><span>animated DSA problems</span></div>
        <div><strong>495</strong><span>brute · better · optimal solutions</span></div>
        <div><strong>7</strong><span>DS-specific visualizers</span></div>
        <div><strong>14</strong><span>illustrated topic notes</span></div>
      </section>

      <section className="topic-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE LEARNING PATH</span>
            <h2>Start with the idea.<br />Stay for the insight.</h2>
          </div>
          <p>Every topic pairs a dedicated visual model, core invariants, pattern notes, and practice problems with all three solution approaches.</p>
        </div>
        <div className="topic-grid">
          {topics.map((topic, index) => (
            <a className="topic-card" href={`#topic/${index}`} key={topic.title}>
              <div className="topic-card-top">
                <span>TOPIC {String(index + 1).padStart(2, "0")}</span>
                <span>{curriculum.topics[index]?.resources.length ?? 0} questions</span>
              </div>
              <div className="topic-glyph"><Layers3 size={20} /><span>{String(index + 1).padStart(2, "0")}</span></div>
              <h3>{topic.title}</h3>
              <p>{topic.short}</p>
              <div className="topic-card-footer">
                <span className="topic-ds-chip">{topicNotes[index]?.dsTag.split("·")[0].trim() ?? "DSA"}</span>
                <span className="card-link">Explore <ArrowRight size={14} /></span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
