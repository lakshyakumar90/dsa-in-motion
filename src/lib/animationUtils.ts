export function prettyValue(value: unknown): string {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, (_key, item: unknown) => typeof item === "number" && !Number.isFinite(item) ? String(item) : item) ?? "undefined"; }
  catch { return String(value); }
}
