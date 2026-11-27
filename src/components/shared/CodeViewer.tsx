import { useMemo, useState } from "react";
import { Check, Copy, WrapText } from "lucide-react";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import { Button } from "@/components/ui/button";
import type { Approach, Language } from "@/types/problem";
import "highlight.js/styles/github-dark.css";

hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);

const languages: { id: Language; label: string; className: string }[] = [
  { id: "cpp", label: "C++", className: "language-cpp" },
  { id: "js", label: "JavaScript", className: "language-javascript" },
  { id: "python", label: "Python", className: "language-python" },
];

export function CodeViewer({ approach, activeLines }: { approach: Approach; activeLines?: Partial<Record<Language, number>> }) {
  const [language, setLanguage] = useState<Language>("cpp");
  const [wrap, setWrap] = useState(false);
  const [copied, setCopied] = useState(false);
  const source = approach[language];
  const lineCount = source.split("\n").length;
  const highlightedLines = useMemo(() => source.split("\n").map((line) => hljs.highlight(line || " ", { language: language === "js" ? "javascript" : language }).value), [source, language]);
  async function copyCode() {
    try { await navigator.clipboard.writeText(source); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
    catch { setCopied(false); }
  }
  return <section className="code-viewer" aria-label="Solution code">
    <div className="code-toolbar"><div className="code-language-tabs" role="tablist" aria-label="Programming language">{languages.map((item) => <button key={item.id} type="button" role="tab" aria-selected={language === item.id} className={language === item.id ? "selected" : ""} onClick={() => setLanguage(item.id)}>{item.label}</button>)}</div><div className="code-actions"><Button size="sm" variant="ghost" aria-pressed={wrap} onClick={() => setWrap((value) => !value)}><WrapText size={15} /> Wrap</Button><Button size="sm" variant="outline" onClick={() => void copyCode()}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy code"}</Button></div></div>
    <div className="code-filebar"><span>solution.{language === "cpp" ? "cpp" : language === "js" ? "js" : "py"}</span><span>{lineCount} lines</span></div>
    <div className={`code-scroll ${wrap ? "wrap" : ""}`}><pre className="code-gutter" aria-hidden="true">{Array.from({ length: lineCount }, (_, index) => index + 1).join("\n")}</pre><pre className="code-content"><code className={languages.find((item) => item.id === language)?.className}>{highlightedLines.map((line, index) => <span className={`code-line${activeLines?.[language] === index + 1 ? " active" : ""}`} key={index} dangerouslySetInnerHTML={{ __html: line }} />)}</code></pre></div>
    {language === "cpp" && <p className="code-help">C++ function snippet. Add standard headers and judge-provided node types if the problem requires them.</p>}
  </section>;
}
