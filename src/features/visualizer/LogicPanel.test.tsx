import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AnimationFrame } from "@/types/animation";
import type { Approach } from "@/types/problem";
import { LogicPanel } from "./LogicPanel";

const approach: Approach = {
  name: "Two pointers",
  type: "optimal",
  idea: "Scan the values once.",
  pros: [], cons: [], steps: [], time: "O(n)", timeExplanation: "One pass.",
  space: "O(1)", spaceExplanation: "Only pointers.",
  cpp: "int i = 0;\nwhile (i < n) {\n  ++i;\n}",
  js: "let i = 0;\nwhile (i < n) {\n  i += 1;\n}",
  python: "i = 0\nwhile i < n:\n    i += 1",
};

const frame: AnimationFrame = {
  title: "Move i",
  message: "Advance the read pointer.",
  codeLines: { cpp: 2 },
};

describe("LogicPanel", () => {
  afterEach(cleanup);

  it("opens an editable, local practice scratchpad with the selected solution", () => {
    render(<LogicPanel problemName="Example" approach={approach} frame={frame} />);
    fireEvent.click(screen.getByRole("button", { name: "Practice editing this solution" }));
    const editor = screen.getByRole("textbox", { name: "Practice editing the selected solution" });
    expect(editor).toHaveValue(approach.cpp);
    fireEvent.change(editor, { target: { value: "// my notes" } });
    expect(editor).toHaveValue("// my notes");
  });

  it("does not suggest a source-line match for conceptual traces", () => {
    render(<LogicPanel problemName="Example" approach={approach} frame={frame} mode="conceptual" />);
    expect(screen.getByText(/no line mapping/i)).toBeInTheDocument();
    expect(screen.getByText(/does not map the selected approach’s source line/i)).toBeInTheDocument();
    expect(document.querySelector(".logic-line.active")).toBeNull();
    expect(screen.queryByRole("button", { name: "Practice editing the selected solution" })).toBeNull();
  });
});
