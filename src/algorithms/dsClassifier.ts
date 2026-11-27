import { problems } from "@/lib/data";

export type DataStructureKind =
  | "array"
  | "string"
  | "linked-list"
  | "stack-queue"
  | "binary-search"
  | "sliding-window"
  | "tree"
  | "bst"
  | "heap"
  | "graph"
  | "dp-matrix"
  | "backtracking"
  | "greedy";

export interface DsVisualMeta {
  kind: DataStructureKind;
  label: string;
  shortLabel: string;
  accentHint: string;
}

const META: Record<DataStructureKind, DsVisualMeta> = {
  "array": { kind: "array", label: "Array & In-Place Pointers", shortLabel: "Array", accentHint: "Contiguous indexed cells with animated pointer tracks" },
  "string": { kind: "string", label: "String Character Stream", shortLabel: "String", accentHint: "Character tiles with index & window highlights" },
  "linked-list": { kind: "linked-list", label: "Linked List · Node & Pointer Rewiring", shortLabel: "Linked List", accentHint: "Split [val | next] nodes with live pointer arrows" },
  "stack-queue": { kind: "stack-queue", label: "Stack (LIFO) & Queue (FIFO)", shortLabel: "Stack / Queue", accentHint: "Vertical LIFO stack tower & horizontal FIFO queue channel" },
  "binary-search": { kind: "binary-search", label: "Binary Search · Range Halving", shortLabel: "Binary Search", accentHint: "Active search window [lo..hi] with discarded halves dimmed" },
  "sliding-window": { kind: "sliding-window", label: "Two Pointers & Sliding Window", shortLabel: "Sliding Window", accentHint: "Expandable [L..R] window bracket across elements" },
  "tree": { kind: "tree", label: "Binary Tree · Hierarchical Traversal", shortLabel: "Binary Tree", accentHint: "Level-banded hierarchy with smooth parent-child curves" },
  "bst": { kind: "bst", label: "Binary Search Tree · Ordered Pruning", shortLabel: "BST", accentHint: "Ordered left < root < right hierarchical paths" },
  "heap": { kind: "heap", label: "Heap · Tree + Array Dual View", shortLabel: "Heap", accentHint: "Priority tree synchronized with underlying index array" },
  "graph": { kind: "graph", label: "Graph · Vertices, Edges & Frontier", shortLabel: "Graph", accentHint: "Directed/weighted vertices, edge relaxation & queue tray" },
  "dp-matrix": { kind: "dp-matrix", label: "Dynamic Programming · State Table", shortLabel: "DP / Matrix", accentHint: "Indexed state table tracking subproblem transitions" },
  "backtracking": { kind: "backtracking", label: "Backtracking · Decision Path & Branches", shortLabel: "Backtracking", accentHint: "Active recursion path, candidate choices & solutions" },
  "greedy": { kind: "greedy", label: "Greedy · Local Choice & Intervals", shortLabel: "Greedy", accentHint: "Ordered decision candidates & running optimal choice" },
};

const topicByProblem = new Map<string, string>(
  problems.map((p) => [p.name.toLowerCase(), p.topicTitle.toLowerCase()])
);

export function classifyDataStructure(problemName: string): DsVisualMeta {
  const lower = problemName.toLowerCase();
  const topic = topicByProblem.get(lower) ?? "";

  if (topic.includes("linked list") || lower.includes("linked list") || lower.includes("rotate list") || lower.includes("swap nodes") || lower.includes("add two numbers") || lower.includes("merge two sorted lists")) {
    return META["linked-list"];
  }
  if (topic.includes("binary search tree") || lower.includes("bst")) {
    return META["bst"];
  }
  if (topic.includes("binary tree") || lower.includes("tree") || lower.includes("lowest common ancestor")) {
    return META["tree"];
  }
  if (topic.includes("heap") || lower.includes("kth largest") || lower.includes("stone weight") || lower.includes("top k frequent")) {
    return META["heap"];
  }
  if (topic.includes("graph") || lower.includes("graph") || lower.includes("topological") || lower.includes("itinerary") || lower.includes("flights") || lower.includes("network connected")) {
    return META["graph"];
  }
  if (topic.includes("backtracking") || lower.includes("subsets") || lower.includes("permutations") || lower.includes("combinations") || lower.includes("n queens") || lower.includes("word search")) {
    return META["backtracking"];
  }
  if (topic.includes("stack") || lower.includes("stack") || lower.includes("queue") || lower.includes("parentheses") || lower.includes("polish notation") || lower.includes("temperatures") || lower.includes("next greater")) {
    return META["stack-queue"];
  }
  if (topic.includes("binary search") || lower.includes("binary search") || lower.includes("rotated sorted") || lower.includes("bad version") || lower.includes("peak") || lower.includes("square root")) {
    return META["binary-search"];
  }
  if (topic.includes("sliding window") || topic.includes("two pointers") || lower.includes("window") || lower.includes("water") || lower.includes("three sum") || lower.includes("two sum")) {
    return META["sliding-window"];
  }
  if (topic.includes("dynamic programming") || lower.includes("climbing stairs") || lower.includes("house robber") || lower.includes("coin change") || lower.includes("unique paths") || lower.includes("egg drop") || lower.includes("subsequence")) {
    return META["dp-matrix"];
  }
  if (topic.includes("greedy") || lower.includes("interval") || lower.includes("gas station") || lower.includes("lemonade") || lower.includes("cookies") || lower.includes("candy")) {
    return META["greedy"];
  }
  if (topic.includes("string") || lower.includes("string") || lower.includes("anagram") || lower.includes("palindrome") || lower.includes("word") || lower.includes("prefix")) {
    return META["string"];
  }
  return META["array"];
}
