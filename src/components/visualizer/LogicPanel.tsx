import { useEffect, useMemo, useState } from "react";
import { Check, Copy, PencilLine, X } from "lucide-react";
import type { AnimationFrame, TraceMode } from "@/types/animation";
import type { Approach } from "@/types/problem";

interface LogicLine { text: string; sourceLine?: number }

function isExecutableLine(text: string) {
  const line = text.trim();
  return !!line && !line.startsWith("//") && !line.startsWith("/*") && !line.startsWith("*") && !/^[{};]+$/.test(line) && !/^(?:class|struct)\s/.test(line) && !/^\w[\w\s:*&<>]*\s+\w+\([^;]*\)\s*\{?$/.test(line);
}

/** Select the C++ operation that best explains this frame when its trace has
 * no explicit source-line mapping (common in older tree and graph traces). */
function inferActiveSourceLine(executable: LogicLine[], frame: AnimationFrame): number | undefined {
  const title = `${frame.title ?? ""} ${frame.message ?? ""}`.toLowerCase();
  const lineFor = (pattern: RegExp) => executable.find((line) => pattern.test(line.text));
  const choose = (...patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const found = lineFor(pattern);
      if (found) return found.sourceLine;
    }
    return undefined;
  };

  if (/\breturn\b|result is complete|answer is/.test(title)) return choose(/^\s*return\b/);
  if (/\bsort\b/.test(title)) return choose(/\bsort\s*\(/);
  if (/\bswap\b/.test(title)) return choose(/\bswap\s*\(/, /\[[^\]]+\]\s*=\s*\[/);
  if (/enqueue|push (?:the )?(?:node|value)|add (?:to|into) (?:the )?queue/.test(title)) return choose(/\.push_back\s*\(/, /\.push\s*\(/, /\.emplace\s*\(/, /\.append\s*\(/);
  if (/dequeue|pop (?:the )?(?:node|value)|remove (?:from|the) (?:queue|stack)|take (?:the )?(?:front|top)/.test(title)) return choose(/\.pop\s*\(/, /\.front\s*\(/, /\.top\s*\(/);
  if (/compare|comparison|check|test|condition|is (?:valid|safe|equal|greater|smaller)/.test(title)) return choose(/^\s*(?:if|else if|while)\s*\(/, /^\s*(?:if|while)\s*\(/);
  if (/mark (?:as )?(?:visited|seen)|visit(?:ed)?|discover/.test(title)) return choose(/visited|visited\s*\[/i, /seen\s*\./i, /\.insert\s*\(/, /\.add\s*\(/, /\.push_back\s*\(/);
  if (/write|copy|append|store|place|assign|fill|put /.test(title)) return choose(/\[[^\]]+\]\s*=/, /\*\w+\s*=/, /\.push_back\s*\(/, /\.push\s*\(/, /\.append\s*\(/, /\.insert\s*\(/);
  if (/move|advance|increment|decrement|pointer/.test(title)) {
    const vars = Object.keys(frame.vars ?? {}).filter((key) => /^(?:i|j|k|l|r|left|right|read|write|slow|fast|current|curr|prev|top|head|tail|mid|low|high|w|u|v|index|ptr)$/i.test(key));
    for (const name of vars) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const line = lineFor(new RegExp(`\\b${escaped}\\b.*(?:\\+\\+|--|\\+=|-=)`))
        ?? lineFor(new RegExp(`\\b${escaped}\\b.*=`));
      if (line) return line.sourceLine;
    }
    return choose(/\+\+|--|\+=|-=|\b(?:left|right|slow|fast|current|curr|prev|top|head|tail|mid|low|high|write|read)\b\s*=/);
  }
  if (/initialize|initialise|start with|set (?:the )?(?:pointer|count|index|minimum|maximum|result)/.test(title)) return choose(/^\s*(?:int|long|size_t|auto|bool|vector|std::\w+)\s+\w+\s*(?:=|\()/, /^\s*\w+\s*=/);

  // Last resort: match meaningful words from the step against code tokens.
  const words = title.match(/[a-z_][a-z_0-9]{2,}/g) ?? [];
  let best: { line: LogicLine; score: number } | undefined;
  for (const line of executable) {
    const code = line.text.toLowerCase();
    const score = words.reduce((sum, word) => sum + (code.includes(word) ? 1 : 0), 0);
    if (score > (best?.score ?? 0)) best = { line, score };
  }
  return best?.score ? best.line.sourceLine : executable[0]?.sourceLine;
}

function activeSourceLine(approach: Approach, frame: AnimationFrame) {
  const source = approach.cpp.split("\n");
  const executable = source.map((text, index) => ({ text, sourceLine: index + 1 })).filter(({ text }) => isExecutableLine(text));
  const requestedLine = frame.codeLines?.cpp;
  return requestedLine && executable.some((line) => line.sourceLine === requestedLine)
    ? requestedLine
    : inferActiveSourceLine(executable, frame);
}

/** The compact notation intentionally follows the same operations as the full solution. */
function mergeLogic(approach: Approach, frame: AnimationFrame): { lines: LogicLine[]; active?: number } {
  const activeLine = activeSourceLine(approach, frame);
  const activeSource = approach.cpp.split("\n")[(activeLine ?? 0) - 1] ?? "";
  if (approach.type === "brute") {
    const lines = ["for j = 0 to n - 1:", "    nums1[m + j] = nums2[j]", "sort(nums1)", "return nums1"].map((text) => ({ text }));
    const active = activeSource.includes("for (int j") ? 1 : activeSource.includes("nums1[m + j]") ? 2 : activeSource.includes("sort(") ? 3 : activeSource.includes("return nums1") ? 4 : /move j|advance j|read nums2/i.test(`${frame.title} ${frame.message}`) ? 1 : undefined;
    return { lines, active };
  }
  if (approach.type === "better") {
    const lines = ["i = 0; j = 0; merged = []", "while i < m and j < n:", "    compare nums1[i] and nums2[j]", "    append the smaller value to merged", "    advance its source pointer", "append the remaining sorted tail", "copy merged back into nums1", "return nums1"].map((text) => ({ text }));
    const active = /int [ij] = 0/.test(activeSource) ? 1 : activeSource.includes("if (nums1[i]") ? 3 : activeSource.includes("while (i < m && j < n)") ? 2 : activeSource.includes("while (i < m)") || activeSource.includes("while (j < n)") ? 6 : activeSource.includes("merged.push") ? 4 : /[ij] \+= 1/.test(activeSource) ? 5 : activeSource.includes("nums1[k] = merged[k]") ? 7 : activeSource.includes("return nums1") ? 8 : undefined;
    return { lines, active };
  }
  const lines = ["i = m - 1; j = n - 1; w = m + n - 1", "while j >= 0:", "    compare nums1[i] and nums2[j]", "    nums1[w] = larger remaining value", "    move its source pointer left", "    w = w - 1"].map((text) => ({ text }));
  const active = /int [ijw] =/.test(activeSource) ? 1 : activeSource.includes("while (j >= 0)") ? 2 : activeSource.includes("if (i >= 0") ? 3 : activeSource.includes("nums1[w] =") ? 4 : /[ij] -= 1/.test(activeSource) ? 5 : activeSource.includes("w -= 1") ? 6 : undefined;
  return { lines, active };
}

function sourceExcerpt(approach: Approach, frame: AnimationFrame): { lines: LogicLine[]; active?: number } {
  const source = approach.cpp.split("\n");
  const executable = source.map((text, index) => ({ text, sourceLine: index + 1 })).filter(({ text }) => isExecutableLine(text));
  const activeSourceLine = activeSourceLineForExcerpt(executable, approach, frame);
  const activeIndex = executable.findIndex((line) => line.sourceLine === activeSourceLine);
  const start = activeIndex < 0 ? 0 : Math.max(0, Math.min(activeIndex - 2, executable.length - 7));
  const lines = executable.slice(start, start + 7);
  const visibleActive = lines.findIndex((line) => line.sourceLine === activeSourceLine);
  return { lines, active: visibleActive < 0 ? undefined : visibleActive + 1 };
}

function activeSourceLineForExcerpt(executable: LogicLine[], approach: Approach, frame: AnimationFrame) {
  const resolved = activeSourceLine(approach, frame);
  return resolved && executable.some((line) => line.sourceLine === resolved) ? resolved : undefined;
}

export function getLogicView(problemName: string, approach: Approach, frame: AnimationFrame) {
  if (problemName !== "Merge Sorted Arrays") return sourceExcerpt(approach, frame);
  const mergedLogic = mergeLogic(approach, frame);
  return mergedLogic.active === undefined ? sourceExcerpt(approach, frame) : mergedLogic;
}

export function LogicPanel({ problemName, approach, frame, mode = "execution" }: { problemName: string; approach: Approach; frame: AnimationFrame; mode?: TraceMode }) {
  const [copied, setCopied] = useState(false);
  const [practice, setPractice] = useState(false);
  const [draft, setDraft] = useState(approach.cpp);
  const compact = useMemo(() => getLogicView(problemName, approach, frame), [problemName, approach, frame]);
  useEffect(() => { setDraft(approach.cpp); setPractice(false); }, [approach]);
  useEffect(() => { if (mode === "conceptual") setPractice(false); }, [mode]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(practice ? draft : compact.lines.map((line) => line.text).join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { setCopied(false); }
  }
  return <section className="logic-panel" aria-label="Current algorithm logic">
    <div className="logic-header"><span>{approach.type} · {problemName === "Merge Sorted Arrays" ? "pseudocode" : "C++ logic"}</span><div className="logic-actions">{mode === "execution" && <button type="button" onClick={() => setPractice((value) => !value)} aria-pressed={practice} aria-label={practice ? "Close practice editor" : "Practice editing this solution"}>{practice ? <X size={13} /> : <PencilLine size={13} />}{practice ? "Close" : "Practice"}</button>}<button type="button" onClick={() => void copy()} aria-label="Copy displayed logic">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</button></div></div>
    {practice ? <><p className="practice-note">Private scratchpad · edits stay in this browser view.</p><textarea className="logic-practice" value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck={false} aria-label="Practice editing the selected solution" /></> : <div className="logic-lines" role="list" aria-label="Algorithm lines">{compact.lines.map((line, index) => <div key={`${line.sourceLine ?? index}-${line.text}`} role="listitem" className={`logic-line${compact.active === index + 1 ? " active" : ""}`} aria-current={compact.active === index + 1 ? "step" : undefined}><span className="logic-line-number">{line.sourceLine ?? index + 1}</span><code>{line.text}</code></div>)}</div>}
    {compact.active !== undefined && <p className="logic-active-note">Highlighted line explains the current animation step.</p>}
    {!compact.lines.length && <p className="logic-empty">See the full solution below the animation.</p>}
  </section>;
}
