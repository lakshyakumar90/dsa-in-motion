import type { AnimationFrame } from "@/types/animation";

interface InputContextBarProps {
  input: Record<string, unknown>;
  frame: AnimationFrame;
  started: boolean;
}

function formatCompactValue(val: unknown): string {
  if (val === null || val === undefined) return "null";
  if (typeof val === "string") return `"${val.length > 22 ? `${val.slice(0, 20)}…` : val}"`;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    if (Array.isArray(val[0])) {
      const preview = val.slice(0, 3).map((row) => `[${Array.isArray(row) ? row.join(",") : String(row)}]`).join(", ");
      return `[${preview}${val.length > 3 ? `, +${val.length - 3}` : ""}]`;
    }
    const preview = val.slice(0, 7).map((v) => String(v)).join(", ");
    return `[${preview}${val.length > 7 ? `, +${val.length - 7}` : ""}]`;
  }
  const s = JSON.stringify(val);
  return s.length > 28 ? `${s.slice(0, 26)}…` : s;
}

function isInputActiveInFrame(key: string, frame: AnimationFrame, started: boolean): boolean {
  if (!started) return false;
  const k = key.toLowerCase();
  // Check if any currently active array in the frame matches this input key
  for (const arr of frame.arrays ?? []) {
    const label = (arr.label ?? "").toLowerCase();
    const hasActivity = Boolean(arr.active?.length || Object.keys(arr.pointers ?? {}).length);
    if (hasActivity && (label === k || label.includes(k) || k.includes(label))) return true;
  }
  // Check title / message mentions (e.g. "nums1[2]", "nums2[j]", "list2")
  const text = `${frame.title ?? ""} ${frame.message ?? ""}`.toLowerCase();
  if (new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)) return true;
  return false;
}

export function InputContextBar({ input, frame, started }: InputContextBarProps) {
  const entries = Object.entries(input ?? {}).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return null;

  return (
    <div className="input-context-bar" aria-label="Problem inputs overview">
      <span className="input-context-label">INPUTS</span>
      <div className="input-context-chips">
        {entries.map(([key, val], idx) => {
          const active = isInputActiveInFrame(key, frame, started);
          const isCollection = Array.isArray(val) || (typeof val === "string" && val.length > 1);
          return (
            <div
              key={key}
              className={`input-context-chip${active ? " is-active" : ""}${isCollection ? " is-collection" : ""}`}
              title={`${key} = ${JSON.stringify(val)}`}
            >
              {isCollection && entries.filter(([, v]) => Array.isArray(v) || (typeof v === "string" && v.length > 1)).length > 1 && (
                <span className="input-chip-order">#{idx + 1}</span>
              )}
              <span className="input-chip-key">{key}</span>
              <span className="input-chip-eq">=</span>
              <code className="input-chip-val">{formatCompactValue(val)}</code>
              {active && <span className="input-chip-active-dot" aria-label="Active in current step" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
