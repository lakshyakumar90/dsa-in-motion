import { useMemo, useState } from "react";
import { ArrowRight, BookMarked, Check, Copy, Download, FileText, Search, Sparkles } from "lucide-react";
import { topicNotes } from "@/data/topicNotes";
import { problems } from "@/lib/data";
import { readStorage, writeStorage } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function NotesPage() {
  const [activeTab, setActiveTab] = useState<"study" | "personal">("study");
  const [selectedTopic, setSelectedTopic] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() =>
    readStorage<Record<string, string>>("dsa-motion-notes", {})
  );

  const currentTopicNote = topicNotes[selectedTopic] ?? topicNotes[0];
  const topicProblems = useMemo(
    () => problems.filter((p) => p.topicIndex === currentTopicNote.topicIndex),
    [currentTopicNote.topicIndex]
  );

  const savedNotesCount = useMemo(
    () => Object.values(notesMap).filter((v) => v.trim().length > 0).length,
    [notesMap]
  );

  const filteredProblems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return problems.filter((p) => {
      const noteText = notesMap[p.id] ?? "";
      if (onlyWithNotes && !noteText.trim()) return false;
      if (!q) return true;
      return `${p.name} ${p.topicTitle} ${noteText}`.toLowerCase().includes(q);
    });
  }, [searchQuery, onlyWithNotes, notesMap]);

  function handleSaveNote(problemId: string, value: string) {
    const updated = { ...notesMap, [problemId]: value };
    setNotesMap(updated);
    writeStorage("dsa-motion-notes", updated);
  }

  async function copyTemplate(idx: number, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      setCopiedIdx(null);
    }
  }

  function exportNotesMarkdown() {
    const lines: string[] = ["# My DSA in Motion Study Notes", ""];
    for (const p of problems) {
      const text = notesMap[p.id]?.trim();
      if (!text) continue;
      lines.push(`## ${p.name} (${p.topicTitle} · ${p.level})`, "", text, "");
    }
    if (lines.length === 2) {
      lines.push("_No personal problem notes saved yet._");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dsa-in-motion-notes.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="notes-page">
      <div className="page-heading">
        <span className="eyebrow"><Sparkles size={14} /> ILLUSTRATED NOTES & PATTERN CHEAT SHEETS</span>
        <h1>Notes that read like<br /><em>a visual mentor.</em></h1>
        <p>Review core invariants, reusable pattern templates, complexity cheat sheets, and your personal problem notes — all in one workspace.</p>
      </div>

      <div className="notes-mode-bar" role="tablist" aria-label="Notes workspace mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "study"}
          className={activeTab === "study" ? "notes-tab is-active" : "notes-tab"}
          onClick={() => setActiveTab("study")}
        >
          <BookMarked size={15} /> Topic Cheat Sheets <span>14</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "personal"}
          className={activeTab === "personal" ? "notes-tab is-active" : "notes-tab"}
          onClick={() => setActiveTab("personal")}
        >
          <FileText size={15} /> My Problem Notes <span>{savedNotesCount}</span>
        </button>
        <Button variant="outline" size="sm" className="notes-export-btn" onClick={exportNotesMarkdown}>
          <Download size={14} /> Export .md
        </Button>
      </div>

      {activeTab === "study" ? (
        <div className="notes-study-layout">
          <aside className="notes-topic-rail" aria-label="DSA Topics">
            {topicNotes.map((item, idx) => (
              <button
                key={item.title}
                type="button"
                className={idx === selectedTopic ? "notes-topic-btn is-active" : "notes-topic-btn"}
                onClick={() => setSelectedTopic(idx)}
              >
                <span className="notes-topic-num">{String(idx + 1).padStart(2, "0")}</span>
                <strong>{item.title}</strong>
              </button>
            ))}
          </aside>

          <article className="notes-sheet-card">
            <header className="notes-sheet-header">
              <div>
                <span className="eyebrow">TOPIC {String(currentTopicNote.topicIndex + 1).padStart(2, "0")} · {currentTopicNote.dsTag}</span>
                <h2>{currentTopicNote.title}</h2>
              </div>
              <a className="notes-topic-jump" href={`#topic/${currentTopicNote.topicIndex}`}>
                Open interactive lesson <ArrowRight size={14} />
              </a>
            </header>

            <div className="notes-mental-model">
              <strong>Core Mental Model</strong>
              <p>{currentTopicNote.mentalModel}</p>
            </div>

            <div className="notes-two-col">
              <div className="notes-block">
                <h3>When to recognize this pattern</h3>
                <ul>
                  {currentTopicNote.whenToUse.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>
              <div className="notes-block">
                <h3>Common interview pitfalls</h3>
                <ul className="notes-pitfalls-list">
                  {currentTopicNote.pitfalls.map((pitfall) => (
                    <li key={pitfall}>{pitfall}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="notes-template-box">
              <div className="notes-template-bar">
                <span>Reusable Pattern Template</span>
                <button
                  type="button"
                  onClick={() => void copyTemplate(currentTopicNote.topicIndex, currentTopicNote.patternTemplate)}
                >
                  {copiedIdx === currentTopicNote.topicIndex ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
              <pre><code>{currentTopicNote.patternTemplate}</code></pre>
            </div>

            <div className="notes-complexity-box">
              <h3>Complexity Cheat Sheet</h3>
              <table>
                <thead>
                  <tr>
                    <th>Operation / Pattern</th>
                    <th>Time</th>
                    <th>Space</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTopicNote.complexityCheatSheet.map((row) => (
                    <tr key={row.operation}>
                      <td>{row.operation}</td>
                      <td><code>{row.time}</code></td>
                      <td><code>{row.space}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="notes-related-problems">
              <h3>Practice problems in {currentTopicNote.title} ({topicProblems.length})</h3>
              <div className="notes-problem-chips">
                {topicProblems.map((p) => (
                  <a key={p.id} href={`#question/${p.id}`} className="notes-problem-chip">
                    <span>{p.name}</span>
                    <em className={`difficulty ${p.level.toLowerCase()}`}>{p.level}</em>
                  </a>
                ))}
              </div>
            </div>
          </article>
        </div>
      ) : (
        <div className="notes-personal-workspace">
          <div className="notes-personal-filters">
            <label className="search-field">
              <Search size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem titles, topics, or your saved notes…"
              />
            </label>
            <Button
              variant={onlyWithNotes ? "subtle" : "outline"}
              size="sm"
              onClick={() => setOnlyWithNotes((v) => !v)}
            >
              {onlyWithNotes ? "Showing saved only" : "Filter: saved notes only"}
            </Button>
          </div>

          <div className="notes-personal-grid">
            {filteredProblems.slice(0, 40).map((p) => (
              <article className="personal-note-card" key={p.id}>
                <div className="personal-note-card-head">
                  <div>
                    <a href={`#question/${p.id}`}>{p.name}</a>
                    <small>{p.topicTitle}</small>
                  </div>
                  <span className={`difficulty ${p.level.toLowerCase()}`}>{p.level}</span>
                </div>
                <textarea
                  value={notesMap[p.id] ?? ""}
                  onChange={(e) => handleSaveNote(p.id, e.target.value)}
                  placeholder="Write key invariants, edge cases, or brute → optimal insight…"
                  aria-label={`Notes for ${p.name}`}
                />
              </article>
            ))}
            {filteredProblems.length === 0 && (
              <div className="empty-state large">No matching problems found. Try clearing your filter.</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
