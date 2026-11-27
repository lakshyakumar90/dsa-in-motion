import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArrayVisualizer } from "./ArrayVisualizer";

describe("ArrayVisualizer", () => {
  it("labels active values and their pointers for assistive technology", () => {
    render(<ArrayVisualizer array={{ label: "Values", values: [3, 8], active: [1], pointers: { left: 1 } }} />);
    expect(screen.getByRole("listitem", { name: "Values index 1: 8, left" })).toBeInTheDocument();
    expect(screen.getByText("left")).toBeInTheDocument();
  });

  it("explains an empty array", () => {
    render(<ArrayVisualizer array={{ label: "Queue", values: [] }} />);
    expect(screen.getByText(/collection is empty/i)).toBeInTheDocument();
  });
});
