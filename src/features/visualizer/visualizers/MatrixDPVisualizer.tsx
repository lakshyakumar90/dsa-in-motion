import type { MatrixFrame } from "@/types/animation";

export function MatrixVisualizer({ matrix }: { matrix: MatrixFrame }) {
  return <section className="viz-panel"><h3>{matrix.label ?? "Table"}</h3><div className="matrix-scroll"><table><tbody>{matrix.values.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => {
    const active = matrix.active?.some(([r, c]) => r === rowIndex && c === columnIndex);
    const done = matrix.done?.some(([r, c]) => r === rowIndex && c === columnIndex);
    return <td key={columnIndex} className={active ? "active" : done ? "done" : ""} aria-label={`Row ${rowIndex}, column ${columnIndex}: ${String(value)}`}><span className="matrix-value" key={String(value)}>{String(value)}</span></td>;
  })}</tr>)}</tbody></table></div></section>;
}
