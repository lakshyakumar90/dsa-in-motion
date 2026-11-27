import type { MatrixFrame } from "@/types/animation";

export function MatrixDPVisualizer({ matrix }: { matrix: MatrixFrame }) {
  const rows = matrix.values ?? [];
  const colCount = rows[0]?.length ?? 0;

  return (
    <section className="viz-panel dp-matrix-panel" aria-label={matrix.label ?? "DP / Matrix Table"}>
      <h3>
        {matrix.label ?? "DP State Table"}
        <span className="viz-legend">
          <i className="legend-swatch is-active" /> computing
          <i className="legend-swatch is-done" /> solved
        </span>
      </h3>
      <div className="matrix-scroll">
        <table className="dp-matrix-table">
          {colCount > 0 && (
            <thead>
              <tr>
                <th scope="col" className="matrix-corner">r\c</th>
                {Array.from({ length: colCount }, (_, c) => (
                  <th scope="col" key={c} className="matrix-col-hdr">c{c}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th scope="row" className="matrix-row-hdr">r{rowIndex}</th>
                {row.map((value, columnIndex) => {
                  const active = matrix.active?.some(([r, c]) => r === rowIndex && c === columnIndex);
                  const done = matrix.done?.some(([r, c]) => r === rowIndex && c === columnIndex);
                  return (
                    <td
                      key={columnIndex}
                      className={active ? "active" : done ? "done" : ""}
                      aria-label={`Row ${rowIndex}, column ${columnIndex}: ${String(value)}`}
                    >
                      <span className="matrix-value" key={String(value)}>{String(value)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
