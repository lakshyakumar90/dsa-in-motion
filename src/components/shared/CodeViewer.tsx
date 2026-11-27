import { useMemo, useState } from "react";
import { Check, Copy, MessageSquareText, WrapText } from "lucide-react";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import { Button } from "@/components/ui/button";
import type { Approach, Language } from "@/types/problem";

hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);

const languages: { id: Language; label: string; className: string }[] = [
  { id: "cpp", label: "C++", className: "language-cpp hljs" },
  { id: "js", label: "JavaScript", className: "language-javascript hljs" },
  { id: "python", label: "Python", className: "language-python hljs" },
];

/** Attach helpful inline teaching comments with concrete dry-run hints to key
 * code lines that do not already have a comment. */
function annotateCodeLine(line: string, lang: Language, exampleText?: string): string {
  const trimmed = line.trim();
  const commentPrefix = lang === "python" ? "#" : "//";
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
    return line;
  }
  if (line.includes("//") || (lang === "python" && line.includes("#"))) {
    return line;
  }
  if (/^\s*return\b/.test(line)) {
    const ex = exampleText ? ` e.g. ${exampleText.slice(0, 48)}` : " return final computed answer";
    return `${line}  ${commentPrefix}${ex}`;
  }
  if (/^\s*(?:while|for)\s*[\(\s]/.test(line)) {
    return `${line}  ${commentPrefix} iterate through elements / active range`;
  }
  if (/\bswap\s*\(/.test(line)) {
    return `${line}  ${commentPrefix} swap in-place (e.g. [a, b] -> [b, a])`;
  }
  if (/\bsort\s*\(/.test(line) || /\.sort\s*\(/.test(line)) {
    return `${line}  ${commentPrefix} sort ascending (e.g. [3,1,2] -> [1,2,3])`;
  }
  if (/mid\s*=/.test(line)) {
    return `${line}  ${commentPrefix} midpoint index (e.g. lo=0, hi=4 -> mid=2)`;
  }
  if (/^\s*if\s*[\(\s]/.test(line) && !trimmed.endsWith(";")) {
    return `${line}  ${commentPrefix} check condition for current state`;
  }
  return line;
}

export function CodeViewer({
  approach,
  activeLines,
  example,
}: {
  approach: Approach;
  activeLines?: Partial<Record<Language, number>>;
  example?: string;
}) {
  const [language, setLanguage] = useState<Language>("cpp");
  const [wrap, setWrap] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [copied, setCopied] = useState(false);

  const exampleText = approach.example || example;
  const rawSource = approach[language];
  const displaySource = useMemo(() => {
    if (!showExamples) return rawSource;
    return rawSource
      .split("\n")
      .map((line) => annotateCodeLine(line, language, exampleText))
      .join("\n");
  }, [rawSource, showExamples, language, exampleText]);

  const lineCount = displaySource.split("\n").length;

  const highlightedLines = useMemo(
    () =>
      displaySource.split("\n").map((line) => {
        try {
          return hljs.highlight(line || " ", { language: language === "js" ? "javascript" : language }).value;
        } catch {
          return line || " ";
        }
      }),
    [displaySource, language]
  );

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(rawSource);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="code-viewer" aria-label="Solution code">
      <div className="code-toolbar">
        <div className="code-language-tabs" role="tablist" aria-label="Programming language">
          {languages.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={language === item.id}
              className={language === item.id ? "selected" : ""}
              onClick={() => setLanguage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="code-actions">
          <Button
            size="sm"
            variant={showExamples ? "subtle" : "ghost"}
            aria-pressed={showExamples}
            onClick={() => setShowExamples((value) => !value)}
          >
            <MessageSquareText size={14} /> Examples
          </Button>
          <Button size="sm" variant="ghost" aria-pressed={wrap} onClick={() => setWrap((value) => !value)}>
            <WrapText size={15} /> Wrap
          </Button>
          <Button size="sm" variant="outline" onClick={() => void copyCode()}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy code"}
          </Button>
        </div>
      </div>

      {showExamples && exampleText && (
        <div className="code-example-banner">
          <span>WORKED EXAMPLE</span>
          <code>{exampleText}</code>
        </div>
      )}

      <div className="code-filebar">
        <span>solution.{language === "cpp" ? "cpp" : language === "js" ? "js" : "py"}</span>
        <span>{lineCount} lines · {approach.time} time · {approach.space} space</span>
      </div>
      <div className={`code-scroll ${wrap ? "wrap" : ""}`}>
        <pre className="code-gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, index) => index + 1).join("\n")}
        </pre>
        <pre className="code-content">
          <code className={languages.find((item) => item.id === language)?.className}>
            {highlightedLines.map((line, index) => (
              <span
                className={`code-line${activeLines?.[language] === index + 1 ? " active" : ""}`}
                key={index}
                dangerouslySetInnerHTML={{ __html: line }}
              />
            ))}
          </code>
        </pre>
      </div>
      {language === "cpp" && (
        <p className="code-help">
          C++ function snippet. Add standard headers and judge-provided node types if the problem requires them.
        </p>
      )}
    </section>
  );
}
