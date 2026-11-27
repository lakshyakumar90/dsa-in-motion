import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadSolution, problems } from "@/lib/data";
import { createTrace, ensureTraceRuntime } from "@/algorithms/traceRegistry";
import { classifyDataStructure } from "@/algorithms/dsClassifier";
import { VisualizerRouter } from "./VisualizerRouter";
import { NotesPage } from "@/features/notes/NotesPage";
import { topicNotes } from "@/data/topicNotes";

describe("165-problem 3-approach coverage & DS-specific visualizers", () => {
  afterEach(cleanup);

  it("provides Brute Force, Better, and Optimal approaches with C++/JS/Python code for all 165 problems", async () => {
    expect(problems).toHaveLength(165);
    for (const problem of problems) {
      const sol = await loadSolution(problem.name);
      expect(sol, `${problem.name} solution`).toBeDefined();
      const types = sol!.approaches.map((a) => a.type);
      expect(types, `${problem.name} approach order`).toEqual(["brute", "better", "optimal"]);
      for (const app of sol!.approaches) {
        expect(app.cpp.trim().length, `${problem.name} ${app.type} cpp`).toBeGreaterThan(0);
        expect(app.js.trim().length, `${problem.name} ${app.type} js`).toBeGreaterThan(0);
        expect(app.python.trim().length, `${problem.name} ${app.type} python`).toBeGreaterThan(0);
        expect(app.time.trim().length, `${problem.name} ${app.type} time`).toBeGreaterThan(0);
        expect(app.space.trim().length, `${problem.name} ${app.type} space`).toBeGreaterThan(0);
      }
    }
  });

  it("generates valid animation traces for all 165 problems across all 3 approaches (495 traces)", async () => {
    await ensureTraceRuntime();
    let totalTraces = 0;
    for (const problem of problems) {
      const sol = (await loadSolution(problem.name))!;
      for (const approach of sol.approaches) {
        const trace = createTrace(problem.name, approach, sol.approaches);
        expect(trace.frames.length, `${problem.name} (${approach.type})`).toBeGreaterThan(0);
        totalTraces += 1;
      }
    }
    expect(totalTraces).toBe(495);
  });

  it("routes distinct data structures to their dedicated visualizers", () => {
    expect(classifyDataStructure("Reverse Linked List").kind).toBe("linked-list");
    expect(classifyDataStructure("Valid Parentheses").kind).toBe("stack-queue");
    expect(classifyDataStructure("Level Order Traversal").kind).toBe("tree");
    expect(classifyDataStructure("Search in a BST").kind).toBe("bst");
    expect(classifyDataStructure("Kth Largest Element in an Array").kind).toBe("heap");
    expect(classifyDataStructure("Find if Path Exists in Graph").kind).toBe("graph");
    expect(classifyDataStructure("Subsets - The Power Set").kind).toBe("backtracking");
    expect(classifyDataStructure("Climbing Stairs").kind).toBe("dp-matrix");
    expect(classifyDataStructure("Binary Search").kind).toBe("binary-search");

    // Linked List
    render(<VisualizerRouter problemName="Reverse Linked List" frame={{ arrays: [{ label: "List", values: [1, 2, 3], active: [1], pointers: { prev: 0, curr: 1 } }] }} />);
    expect(screen.getByText("NULL")).toBeInTheDocument();
    cleanup();

    // Stack
    render(<VisualizerRouter problemName="Valid Parentheses" frame={{ arrays: [{ label: "Stack", values: ["(", "["], active: [1] }] }} />);
    expect(screen.getByText("TOP")).toBeInTheDocument();
    expect(screen.getByText("BOTTOM")).toBeInTheDocument();
    cleanup();

    // Tree / Heap
    render(<VisualizerRouter problemName="Kth Largest Element in an Array" frame={{ arrays: [{ label: "Min Heap", values: [3, 5, 6], active: [0] }] }} />);
    expect(screen.getByText(/Binary Heap/i)).toBeInTheDocument();
    cleanup();

    // Backtracking
    render(<VisualizerRouter problemName="Subsets - The Power Set" frame={{ arrays: [{ label: "Current path", values: [1, 2] }, { label: "nums", values: [1, 2, 3], active: [1] }] }} />);
    expect(screen.getByText("ROOT")).toBeInTheDocument();
    cleanup();

    // DP Matrix
    render(<VisualizerRouter problemName="Unique Paths" frame={{ matrix: { label: "DP Table", values: [[1, 1], [1, 2]], active: [[1, 1]] } }} />);
    expect(screen.getByText("r\\c")).toBeInTheDocument();
    cleanup();
  });

  it("renders the Notes Hub with all 14 topic cheat sheets and personal notes toggle", () => {
    expect(topicNotes).toHaveLength(14);
    render(<NotesPage />);
    expect(screen.getByText(/Topic Cheat Sheets/i)).toBeInTheDocument();
    expect(screen.getByText(/Core Mental Model/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /My Problem Notes/i }));
    expect(screen.getByPlaceholderText(/Search problem titles/i)).toBeInTheDocument();
  });
});
