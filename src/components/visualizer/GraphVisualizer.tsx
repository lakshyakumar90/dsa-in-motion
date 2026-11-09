import type { GraphEdge, GraphNode } from "@/types/animation";
import { useId } from "react";

export function GraphVisualizer({ nodes, edges, label }: { nodes: GraphNode[]; edges: GraphEdge[]; label?: string }) {
  const markerId = `graph-arrow-${useId().replace(/:/g, "")}`;
  const width = 700, height = 360, pad = 52;
  const xs = nodes.map((node) => node.x).filter((x): x is number => Number.isFinite(x));
  const ys = nodes.map((node) => node.y).filter((y): y is number => Number.isFinite(y));
  const hasCoordinates = xs.length === nodes.length && ys.length === nodes.length;
  // Coordinates from the trace are in a shared 620 × 320 world. Keeping that
  // world fixed stops the whole diagram sliding as nodes become active or a
  // tree grows one node at a time.
  const project = (value: number, extent: number, dimension: number) => pad + (value / extent) * (dimension - pad * 2);
  const positions = new Map(nodes.map((node, index) => [String(node.id), hasCoordinates
    ? { x: project(node.x!, 620, width), y: project(node.y!, 320, height) }
    : { x: width / 2 + Math.cos(index / Math.max(1, nodes.length) * Math.PI * 2 - Math.PI / 2) * 145, y: height / 2 + Math.sin(index / Math.max(1, nodes.length) * Math.PI * 2 - Math.PI / 2) * 112 }]));
  return <section className="viz-panel"><h3>{label ?? "Connections"}</h3><div className="graph-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Graph showing nodes and directed edges">
    <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
    {edges.map((edge, index) => {
      const fromId = String(edge.from ?? (edge as unknown as { source?: string }).source);
      const toId = String(edge.to ?? (edge as unknown as { target?: string }).target);
      const from = positions.get(fromId), to = positions.get(toId);
      if (!from || !to) return null;
      const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
      const ux = dx / length, uy = dy / length;
      const directed = edge.directed !== false;
      const startGap = Math.min(24, length * .28), endGap = Math.min(directed ? 32 : 24, length * .38);
      const x1 = from.x + ux * startGap, y1 = from.y + uy * startGap;
      const x2 = to.x - ux * endGap, y2 = to.y - uy * endGap;
      const hasReverse = directed && edges.some((other, otherIndex) => otherIndex !== index && other.directed !== false && String(other.from) === toId && String(other.to) === fromId);
      const path = fromId === toId
        ? `M ${from.x + 15} ${from.y - 17} C ${from.x + 50} ${from.y - 55}, ${from.x - 50} ${from.y - 55}, ${from.x - 15} ${from.y - 17}`
        : hasReverse
          ? `M ${x1} ${y1} Q ${(x1 + x2) / 2 - uy * 15} ${(y1 + y2) / 2 + ux * 15} ${x2} ${y2}`
          : `M ${x1} ${y1} L ${x2} ${y2}`;
      const midX = fromId === toId ? from.x : hasReverse ? (x1 + x2) / 2 - uy * 7.5 : (x1 + x2) / 2;
      const midY = fromId === toId ? from.y - 39 : hasReverse ? (y1 + y2) / 2 + ux * 7.5 : (y1 + y2) / 2;
      const edgeClass = edge.state === "active" || edge.state === true ? "edge-active" : edge.state === "done" ? "edge-done" : "edge-muted";
      return <g key={`${fromId}-${toId}-${index}`}><path d={path} className={edgeClass} markerEnd={directed ? `url(#${markerId})` : undefined} />{edge.label !== undefined && edge.label !== "" && <text x={midX} y={midY - 7} className="edge-label" textAnchor="middle">{String(edge.label)}</text>}</g>;
    })}
    {nodes.map((node) => { const point = positions.get(String(node.id))!; return <g key={String(node.id)} transform={`translate(${point.x} ${point.y})`} className={`graph-node ${node.state ?? ""}`}><circle r="23" /><text textAnchor="middle" dy="4">{node.label}</text></g>; })}
  </svg></div></section>;
}
