import type { ArrayFrame, GraphEdge, GraphNode } from "@/types/animation";

interface TreeVisualizerProps {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  heapArray?: ArrayFrame;
  label?: string;
  isBst?: boolean;
  isHeap?: boolean;
}

/** Build a binary-heap tree layout directly from an array when a heap trace
 * emits array values without explicit graph nodes. */
function buildHeapNodesFromArray(arr: ArrayFrame): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const vals = arr.values ?? [];
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const maxDepth = Math.max(0, Math.floor(Math.log2(Math.max(1, vals.length))));

  vals.forEach((v, i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const levelStart = (1 << depth) - 1;
    const posInLevel = i - levelStart;
    const slots = 1 << depth;
    const x = ((posInLevel + 0.5) / slots) * 580 + 20;
    const y = 36 + (depth / Math.max(1, maxDepth)) * 230;
    const state = arr.active?.includes(i) ? "active" : arr.done?.includes(i) ? "done" : "";
    nodes.push({ id: i, label: String(v), x, y, state });
    if (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      edges.push({
        from: parent,
        to: i,
        directed: false,
        state: arr.active?.includes(i) && arr.active?.includes(parent) ? "active" : arr.done?.includes(i) ? "done" : "idle",
      });
    }
  });
  return { nodes, edges };
}

export function TreeVisualizer({ nodes = [], edges = [], heapArray, label, isBst = false, isHeap = false }: TreeVisualizerProps) {
  const derived = !nodes.length && heapArray?.values?.length ? buildHeapNodesFromArray(heapArray) : { nodes, edges };
  const treeNodes = derived.nodes;
  const treeEdges = derived.edges;

  const width = 700;
  const height = 340;
  const padX = 48;
  const padY = 44;

  const xs = treeNodes.map((n) => n.x).filter((x): x is number => Number.isFinite(x));
  const ys = treeNodes.map((n) => n.y).filter((y): y is number => Number.isFinite(y));
  const hasCoords = xs.length === treeNodes.length && ys.length === treeNodes.length && treeNodes.length > 0;

  const projectX = (v: number) => padX + (v / 620) * (width - padX * 2);
  const projectY = (v: number) => padY + (v / 320) * (height - padY * 2);

  const positions = new Map(
    treeNodes.map((node, i) => {
      if (hasCoords) return [String(node.id), { x: projectX(node.x!), y: projectY(node.y!) }];
      const depth = Math.floor(Math.log2(i + 1));
      const levelStart = (1 << depth) - 1;
      const slots = 1 << depth;
      const pos = i - levelStart;
      return [
        String(node.id),
        {
          x: padX + ((pos + 0.5) / slots) * (width - padX * 2),
          y: padY + depth * 72,
        },
      ];
    })
  );

  // Extract distinct y-levels for subtle depth guide lines
  const distinctYs = Array.from(new Set(Array.from(positions.values()).map((p) => Math.round(p.y / 14) * 14))).sort((a, b) => a - b);

  const kindTag = isHeap ? "Binary Heap · parent(i) = ⌊(i-1)/2⌋" : isBst ? "BST · left < node < right" : "Binary Tree · hierarchical traversal";

  return (
    <section className="viz-panel tree-viz-panel" aria-label={label ?? "Tree visualization"}>
      <h3>
        {label ?? (isHeap ? "Heap Tree" : isBst ? "Binary Search Tree" : "Binary Tree")}
        <span className="viz-legend">{kindTag}</span>
      </h3>
      {treeNodes.length ? (
        <div className="tree-scroll">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Hierarchical tree structure">
            {distinctYs.map((y, level) => (
              <g key={y} className="tree-level-guide">
                <line x1="26" y1={y} x2={width - 14} y2={y} />
                <text x="10" y={y + 3}>L{level}</text>
              </g>
            ))}
            {treeEdges.map((edge, idx) => {
              const fromId = String(edge.from ?? (edge as unknown as { source?: string }).source);
              const toId = String(edge.to ?? (edge as unknown as { target?: string }).target);
              const from = positions.get(fromId);
              const to = positions.get(toId);
              if (!from || !to) return null;
              const midY = (from.y + to.y) / 2;
              const path = `M ${from.x} ${from.y + 20} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y - 20}`;
              const cls = edge.state === "active" || edge.state === true ? "tree-edge-active" : edge.state === "done" ? "tree-edge-done" : "tree-edge-muted";
              return (
                <g key={`${fromId}-${toId}-${idx}`}>
                  <path d={path} className={cls} />
                  {edge.label !== undefined && edge.label !== "" && (
                    <text x={(from.x + to.x) / 2} y={midY - 4} className="edge-label" textAnchor="middle">
                      {String(edge.label)}
                    </text>
                  )}
                </g>
              );
            })}
            {treeNodes.map((node, idx) => {
              const pt = positions.get(String(node.id))!;
              const isRoot = idx === 0;
              return (
                <g key={String(node.id)} transform={`translate(${pt.x} ${pt.y})`} className={`tree-node ${node.state ?? ""}${isRoot ? " is-root" : ""}`}>
                  {isRoot && <circle r="27" className="tree-root-halo" />}
                  <circle r="21" className="tree-node-circle" />
                  <text textAnchor="middle" dy="4">{node.label}</text>
                  {isHeap && <text textAnchor="middle" dy="33" className="tree-heap-idx">[{idx}]</text>}
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <p className="empty-state">Tree is empty at this step.</p>
      )}
    </section>
  );
}
