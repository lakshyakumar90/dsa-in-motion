/* Exact, executable traces for backtracking, greedy, DP, and graph questions. */
(() => {
  "use strict";
  const R = globalThis.PROBLEM_TRACES;
  const copy = (v) => JSON.parse(JSON.stringify(v));
  const arr = (v, name, max = 18) => {
    if (
      !Array.isArray(v) ||
      v.length > max ||
      v.some((x) => typeof x !== "number" || !Number.isFinite(x))
    )
      throw Error(`${name} must be an array of at most ${max} finite numbers.`);
    return v.slice();
  };
  const positive = (v, name, max = 18) => {
    const a = arr(v, name, max);
    if (a.some((x) => !Number.isInteger(x) || x <= 0))
      throw Error(`${name} must contain positive integers.`);
    return a;
  };
  const integer = (v, name, lo = 0, hi = 30) => {
    if (!Number.isInteger(v) || v < lo || v > hi)
      throw Error(`${name} must be an integer from ${lo} to ${hi}.`);
    return v;
  };
  const str = (v, name, max = 30) => {
    if (typeof v !== "string" || v.length > max)
      throw Error(`${name} must be a string of at most ${max} characters.`);
    return v;
  };
  const tuples = (v, name, size, max = 15) => {
    if (
      !Array.isArray(v) ||
      v.length > max ||
      v.some(
        (x) =>
          !Array.isArray(x) ||
          x.length !== size ||
          x.some((y) => !Number.isFinite(y)),
      )
    )
      throw Error(
        `${name} must contain at most ${max} numeric ${size}-item arrays.`,
      );
    return copy(v);
  };
  const intervals = (v) => {
    const a = tuples(v, "intervals", 2);
    if (a.some(([s, e]) => s > e))
      throw Error("Each interval must have start ≤ end.");
    return a;
  };
  const row = (label, values, active = [], pointers = {}, done = []) => ({
    label,
    values: copy(values),
    active,
    pointers,
    done,
  });
  function register(name, input, work) {
    R[name] = {
      input,
      run(data, emit) {
        emit({
          title: "Start",
          message: `Run ${name} on the supplied example.`,
          vars: copy(data),
        });
        let lastFrame = {};
        const record = (frame) => {
          lastFrame = copy(frame);
          emit(frame);
        };
        const result = work(data, record);
        emit({
          ...lastFrame,
          title: "Result",
          message: `${name} is complete. The final return value is shown below.`,
          output: result,
          vars: { result },
        });
        return result;
      },
    };
  }

  register("Subsets - The Power Set", { nums: [1, 2, 3] }, ({ nums }, emit) => {
    const a = arr(nums, "nums", 5);
    if (new Set(a).size !== a.length)
      throw Error("Use distinct numbers for this problem.");
    const out = [],
      path = [];
    function dfs(i) {
      emit({
        title: "Decision",
        message:
          i < a.length
            ? `At index ${i}, first explore without ${a[i]}.`
            : "Every element has a decision. Save a copy of the current path.",
        arrays: [row("Input", a, [i]), row("Current subset", path)],
        vars: { index: i, subsets: out.length },
      });
      if (i === a.length) {
        out.push(path.slice());
        emit({
          title: "Save subset",
          message: `Append [${path}] to the answer.`,
          arrays: [row("Current subset", path)],
          output: copy(out),
        });
        return;
      }
      dfs(i + 1);
      path.push(a[i]);
      emit({
        title: "Include",
        message: `Include ${a[i]}, then explore the remaining positions.`,
        arrays: [row("Input", a, [i]), row("Current subset", path)],
        vars: { index: i },
      });
      dfs(i + 1);
      path.pop();
      emit({
        title: "Undo choice",
        message: `Remove ${a[i]} so the sibling branch starts with its original path.`,
        arrays: [row("Current subset", path)],
        vars: { returnTo: i },
      });
    }
    dfs(0);
    return out;
  });
  register("Combinations", { n: 4, k: 2 }, ({ n, k }, emit) => {
    n = integer(n, "n", 0, 7);
    k = integer(k, "k", 0, n);
    const out = [],
      path = [],
      a = Array.from({ length: n }, (_, i) => i + 1);
    function dfs(start) {
      if (path.length === k) {
        out.push(path.slice());
        emit({
          title: "Save combination",
          message: "The path contains k choices; save it and return.",
          arrays: [row("Candidates", a), row("Current combination", path)],
          output: copy(out),
        });
        return;
      }
      for (let v = start; v <= n - (k - path.length) + 1; v++) {
        path.push(v);
        emit({
          title: "Choose",
          message: `Choose ${v}; future choices must be larger, avoiding reordered duplicates.`,
          arrays: [
            row("Candidates", a, [v - 1]),
            row("Current combination", path),
          ],
          vars: { nextStart: v + 1, remaining: k - path.length },
        });
        dfs(v + 1);
        path.pop();
        emit({
          title: "Backtrack",
          message: `Undo ${v} and try the next candidate.`,
          arrays: [row("Current combination", path)],
        });
      }
    }
    dfs(1);
    return out;
  });
  register("Permutations", { nums: [1, 2, 3] }, ({ nums }, emit) => {
    const a = arr(nums, "nums", 5);
    if (new Set(a).size !== a.length)
      throw Error(
        "Use distinct numbers; repeated values belong in Permutations - II.",
      );
    const used = a.map(() => false),
      path = [],
      out = [];
    function dfs() {
      if (path.length === a.length) {
        out.push(path.slice());
        emit({
          title: "Save permutation",
          message: "All positions are filled. Save this order.",
          arrays: [row("Permutation", path)],
          output: copy(out),
        });
        return;
      }
      for (let i = 0; i < a.length; i++)
        if (!used[i]) {
          used[i] = true;
          path.push(a[i]);
          emit({
            title: "Choose unused value",
            message: `Place ${a[i]} in position ${path.length - 1}.`,
            arrays: [
              row(
                "Input",
                a,
                [i],
                {},
                used.map((x, j) => (x ? j : -1)).filter((j) => j >= 0),
              ),
              row("Permutation", path),
            ],
            vars: { used: used.slice() },
          });
          dfs();
          path.pop();
          used[i] = false;
          emit({
            title: "Undo",
            message: `Free ${a[i]} for the next branch.`,
            arrays: [row("Permutation", path)],
            vars: { used: used.slice() },
          });
        }
    }
    dfs();
    return out;
  });
  register("Subset - II", { nums: [1, 2, 2] }, ({ nums }, emit) => {
    const a = arr(nums, "nums", 6).sort((x, y) => x - y),
      path = [],
      out = [];
    function dfs(start) {
      out.push(path.slice());
      emit({
        title: "Save subset",
        message: "Every recursion path is a unique subset.",
        arrays: [row("Sorted input", a), row("Subset", path)],
        output: copy(out),
      });
      for (let i = start; i < a.length; i++) {
        if (i > start && a[i] === a[i - 1]) {
          emit({
            title: "Skip duplicate",
            message: `Skip the second ${a[i]} at this depth; it would repeat an existing branch.`,
            arrays: [row("Sorted input", a, [i])],
            vars: { start },
          });
          continue;
        }
        path.push(a[i]);
        emit({
          title: "Include",
          message: `Choose index ${i}, then recurse using later positions.`,
          arrays: [row("Sorted input", a, [i]), row("Subset", path)],
        });
        dfs(i + 1);
        path.pop();
        emit({
          title: "Backtrack",
          message: `Undo ${a[i]}.`,
          arrays: [row("Subset", path)],
        });
      }
    }
    dfs(0);
    return out;
  });
  function comboTrace(candidates, target, emit, reuse, k = null) {
    const a = candidates.slice().sort((x, y) => x - y),
      out = [],
      path = [];
    function dfs(start, left) {
      if (left === 0 && (k === null || path.length === k)) {
        out.push(path.slice());
        emit({
          title: "Save combination",
          message:
            "The remaining target is zero, so the current choices form a solution.",
          arrays: [row("Candidates", a), row("Path", path)],
          vars: { remaining: left },
          output: copy(out),
        });
        return;
      }
      if (k !== null && path.length >= k) return;
      for (let i = start; i < a.length; i++) {
        if (i > start && a[i] === a[i - 1]) {
          emit({
            title: "Skip duplicate",
            message: `Do not start another equivalent branch with ${a[i]} at the same depth.`,
            arrays: [row("Candidates", a, [i]), row("Path", path)],
          });
          continue;
        }
        if (a[i] > left) {
          emit({
            title: "Prune",
            message: `${a[i]} exceeds remaining target ${left}. Sorted later values cannot fit either.`,
            arrays: [row("Candidates", a, [i]), row("Path", path)],
            vars: { remaining: left },
          });
          break;
        }
        path.push(a[i]);
        emit({
          title: "Choose",
          message: `Take ${a[i]}; ${reuse ? "this candidate may be reused" : "advance to the next index"}.`,
          arrays: [row("Candidates", a, [i]), row("Path", path)],
          vars: { remaining: left - a[i] },
        });
        dfs(reuse ? i : i + 1, left - a[i]);
        path.pop();
        emit({
          title: "Undo",
          message: `Remove ${a[i]} and try the next choice.`,
          arrays: [row("Path", path)],
          vars: { remaining: left },
        });
      }
    }
    dfs(0, target);
    return out;
  }
  register(
    "Combination Sum",
    { candidates: [2, 3, 6, 7], target: 7 },
    ({ candidates, target }, emit) => {
      const a = positive(candidates, "candidates", 7);
      if (new Set(a).size !== a.length)
        throw Error("Candidates must be distinct.");
      return comboTrace(a, integer(target, "target", 0, 16), emit, true);
    },
  );
  register(
    "Combination Sum - II",
    { candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 },
    ({ candidates, target }, emit) =>
      comboTrace(
        positive(candidates, "candidates", 9),
        integer(target, "target", 0, 20),
        emit,
        false,
      ),
  );
  register("Combination Sum - III", { k: 3, n: 7 }, ({ k, n }, emit) =>
    comboTrace(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      integer(n, "n", 0, 25),
      emit,
      false,
      integer(k, "k", 0, 5),
    ),
  );
  register(
    "Letter Combinations of a Phone Number",
    { digits: "23" },
    ({ digits }, emit) => {
      digits = str(digits, "digits", 3);
      if (/[^2-9]/.test(digits)) throw Error("Use digits 2 through 9 only.");
      if (!digits) return [];
      const map = {
          2: "abc",
          3: "def",
          4: "ghi",
          5: "jkl",
          6: "mno",
          7: "pqrs",
          8: "tuv",
          9: "wxyz",
        },
        path = [],
        out = [];
      function dfs(i) {
        if (i === digits.length) {
          out.push(path.join(""));
          emit({
            title: "Save word",
            message: `All digits have a letter: save “${path.join("")}”.`,
            arrays: [row("Digits", digits.split("")), row("Letters", path)],
            output: out.slice(),
          });
          return;
        }
        for (const c of map[digits[i]]) {
          path.push(c);
          emit({
            title: "Choose letter",
            message: `Digit ${digits[i]} allows ${map[digits[i]]}. Choose ${c}.`,
            arrays: [
              row("Digits", digits.split(""), [i]),
              row("Current word", path),
            ],
            vars: { digitIndex: i },
          });
          dfs(i + 1);
          path.pop();
          emit({
            title: "Undo letter",
            message: `Return to digit ${digits[i]} to try its next letter.`,
            arrays: [row("Current word", path)],
          });
        }
      }
      dfs(0);
      return out;
    },
  );
  register("Permutations - II", { nums: [1, 1, 2] }, ({ nums }, emit) => {
    const a = arr(nums, "nums", 5).sort((x, y) => x - y),
      used = a.map(() => false),
      path = [],
      out = [];
    function dfs() {
      if (path.length === a.length) {
        out.push(path.slice());
        emit({
          title: "Save unique permutation",
          message: "All values are placed exactly once.",
          arrays: [row("Permutation", path)],
          output: copy(out),
        });
        return;
      }
      for (let i = 0; i < a.length; i++) {
        if (used[i]) continue;
        if (i > 0 && a[i] === a[i - 1] && !used[i - 1]) {
          emit({
            title: "Skip equivalent choice",
            message:
              "The equal previous value is unused at this depth; choosing this copy would duplicate an order.",
            arrays: [row("Sorted values", a, [i])],
            vars: { used: used.slice() },
          });
          continue;
        }
        used[i] = true;
        path.push(a[i]);
        emit({
          title: "Place value",
          message: `Use occurrence ${i} of value ${a[i]}.`,
          arrays: [row("Sorted values", a, [i]), row("Permutation", path)],
          vars: { used: used.slice() },
        });
        dfs();
        path.pop();
        used[i] = false;
        emit({
          title: "Backtrack",
          message: `Release occurrence ${i}.`,
          arrays: [row("Permutation", path)],
          vars: { used: used.slice() },
        });
      }
    }
    dfs();
    return out;
  });
  register("Palindrome Partitioning", { s: "aab" }, ({ s }, emit) => {
    s = str(s, "s", 8);
    const path = [],
      out = [],
      pal = (x) => x === x.split("").reverse().join("");
    function dfs(start) {
      if (start === s.length) {
        out.push(path.slice());
        emit({
          title: "Save partition",
          message:
            "Every selected piece is a palindrome and the entire string is covered.",
          arrays: [row("Partition", path)],
          output: copy(out),
        });
        return;
      }
      for (let end = start + 1; end <= s.length; end++) {
        const piece = s.slice(start, end),
          ok = pal(piece);
        emit({
          title: "Test substring",
          message: `“${piece}” ${ok ? "is" : "is not"} a palindrome.`,
          arrays: [
            row(
              "Characters",
              s.split(""),
              Array.from({ length: end - start }, (_, j) => start + j),
            ),
            row("Partition", path),
          ],
          vars: { start, end: end - 1, palindrome: ok },
        });
        if (!ok) continue;
        path.push(piece);
        dfs(end);
        path.pop();
        emit({
          title: "Undo cut",
          message: `Remove “${piece}” and try another ending.`,
          arrays: [row("Partition", path)],
        });
      }
    }
    dfs(0);
    return out;
  });
  register(
    "Word Search",
    {
      board: [
        ["A", "B"],
        ["C", "D"],
      ],
      word: "ABD",
    },
    ({ board, word }, emit) => {
      if (
        !Array.isArray(board) ||
        !board.length ||
        board.length > 5 ||
        !Array.isArray(board[0]) ||
        !board[0].length ||
        board[0].length > 5 ||
        board.some(
          (r) =>
            r.length !== board[0].length ||
            r.some((c) => typeof c !== "string" || c.length !== 1),
        )
      )
        throw Error("board must be a rectangular character grid up to 5×5.");
      word = str(word, "word", 9);
      if (!word) return true;
      const b = copy(board),
        m = b.length,
        n = b[0].length,
        used = new Set(),
        path = [];
      function dfs(r, c, i) {
        if (i === word.length) return true;
        if (r < 0 || r >= m || c < 0 || c >= n || used.has(r + "," + c))
          return false;
        let match = b[r][c] === word[i];
        emit({
          title: "Compare cell",
          message: `Compare ${b[r][c]} with word[${i}] = ${word[i]}. ${match ? "Match: explore its neighbors." : "Mismatch: reject this branch."}`,
          matrix: {
            label: "Board",
            values: b,
            active: [[r, c]],
            done: path.slice(),
          },
          arrays: [row("Word", word.split(""), [i])],
          vars: { letter: i, path: path.map((p) => p.join(",")) },
        });
        if (!match) return false;
        used.add(r + "," + c);
        path.push([r, c]);
        if (i === word.length - 1) return true;
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
        ])
          if (dfs(r + dr, c + dc, i + 1)) return true;
        used.delete(r + "," + c);
        path.pop();
        emit({
          title: "Backtrack",
          message: `No continuation works from (${r},${c}); unmark it for other paths.`,
          matrix: {
            label: "Board",
            values: b,
            active: [[r, c]],
            done: path.slice(),
          },
        });
        return false;
      }
      for (let r = 0; r < m; r++)
        for (let c = 0; c < n; c++) if (dfs(r, c, 0)) return true;
      return false;
    },
  );
  register("N Queens", { n: 4 }, ({ n }, emit) => {
    n = integer(n, "n", 1, 5);
    const board = Array.from({ length: n }, () => Array(n).fill(".")),
      cols = new Set(),
      d1 = new Set(),
      d2 = new Set(),
      out = [];
    function dfs(r) {
      if (r === n) {
        out.push(board.map((x) => x.join("")));
        emit({
          title: "Save board",
          message:
            "Every row has one queen, and no two queens attack each other.",
          matrix: { label: "Valid board", values: copy(board) },
          vars: { solutions: out.length },
          output: copy(out),
        });
        return;
      }
      for (let c = 0; c < n; c++) {
        const safe = !cols.has(c) && !d1.has(r - c) && !d2.has(r + c);
        emit({
          title: "Check square",
          message: `(${r},${c}) is ${safe ? "safe" : "attacked by a placed queen"}.`,
          matrix: {
            label: "Queen board",
            values: copy(board),
            active: [[r, c]],
          },
          vars: { row: r, column: c, safe },
        });
        if (!safe) continue;
        board[r][c] = "Q";
        cols.add(c);
        d1.add(r - c);
        d2.add(r + c);
        emit({
          title: "Place queen",
          message: `Place queen in row ${r}, column ${c}.`,
          matrix: {
            label: "Queen board",
            values: copy(board),
            active: [[r, c]],
          },
        });
        dfs(r + 1);
        board[r][c] = ".";
        cols.delete(c);
        d1.delete(r - c);
        d2.delete(r + c);
        emit({
          title: "Remove queen",
          message: `Undo (${r},${c}) to explore another arrangement.`,
          matrix: {
            label: "Queen board",
            values: copy(board),
            active: [[r, c]],
          },
        });
      }
    }
    dfs(0);
    return out;
  });

  register(
    "Two City Scheduling",
    {
      costs: [
        [10, 20],
        [30, 200],
        [400, 50],
        [30, 20],
      ],
    },
    ({ costs }, emit) => {
      const a = tuples(costs, "costs", 2, 12);
      if (a.length % 2) throw Error("Use an even number of people.");
      a.forEach((x, i) => x.push(i));
      a.sort((x, y) => x[0] - x[1] - (y[0] - y[1]));
      let total = 0;
      const assignments = [];
      emit({
        title: "Sort by savings",
        message:
          "Sort by cost(A) − cost(B). The first half benefit most from going to A.",
        matrix: { label: "Sorted [A, B, person]", values: a },
        arrays: [
          row(
            "A − B",
            a.map((x) => x[0] - x[1]),
          ),
        ],
      });
      for (let i = 0; i < a.length; i++) {
        const city = i < a.length / 2 ? "A" : "B",
          cost = a[i][city === "A" ? 0 : 1];
        total += cost;
        assignments.push(`P${a[i][2]}→${city}`);
        emit({
          title: "Assign person",
          message: `Send person ${a[i][2]} to city ${city}, adding ${cost}.`,
          matrix: {
            label: "Sorted costs",
            values: a,
            active: [[i, city === "A" ? 0 : 1]],
          },
          arrays: [row("Assignments", assignments)],
          vars: { total },
        });
      }
      return total;
    },
  );
  register(
    "Assign Cookies",
    { greed: [1, 2, 3], cookies: [1, 1] },
    ({ greed, cookies }, emit) => {
      const g = positive(greed, "greed"),
        c = positive(cookies, "cookies");
      g.sort((a, b) => a - b);
      c.sort((a, b) => a - b);
      let child = 0;
      for (let j = 0; j < c.length && child < g.length; j++) {
        const ok = c[j] >= g[child];
        emit({
          title: "Match smallest remaining child",
          message: `Cookie ${c[j]} ${ok ? "satisfies" : "is too small for"} greed ${g[child]}.`,
          arrays: [
            row("Sorted greed", g, [child], { child }),
            row("Sorted cookies", c, [j], { cookie: j }),
          ],
          vars: { satisfied: child },
        });
        if (ok) child++;
        emit({
          title: ok ? "Assign cookie" : "Discard cookie",
          message: ok
            ? "Advance to the next child."
            : "A later, larger cookie may satisfy this child.",
          vars: { satisfied: child },
          arrays: [
            row("Sorted greed", g, [], { nextChild: child }),
            row("Sorted cookies", c, [j]),
          ],
        });
      }
      return child;
    },
  );
  register(
    "Lemonade Change",
    { bills: [5, 5, 5, 10, 20] },
    ({ bills }, emit) => {
      const a = arr(bills, "bills");
      if (a.some((x) => ![5, 10, 20].includes(x)))
        throw Error("Bills must be 5, 10, or 20.");
      let five = 0,
        ten = 0;
      for (let i = 0; i < a.length; i++) {
        let ok = true,
          action = "";
        if (a[i] === 5) {
          five++;
          action = "Keep the $5 bill; no change is needed.";
        } else if (a[i] === 10) {
          five--;
          ten++;
          action = "Return one $5 bill as change.";
        } else if (ten > 0 && five > 0) {
          ten--;
          five--;
          action = "Return $10 + $5, preserving smaller bills.";
        } else {
          five -= 3;
          action = "Return three $5 bills.";
        }
        ok = five >= 0;
        emit({
          title: ok ? "Serve customer" : "Cannot make change",
          message: `Customer pays $${a[i]}. ${action}`,
          arrays: [row("Bills", a, [i], { customer: i })],
          vars: { $5: Math.max(0, five), $10: ten, possible: ok },
        });
        if (!ok) return false;
      }
      return true;
    },
  );
  register(
    "Best Time to Buy and Sell Stock - II",
    { prices: [7, 1, 5, 3, 6, 4] },
    ({ prices }, emit) => {
      const a = arr(prices, "prices");
      let profit = 0;
      for (let i = 1; i < a.length; i++) {
        let gain = a[i] - a[i - 1];
        if (gain > 0) profit += gain;
        emit({
          title: gain > 0 ? "Capture rising edge" : "Skip falling edge",
          message: `Day ${i - 1} → ${i}: price change ${gain}. ${gain > 0 ? "Add the positive difference." : "No profitable overnight trade."}`,
          arrays: [row("Prices", a, [i - 1, i], { day: i })],
          vars: { dailyGain: gain, profit },
        });
      }
      return profit;
    },
  );
  register(
    "Insert Interval",
    {
      intervals: [
        [1, 3],
        [6, 9],
      ],
      newInterval: [2, 5],
    },
    ({ intervals: v, newInterval }, emit) => {
      const a = intervals(v);
      if (a.some((x, i) => i > 0 && a[i - 1][1] >= x[0]))
        throw Error("Input intervals must be sorted and non-overlapping.");
      const fresh = tuples([newInterval], "newInterval", 2)[0];
      if (fresh[0] > fresh[1])
        throw Error("New interval start must not exceed its end.");
      const out = [];
      let i = 0;
      while (i < a.length && a[i][1] < fresh[0]) {
        out.push(a[i]);
        emit({
          title: "Keep interval before insertion",
          message: `[${a[i]}] finishes before the new interval.`,
          matrix: {
            label: "Input intervals",
            values: a,
            active: [
              [i, 0],
              [i, 1],
            ],
          },
          vars: { merged: fresh.slice() },
          output: copy(out),
        });
        i++;
      }
      while (i < a.length && a[i][0] <= fresh[1]) {
        fresh[0] = Math.min(fresh[0], a[i][0]);
        fresh[1] = Math.max(fresh[1], a[i][1]);
        emit({
          title: "Merge overlap",
          message: `Absorb [${a[i]}] into [${fresh}].`,
          matrix: {
            label: "Input intervals",
            values: a,
            active: [
              [i, 0],
              [i, 1],
            ],
          },
          vars: { merged: fresh.slice() },
        });
        i++;
      }
      out.push(fresh);
      emit({
        title: "Insert merged interval",
        message: `Append the merged interval [${fresh}].`,
        output: copy(out),
      });
      while (i < a.length) {
        out.push(a[i++]);
        emit({
          title: "Keep later interval",
          message: "The remaining intervals start after the merged range.",
          output: copy(out),
        });
      }
      return out;
    },
  );
  register(
    "Merge Intervals",
    {
      intervals: [
        [1, 3],
        [2, 6],
        [8, 10],
        [15, 18],
      ],
    },
    ({ intervals: v }, emit) => {
      const a = intervals(v).sort((x, y) => x[0] - y[0]),
        out = [];
      emit({
        title: "Sort by start",
        message:
          "Intervals with overlapping ranges become adjacent after sorting.",
        matrix: { label: "Sorted intervals", values: a },
      });
      for (let i = 0; i < a.length; i++) {
        const last = out.at(-1);
        if (last && a[i][0] <= last[1]) {
          last[1] = Math.max(last[1], a[i][1]);
          emit({
            title: "Extend overlap",
            message: `Merge [${a[i]}] into the previous result.`,
            matrix: {
              label: "Sorted intervals",
              values: a,
              active: [
                [i, 0],
                [i, 1],
              ],
            },
            output: copy(out),
          });
        } else {
          out.push(a[i].slice());
          emit({
            title: "Start disjoint range",
            message: `[${a[i]}] starts beyond the previous endpoint.`,
            matrix: {
              label: "Sorted intervals",
              values: a,
              active: [
                [i, 0],
                [i, 1],
              ],
            },
            output: copy(out),
          });
        }
      }
      return out;
    },
  );
  register(
    "Partition Labels",
    { s: "ababcbacadefegdehijhklij" },
    ({ s }, emit) => {
      s = str(s, "s", 40);
      const last = {},
        out = [];
      for (let i = 0; i < s.length; i++) last[s[i]] = i;
      let start = 0,
        end = 0;
      emit({
        title: "Record last occurrences",
        message:
          "A partition containing a character must extend through its last occurrence.",
        arrays: [row("Characters", s.split(""))],
        vars: { last },
      });
      for (let i = 0; i < s.length; i++) {
        end = Math.max(end, last[s[i]]);
        emit({
          title: "Extend required boundary",
          message: `Character ${s[i]} last occurs at ${last[s[i]]}; the current partition must end at least at ${end}.`,
          arrays: [
            row("Characters", s.split(""), [i], { start, scan: i, end }),
          ],
          vars: { lastIndex: last[s[i]], end },
          output: out.slice(),
        });
        if (i === end) {
          out.push(end - start + 1);
          emit({
            title: "Close partition",
            message: `No character in [${start},${end}] appears later. Save length ${end - start + 1}.`,
            arrays: [row("Partition lengths", out)],
            vars: { start, end },
          });
          start = i + 1;
        }
      }
      return out;
    },
  );
  register(
    "Non Overlapping Intervals",
    {
      intervals: [
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 3],
      ],
    },
    ({ intervals: v }, emit) => {
      const a = intervals(v).sort((x, y) => x[1] - y[1]);
      let end = -Infinity,
        removed = 0;
      const kept = [];
      for (let i = 0; i < a.length; i++) {
        let keep = a[i][0] >= end;
        if (keep) {
          end = a[i][1];
          kept.push(a[i].slice());
        } else removed++;
        emit({
          title: keep ? "Keep earliest finish" : "Remove overlap",
          message: `[${a[i]}] ${keep ? "fits after the last kept interval." : "overlaps the last chosen range."}`,
          matrix: {
            label: "Intervals by finish",
            values: a,
            active: [
              [i, 0],
              [i, 1],
            ],
          },
          vars: { lastFinish: Number.isFinite(end) ? end : null, removed },
          output: copy(kept),
        });
      }
      return removed;
    },
  );
  register(
    "Task Scheduler",
    { tasks: ["A", "A", "A", "B", "B", "B"], n: 2 },
    ({ tasks, n }, emit) => {
      if (
        !Array.isArray(tasks) ||
        tasks.length > 20 ||
        tasks.some((t) => typeof t !== "string" || t.length !== 1)
      )
        throw Error("tasks must contain at most 20 one-character task names.");
      n = integer(n, "n", 0, 6);
      let count = {};
      for (const t of tasks) count[t] = (count[t] || 0) + 1;
      const counts = Object.values(count),
        max = Math.max(0, ...counts),
        ties = counts.filter((x) => x === max).length;
      emit({
        title: "Count task frequencies",
        message:
          "The most frequent tasks determine the mandatory cooldown skeleton.",
        arrays: [
          row("Tasks", tasks),
          row(
            "Counts",
            Object.keys(count).map((k) => `${k}:${count[k]}`),
          ),
        ],
        vars: { maxFrequency: max, tiedMaxima: ties, cooldown: n },
      });
      const bound = tasks.length
        ? Math.max(tasks.length, (max - 1) * (n + 1) + ties)
        : 0;
      const next = {},
        timeline = [];
      for (let time = 0; time < bound; time++) {
        const ready = Object.keys(count)
          .filter((t) => count[t] > 0 && (next[t] ?? 0) <= time)
          .sort((a, b) => count[b] - count[a] || a.localeCompare(b));
        const task = ready[0] ?? "idle";
        timeline.push(task);
        if (task !== "idle") {
          count[task]--;
          next[task] = time + n + 1;
        }
        emit({
          title: task === "idle" ? "Cooldown slot" : "Run task",
          message:
            task === "idle"
              ? "All remaining tasks are cooling down; this slot must be idle."
              : `Run ${task}; it becomes available again at time ${next[task]}.`,
          arrays: [
            row("Timeline", timeline, [time]),
            row(
              "Remaining",
              Object.keys(count).map((k) => `${k}:${count[k]}`),
            ),
          ],
          vars: { time, nextAvailable: copy(next), minimumIntervals: bound },
        });
      }
      return bound;
    },
  );
  register(
    "Gas Station",
    { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] },
    ({ gas, cost }, emit) => {
      const g = arr(gas, "gas"),
        c = arr(cost, "cost");
      if (
        !g.length ||
        g.length !== c.length ||
        g.some((x) => x < 0) ||
        c.some((x) => x < 0)
      )
        throw Error(
          "gas and cost must have the same nonzero length and nonnegative values.",
        );
      let total = 0,
        tank = 0,
        start = 0;
      for (let i = 0; i < g.length; i++) {
        const change = g[i] - c[i];
        tank += change;
        total += change;
        emit({
          title: "Travel to next station",
          message: `At ${i}, gain ${g[i]} and spend ${c[i]}. Tank changes by ${change}.`,
          arrays: [
            row("Gas", g, [i], { candidate: start, station: i }),
            row("Cost", c, [i]),
          ],
          vars: { tank, total, start },
        });
        if (tank < 0) {
          emit({
            title: "Reject candidate segment",
            message: `Candidate ${start} cannot reach past station ${i}; every start in that segment also fails. Try ${i + 1}.`,
            arrays: [row("Gas", g, [i], { nextCandidate: i + 1 })],
            vars: { failedTank: tank },
          });
          start = i + 1;
          tank = 0;
        }
      }
      return total >= 0 ? start : -1;
    },
  );
  register(
    "Car Pooling",
    {
      trips: [
        [2, 1, 5],
        [3, 3, 7],
      ],
      capacity: 4,
    },
    ({ trips, capacity }, emit) => {
      const a = tuples(trips, "trips", 3, 12);
      capacity = integer(capacity, "capacity", 0, 100);
      if (a.some(([p, s, e]) => p < 0 || s >= e))
        throw Error(
          "Each trip is [nonnegative passengers, start, end] with start < end.",
        );
      const events = [];
      for (let [p, s, e] of a) {
        events.push([s, p]);
        events.push([e, -p]);
      }
      events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let onboard = 0;
      emit({
        title: "Build ordered events",
        message: "Drop-offs are processed before pickups at the same location.",
        matrix: { label: "[location, passenger change]", values: events },
      });
      for (let i = 0; i < events.length; i++) {
        onboard += events[i][1];
        emit({
          title: events[i][1] < 0 ? "Drop off" : "Pick up",
          message: `At location ${events[i][0]}, passenger count changes by ${events[i][1]}.`,
          matrix: {
            label: "Events",
            values: events,
            active: [
              [i, 0],
              [i, 1],
            ],
          },
          vars: { onboard, capacity, withinCapacity: onboard <= capacity },
        });
        if (onboard > capacity) return false;
      }
      return true;
    },
  );
  register("Candy", { ratings: [1, 0, 2] }, ({ ratings }, emit) => {
    const a = arr(ratings, "ratings"),
      c = a.map(() => 1);
    for (let i = 1; i < a.length; i++) {
      if (a[i] > a[i - 1]) c[i] = c[i - 1] + 1;
      emit({
        title: "Left-to-right pass",
        message: `Child ${i} ${a[i] > a[i - 1] ? "needs one more candy than the left neighbor." : "has no higher-rating requirement from the left."}`,
        arrays: [row("Ratings", a, [i - 1, i]), row("Candies", c, [i])],
        vars: { direction: "left → right" },
      });
    }
    for (let i = a.length - 2; i >= 0; i--) {
      if (a[i] > a[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1);
      emit({
        title: "Right-to-left pass",
        message: `Enforce the right-neighbor rule at ${i} without breaking the left-neighbor rule.`,
        arrays: [row("Ratings", a, [i, i + 1]), row("Candies", c, [i])],
        vars: { direction: "right → left" },
      });
    }
    return c.reduce((s, x) => s + x, 0);
  });

  register("Climbing Stairs", { n: 6 }, ({ n }, emit) => {
    n = integer(n, "n", 0, 15);
    const dp = Array(n + 1).fill(0);
    dp[0] = 1;
    if (n >= 1) dp[1] = 1;
    emit({
      title: "Base cases",
      message: "One way to stay at step 0; one way to reach step 1.",
      arrays: [row("Ways", dp, [0, 1])],
      vars: { n },
    });
    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
      emit({
        title: "Add disjoint predecessor paths",
        message: `ways[${i}] = ways[${i - 1}] + ways[${i - 2}] = ${dp[i]}.`,
        arrays: [
          row("Ways", dp, [i], { oneStepBack: i - 1, twoStepsBack: i - 2 }),
        ],
        vars: { step: i },
      });
    }
    return dp[n];
  });
  register(
    "Minimum Cost Climbing Stairs",
    { cost: [10, 15, 20] },
    ({ cost }, emit) => {
      const a = arr(cost, "cost");
      if (a.length < 2) throw Error("Use at least two step costs.");
      const dp = Array(a.length + 1).fill(0);
      emit({
        title: "Free starting choices",
        message: "Start at step 0 or step 1 without paying until leaving it.",
        arrays: [row("Cost", a), row("Minimum cost to reach", dp, [0, 1])],
      });
      for (let i = 2; i <= a.length; i++) {
        const one = dp[i - 1] + a[i - 1],
          two = dp[i - 2] + a[i - 2];
        dp[i] = Math.min(one, two);
        emit({
          title: "Choose cheaper predecessor",
          message: `dp[${i}] = min(${one}, ${two}) = ${dp[i]}.`,
          arrays: [
            row("Cost", a, [i - 1, i - 2]),
            row("Minimum cost to reach", dp, [i], {
              fromOne: i - 1,
              fromTwo: i - 2,
            }),
          ],
          vars: { oneStep: one, twoSteps: two },
        });
      }
      return dp[a.length];
    },
  );
  function robLine(a, emit, label) {
    let prev2 = 0,
      prev1 = 0;
    for (let i = 0; i < a.length; i++) {
      const take = prev2 + a[i],
        skip = prev1,
        best = Math.max(take, skip);
      emit({
        title: "Take or skip house",
        message: `${label}: house ${i}, choose max(take ${take}, skip ${skip}).`,
        arrays: [row(label, a, [i], { house: i })],
        vars: { twoBack: prev2, previous: prev1, take, skip, best },
      });
      prev2 = prev1;
      prev1 = best;
    }
    return prev1;
  }
  register("House Robber", { nums: [2, 7, 9, 3, 1] }, ({ nums }, emit) =>
    robLine(arr(nums, "nums"), emit, "Houses"),
  );
  register("House Robber II", { nums: [2, 3, 2] }, ({ nums }, emit) => {
    const a = arr(nums, "nums");
    if (a.some((x) => x < 0)) throw Error("House values must be nonnegative.");
    if (a.length <= 1) return a[0] ?? 0;
    emit({
      title: "Break the circle",
      message:
        "First and last cannot both be taken. Solve once without the last and once without the first.",
      arrays: [row("Circular houses", a)],
    });
    const x = robLine(a.slice(0, -1), emit, "Exclude last"),
      y = robLine(a.slice(1), emit, "Exclude first");
    emit({
      title: "Compare the two valid cases",
      message:
        "Every valid circular solution belongs to at least one of these cases.",
      vars: { excludeLast: x, excludeFirst: y },
    });
    return Math.max(x, y);
  });
  register(
    "Coin Change",
    { coins: [1, 2, 5], amount: 11 },
    ({ coins, amount }, emit) => {
      const a = positive(coins, "coins", 8);
      amount = integer(amount, "amount", 0, 30);
      const dp = Array(amount + 1).fill(amount + 1);
      dp[0] = 0;
      emit({
        title: "Initialize unreachable amounts",
        message: "dp[0] = 0. Every other amount starts unreachable.",
        arrays: [
          row("Coins", a),
          row(
            "Minimum coins",
            dp.map((x) => (x > amount ? "∞" : x)),
          ),
        ],
      });
      for (let x = 1; x <= amount; x++)
        for (let j = 0; j < a.length; j++) {
          const c = a[j];
          if (c > x) continue;
          const candidate = dp[x - c] + 1,
            old = dp[x];
          dp[x] = Math.min(old, candidate);
          emit({
            title: dp[x] < old ? "Improve minimum" : "Keep current minimum",
            message: `For amount ${x}, try coin ${c}: dp[${x - c}] + 1.`,
            arrays: [
              row("Coins", a, [j]),
              row(
                "Minimum coins",
                dp.map((x) => (x > amount ? "∞" : x)),
                [x],
                { predecessor: x - c },
              ),
            ],
            vars: {
              amount: x,
              coin: c,
              candidate: candidate > amount ? "unreachable" : candidate,
            },
          });
        }
      return dp[amount] > amount ? -1 : dp[amount];
    },
  );
  function expandPal(s, emit, longest) {
    let count = 0,
      best = "";
    for (let center = 0; center < 2 * s.length - 1; center++) {
      let l = Math.floor(center / 2),
        r = l + (center % 2);
      while (l >= 0 && r < s.length) {
        const equal = s[l] === s[r];
        emit({
          title: "Expand around center",
          message: `Compare positions ${l} and ${r}: ${equal ? "equal, so the range is a palindrome." : "different; this expansion stops."}`,
          arrays: [
            row("Characters", s.split(""), [l, r], { left: l, right: r }),
          ],
          vars: { center: center / 2, palindromes: count, longest: best },
        });
        if (!equal) break;
        count++;
        if (r - l + 1 > best.length) best = s.slice(l, r + 1);
        emit({
          title: "Record palindrome",
          message: `“${s.slice(l, r + 1)}” is palindromic.`,
          arrays: [
            row(
              "Characters",
              s.split(""),
              Array.from({ length: r - l + 1 }, (_, i) => l + i),
            ),
          ],
          vars: { palindromes: count, longest: best },
        });
        l--;
        r++;
      }
    }
    return longest ? best : count;
  }
  register("Palindromic Substrings", { s: "aaa" }, ({ s }, emit) =>
    expandPal(str(s, "s", 14), emit, false),
  );
  register("Longest Palindromic Substring", { s: "babad" }, ({ s }, emit) =>
    expandPal(str(s, "s", 14), emit, true),
  );
  register("Decode Ways", { s: "226" }, ({ s }, emit) => {
    s = str(s, "s", 20);
    if (!/^\d+$/.test(s)) throw Error("Use a nonempty decimal digit string.");
    const dp = Array(s.length + 1).fill(0);
    dp[0] = 1;
    emit({
      title: "Empty-prefix base case",
      message: "There is one way to decode the empty prefix.",
      arrays: [
        row("Digits", s.split("")),
        row("Ways per prefix length", dp, [0]),
      ],
    });
    for (let i = 1; i <= s.length; i++) {
      let one = 0,
        two = 0;
      if (s[i - 1] !== "0") one = dp[i - 1];
      if (
        i >= 2 &&
        Number(s.slice(i - 2, i)) >= 10 &&
        Number(s.slice(i - 2, i)) <= 26
      )
        two = dp[i - 2];
      dp[i] = one + two;
      emit({
        title: "Decode final one or two digits",
        message: `Prefix length ${i}: ${one} ways with one digit + ${two} with a valid two-digit code.`,
        arrays: [
          row(
            "Digits",
            s.split(""),
            [i - 1, i - 2].filter((x) => x >= 0),
          ),
          row("Ways per prefix length", dp, [i], {
            oneBack: i - 1,
            twoBack: i - 2,
          }),
        ],
        vars: { oneDigit: one, twoDigits: two },
      });
    }
    return dp[s.length];
  });
  register(
    "Maximum Subarray",
    { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    ({ nums }, emit) => {
      const a = arr(nums, "nums");
      if (!a.length) throw Error("Use at least one number.");
      let ending = a[0],
        best = a[0],
        start = 0,
        bestL = 0,
        bestR = 0;
      emit({
        title: "First subarray",
        message: "A nonempty subarray must contain at least one value.",
        arrays: [row("Numbers", a, [0])],
        vars: { ending, best },
      });
      for (let i = 1; i < a.length; i++) {
        if (a[i] > ending + a[i]) {
          ending = a[i];
          start = i;
        } else ending += a[i];
        if (ending > best) {
          best = ending;
          bestL = start;
          bestR = i;
        }
        emit({
          title: "Extend or restart",
          message: `At ${i}, the best ending-here sum is ${ending}. Best global sum is ${best}.`,
          arrays: [
            row(
              "Numbers",
              a,
              [i],
              { start, end: i },
              Array.from({ length: bestR - bestL + 1 }, (_, j) => bestL + j),
            ),
          ],
          vars: { ending, best, bestRange: [bestL, bestR] },
        });
      }
      return best;
    },
  );
  register(
    "Maximum Product Subarray",
    { nums: [2, 3, -2, 4] },
    ({ nums }, emit) => {
      const a = arr(nums, "nums");
      if (!a.length) throw Error("Use a nonempty array.");
      let hi = a[0],
        lo = a[0],
        best = a[0];
      emit({
        title: "Keep both extremes",
        message:
          "A negative multiplier can turn a minimum product into the new maximum.",
        arrays: [row("Numbers", a, [0])],
        vars: { maxEnding: hi, minEnding: lo, best },
      });
      for (let i = 1; i < a.length; i++) {
        const v = a[i],
          candidates = [v, hi * v, lo * v];
        hi = Math.max(...candidates);
        lo = Math.min(...candidates);
        best = Math.max(best, hi);
        emit({
          title: "Update both products",
          message: `Consider starting at ${v}, extending the maximum, and extending the minimum.`,
          arrays: [row("Numbers", a, [i]), row("Candidates", candidates)],
          vars: { maxEnding: hi, minEnding: lo, best },
        });
      }
      return best;
    },
  );
  register(
    "Word Break",
    { s: "leetcode", words: ["leet", "code"] },
    ({ s, words }, emit) => {
      s = str(s, "s", 24);
      if (
        !Array.isArray(words) ||
        words.length > 12 ||
        words.some((w) => typeof w !== "string" || !w.length || w.length > 15)
      )
        throw Error("words must contain up to 12 nonempty strings.");
      const dict = new Set(words),
        dp = Array(s.length + 1).fill(false);
      dp[0] = true;
      emit({
        title: "Segmentable empty prefix",
        message:
          "dp[0] is true. Find a reachable earlier cut followed by a dictionary word.",
        arrays: [
          row("Characters", s.split("")),
          row("Segmentable prefixes", dp),
        ],
      });
      for (let i = 1; i <= s.length; i++)
        for (let j = 0; j < i; j++) {
          if (!dp[j]) continue;
          let word = s.slice(j, i),
            hit = dict.has(word);
          emit({
            title: "Test next word",
            message: `Prefix ${j} is segmentable. Is “${word}” in the dictionary? ${hit ? "Yes." : "No."}`,
            arrays: [
              row(
                "Characters",
                s.split(""),
                Array.from({ length: i - j }, (_, k) => j + k),
              ),
              row("Segmentable prefixes", dp, [j, i]),
            ],
            vars: { dictionary: words, cut: j, end: i, match: hit },
          });
          if (hit) {
            dp[i] = true;
            emit({
              title: "Mark reachable prefix",
              message: `The prefix ending at ${i} can be segmented.`,
              arrays: [row("Segmentable prefixes", dp, [i])],
            });
            break;
          }
        }
      return dp[s.length];
    },
  );
  register(
    "Longest Increasing Subsequence",
    { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
    ({ nums }, emit) => {
      const a = arr(nums, "nums"),
        tails = [];
      for (let i = 0; i < a.length; i++) {
        let l = 0,
          r = tails.length;
        while (l < r) {
          let m = (l + r) >> 1;
          emit({
            title: "Find replacement position",
            message: `Search for the first tail ≥ ${a[i]}; compare with tails[${m}].`,
            arrays: [
              row("Input", a, [i]),
              row("Smallest tails", tails, [m], { lo: l, mid: m, hi: r }),
            ],
            vars: { value: a[i] },
          });
          if (tails[m] < a[i]) l = m + 1;
          else r = m;
        }
        tails[l] = a[i];
        emit({
          title:
            l === tails.length - 1
              ? "Extend or improve tail"
              : "Improve a shorter tail",
          message: `Set tails[${l}] = ${a[i]}. Tails length is the best increasing subsequence length seen so far.`,
          arrays: [row("Input", a, [i]), row("Smallest tails", tails, [l])],
          vars: { length: tails.length },
        });
      }
      return tails.length;
    },
  );
  register(
    "Partition Equal Subset Sum",
    { nums: [1, 5, 11, 5] },
    ({ nums }, emit) => {
      const a = positive(nums, "nums", 14),
        sum = a.reduce((s, x) => s + x, 0);
      if (sum > 100)
        throw Error("Use a total sum no greater than 100 in this visualizer.");
      if (sum % 2) {
        emit({
          title: "Odd total",
          message: `Total ${sum} cannot be divided into two equal integer sums.`,
          vars: { sum },
        });
        return false;
      }
      const target = sum / 2,
        dp = Array(target + 1).fill(false);
      dp[0] = true;
      emit({
        title: "Subset target",
        message: `Only need a subset adding to half the total: ${target}.`,
        arrays: [row("Numbers", a), row("Reachable sums", dp)],
        vars: { target },
      });
      for (let i = 0; i < a.length; i++)
        for (let x = target; x >= a[i]; x--) {
          const old = dp[x];
          dp[x] = dp[x] || dp[x - a[i]];
          emit({
            title: !old && dp[x] ? "Reach a new sum" : "Check include/exclude",
            message: `For value ${a[i]}, update sum ${x} from sum ${x - a[i]}. Scan backward to use this value once.`,
            arrays: [
              row("Numbers", a, [i]),
              row("Reachable sums", dp, [x], { predecessor: x - a[i] }),
            ],
            vars: { target },
          });
        }
      return dp[target];
    },
  );
  register(
    "Coin Change II",
    { amount: 5, coins: [1, 2, 5] },
    ({ amount, coins }, emit) => {
      amount = integer(amount, "amount", 0, 25);
      const a = positive(coins, "coins", 7);
      if (new Set(a).size !== a.length)
        throw Error("Use distinct coin denominations.");
      const dp = Array(amount + 1).fill(0);
      dp[0] = 1;
      emit({
        title: "One empty combination",
        message:
          "dp[0] = 1; process one denomination at a time to avoid counting reordered copies.",
        arrays: [row("Coins", a), row("Combination counts", dp)],
      });
      for (let j = 0; j < a.length; j++)
        for (let x = a[j]; x <= amount; x++) {
          dp[x] += dp[x - a[j]];
          emit({
            title: "Include current coin",
            message: `Using coin ${a[j]}, add dp[${x - a[j]}] to dp[${x}].`,
            arrays: [
              row("Coins", a, [j]),
              row("Combination counts", dp, [x], { predecessor: x - a[j] }),
            ],
            vars: { coin: a[j], amount: x },
          });
        }
      return dp[amount];
    },
  );
  register("Unique Paths", { m: 3, n: 7 }, ({ m, n }, emit) => {
    m = integer(m, "m", 1, 7);
    n = integer(n, "n", 1, 10);
    const dp = Array.from({ length: m }, () => Array(n).fill(0));
    dp[0][0] = 1;
    emit({
      title: "Starting cell",
      message: "There is one way to be at the top-left corner.",
      matrix: {
        label: "Ways to reach each cell",
        values: copy(dp),
        active: [[0, 0]],
      },
    });
    for (let r = 0; r < m; r++)
      for (let c = 0; c < n; c++) {
        if (r === 0 && c === 0) continue;
        dp[r][c] = (r ? dp[r - 1][c] : 0) + (c ? dp[r][c - 1] : 0);
        emit({
          title: "Add paths from above and left",
          message: `ways[${r}][${c}] = ${r ? dp[r - 1][c] : 0} + ${c ? dp[r][c - 1] : 0} = ${dp[r][c]}.`,
          matrix: {
            label: "Ways to reach each cell",
            values: copy(dp),
            active: [[r, c]],
            done: [
              [r - 1, c],
              [r, c - 1],
            ].filter(([y, x]) => y >= 0 && x >= 0),
          },
          vars: { row: r, column: c },
        });
      }
    return dp[m - 1][n - 1];
  });
  register("Jump Game", { nums: [2, 3, 1, 1, 4] }, ({ nums }, emit) => {
    const a = arr(nums, "nums");
    if (!a.length || a.some((v) => v < 0 || !Number.isInteger(v)))
      throw Error("Use a nonempty array of nonnegative jump lengths.");
    let far = 0;
    for (let i = 0; i < a.length; i++) {
      if (i > far) {
        emit({
          title: "Unreachable position",
          message: `Index ${i} lies beyond the farthest reachable index ${far}.`,
          arrays: [row("Jump lengths", a, [i], { farthest: far })],
        });
        return false;
      }
      let old = far;
      far = Math.max(far, i + a[i]);
      emit({
        title: "Extend reach",
        message: `Index ${i} can reach ${i + a[i]}; farthest becomes ${far}.`,
        arrays: [
          row("Jump lengths", a, [i], {
            scan: i,
            farthest: Math.min(far, a.length - 1),
          }),
        ],
        vars: { previousFarthest: old, farthest: far },
      });
      if (far >= a.length - 1) return true;
    }
    return true;
  });
  register("Jump Game II", { nums: [2, 3, 1, 1, 4] }, ({ nums }, emit) => {
    const a = arr(nums, "nums");
    if (!a.length || a.some((v) => v < 0 || !Number.isInteger(v)))
      throw Error("Use nonnegative jump lengths.");
    let end = 0,
      far = 0,
      jumps = 0;
    for (let i = 0; i < a.length - 1; i++) {
      if (i > far)
        throw Error("The final index is unreachable for this input.");
      far = Math.max(far, i + a[i]);
      emit({
        title: "Explore current jump layer",
        message: `Index ${i} extends next-layer reach to ${far}.`,
        arrays: [
          row("Jump lengths", a, [i], {
            scan: i,
            currentLayerEnd: end,
            nextReach: Math.min(far, a.length - 1),
          }),
        ],
        vars: { jumps },
      });
      if (i === end) {
        if (far === end)
          throw Error("The final index is unreachable for this input.");
        jumps++;
        end = far;
        emit({
          title: "Commit next jump",
          message: `All positions reachable in ${jumps - 1} jumps have been scanned. Commit jump ${jumps}, reaching through ${end}.`,
          arrays: [
            row("Jump lengths", a, [], {
              layerEnd: Math.min(end, a.length - 1),
            }),
          ],
          vars: { jumps, end },
        });
        if (end >= a.length - 1) break;
      }
    }
    return jumps;
  });
  register(
    "Minimum Cost to Cut a Stick",
    { n: 7, cuts: [1, 3, 4, 5] },
    ({ n, cuts }, emit) => {
      n = integer(n, "n", 1, 50);
      const cutsA = positive(cuts, "cuts", 7);
      if (new Set(cutsA).size !== cutsA.length || cutsA.some((c) => c >= n))
        throw Error("Cuts must be distinct and strictly inside the stick.");
      const p = [0, ...cutsA.sort((a, b) => a - b), n],
        N = p.length,
        dp = Array.from({ length: N }, () => Array(N).fill(0));
      emit({
        title: "Add stick endpoints",
        message:
          "The DP interval [i,j] represents the stick between positions p[i] and p[j].",
        arrays: [row("Positions", p)],
        matrix: { label: "Minimum interval costs", values: copy(dp) },
      });
      for (let len = 2; len < N; len++)
        for (let l = 0; l + len < N; l++) {
          let r = l + len;
          dp[l][r] = Infinity;
          for (let k = l + 1; k < r; k++) {
            const candidate = p[r] - p[l] + dp[l][k] + dp[k][r];
            dp[l][r] = Math.min(dp[l][r], candidate);
            emit({
              title: "Try first cut inside interval",
              message: `Cut at ${p[k]} first: segment length ${p[r] - p[l]} + left cost ${dp[l][k]} + right cost ${dp[k][r]}.`,
              arrays: [
                row("Positions", p, [l, k, r], { left: l, cut: k, right: r }),
              ],
              matrix: {
                label: "Minimum interval costs",
                values: dp.map((row) =>
                  row.map((v) => (Number.isFinite(v) ? v : "∞")),
                ),
                active: [[l, r]],
                done: [
                  [l, k],
                  [k, r],
                ],
              },
              vars: { candidate, best: dp[l][r] },
            });
          }
        }
      return dp[0][N - 1];
    },
  );
  register("Super Egg Drop", { k: 2, n: 6 }, ({ k, n }, emit) => {
    k = integer(k, "k", 1, 6);
    n = integer(n, "n", 0, 60);
    const reach = Array(k + 1).fill(0);
    let moves = 0;
    emit({
      title: "No moves, no floors",
      message:
        "reach[e] counts how many floors can be resolved using e eggs and the current number of moves.",
      arrays: [row("Reachable floors by egg count", reach)],
    });
    while (reach[k] < n) {
      moves++;
      for (let e = k; e >= 1; e--) {
        const broken = reach[e - 1],
          survives = reach[e];
        reach[e] = broken + 1 + survives;
        emit({
          title: "Cover both drop outcomes",
          message: `With ${e} eggs and ${moves} moves: ${broken} floors if it breaks + 1 tested floor + ${survives} if it survives.`,
          arrays: [
            row("Reachable floors by egg count", reach, [e], {
              oneLessEgg: e - 1,
            }),
          ],
          vars: { moves, eggs: e, targetFloors: n },
        });
      }
    }
    return moves;
  });

  function graphData(n, edges, directed = false) {
    const adj = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) {
      if (
        !Number.isInteger(u) ||
        !Number.isInteger(v) ||
        u < 0 ||
        v < 0 ||
        u >= n ||
        v >= n
      )
        throw Error("Edge endpoints must be valid vertex indices.");
      adj[u].push([v, w]);
      if (!directed) adj[v].push([u, w]);
    }
    return adj;
  }
  function diagram(
    n,
    edges,
    active = [],
    done = [],
    chosen = [],
    directed = false,
  ) {
    return {
      nodes: Array.from({ length: n }, (_, i) => ({
        id: String(i),
        label: String(i),
        x: 300 + 190 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
        y: 155 + 115 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
        state: active.includes(i)
          ? "active"
          : done.includes(i)
            ? "done"
            : "muted",
      })),
      edges: edges.map(([u, v, w]) => ({
        from: String(u),
        to: String(v),
        label: w === undefined ? "" : String(w),
        directed,
        state: chosen.some(
          ([a, b]) => (a === u && b === v) || (a === v && b === u),
        )
          ? "done"
          : active.includes(u) && active.includes(v)
            ? "active"
            : undefined,
      })),
    };
  }
  function adjacencyInput(v, name = "adjacency") {
    if (!Array.isArray(v) || v.length > 10 || v.some((a) => !Array.isArray(a)))
      throw Error(
        `${name} must be an adjacency list with at most 10 vertices.`,
      );
    v.forEach((a) =>
      a.forEach((x) => {
        if (!Number.isInteger(x) || x < 0 || x >= v.length)
          throw Error("Every neighbor must be a valid vertex index.");
      }),
    );
    return copy(v);
  }
  register(
    "Clone Graph",
    {
      adjacency: [
        [2, 4],
        [1, 3],
        [2, 4],
        [1, 3],
      ],
    },
    ({ adjacency }, emit) => {
      if (
        !Array.isArray(adjacency) ||
        adjacency.length > 8 ||
        adjacency.some(
          (x) =>
            !Array.isArray(x) ||
            x.some(
              (v) => !Number.isInteger(v) || v < 1 || v > adjacency.length,
            ),
        )
      )
        throw Error(
          "Use a 1-indexed adjacency list of at most 8 vertices, as in the source example.",
        );
      if (!adjacency.length) return [];
      const n = adjacency.length,
        edges = [];
      adjacency.forEach((a, u) =>
        a.forEach((v) => {
          if (u < v - 1) edges.push([u, v - 1]);
        }),
      );
      const clones = new Map(),
        q = [0];
      clones.set(0, []);
      let built = [];
      function visual(active) {
        return {
          nodes: [
            ...Array.from({ length: n }, (_, i) => ({
              id: "o" + i,
              label: "original " + (i + 1),
              x: 110 + 100 * (i % 2),
              y: 55 + 90 * Math.floor(i / 2),
              state: active === i ? "active" : "muted",
            })),
            ...Array.from(clones.keys(), (i) => ({
              id: "c" + i,
              label: "clone " + (i + 1),
              x: 410 + 100 * (i % 2),
              y: 55 + 90 * Math.floor(i / 2),
              state: active === i ? "active" : "done",
            })),
          ],
          edges: [
            ...edges.map(([u, v]) => ({
              from: "o" + u,
              to: "o" + v,
              directed: false,
            })),
            ...built.map(([u, v]) => ({
              from: "c" + u,
              to: "c" + v,
              directed: false,
              state: "done",
            })),
          ],
        };
      }
      emit({
        title: "Create the first clone",
        message:
          "Map the original source node to a new object before following neighbors, preventing infinite recursion around cycles.",
        ...visual(0),
        vars: { mapping: ["original 1 → new clone 1"] },
      });
      for (let h = 0; h < q.length; h++) {
        const u = q[h];
        for (const label of adjacency[u]) {
          const v = label - 1;
          if (!clones.has(v)) {
            clones.set(v, []);
            q.push(v);
            emit({
              title: "Create neighbor clone",
              message: `Allocate a separate clone for original node ${label}.`,
              ...visual(v),
              arrays: [
                row(
                  "BFS queue",
                  q.slice(h + 1).map((x) => x + 1),
                ),
              ],
            });
          }
          clones.get(u).push(v + 1);
          built.push([u, v]);
          emit({
            title: "Connect cloned nodes",
            message: `Add a reference from clone ${u + 1} to clone ${v + 1}; never reference an original node.`,
            ...visual(u),
            vars: { original: u + 1, clonedNeighbors: clones.get(u).slice() },
          });
        }
      }
      return Array.from({ length: n }, (_, i) => clones.get(i) ?? []);
    },
  );
  register(
    "Find if Path Exists in Graph",
    {
      n: 3,
      edges: [
        [0, 1],
        [1, 2],
      ],
      source: 0,
      destination: 2,
    },
    ({ n, edges, source, destination }, emit) => {
      n = integer(n, "n", 1, 10);
      const e = tuples(edges, "edges", 2, 20),
        adj = graphData(n, e);
      source = integer(source, "source", 0, n - 1);
      destination = integer(destination, "destination", 0, n - 1);
      const q = [source],
        seen = new Set([source]),
        parent = {};
      emit({
        title: "Discover source",
        message:
          "Mark the source before enqueuing it, so it will be explored once.",
        ...diagram(n, e, [source], [...seen]),
        arrays: [row("Queue", q)],
      });
      for (let h = 0; h < q.length; h++) {
        let u = q[h];
        emit({
          title: "Dequeue vertex",
          message: `Explore neighbors of ${u}.`,
          ...diagram(n, e, [u], [...seen]),
          arrays: [row("Queue", q.slice(h + 1))],
        });
        if (u === destination) {
          const path = [];
          for (let x = u; x !== undefined; x = parent[x]) path.unshift(x);
          emit({
            title: "Path found",
            message: `A path reaches ${destination}.`,
            ...diagram(
              n,
              e,
              path,
              [...seen],
              path.slice(1).map((x, i) => [path[i], x]),
            ),
            output: path,
          });
          return true;
        }
        for (let [v] of adj[u])
          if (!seen.has(v)) {
            seen.add(v);
            parent[v] = u;
            q.push(v);
            emit({
              title: "Discover neighbor",
              message: `Mark ${v} and enqueue it. Parent[${v}] = ${u}.`,
              ...diagram(n, e, [u, v], [...seen], [[u, v]]),
              arrays: [row("Queue", q.slice(h + 1))],
            });
          }
      }
      return false;
    },
  );
  register(
    "All Paths From Source to Target",
    { graph: [[1, 2], [3], [3], []] },
    ({ graph }, emit) => {
      const g = adjacencyInput(graph, "graph"),
        n = g.length;
      if (!n) return [];
      const e = g.flatMap((a, u) => a.map((v) => [u, v])),
        path = [0],
        out = [],
        on = new Set([0]);
      function dfs(u) {
        emit({
          title: "Explore path prefix",
          message: `Current path ends at ${u}.`,
          ...diagram(
            n,
            e,
            [u],
            path,
            path.slice(1).map((x, i) => [path[i], x]),
            true,
          ),
          arrays: [row("Path", path)],
        });
        if (u === n - 1) {
          out.push(path.slice());
          emit({
            title: "Save source-to-target path",
            message: "The last vertex is reached; save this path.",
            arrays: [row("Path", path)],
            output: copy(out),
          });
          return;
        }
        for (let v of g[u]) {
          if (on.has(v))
            throw Error("This problem requires a directed acyclic graph.");
          path.push(v);
          on.add(v);
          dfs(v);
          on.delete(v);
          path.pop();
          emit({
            title: "Backtrack to parent",
            message: `Undo edge ${u} → ${v} and try the next neighbor.`,
            ...diagram(n, e, [u], path, [], true),
            arrays: [row("Path", path)],
          });
        }
      }
      dfs(0);
      return out;
    },
  );
  register(
    "Reconstruct Itinerary",
    {
      tickets: [
        ["JFK", "SFO"],
        ["SFO", "ATL"],
      ],
    },
    ({ tickets }, emit) => {
      if (
        !Array.isArray(tickets) ||
        tickets.length > 12 ||
        tickets.some(
          (t) =>
            !Array.isArray(t) ||
            t.length !== 2 ||
            t.some((x) => typeof x !== "string" || x.length > 5),
        )
      )
        throw Error("Use at most 12 [from, to] airport-string tickets.");
      const adj = {},
        airports = [...new Set(tickets.flat())].sort();
      if (!airports.includes("JFK") && tickets.length)
        throw Error("The itinerary must begin at JFK.");
      for (let [u, v] of tickets) (adj[u] ??= []).push(v);
      for (let a of Object.values(adj)) a.sort().reverse();
      const stack = ["JFK"],
        route = [],
        used = [];
      const viz = () => ({
        nodes: airports.map((a, i) => ({
          id: a,
          label: a,
          x: 300 + 180 * Math.cos((i * 2 * Math.PI) / airports.length),
          y: 155 + 100 * Math.sin((i * 2 * Math.PI) / airports.length),
          state: stack.at(-1) === a ? "active" : "muted",
        })),
        edges: tickets.map(([u, v]) => ({
          from: u,
          to: v,
          state: used.some(([a, b]) => a === u && b === v) ? "done" : undefined,
        })),
      });
      while (stack.length) {
        let u = stack.at(-1);
        if (adj[u]?.length) {
          const v = adj[u].pop();
          used.push([u, v]);
          stack.push(v);
          emit({
            title: "Use lexical next ticket",
            message: `Consume ${u} → ${v} and continue the Eulerian walk.`,
            ...viz(),
            arrays: [
              row("Traversal stack", stack),
              row("Reverse itinerary", route),
            ],
          });
        } else {
          route.push(stack.pop());
          emit({
            title: "Finish dead-end airport",
            message: `No unused departure remains at ${u}. Append it to the reversed route.`,
            ...viz(),
            arrays: [
              row("Traversal stack", stack),
              row("Reverse itinerary", route),
            ],
          });
        }
      }
      const result = route.reverse();
      const bag = new Map();
      for (const t of tickets) {
        const k = t.join("|");
        bag.set(k, (bag.get(k) || 0) + 1);
      }
      for (let i = 1; i < result.length; i++) {
        const k = [result[i - 1], result[i]].join("|");
        if (!(bag.get(k) > 0))
          throw Error("Tickets do not form one valid itinerary from JFK.");
        bag.set(k, bag.get(k) - 1);
      }
      if (result.length !== tickets.length + 1)
        throw Error("All tickets must be reachable in one itinerary from JFK.");
      return result;
    },
  );
  register(
    "Detect Cycle in Undirected Connected Graph",
    {
      n: 3,
      edges: [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
    },
    ({ n, edges }, emit) => {
      n = integer(n, "n", 1, 10);
      const e = tuples(edges, "edges", 2, 20),
        adj = graphData(n, e),
        seen = new Set(),
        tree = [];
      function dfs(u, parent) {
        seen.add(u);
        emit({
          title: "Enter DFS vertex",
          message: `Visit ${u}; its parent is ${parent === -1 ? "none" : parent}.`,
          ...diagram(n, e, [u], [...seen], tree),
          vars: { vertex: u, parent },
        });
        for (let [v] of adj[u]) {
          if (v === parent) {
            emit({
              title: "Ignore reverse tree edge",
              message: `${u} → ${v} returns directly to the parent, so it is not a cycle.`,
              ...diagram(n, e, [u, v], [...seen], tree),
            });
            continue;
          }
          if (seen.has(v)) {
            emit({
              title: "Cycle detected",
              message: `${v} is visited and is not the parent of ${u}. The extra edge closes a cycle.`,
              ...diagram(n, e, [u, v], [...seen], [...tree, [u, v]]),
            });
            return true;
          }
          tree.push([u, v]);
          if (dfs(v, u)) return true;
        }
        return false;
      }
      for (let u = 0; u < n; u++) if (!seen.has(u) && dfs(u, -1)) return true;
      return false;
    },
  );
  register(
    "Topological Sort (DFS)",
    { adjacency: [[1, 2], [3], [3], []] },
    ({ adjacency }, emit) => {
      const g = adjacencyInput(adjacency),
        n = g.length,
        e = g.flatMap((a, u) => a.map((v) => [u, v])),
        state = Array(n).fill(0),
        post = [],
        stack = [];
      function dfs(u) {
        if (state[u] === 1)
          throw Error(
            "A directed cycle exists; no topological ordering is possible.",
          );
        if (state[u] === 2) return;
        state[u] = 1;
        stack.push(u);
        emit({
          title: "Enter vertex",
          message: `Visit ${u}. Finish every outgoing dependency before placing it.`,
          ...diagram(
            n,
            e,
            [u],
            state.map((x, i) => (x === 2 ? i : -1)).filter((i) => i >= 0),
            [],
            true,
          ),
          arrays: [row("DFS stack", stack), row("Postorder", post)],
        });
        for (let v of g[u]) dfs(v);
        stack.pop();
        state[u] = 2;
        post.push(u);
        emit({
          title: "Finish vertex",
          message: `All outgoing neighbors of ${u} are complete; append ${u} to postorder.`,
          ...diagram(n, e, [], post, [], true),
          arrays: [row("DFS stack", stack), row("Postorder", post)],
        });
      }
      for (let i = 0; i < n; i++) dfs(i);
      emit({
        title: "Reverse postorder",
        message:
          "Reversing finish order puts every source before its outgoing destinations.",
        arrays: [
          row("Postorder", post),
          row("Topological order", post.slice().reverse()),
        ],
      });
      return post.reverse();
    },
  );
  register(
    "Number of Operations to Make Network Connected",
    {
      n: 4,
      connections: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
    },
    ({ n, connections }, emit) => {
      n = integer(n, "n", 1, 10);
      const e = tuples(connections, "connections", 2, 20);
      graphData(n, e);
      const p = Array.from({ length: n }, (_, i) => i),
        size = Array(n).fill(1);
      let components = n,
        spare = 0;
      function find(x) {
        while (p[x] !== x) x = p[x];
        return x;
      }
      for (let [u, v] of e) {
        let a = find(u),
          b = find(v);
        if (a === b) spare++;
        else {
          if (size[a] < size[b]) [a, b] = [b, a];
          p[b] = a;
          size[a] += size[b];
          components--;
        }
        emit({
          title: a === b ? "Redundant cable" : "Join components",
          message:
            a === b
              ? `Cable ${u}–${v} is spare because both endpoints are already connected.`
              : `Cable ${u}–${v} merges two distinct components.`,
          ...diagram(n, e, [u, v], []),
          arrays: [row("DSU parent", p), row("Component sizes", size)],
          vars: { components, spare, needed: components - 1 },
        });
      }
      return spare >= components - 1 ? components - 1 : -1;
    },
  );
  register(
    "Cheapest Flights Within K Stops",
    {
      n: 3,
      flights: [
        [0, 1, 100],
        [1, 2, 100],
        [0, 2, 500],
      ],
      src: 0,
      dst: 2,
      k: 1,
    },
    ({ n, flights, src, dst, k }, emit) => {
      n = integer(n, "n", 1, 10);
      const e = tuples(flights, "flights", 3, 20);
      if (e.some((x) => x[2] < 0))
        throw Error("Flight prices must be nonnegative.");
      graphData(n, e, true);
      src = integer(src, "src", 0, n - 1);
      dst = integer(dst, "dst", 0, n - 1);
      k = integer(k, "k", 0, 6);
      let dist = Array(n).fill(Infinity);
      dist[src] = 0;
      for (let round = 0; round <= k; round++) {
        const next = dist.slice();
        emit({
          title: "Freeze previous round",
          message: `Round ${round + 1}: read only distances using at most ${round} flights. This prevents taking multiple new edges in one round.`,
          ...diagram(n, e, [src], [], [], true),
          arrays: [
            row(
              "Previous distances",
              dist.map((x) => (Number.isFinite(x) ? x : "∞")),
            ),
          ],
          vars: { maximumFlights: round + 1 },
        });
        for (let [u, v, w] of e) {
          const candidate = dist[u] + w,
            better = candidate < next[v];
          if (better) next[v] = candidate;
          emit({
            title: better ? "Relax flight" : "Keep cheaper cost",
            message: `Try ${u} → ${v} for ${w}: candidate ${Number.isFinite(candidate) ? candidate : "unreachable"}.`,
            ...diagram(n, e, [u, v], [], better ? [[u, v]] : [], true),
            arrays: [
              row(
                "Previous distances",
                dist.map((x) => (Number.isFinite(x) ? x : "∞")),
                [u],
              ),
              row(
                "Next distances",
                next.map((x) => (Number.isFinite(x) ? x : "∞")),
                [v],
              ),
            ],
            vars: { round: round + 1 },
          });
        }
        dist = next;
      }
      return Number.isFinite(dist[dst]) ? dist[dst] : -1;
    },
  );
  register(
    "Number of Ways to Arrive at Destination",
    {
      n: 4,
      roads: [
        [0, 1, 1],
        [1, 3, 1],
        [0, 2, 1],
        [2, 3, 1],
      ],
    },
    ({ n, roads }, emit) => {
      n = integer(n, "n", 1, 10);
      const e = tuples(roads, "roads", 3, 24);
      if (e.some((x) => x[2] <= 0))
        throw Error("Road times must be strictly positive.");
      const adj = graphData(n, e),
        dist = Array(n).fill(Infinity),
        ways = Array(n).fill(0),
        done = Array(n).fill(false),
        MOD = 1000000007;
      dist[0] = 0;
      ways[0] = 1;
      for (let step = 0; step < n; step++) {
        let u = -1;
        for (let i = 0; i < n; i++)
          if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
        if (u === -1 || !Number.isFinite(dist[u])) break;
        done[u] = true;
        emit({
          title: "Settle shortest distance",
          message: `Vertex ${u} has the smallest unsettled distance ${dist[u]}.`,
          ...diagram(
            n,
            e,
            [u],
            done.map((x, i) => (x ? i : -1)).filter((i) => i >= 0),
          ),
          arrays: [
            row(
              "Distance",
              dist.map((x) => (Number.isFinite(x) ? x : "∞")),
              [u],
            ),
            row("Shortest-path counts", ways, [u]),
          ],
        });
        for (let [v, w] of adj[u]) {
          let candidate = dist[u] + w,
            mode = "No improvement";
          if (candidate < dist[v]) {
            dist[v] = candidate;
            ways[v] = ways[u];
            mode = "New shorter route";
          } else if (candidate === dist[v]) {
            ways[v] = (ways[v] + ways[u]) % MOD;
            mode = "Another equally short route";
          }
          emit({
            title: mode,
            message: `Edge ${u}–${v}: candidate time ${candidate}. ${mode === "New shorter route" ? "Replace the distance and copy the predecessor count." : mode === "Another equally short route" ? "Add the predecessor path count." : "Keep the existing distance and count."}`,
            ...diagram(n, e, [u, v], [], [[u, v]]),
            arrays: [
              row(
                "Distance",
                dist.map((x) => (Number.isFinite(x) ? x : "∞")),
                [v],
              ),
              row("Shortest-path counts", ways, [v]),
            ],
            vars: { from: u, to: v, edgeTime: w },
          });
        }
      }
      return ways[n - 1];
    },
  );
  register(
    "Min Cost to Connect All Points",
    {
      points: [
        [0, 0],
        [2, 2],
        [3, 10],
        [5, 2],
        [7, 0],
      ],
    },
    ({ points }, emit) => {
      const a = tuples(points, "points", 2, 10),
        n = a.length;
      if (!n) return 0;
      const best = Array(n).fill(Infinity),
        used = Array(n).fill(false),
        parent = Array(n).fill(-1),
        edges = [];
      best[0] = 0;
      let total = 0;
      const minX = Math.min(...a.map((x) => x[0])),
        maxX = Math.max(...a.map((x) => x[0])),
        minY = Math.min(...a.map((x) => x[1])),
        maxY = Math.max(...a.map((x) => x[1]));
      function viz(active) {
        return {
          nodes: a.map(([x, y], i) => ({
            id: String(i),
            label: `${i}:(${x},${y})`,
            x: 65 + ((x - minX) / Math.max(1, maxX - minX)) * 490,
            y: 260 - ((y - minY) / Math.max(1, maxY - minY)) * 210,
            state: i === active ? "active" : used[i] ? "done" : "muted",
          })),
          edges: edges.map(([u, v, w]) => ({
            from: String(u),
            to: String(v),
            label: String(w),
            directed: false,
            state: "done",
          })),
        };
      }
      for (let step = 0; step < n; step++) {
        let u = -1;
        for (let i = 0; i < n; i++)
          if (!used[i] && (u === -1 || best[i] < best[u])) u = i;
        used[u] = true;
        total += best[u];
        if (parent[u] !== -1) edges.push([parent[u], u, best[u]]);
        emit({
          title: "Add cheapest frontier connection",
          message:
            parent[u] === -1
              ? "Start the minimum spanning tree at point 0."
              : `Connect point ${u} to point ${parent[u]} for Manhattan cost ${best[u]}.`,
          ...viz(u),
          arrays: [
            row(
              "Cheapest connection to tree",
              best.map((x) => (Number.isFinite(x) ? x : "∞")),
              [u],
            ),
          ],
          vars: { total, connected: step + 1 },
        });
        for (let v = 0; v < n; v++)
          if (!used[v]) {
            let d = Math.abs(a[u][0] - a[v][0]) + Math.abs(a[u][1] - a[v][1]);
            if (d < best[v]) {
              best[v] = d;
              parent[v] = u;
              emit({
                title: "Improve frontier edge",
                message: `Point ${u} offers point ${v} a cheaper connection of ${d}.`,
                ...viz(v),
                arrays: [
                  row(
                    "Cheapest connection to tree",
                    best.map((x) => (Number.isFinite(x) ? x : "∞")),
                    [v],
                  ),
                  row("Best parent", parent, [v]),
                ],
                vars: { total },
              });
            }
          }
      }
      return total;
    },
  );
})();
