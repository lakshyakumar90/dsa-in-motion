/* Approach-specific animations for every solution approach (Brute / Better / Optimal).
   - Reuses the base PROBLEM_TRACES input/optimal run where possible.
   - Generates faithful, step-by-step visual traces for each approach when a
     specialized simulator exists; otherwise generates a rich step-walk
     narrative trace that visualizes the input + approach steps + cost model.
   Each frame: { title, message, arrays, vars, why, cost, insight, output }
*/
(() => {
  const R = globalThis.PROBLEM_TRACES || (globalThis.PROBLEM_TRACES = {});
  const A = (label, values, active = [], pointers = {}) => ({ label, values: [...values], active, pointers });
  const clone = (v) => structuredClone(v);

  function baseInput(name) {
    return R[name]?.input ? clone(R[name].input) : {};
  }
  function arraysFromInput(inp) {
    const out = [];
    for (const [k, v] of Object.entries(inp || {})) {
      if (typeof v === "string") out.push({ label: k, values: [...v] });
      else if (Array.isArray(v) && v.every((x) => x === null || typeof x !== "object"))
        out.push({ label: k, values: [...v] });
    }
    if (!out.length && inp && typeof inp === "object") {
      for (const [k, v] of Object.entries(inp)) {
        if (v && typeof v === "object" && !Array.isArray(v)) continue;
        out.push({ label: k, values: Array.isArray(v) ? v : [v] });
      }
    }
    return out;
  }
  function complexityRank(t) {
    const s = (t || "").toLowerCase();
    if (s.includes("o(1)")) return 0;
    if (s.includes("log")) return 1;
    if (s.includes("√") || s.includes("sqrt")) return 2;
    if (s.includes("n log") || s.includes("nlog")) return 3;
    if (s.includes("o(n)") || s.includes("o(m + n)") || s.includes("o(m+n)")) return 4;
    if (s.includes("o(n√") || s.includes("o(n *")) return 5;
    if (s.includes("o(n²") || s.includes("o(n^2") || s.includes("o(n * n")) return 6;
    if (s.includes("o(n³") || s.includes("o(2^") || s.includes("o(2^n")) return 7;
    return 5;
  }
  function estOps(t, n) {
    const r = complexityRank(t);
    if (r <= 0) return 1;
    if (r === 1) return Math.max(1, Math.ceil(Math.log2(Math.max(2, n))));
    if (r === 3) return Math.max(1, Math.round(n * Math.log2(Math.max(2, n))));
    if (r === 4) return Math.max(1, n);
    if (r === 6) return n * n;
    if (r === 7) return Math.min(2000, Math.pow(2, Math.min(11, n)));
    return n;
  }

  // ---- Specialist simulators: return true if handled ----
  function runSpecial(name, approach, input, emit) {
    const type = approach.type || "optimal";
    const tn = name.toLowerCase();
    const arrays0 = arraysFromInput(input);
    const firstArr = arrays0[0];

    // Binary Search: brute linear vs binary
    if (tn === "binary search" && firstArr && Array.isArray(input.nums)) {
      const nums = [...input.nums], target = input.target;
      if (type === "brute") {
        emit({ title: "Linear scan — check every slot", message: `Brute force ignores sorted order and checks index 0,1,2… until it finds ${target}. Worst case visits all ${nums.length} elements.`, arrays: [A("Sorted array", nums, [0], { i: 0 })], vars: { target, visits: 1 }, why: "Correct but wasteful: sorted order gives us a shortcut we are not using.", cost: `Step 1 of ${nums.length} — O(N) walk.`, insight: "Compare this with Optimal: Binary Search halves the window each step." });
        for (let i = 0; i < nums.length; i++) {
          const found = nums[i] === target;
          emit({ title: `Check index ${i}`, message: found ? `${nums[i]} equals target ${target}. Done at index ${i}.` : `${nums[i]} ≠ ${target} — keep scanning right. Sorted order wasted.`, arrays: [A("Sorted array", nums, [i], { i })], vars: { i, target }, why: found ? "First match wins in linear order." : "No shortcut — must inspect every predecessor.", cost: `${i + 1} / ${nums.length} comparisons (O(N)).`, insight: found ? "Brute found it, but only after O(N) work." : "This is exactly the work Binary Search avoids." });
          if (found) return i;
        }
        return -1;
      }
      return false; // optimal/better already have good base trace
    }
    // Find Largest / Smallest
    if ((tn.includes("largest number in an array") || tn.includes("smallest number in an array")) && input.nums) {
      const nums = [...input.nums];
      const isMax = tn.includes("largest");
      if (type === "brute") {
        let a = [...nums];
        emit({ title: "Sort first, then pick", message: `Brute force sorts the whole array (${nums.length} elements) just to read one end. Sorting does O(N log N) comparisons for a single answer.`, arrays: [A("Input", nums), A("Sorted copy", [])], vars: { n: nums.length }, why: "Sorting guarantees order, but we only need the extreme — huge overkill.", cost: "Sorting phase: ~O(N log N) comparisons.", insight: "Optimal scans once: O(N), no reordering." });
        // bubble sort walk
        for (let pass = 0; pass < a.length; pass++) {
          for (let j = 0; j < a.length - pass - 1; j++) {
            if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
            emit({ title: `Sorting pass ${pass + 1}`, message: `Compare ${a[j]} and ${a[j + 1]}; swap if out of order. After ${pass + 1} passes the tail grows sorted.`, arrays: [A("Sorting copy", a, [j, j + 1])], vars: { pass: pass + 1, j }, why: "Sorting compares neighbors repeatedly — far more work than one linear scan.", cost: `Sorting in progress…`, insight: isMax ? "After sorting, answer is last element." : "After sorting, answer is first element." });
          }
        }
        const ans = isMax ? a[a.length - 1] : a[0];
        emit({ title: "Pick the extreme", message: isMax ? `Sorted array is [${a}] — largest is last: ${ans}.` : `Sorted array is [${a}] — smallest is first: ${ans}.`, arrays: [A("Sorted copy", a, [isMax ? a.length - 1 : 0])], vars: { answer: ans }, why: "Only the end matters; everything else was wasted work.", cost: "Total O(N log N) time, O(1)–O(N) space.", insight: "Optimal: single scan, O(N) time, O(1) space, no reordering." });
        return ans;
      }
      return false;
    }
    // Sum: brute counting
    if (tn === "sum" && Number.isFinite(input.a)) {
      const { a, b } = input;
      if (type === "brute") {
        let total = a; let i = 0;
        emit({ title: "Count up from a", message: `Start at ${a} and add 1, ${b} times. This is how counting works — but it takes O(b) steps.`, arrays: [A("Operands", [a, b], [0, 1])], vars: { a, b, total }, why: "Mirrors finger-counting; correct but slow for large b.", cost: `0 / ${b} increments done.`, insight: "Optimal uses one CPU add: O(1)." });
        // coalesce small b for animation
        const steps = Math.min(Math.abs(b), 12);
        for (let s = 1; s <= steps; s++) {
          total += Math.sign(b) || 1;
          emit({ title: `Increment ${s}`, message: `total = ${total}. ${b - s > 0 ? `…${b - s} more increments to go.` : `Done after ${b} increments.`}`, arrays: [A("Running total", [total], [0])], vars: { total, remaining: b - s }, why: "Each increment is one unit of hidden O(b) work.", cost: `${s} / ${b} increments (O(b)).`, insight: "Try a large b (e.g. 10^9) — brute force never finishes." });
        }
        // jump remaining if b large
        if (Math.abs(b) > steps) { total = a + b; emit({ title: "Fast-forward", message: `Skipping remaining increments: total = ${a} + ${b} = ${total}. Animation compressed the loop.`, arrays: [A("Operands", [a, b], [0, 1]), A("Result", [total], [0])], vars: { total }, why: "In reality every step runs — cost is O(b), not O(1).", cost: "Total O(b) increments.", insight: "Optimal: single addition O(1)." }); }
        return a + b;
      }
      return false;
    }
    // Missing Number / Single Number: brute set/sort vs xor
    if (tn === "missing number" && Array.isArray(input.nums)) {
      const nums = [...input.nums];
      if (type === "brute") {
        const set = new Set(nums);
        const n = nums.length;
        emit({ title: "Build a set, then hunt", message: "Brute force stores every value in a set, then scans 0…N to find the gap. Simple, but costs O(N) space.", arrays: [A("Values", nums)], vars: { n }, why: "Membership test is O(1), but we pay memory for the set.", cost: "Set built O(N) time + O(N) space.", insight: "XOR / sum formulas need O(1) space." });
        for (let v = 0; v <= n; v++) {
          emit({ title: `Is ${v} present?`, message: set.has(v) ? `${v} is in the set — continue.` : `${v} is missing! Answer: ${v}.`, arrays: [A("Values", nums, nums.indexOf(v) >= 0 ? [nums.indexOf(v)] : [], { candidate: v }), A("Candidates 0…N", Array.from({ length: n + 1 }, (_, i) => i), [v])], vars: { candidate: v, found: set.has(v) }, why: "Linear hunt after building the set.", cost: `Checked ${v + 1} / ${n + 1} candidates.`, insight: set.has(v) ? "Still no gap." : "Gap found — brute force works." });
          if (!set.has(v)) return v;
        }
      }
      return false;
    }
    return false;
  }

  function genericRun(name, approach, allApproaches, input, emit) {
    const arrays0 = arraysFromInput(input);
    const steps = approach.steps && approach.steps.length ? approach.steps : ["Follow the approach logic.", "Return the result."];
    // Make conceptual phases visible by moving a clearly named focus marker
    // through the input. This is a teaching aid, not a claim that we simulated
    // the selected code's individual operations.
    emit({ title: "Conceptual walkthrough", message: approach.idea,
      arrays: arrays0.map((array) => ({ ...array, active: array.values.length ? [0] : [], pointers: array.values.length ? { focus: 0 } : {} })), vars: { time: approach.time, space: approach.space },
      why: "The walkthrough will move its focus across the input as each idea is explained. This is an illustration, not an operation-by-operation execution trace.",
      cost: approach.timeExplanation || `Time: ${approach.time}; space: ${approach.space}.`,
      insight: "The selected code below is the source of truth for its exact operations." });
    steps.forEach((stepText, si) => {
      const arrays = arrays0.map((array) => {
        const length = array.values.length;
        if (!length) return array;
        const start = Math.min(length - 1, Math.floor(si * length / steps.length));
        const end = Math.max(start, Math.min(length - 1, Math.ceil((si + 1) * length / steps.length) - 1));
        const focus = Math.floor((start + end) / 2);
        return { ...array, active: Array.from({ length: end - start + 1 }, (_, offset) => start + offset), pointers: { focus }, range: [start, end] };
      });
      const first = arrays[0];
      const focusedValues = first?.values?.slice(
        Math.floor(si * (first?.values?.length ?? 0) / steps.length),
        Math.max(Math.floor(si * (first?.values?.length ?? 0) / steps.length) + 1, Math.ceil((si + 1) * (first?.values?.length ?? 0) / steps.length)),
      ) ?? [];
      emit({
        title: `Conceptual phase ${si + 1} of ${steps.length}`,
        message: stepText, arrays,
        vars: { phase: `${si + 1} / ${steps.length}`, focus: focusedValues },
        why: "The highlighted region is a visual cue for this explanation phase; it is not a computed state from running the code.",
        cost: approach.timeExplanation || `Overall time: ${approach.time}.`,
        insight: si + 1 < steps.length ? `Next idea: ${steps[si + 1]}` : "The explanation is complete. Compare it with the selected implementation below."
      });
    });
    return undefined;
  }

  function build(name, approach, allApproaches, inputRaw) {
    let input = clone(inputRaw || baseInput(name));
    // normalize: ensure arrays length guard
    const run = (inp, emit) => {
      // if optimal and base trace exists, defer to base for fidelity (but caller may choose)
      const isOptimal = (approach.type || "optimal") === "optimal";
      if (isOptimal && R[name]?.run) {
        // run base but wrap emit to append why/cost enrichment already present; keep base fidelity
        return R[name].run(clone(inp), emit);
      }
      // Use a real specialist trace wherever the selected approach has one.
      // It must run before the illustrative phase fallback below.
      const specializedOutput = runSpecial(name, approach, inp, emit);
      if (specializedOutput !== false) return specializedOutput;
      const out = genericRun(name, approach, allApproaches, inp, emit);
      // try to get real output via base optimal run silently for final frame
      let real = out;
      try {
        if (R[name]?.run) {
          const sink = [];
          const cap = (f) => sink.push(f);
          const capture = (f) => { sink.push(f); };
          // run base with capture that just records (avoid unbounded)
          const tmp = R[name].run(clone(inp), capture);
          real = tmp;
          sink.length = 0;
        }
      } catch {}
      emit({ title: "Result", message: `Reference result from the problem’s optimal trace. The selected approach is shown as a conceptual walkthrough.`, arrays: arraysFromInput(inp), vars: { output: real, time: approach.time, space: approach.space }, why: "This result was calculated by the reference trace, not by this conceptual walkthrough.", cost: `Total: ${approach.time} · ${approach.space} (${approach.timeExplanation || ""})`, insight: `Pros: ${approach.pros?.[0] || ""} · Cons: ${approach.cons?.[0] || ""}`, output: real });
      return real;
    };
    return { input, run };
  }

  globalThis.buildApproachTrace = build;
  globalThis.APPROACH_COMPLEXITY_RANK = complexityRank;
})();
