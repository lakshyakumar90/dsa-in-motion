import { describe, expect, it } from "vitest";
import { loadSolution, problems } from "@/lib/data";
import { createTrace, ensureConceptLabs, ensureTraceRuntime, getConceptLabRegistry } from "@/algorithms/traceRegistry";

describe("preserved algorithm traces", () => {
  it("loads all 165 reference trace definitions", async () => {
    await ensureTraceRuntime();
    expect(Object.keys(globalThis.PROBLEM_TRACES)).toHaveLength(165);
    expect(problems).toHaveLength(165);
  });

  it("keeps the Sum reference trace output and emitted frame data", async () => {
    await ensureTraceRuntime();
    const solution = await loadSolution("Sum");
    expect(solution).toBeDefined();
    const approach = solution!.approaches.find((item) => item.type === "optimal")!;
    const trace = createTrace("Sum", approach, solution!.approaches);
    expect(trace.mode).toBe("execution");
    expect(trace.output).toBe(11);
    expect(trace.frames.length).toBeGreaterThan(1);
    expect(trace.frames[0]).toHaveProperty("title");
  });

  it("labels the existing non-optimal walkthrough as conceptual", async () => {
    await ensureTraceRuntime();
    const problem = problems.find((item) => item.name === "Binary Search")!;
    const solution = await loadSolution(problem.name);
    const approach = solution!.approaches.find((item) => item.type === "brute")!;
    const trace = createTrace(problem.name, approach, solution!.approaches);
    expect(trace.mode).toBe("conceptual");
    expect(trace.frames.length).toBeGreaterThan(0);
  });

  it("preserves outputs while producing usable frames for all 165 reference traces", async () => {
    await ensureTraceRuntime();
    for (const problem of problems) {
      const base = globalThis.PROBLEM_TRACES[problem.name];
      const solution = await loadSolution(problem.name);
      expect(base, `${problem.name} reference trace`).toBeDefined();
      expect(solution, `${problem.name} solution`).toBeDefined();
      const approach = solution!.approaches.find((item) => item.type === "optimal") ?? solution!.approaches.at(-1)!;
      const expectedOutput = base.run(structuredClone(base.input), () => {});
      const migrated = createTrace(problem.name, approach, solution!.approaches);
      expect(migrated.frames.length, `${problem.name} frames`).toBeGreaterThan(0);
      expect(migrated.output, `${problem.name} output`).toEqual(expectedOutput);
    }
  });

  it("keeps the live merge result through pointer and comparison steps", async () => {
    await ensureTraceRuntime();
    const solution = (await loadSolution("Merge Sorted Arrays"))!;
    const input = { nums1: [1, 4, 7, 0, 0, 0], m: 3, nums2: [2, 3, 6], n: 3 };
    for (const approach of solution.approaches) {
      const trace = createTrace("Merge Sorted Arrays", approach, solution.approaches, input);
      expect(trace.output).toEqual([1, 2, 3, 4, 6, 7]);
      for (let index = 1; index < trace.frames.length; index++) {
        const frame = trace.frames[index];
        if (!/^(Move|Compare)/.test(frame.title ?? "")) continue;
        const result = (frame.arrays ?? []).find((array) => array.label === "Merged result")?.values;
        const previous = (trace.frames[index - 1].arrays ?? []).find((array) => array.label === "Merged result")?.values;
        expect(result, `${approach.type}: ${frame.title}`).toEqual(previous);
      }
      expect(trace.frames.at(-1)?.arrays?.find((array) => array.label === "Merged result")?.values).toEqual(trace.output);
    }
    const optimal = solution.approaches.find((approach) => approach.type === "optimal")!;
    const brute = solution.approaches.find((approach) => approach.type === "brute")!;
    const bruteTrace = createTrace("Merge Sorted Arrays", brute, solution.approaches, input);
    const firstCopy = bruteTrace.frames.find((frame) => frame.title === "Copy 2 into nums1[3]")!;
    expect(firstCopy.arrays?.find((array) => array.label === "Merged result")?.values).toEqual([1, 4, 7, 2, "·", "·"]);
    expect(firstCopy.vars).toMatchObject({ m: 3, n: 3, j: 0, write: 3 });
    const trace = createTrace("Merge Sorted Arrays", optimal, solution.approaches, input);
    expect(trace.frames[0].arrays?.[0].pointers).toEqual({ i: 2 });
    expect(trace.frames[0].arrays?.[1].pointers).toEqual({});
    expect(trace.frames[1].arrays?.[1].pointers).toEqual({ j: 2 });
    expect(trace.frames[2].arrays?.[0].pointers).toEqual({ i: 2, w: 5 });
    const writeFromSecond = trace.frames.find((frame) => frame.title === "Write 6 into nums1[4]")!;
    expect(optimal.cpp.split("\n")[(writeFromSecond.codeLines?.cpp ?? 0) - 1]).toContain("nums2[j]");
  });

  it("runs the array copy, swap, and compaction approaches as small mapped steps", async () => {
    await ensureTraceRuntime();
    for (const name of ["Remove Element", "Reverse String", "Move Zeros", "Max Consecutive Ones", "Best Time to Buy and Sell Stocks", "Container with Most Water"]) {
      const reference = globalThis.PROBLEM_TRACES[name];
      const solution = (await loadSolution(name))!;
      for (const approach of solution.approaches) {
        const expected = reference.run(structuredClone(reference.input), () => {});
        const trace = createTrace(name, approach, solution.approaches);
        expect(trace.mode, `${name} ${approach.type} mode`).toBe("execution");
        expect(trace.output, `${name} ${approach.type} output`).toEqual(expected);
        expect(trace.frames.length, `${name} ${approach.type} frames`).toBeGreaterThan(2);
        for (const [frameIndex, frame] of trace.frames.entries()) {
          const sourceLine = frame.codeLines?.cpp;
          expect(sourceLine, `${name} ${approach.type} frame ${frameIndex} should map to code`).toBeDefined();
          if (sourceLine !== undefined) {
            expect(approach.cpp.split("\n")[sourceLine - 1], `${name} ${approach.type} frame ${frameIndex} source line`).toBeTruthy();
          }
          if (frameIndex > 0 && /^(Move|Check|Compare)/.test(frame.title ?? "")) {
            const resultValues = frame.arrays?.find((array) => /result|moved values/i.test(array.label ?? ""))?.values;
            const previousValues = trace.frames[frameIndex - 1].arrays?.find((array) => /result|moved values/i.test(array.label ?? ""))?.values;
            if (resultValues || previousValues) expect(resultValues, `${name} ${approach.type} ${frame.title}`).toEqual(previousValues);
            else if (frame.vars?.result !== undefined) expect(frame.vars.result, `${name} ${frame.title}`).toEqual(trace.frames[frameIndex - 1].vars?.result);
          }
        }
      }
    }
  });

  it("loads and generates the original frame data for all 13 interactive concept labs", async () => {
    await ensureConceptLabs();
    const labs = getConceptLabRegistry();
    expect(Object.keys(labs)).toHaveLength(13);
    for (const [id, spec] of Object.entries(labs)) {
      let input: number[] | number[][] | string | number;
      if (spec.textInput) input = spec.input;
      else if (spec.singleInput) input = Number(spec.input);
      else if (spec.intervalInput) input = spec.input.split(",").map((item) => item.split("-").map(Number));
      else input = spec.input.split(",").map(Number);
      const frames = spec.trace(input, spec.param ?? undefined);
      expect(frames.length, `${id} frame count`).toBeGreaterThan(1);
      expect(frames[0].text, `${id} first explanation`).toBeTruthy();
      expect(frames.at(-1)?.text, `${id} final explanation`).toBeTruthy();
    }
    const water = labs.water;
    const waterFrames = water.trace(water.input.split(",").map(Number));
    expect(waterFrames.at(-1)?.value).toBe(6);
  });
});
