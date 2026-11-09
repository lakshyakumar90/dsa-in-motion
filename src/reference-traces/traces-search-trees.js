/* Exact algorithm traces for binary search, windows, trees, BSTs, and heaps. */
(() => {
  const R = globalThis.PROBLEM_TRACES;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function nums(value, name = "nums", min = 1) {
    if (
      !Array.isArray(value) ||
      value.length < min ||
      value.length > 30 ||
      value.some((x) => !Number.isFinite(x))
    )
      throw Error(`${name} must contain ${min}–30 finite numbers.`);
    return value.slice();
  }
  function integer(value, name, min = -100000, max = 100000) {
    if (!Number.isInteger(value) || value < min || value > max)
      throw Error(`${name} must be an integer between ${min} and ${max}.`);
    return value;
  }
  function str(value, name = "s") {
    if (typeof value !== "string" || value.length > 40)
      throw Error(`${name} must be a string of at most 40 characters.`);
    return value;
  }
  function sorted(a) {
    if (a.some((v, i) => i && v < a[i - 1]))
      throw Error("nums must be sorted in ascending order.");
    return a;
  }
  function nonnegative(a) {
    if (a.some((v) => v < 0)) throw Error("Heights must be nonnegative.");
    return a;
  }
  function reg(name, input, algorithm) {
    R[name] = {
      input,
      run(input, emit) {
        let last = {},
          count = 0;
        const step = (frame) => {
          last = frame;
          count++;
          emit(frame);
        };
        let initial = {
          arrays: Object.entries(input)
            .filter(
              ([k, v]) =>
                (Array.isArray(v) && !v.some(Array.isArray)) ||
                typeof v === "string",
            )
            .map(([k, v]) => array(k, typeof v === "string" ? [...v] : v)),
        };
        if (Array.isArray(input.tree)) initial = treeFrame(tree(input.tree));
        if (Array.isArray(input.matrix))
          initial = { matrix: { label: "matrix", values: input.matrix } };
        step({
          title: "Read the input",
          message: `Run the exact ${name} algorithm on this example.`,
          ...initial,
          vars: Object.fromEntries(
            Object.entries(input).filter(
              ([, v]) => !Array.isArray(v) && typeof v !== "object",
            ),
          ),
        });
        const answer = algorithm(input, step);
        step({
          ...last,
          title: "Result",
          message: `The algorithm is complete. ${name} returns ${JSON.stringify(answer)}.`,
          output: answer,
        });
        return answer;
      },
    };
  }
  const array = (label, values, active = [], pointers = {}, done = []) => ({
    label,
    values: [...values],
    active,
    pointers,
    done,
  });
  function arrStep(
    e,
    a,
    message,
    vars = {},
    active = [],
    pointers = {},
    extra = {},
  ) {
    e({
      title: "Inspect and update",
      message,
      arrays: [array("nums", a, active, pointers)],
      vars,
      ...extra,
    });
  }
  function bounds(e, a, lo, hi, mid, message, vars = {}) {
    arrStep(e, a, message, { lo, hi, mid, ...vars }, mid >= 0 ? [mid] : [], {
      lo,
      mid,
      hi,
    });
  }
  reg("Square Root of X", { x: 26 }, ({ x }, e) => {
    integer(x, "x", 0, 10000);
    let lo = 0,
      hi = x,
      answer = 0;
    while (lo <= hi) {
      const mid = lo + Math.floor((hi - lo) / 2),
        square = mid * mid;
      e({
        title: "Test the midpoint",
        message: `${mid}² = ${square}. ${mid === 0 || mid <= Math.floor(x / mid) ? "This fits; remember it and try a larger root." : "This is too large; search smaller roots."}`,
        arrays: [
          array("candidate root", [lo, mid, hi], [1], { lo: 0, mid: 1, hi: 2 }),
        ],
        vars: { lo, hi, mid, square, answer, x },
      });
      if (mid === 0 || mid <= Math.floor(x / mid)) {
        answer = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return answer;
  });
  reg("Guess Higher or Lower", { n: 20, secret: 14 }, ({ n, secret }, e) => {
    integer(n, "n", 1, 50);
    integer(secret, "secret", 1, n);
    let lo = 1,
      hi = n;
    const a = Array.from({ length: n }, (_, i) => i + 1);
    while (lo <= hi) {
      const m = Math.floor((lo + hi) / 2);
      bounds(
        e,
        a,
        lo - 1,
        hi - 1,
        m - 1,
        m === secret
          ? "The guess matches the secret."
          : m < secret
            ? "The oracle says higher. Discard the lower half."
            : "The oracle says lower. Discard the upper half.",
        {
          guess: m,
          feedback: m === secret ? "correct" : m < secret ? "higher" : "lower",
        },
      );
      if (m === secret) return m;
      if (m < secret) lo = m + 1;
      else hi = m - 1;
    }
  });
  reg(
    "Search in Rotated Sorted Array",
    { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
    ({ nums: input, target }, e) => {
      const a = nums(input);
      integer(target, "target");
      if (
        new Set(a).size !== a.length ||
        a.filter((v, i) => i && v < a[i - 1]).length > 1 ||
        (a.some((v, i) => i && v < a[i - 1]) && a.at(-1) > a[0])
      )
        throw Error("Use a rotated ascending array with distinct values.");
      let lo = 0,
        hi = a.length - 1;
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        bounds(
          e,
          a,
          lo,
          hi,
          m,
          `Compare nums[${m}] = ${a[m]} with ${target}.`,
          { target },
        );
        if (a[m] === target) return m;
        if (a[lo] <= a[m]) {
          const left = a[lo] <= target && target < a[m];
          bounds(
            e,
            a,
            lo,
            hi,
            m,
            `The left half is sorted. Target ${left ? "lies inside it" : "is outside it"}.`,
            { target },
          );
          if (left) hi = m - 1;
          else lo = m + 1;
        } else {
          const right = a[m] < target && target <= a[hi];
          bounds(
            e,
            a,
            lo,
            hi,
            m,
            `The right half is sorted. Target ${right ? "lies inside it" : "is outside it"}.`,
            { target },
          );
          if (right) lo = m + 1;
          else hi = m - 1;
        }
      }
      return -1;
    },
  );
  reg("First Bad Version", { n: 12, firstBad: 8 }, ({ n, firstBad }, e) => {
    integer(n, "n", 1, 30);
    integer(firstBad, "firstBad", 1, n);
    const a = Array.from({ length: n }, (_, i) =>
      i + 1 >= firstBad ? "bad" : "good",
    );
    let lo = 1,
      hi = n;
    while (lo < hi) {
      const m = (lo + hi) >> 1,
        bad = m >= firstBad;
      bounds(
        e,
        a,
        lo - 1,
        hi - 1,
        m - 1,
        `Version ${m} is ${bad ? "bad: keep it as a possible first bad version and search left" : "good: every earlier version is good too"}.`,
        { version: m, isBad: bad },
      );
      if (bad) hi = m;
      else lo = m + 1;
    }
    bounds(e, a, lo - 1, lo - 1, lo - 1, `The first bad version is ${lo}.`);
    return lo;
  });
  function peakRun(input, e, mountain) {
    const a = nums(input);
    if (a.some((v, i) => i && v === a[i - 1]))
      throw Error("Adjacent values must be different.");
    if (
      mountain &&
      (a.length < 3 ||
        a[0] >= a[1] ||
        a.at(-1) >= a.at(-2) ||
        a.slice(1).filter((v, i) => v < a[i]).length === 0)
    )
      throw Error(
        "Use a mountain array that strictly rises then strictly falls.",
      );
    let lo = 0,
      hi = a.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      bounds(
        e,
        a,
        lo,
        hi,
        m,
        `${a[m]} ${a[m] < a[m + 1] ? "<" : ">"} ${a[m + 1]}: ${a[m] < a[m + 1] ? "the slope rises, so a peak lies to the right" : "the slope falls, so keep mid and search left"}.`,
        { next: a[m + 1] },
      );
      if (a[m] < a[m + 1]) lo = m + 1;
      else hi = m;
    }
    bounds(e, a, lo, hi, lo, `Peak found at index ${lo}.`);
    return lo;
  }
  reg("Find Peak Element", { nums: [1, 2, 1, 3, 5, 6, 4] }, ({ nums }, e) =>
    peakRun(nums, e, false),
  );
  reg(
    "Find Peak in a Mountain Array",
    { nums: [1, 3, 6, 9, 7, 4, 2] },
    ({ nums }, e) => {
      let a = nums;
      let falling = false;
      for (let i = 1; i < a.length; i++) {
        if (a[i] < a[i - 1]) falling = true;
        else if (falling)
          throw Error("The mountain must rise once and fall once.");
      }
      return peakRun(a, e, true);
    },
  );
  reg(
    "Find Minimum in Rotated Sorted Array",
    { nums: [4, 5, 6, 7, 0, 1, 2] },
    ({ nums: input }, e) => {
      const a = nums(input);
      if (
        new Set(a).size !== a.length ||
        a.filter((v, i) => i && v < a[i - 1]).length > 1 ||
        (a.some((v, i) => i && v < a[i - 1]) && a.at(-1) > a[0])
      )
        throw Error("Use a rotated ascending array with distinct values.");
      let lo = 0,
        hi = a.length - 1;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        bounds(
          e,
          a,
          lo,
          hi,
          m,
          a[m] > a[hi]
            ? `${a[m]} > right boundary ${a[hi]}; the minimum is strictly after mid.`
            : `${a[m]} < right boundary ${a[hi]}; mid may be the minimum, so keep it.`,
        );
        if (a[m] > a[hi]) lo = m + 1;
        else hi = m;
      }
      bounds(e, a, lo, hi, lo, `Minimum ${a[lo]} at index ${lo}.`);
      return a[lo];
    },
  );
  reg(
    "Find First & Last Position in Sorted Array",
    { nums: [5, 7, 7, 8, 8, 10], target: 8 },
    ({ nums: input, target }, e) => {
      const a = sorted(nums(input, "nums", 0));
      integer(target, "target");
      function bound(strict) {
        let lo = 0,
          hi = a.length;
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2),
            moveRight = a[mid] < target || (strict && a[mid] === target);
          bounds(
            e,
            a,
            lo,
            hi,
            mid,
            `${strict ? "Upper bound: first value greater than target" : "Lower bound: first value at least target"}. Use half-open [lo, hi). ${moveRight ? "Move lo after mid." : "Keep mid as a candidate and move hi to mid."}`,
            { target, strict, halfOpen: true },
          );
          if (moveRight) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      }
      const first = bound(false);
      if (first === a.length || a[first] !== target) {
        arrStep(
          e,
          a,
          "The lower bound does not point to target; no occurrences exist.",
          { target, lowerBound: first },
        );
        return [-1, -1];
      }
      const after = bound(true);
      arrStep(
        e,
        a,
        `The matching interval is [${first}, ${after}); its last included index is ${after - 1}.`,
        { first, after },
        Array.from({ length: after - first }, (_, j) => first + j),
        { first, last: after - 1 },
      );
      return [first, after - 1];
    },
  );
  reg(
    "Single Element in a Sorted Array",
    { nums: [1, 1, 2, 3, 3, 4, 4, 8, 8] },
    ({ nums: input }, e) => {
      const a = sorted(nums(input));
      const counts = new Map();
      a.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
      if (
        [...counts.values()].filter((c) => c === 1).length !== 1 ||
        [...counts.values()].some((c) => c !== 1 && c !== 2)
      )
        throw Error(
          "Exactly one value must appear once; every other value must appear twice.",
        );
      let lo = 0,
        hi = a.length - 1;
      while (lo < hi) {
        let m = (lo + hi) >> 1;
        if (m % 2) m--;
        bounds(
          e,
          a,
          lo,
          hi,
          m,
          `Use even pair start ${m}. ${a[m] === a[m + 1] ? "The pair is intact: the single value is after it." : "The pairing is broken: the single value is at or before mid."}`,
          { pair: [a[m], a[m + 1]] },
        );
        if (a[m] === a[m + 1]) lo = m + 2;
        else hi = m;
      }
      bounds(e, a, lo, hi, lo, `The unpaired value is ${a[lo]}.`);
      return a[lo];
    },
  );
  reg(
    "Find k Closest Elements",
    { nums: [1, 2, 3, 4, 5], k: 4, x: 3 },
    ({ nums: input, k, x }, e) => {
      const a = sorted(nums(input));
      integer(k, "k", 1, a.length);
      integer(x, "x");
      let lo = 0,
        hi = a.length - k;
      while (lo < hi) {
        const m = (lo + hi) >> 1,
          leftDistance = x - a[m],
          rightDistance = a[m + k] - x;
        bounds(
          e,
          a,
          lo,
          hi,
          m,
          `Compare leaving ${a[m]} versus entering ${a[m + k]}. ${leftDistance > rightDistance ? "Shift the candidate start right." : "Keep the earlier start, including ties."}`,
          { k, x, leftDistance, rightDistance },
        );
        if (leftDistance > rightDistance) lo = m + 1;
        else hi = m;
      }
      arrStep(
        e,
        a,
        `Closest window is indices ${lo} through ${lo + k - 1}.`,
        { x, k },
        Array.from({ length: k }, (_, j) => lo + j),
        { start: lo, end: lo + k - 1 },
      );
      return a.slice(lo, lo + k);
    },
  );
  reg(
    "Two Sum",
    { nums: [2, 7, 11, 15], target: 9 },
    ({ nums: input, target }, e) => {
      const a = nums(input);
      integer(target, "target");
      const seen = new Map();
      for (let i = 0; i < a.length; i++) {
        const need = target - a[i];
        arrStep(
          e,
          a,
          `At index ${i}, look for complement ${need} among previously seen values.`,
          { target, need, seen: [...seen].map(([v, j]) => `${v}→${j}`) },
          [i],
          { i },
        );
        if (seen.has(need)) {
          arrStep(
            e,
            a,
            `${need} + ${a[i]} = ${target}. Return the two indices.`,
            { target },
            [seen.get(need), i],
          );
          return [seen.get(need), i];
        }
        seen.set(a[i], i);
        arrStep(
          e,
          a,
          `Store ${a[i]} → ${i} for later values.`,
          { seen: [...seen].map(([v, j]) => `${v}→${j}`) },
          [i],
        );
      }
      return [];
    },
  );
  reg(
    "Two Sum II",
    { nums: [2, 7, 11, 15], target: 9 },
    ({ nums: input, target }, e) => {
      const a = sorted(nums(input));
      integer(target, "target");
      let l = 0,
        r = a.length - 1;
      while (l < r) {
        const sum = a[l] + a[r];
        arrStep(
          e,
          a,
          `${a[l]} + ${a[r]} = ${sum}. ${sum === target ? "Found: return one-based indices." : sum < target ? "Too small: advance left." : "Too large: decrease right."}`,
          { sum, target },
          [l, r],
          { left: l, right: r },
        );
        if (sum === target) return [l + 1, r + 1];
        if (sum < target) l++;
        else r--;
      }
      return [];
    },
  );
  reg("Is Subsequence", { s: "abc", t: "ahbgdc" }, ({ s, t }, e) => {
    str(s);
    str(t, "t");
    let i = 0;
    for (let j = 0; j < t.length; j++) {
      const match = i < s.length && s[i] === t[j];
      e({
        title: match ? "Match and advance both" : "Skip this text character",
        message: `${JSON.stringify(t[j])} ${match ? "matches" : "does not match"} the next required character ${JSON.stringify(s[i] ?? "none")}.`,
        arrays: [
          array("subsequence s", [...s], i < s.length ? [i] : [], { i }),
          array("text t", [...t], [j], { j }),
        ],
        vars: { matched: i, required: s.length },
      });
      if (match) i++;
    }
    return i === s.length;
  });
  reg(
    "Find Index of First Occurrence in String",
    { haystack: "ababcabcabababd", needle: "ababd" },
    ({ haystack, needle }, e) => {
      str(haystack, "haystack");
      str(needle, "needle");
      if (!needle.length) {
        e({
          title: "Empty needle",
          message: "The empty string occurs at index 0.",
          arrays: [array("haystack", [...haystack])],
          vars: { answer: 0 },
        });
        return 0;
      }
      const pi = Array(needle.length).fill(0);
      let j = 0;
      for (let i = 1; i < needle.length; i++) {
        while (j && needle[i] !== needle[j]) {
          e({
            title: "Reuse a shorter prefix",
            message: `Pattern mismatch at i=${i}, j=${j}. Fall back to pi[j−1] = ${pi[j - 1]} instead of restarting all prefix work.`,
            arrays: [
              array("needle", [...needle], [i, j], { i, j }),
              array("prefix function pi", pi, [j - 1]),
            ],
            vars: { phase: "build prefix function", i, j, fallback: pi[j - 1] },
          });
          j = pi[j - 1];
        }
        if (needle[i] === needle[j]) j++;
        pi[i] = j;
        e({
          title: "Save the matched prefix length",
          message: `pi[${i}] = ${j}: this prefix is also a suffix of needle[0..${i}].`,
          arrays: [
            array("needle", [...needle], [i], { i, prefixEnd: j - 1 }),
            array("prefix function pi", pi, [i]),
          ],
          vars: { phase: "build prefix function", i, j },
        });
      }
      j = 0;
      for (let i = 0; i < haystack.length; i++) {
        while (j && haystack[i] !== needle[j]) {
          e({
            title: "KMP fallback without moving the text pointer back",
            message: `Text ${haystack[i]} mismatches pattern ${needle[j]}. Keep text index ${i}; shorten matched prefix from ${j} to ${pi[j - 1]}.`,
            arrays: [
              array("haystack", [...haystack], [i], { i }),
              array("needle", [...needle], [j], { j }),
              array("prefix function pi", pi, [j - 1]),
            ],
            vars: { i, matched: j, fallback: pi[j - 1] },
          });
          j = pi[j - 1];
        }
        const match = haystack[i] === needle[j];
        if (match) j++;
        e({
          title: match
            ? "Extend the matched prefix"
            : "No prefix matches this character",
          message: `After text index ${i}, matched prefix length is ${j}. ${j === needle.length ? "The full needle is found." : "Advance the text pointer once."}`,
          arrays: [
            array(
              "haystack",
              [...haystack],
              j ? Array.from({ length: j }, (_, z) => i - j + 1 + z) : [i],
              { i, matchStart: i - j + 1 },
            ),
            array(
              "needle",
              [...needle],
              Array.from({ length: j }, (_, z) => z),
            ),
            array("prefix function pi", pi),
          ],
          vars: { i, matched: j },
        });
        if (j === needle.length) return i - j + 1;
      }
      return -1;
    },
  );
  function linkedIntersection(input, e) {
    const a = nums(input.a, "a", 0),
      b = nums(input.b, "b", 0),
      shared = nums(input.shared, "shared", 0);
    let serial = 0;
    const make = (v) => ({ id: `list-${serial++}`, val: v, next: null });
    const chain = (values) => {
      const nodes = values.map(make);
      nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null));
      return nodes;
    };
    const aa = chain(a),
      bb = chain(b),
      ss = chain(shared);
    if (aa.length) aa.at(-1).next = ss[0] ?? null;
    if (bb.length) bb.at(-1).next = ss[0] ?? null;
    const headA = aa[0] ?? ss[0] ?? null,
      headB = bb[0] ?? ss[0] ?? null,
      all = [...aa, ...bb, ...ss];
    let p = headA,
      q = headB,
      ticks = 0;
    function frame(message) {
      e({
        title: "Equalize the two pointer path lengths",
        message,
        nodes: all.map((n) => ({
          id: n.id,
          label: `${n.val}${n === p ? " · p" : ""}${n === q ? " · q" : ""}`,
          x: aa.includes(n)
            ? 25 + aa.indexOf(n) * 50
            : bb.includes(n)
              ? 25 + bb.indexOf(n) * 50
              : 350 + ss.indexOf(n) * 50,
          y: aa.includes(n) ? 60 : bb.includes(n) ? 220 : 140,
          state: n === p || n === q ? "active" : undefined,
        })),
        edges: all
          .filter((n) => n.next)
          .map((n) => ({ from: n.id, to: n.next.id })),
        vars: { p: p?.id ?? "null", q: q?.id ?? "null", steps: ticks },
      });
    }
    frame(
      "The lists have separate prefixes and one shared tail. Equal values in different nodes are not intersections.",
    );
    while (p !== q) {
      p = p ? p.next : headB;
      q = q ? q.next : headA;
      ticks++;
      frame(
        "Advance each pointer once; when it is null, restart it at the other head. Both pointers traverse equal total lengths.",
      );
      if (ticks > 200) throw Error("Unexpected list cycle.");
    }
    return p ? p.val : null;
  }
  reg(
    "Intersection of Two Linked Lists",
    { a: [4, 1], b: [5, 6, 1], shared: [8, 4, 5] },
    linkedIntersection,
  );
  reg(
    "Container with Most Water",
    { heights: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
    ({ heights }, e) => {
      const a = nonnegative(nums(heights, "heights"));
      let l = 0,
        r = a.length - 1,
        best = 0;
      while (l < r) {
        const area = (r - l) * Math.min(a[l], a[r]);
        best = Math.max(best, area);
        arrStep(
          e,
          a,
          `Area = width ${r - l} × lower wall ${Math.min(a[l], a[r])} = ${area}. Move the lower wall; narrowing cannot help it.`,
          { width: r - l, area, best },
          [l, r],
          { left: l, right: r },
        );
        if (a[l] <= a[r]) l++;
        else r--;
      }
      return best;
    },
  );
  reg("Three Sum", { nums: [-1, 0, 1, 2, -1, -4] }, ({ nums: input }, e) => {
    const a = nums(input, "nums", 0).sort((x, y) => x - y),
      out = [];
    arrStep(
      e,
      a,
      "Sort to support two-pointer search and duplicate skipping.",
      { triplets: out },
    );
    for (let i = 0; i < a.length - 2; i++) {
      if (i && a[i] === a[i - 1]) {
        arrStep(e, a, `Skip repeated anchor ${a[i]}.`, {}, [i]);
        continue;
      }
      let l = i + 1,
        r = a.length - 1;
      while (l < r) {
        const sum = a[i] + a[l] + a[r];
        arrStep(
          e,
          a,
          `${a[i]} + ${a[l]} + ${a[r]} = ${sum}. ${sum === 0 ? "Save a unique triple, then skip equal pointer values." : sum < 0 ? "Increase left to raise the sum." : "Decrease right to lower the sum."}`,
          { sum, triplets: copy(out) },
          [i, l, r],
          { anchor: i, left: l, right: r },
        );
        if (!sum) {
          out.push([a[i], a[l], a[r]]);
          const lv = a[l],
            rv = a[r];
          while (l < r && a[l] === lv) l++;
          while (l < r && a[r] === rv) r--;
        } else if (sum < 0) l++;
        else r--;
      }
    }
    return out;
  });
  reg(
    "Trapping Rain Water",
    { heights: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
    ({ heights }, e) => {
      const a = nonnegative(nums(heights, "heights")),
        water = a.map(() => 0);
      let l = 0,
        r = a.length - 1,
        leftMax = 0,
        rightMax = 0,
        total = 0;
      while (l <= r) {
        let i, side;
        if (a[l] <= a[r]) {
          side = "left";
          i = l++;
          leftMax = Math.max(leftMax, a[i]);
          water[i] = leftMax - a[i];
        } else {
          side = "right";
          i = r--;
          rightMax = Math.max(rightMax, a[i]);
          water[i] = rightMax - a[i];
        }
        total += water[i];
        e({
          title: `Resolve the ${side} boundary`,
          message: `The opposite boundary is high enough. Index ${i} holds ${water[i]} water; cumulative trapped water is ${total}.`,
          arrays: [
            array("heights", a, [i], { left: l, right: r }),
            array("water above each position", water, [i]),
          ],
          vars: { leftMax, rightMax, added: water[i], total },
        });
      }
      return total;
    },
  );
  reg(
    "Longest Substring Without Repeating Characters",
    { s: "abcabcbb" },
    ({ s }, e) => {
      str(s);
      const last = new Map();
      let left = 0,
        best = 0;
      for (let right = 0; right < s.length; right++) {
        const previous = last.get(s[right]);
        if (previous !== undefined) left = Math.max(left, previous + 1);
        last.set(s[right], right);
        best = Math.max(best, right - left + 1);
        e({
          title: "Restore a window with unique characters",
          message: `Read ${s[right]}; ${previous === undefined ? "not seen before" : `last seen at ${previous}`}. Keep left at least ${left}.`,
          arrays: [
            array(
              "characters",
              [...s],
              Array.from({ length: right - left + 1 }, (_, j) => left + j),
              { left, right },
            ),
          ],
          vars: {
            left,
            right,
            window: s.slice(left, right + 1),
            length: right - left + 1,
            best,
            lastSeen: [...last].map(([k, v]) => `${k}:${v}`),
          },
        });
      }
      return best;
    },
  );
  reg(
    "Longest Repeating Character Replacement",
    { s: "AABABBA", k: 1 },
    ({ s, k }, e) => {
      str(s);
      if (/[^A-Z]/.test(s)) throw Error("Use uppercase A–Z characters.");
      integer(k, "k", 0, s.length);
      const counts = Array(26).fill(0);
      let left = 0,
        best = 0;
      function frame(right, message) {
        const maxFrequency = Math.max(...counts);
        e({
          title: "Maintain a valid replacement window",
          message,
          arrays: [
            array(
              "characters",
              [...s],
              Array.from(
                { length: Math.max(0, right - left + 1) },
                (_, j) => left + j,
              ),
              { left, right },
            ),
          ],
          vars: {
            frequencies: counts
              .map((c, i) => (c ? `${String.fromCharCode(i + 65)}:${c}` : null))
              .filter(Boolean),
            maxFrequency,
            replacementsNeeded: right - left + 1 - maxFrequency,
            k,
            best,
          },
        });
      }
      for (let right = 0; right < s.length; right++) {
        counts[s.charCodeAt(right) - 65]++;
        frame(
          right,
          `Add ${s[right]}; recompute the most frequent character in the current window.`,
        );
        while (right - left + 1 - Math.max(...counts) > k) {
          const removed = s[left];
          counts[s.charCodeAt(left++) - 65]--;
          frame(
            right,
            `Too many replacements were needed. Remove ${removed} from the left and recompute the maximum count.`,
          );
        }
        best = Math.max(best, right - left + 1);
        frame(
          right,
          `The window needs at most ${k} changes. Update best length to ${best}.`,
        );
      }
      return best;
    },
  );
  reg(
    "Permutation in String",
    { s1: "ab", s2: "eidbaooo" },
    ({ s1, s2 }, e) => {
      str(s1, "s1");
      str(s2, "s2");
      if (/[^a-z]/.test(s1 + s2)) throw Error("Use lowercase a–z characters.");
      const need = Array(26).fill(0),
        have = Array(26).fill(0);
      for (const c of s1) need[c.charCodeAt(0) - 97]++;
      if (!s1.length) {
        e({
          title: "Empty permutation",
          message: "The empty pattern occurs at the beginning.",
          arrays: [array("text", [...s2])],
        });
        return true;
      }
      for (let r = 0; r < s2.length; r++) {
        have[s2.charCodeAt(r) - 97]++;
        if (r >= s1.length) have[s2.charCodeAt(r - s1.length) - 97]--;
        const left = Math.max(0, r - s1.length + 1),
          match = r + 1 >= s1.length && have.every((v, i) => v === need[i]);
        const letters = [...new Set(s1 + s2)].sort();
        e({
          title: "Compare fixed-window frequencies",
          message: `Window ${JSON.stringify(s2.slice(left, r + 1))} ${match ? "has exactly the pattern counts" : "does not yet match all pattern counts"}.`,
          arrays: [
            array(
              "text",
              [...s2],
              Array.from({ length: r - left + 1 }, (_, j) => left + j),
              { left, right: r },
            ),
            array("letters", letters),
            array(
              "needed count",
              letters.map((c) => need[c.charCodeAt(0) - 97]),
            ),
            array(
              "window count",
              letters.map((c) => have[c.charCodeAt(0) - 97]),
            ),
          ],
          vars: { match, pattern: s1 },
        });
        if (match) return true;
      }
      return false;
    },
  );
  reg(
    "Sliding Window Maximum",
    { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
    ({ nums: input, k }, e) => {
      const a = nums(input);
      integer(k, "k", 1, a.length);
      const deque = [],
        out = [];
      for (let r = 0; r < a.length; r++) {
        while (deque.length && deque[0] <= r - k) {
          const removed = deque.shift();
          e({
            title: "Expire an old index",
            message: `Index ${removed} has left the window. Remove it from the deque front.`,
            arrays: [
              array("nums", a, [removed, r], { right: r }),
              array("deque indices", deque),
            ],
            vars: { k, output: out },
          });
        }
        while (deque.length && a[deque.at(-1)] <= a[r]) {
          const removed = deque.pop();
          e({
            title: "Remove a dominated candidate",
            message: `${a[r]} is at least ${a[removed]} and arrives later; index ${removed} can never win a future window.`,
            arrays: [
              array("nums", a, [removed, r], { right: r }),
              array("deque indices", deque),
            ],
            vars: { k },
          });
        }
        deque.push(r);
        if (r >= k - 1) out.push(a[deque[0]]);
        e({
          title: "Read the maximum at the deque front",
          message: `${r >= k - 1 ? `Window maximum is ${a[deque[0]]}.` : "The first full window is not ready yet."}`,
          arrays: [
            array("nums", a, [deque[0]], {
              left: Math.max(0, r - k + 1),
              right: r,
            }),
            array("deque indices", deque),
            array("window maxima", out),
          ],
          vars: { k, frontValue: a[deque[0]] },
        });
      }
      return out;
    },
  );

  /* Tree input is the usual compact breadth-first serialization, with null children. */
  function tree(values, name = "tree") {
    if (
      !Array.isArray(values) ||
      values.length > 31 ||
      values.some((v) => v !== null && !Number.isFinite(v))
    )
      throw Error(
        `${name} must be a level-order array of numbers/null, at most 31 entries.`,
      );
    if (!values.length || values[0] === null) {
      if (values.slice(1).some((v) => v !== null))
        throw Error("A null root cannot have descendants.");
      return null;
    }
    let serial = 0;
    const make = (v) => ({
      id: `${name}-${serial++}`,
      val: v,
      left: null,
      right: null,
    });
    const root = make(values[0]),
      queue = [root];
    let i = 1;
    for (let h = 0; h < queue.length && i < values.length; h++) {
      const n = queue[h];
      for (const side of ["left", "right"]) {
        const v = values[i++];
        if (v !== undefined && v !== null) {
          n[side] = make(v);
          queue.push(n[side]);
        }
      }
    }
    if (i < values.length && values.slice(i).some((v) => v !== null))
      throw Error("Level-order input contains nodes without a parent.");
    return root;
  }
  function serialize(root) {
    if (!root) return [];
    const q = [root],
      out = [];
    for (let i = 0; i < q.length; i++) {
      const n = q[i];
      out.push(n ? n.val : null);
      if (n) q.push(n.left, n.right);
    }
    while (out.at(-1) === null) out.pop();
    return out;
  }
  function allNodes(root) {
    const out = [];
    (function go(n) {
      if (n) {
        out.push(n);
        go(n.left);
        go(n.right);
      }
    })(root);
    return out;
  }
  function treeFrame(root, current = [], visited = [], extraEdges = []) {
    const nodes = [],
      edges = [];
    function go(n, x, y, gap) {
      if (!n) return;
      nodes.push({
        id: n.id,
        label: String(n.val),
        x,
        y,
        state: current.includes(n.id)
          ? "active"
          : visited.includes(n.id)
            ? "done"
            : undefined,
      });
      for (const [side, sign] of [
        ["left", -1],
        ["right", 1],
      ])
        if (n[side]) {
          edges.push({
            from: n.id,
            to: n[side].id,
            label: side === "left" ? "L" : "R",
            state: current.includes(n[side].id) ? "active" : undefined,
          });
          go(n[side], x + gap * sign, y + 62, gap / 2);
        }
    }
    go(root, 310, 35, 145);
    return { nodes, edges: [...edges, ...extraEdges] };
  }
  function tf(
    e,
    root,
    title,
    message,
    current = [],
    visited = [],
    vars = {},
    arrays = [],
  ) {
    e({
      title,
      message,
      ...treeFrame(
        root,
        current.map((n) => (typeof n === "string" ? n : n.id)),
        visited.map((n) => (typeof n === "string" ? n : n.id)),
      ),
      vars,
      arrays,
    });
  }
  const defaultTree = [8, 4, 12, 2, 6, 10, 14];
  function traversal(input, e, order) {
    const root = tree(input),
      visited = [],
      out = [],
      stack = [];
    function visit(n) {
      out.push(n.val);
      visited.push(n);
      tf(
        e,
        root,
        `Visit in ${order}`,
        `Append ${n.val} to the output.`,
        [n],
        visited,
        { callStack: stack.map((n) => n.val) },
        [array("output", out)],
      );
    }
    function go(n) {
      if (!n) return;
      stack.push(n);
      tf(
        e,
        root,
        "Enter a subtree",
        `Enter node ${n.val}.`,
        [n],
        visited,
        { callStack: stack.map((n) => n.val) },
        [array("output", out)],
      );
      if (order === "preorder") visit(n);
      go(n.left);
      if (order === "inorder") visit(n);
      go(n.right);
      if (order === "postorder") visit(n);
      stack.pop();
    }
    go(root);
    if (!root)
      tf(e, root, "Empty tree", "No nodes to visit.", [], [], {}, [
        array("output", []),
      ]);
    return out;
  }
  reg("Preorder Traversal", { tree: defaultTree }, ({ tree }, e) =>
    traversal(tree, e, "preorder"),
  );
  reg("Inorder Traversal", { tree: defaultTree }, ({ tree }, e) =>
    traversal(tree, e, "inorder"),
  );
  reg("Postorder Traversal", { tree: defaultTree }, ({ tree }, e) =>
    traversal(tree, e, "postorder"),
  );
  reg("Level Order Traversal", { tree: defaultTree }, ({ tree: input }, e) => {
    const root = tree(input),
      q = root ? [root] : [],
      visited = [],
      out = [];
    for (let head = 0; head < q.length;) {
      const end = q.length,
        level = [];
      tf(
        e,
        root,
        "Start a level",
        `Capture ${end - head} nodes currently in the queue. Children belong to the next level.`,
        [],
        visited,
        { queue: q.slice(head).map((n) => n.val), level: out.length },
      );
      while (head < end) {
        const n = q[head++];
        level.push(n.val);
        visited.push(n);
        if (n.left) q.push(n.left);
        if (n.right) q.push(n.right);
        tf(
          e,
          root,
          "Dequeue and discover children",
          `Visit ${n.val}, then append its children to the queue.`,
          [n],
          visited,
          { queue: q.slice(head).map((n) => n.val), currentLevel: level },
          [array("current level", level)],
        );
      }
      out.push(level);
    }
    if (!root) tf(e, root, "Empty tree", "An empty tree has no levels.");
    return out;
  });
  reg(
    "Maximum Depth of Binary Tree",
    { tree: [3, 9, 20, null, null, 15, 7] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      function depth(n) {
        if (!n) return 0;
        tf(
          e,
          root,
          "Compute subtree depth",
          `Ask the children of ${n.val} for their depths.`,
          [n],
          visited,
        );
        const left = depth(n.left),
          right = depth(n.right),
          result = 1 + Math.max(left, right);
        visited.push(n);
        tf(
          e,
          root,
          "Return depth to parent",
          `depth(${n.val}) = 1 + max(${left}, ${right}) = ${result}.`,
          [n],
          visited,
          { leftDepth: left, rightDepth: right, depth: result },
        );
        return result;
      }
      if (!root) tf(e, root, "Empty tree", "Depth of null is 0.");
      return depth(root);
    },
  );
  reg(
    "Path Sum",
    { tree: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], target: 22 },
    ({ tree: input, target }, e) => {
      const root = tree(input);
      integer(target, "target");
      const visited = [],
        path = [];
      function go(n, remaining) {
        if (!n) return false;
        path.push(n.val);
        const next = remaining - n.val;
        tf(
          e,
          root,
          "Subtract the current node",
          `Remaining target ${remaining} − ${n.val} = ${next}. ${!n.left && !n.right ? "This is a leaf: test whether the remainder is zero." : "Continue to a child."}`,
          [n],
          visited,
          { remaining: next, target, path: [...path] },
        );
        if (!n.left && !n.right) {
          path.pop();
          return next === 0;
        }
        const yes = go(n.left, next) || go(n.right, next);
        visited.push(n);
        path.pop();
        return yes;
      }
      if (!root)
        tf(e, root, "No root-to-leaf path", "An empty tree has no path.");
      return go(root, target);
    },
  );
  reg(
    "Symmetric Tree",
    { tree: [1, 2, 2, 3, 4, 4, 3] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      function mirror(a, b) {
        tf(
          e,
          root,
          "Compare mirrored positions",
          !a || !b
            ? `Left position ${a?.val ?? "null"}, right position ${b?.val ?? "null"}: both must be null together.`
            : `Compare ${a.val} and ${b.val}, then compare outer and inner children.`,
          [a, b].filter(Boolean),
          visited,
          { left: a?.val ?? null, right: b?.val ?? null },
        );
        if (!a || !b) return a === b;
        if (a.val !== b.val) return false;
        visited.push(a, b);
        return mirror(a.left, b.right) && mirror(a.right, b.left);
      }
      return !root || mirror(root.left, root.right);
    },
  );
  reg(
    "Invert a Binary Tree",
    { tree: [4, 2, 7, 1, 3, 6, 9] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      function go(n) {
        if (!n) return;
        tf(
          e,
          root,
          "Before swapping children",
          `Node ${n.val}: left is ${n.left?.val ?? "null"}, right is ${n.right?.val ?? "null"}.`,
          [n],
          visited,
        );
        [n.left, n.right] = [n.right, n.left];
        visited.push(n);
        tf(
          e,
          root,
          "Swap left and right links",
          `Node ${n.val} now points left to ${n.left?.val ?? "null"} and right to ${n.right?.val ?? "null"}.`,
          [n],
          visited,
        );
        go(n.left);
        go(n.right);
      }
      go(root);
      return serialize(root);
    },
  );
  reg("Same Tree", { p: [1, 2, 3], q: [1, 2, 3] }, ({ p, q }, e) => {
    const a = tree(p, "p"),
      b = tree(q, "q");
    function compare(x, y) {
      const va = treeFrame(a, x ? [x.id] : []),
        vb = treeFrame(b, y ? [y.id] : []);
      e({
        title: "Compare corresponding nodes",
        message: `${x?.val ?? "null"} versus ${y?.val ?? "null"}: both value and child structure must match.`,
        nodes: [
          ...va.nodes.map((n) => ({ ...n, x: n.x * 0.46, y: n.y })),
          ...vb.nodes.map((n) => ({ ...n, x: 320 + n.x * 0.46, y: n.y })),
        ],
        edges: [...va.edges, ...vb.edges],
        vars: { p: x?.val ?? null, q: y?.val ?? null },
      });
      if (!x || !y) return x === y;
      return (
        x.val === y.val && compare(x.left, y.left) && compare(x.right, y.right)
      );
    }
    return compare(a, b);
  });
  reg(
    "Balanced Binary Tree",
    { tree: [3, 9, 20, null, null, 15, 7] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      function height(n) {
        if (!n) return 0;
        const left = height(n.left);
        if (left === -1) return -1;
        const right = height(n.right);
        if (right === -1) return -1;
        const ok = Math.abs(left - right) <= 1;
        visited.push(n);
        tf(
          e,
          root,
          "Check height balance",
          `Node ${n.val}: left height ${left}, right height ${right}. ${ok ? "Difference is at most one." : "Difference exceeds one: propagate failure."}`,
          [n],
          visited,
          { leftHeight: left, rightHeight: right, balanced: ok },
        );
        return ok ? 1 + Math.max(left, right) : -1;
      }
      return height(root) !== -1;
    },
  );
  reg(
    "Diameter of a Binary Tree",
    { tree: [1, 2, 3, 4, 5] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      let diameter = 0;
      function height(n) {
        if (!n) return 0;
        const left = height(n.left),
          right = height(n.right);
        diameter = Math.max(diameter, left + right);
        visited.push(n);
        tf(
          e,
          root,
          "Join the two longest child paths",
          `At ${n.val}, a path through the node has ${left} + ${right} = ${left + right} edges. Return only height to the parent.`,
          [n],
          visited,
          {
            leftHeight: left,
            rightHeight: right,
            diameter,
            returnedHeight: 1 + Math.max(left, right),
          },
        );
        return 1 + Math.max(left, right);
      }
      height(root);
      return diameter;
    },
  );
  reg(
    "Zigzag Level Order Traversal",
    { tree: [3, 9, 20, null, null, 15, 7] },
    ({ tree: input }, e) => {
      const root = tree(input),
        out = [],
        visited = [];
      let level = root ? [root] : [];
      while (level.length) {
        const next = [],
          row = [];
        for (const n of level) {
          row.push(n.val);
          visited.push(n);
          if (n.left) next.push(n.left);
          if (n.right) next.push(n.right);
          tf(
            e,
            root,
            "Collect a level from left to right",
            `Visit ${n.val}; preserve normal child discovery order.`,
            [n],
            visited,
            { depth: out.length, nextQueue: next.map((n) => n.val) },
            [array("current level", row)],
          );
        }
        if (out.length % 2) {
          row.reverse();
          tf(
            e,
            root,
            "Reverse this odd-numbered level",
            `Depth ${out.length} is odd, so reverse only its output row.`,
            level,
            visited,
            { depth: out.length },
            [array("reversed level output", row)],
          );
        }
        out.push(row);
        level = next;
      }
      return out;
    },
  );
  reg(
    "Subtree of another Tree",
    { tree: [3, 4, 5, 1, 2], subtree: [4, 1, 2] },
    ({ tree: input, subtree }, e) => {
      const root = tree(input),
        sub = tree(subtree, "subtree"),
        visited = [];
      function same(a, b) {
        tf(
          e,
          root,
          "Check subtree structure",
          `Compare candidate ${a?.val ?? "null"} to pattern ${b?.val ?? "null"}.`,
          a ? [a] : [],
          visited,
          { candidate: a?.val ?? null, pattern: b?.val ?? null },
        );
        if (!a || !b) return a === b;
        return (
          a.val === b.val && same(a.left, b.left) && same(a.right, b.right)
        );
      }
      function go(n) {
        if (!sub) return true;
        if (!n) return false;
        tf(
          e,
          root,
          "Try a subtree root",
          `Treat node ${n.val} as a candidate for pattern root ${sub.val}.`,
          [n],
          visited,
          { pattern: serialize(sub) },
        );
        if (same(n, sub)) return true;
        visited.push(n);
        return go(n.left) || go(n.right);
      }
      return go(root);
    },
  );
  reg(
    "Lowest Common Ancestor",
    { tree: [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], p: 5, q: 1 },
    ({ tree: input, p, q }, e) => {
      const root = tree(input);
      integer(p, "p");
      integer(q, "q");
      const all = allNodes(root);
      if (
        new Set(all.map((n) => n.val)).size !== all.length ||
        !all.some((n) => n.val === p) ||
        !all.some((n) => n.val === q)
      )
        throw Error(
          "Use unique tree values and choose p/q present in the tree.",
        );
      const visited = [];
      function go(n) {
        if (!n) return null;
        tf(
          e,
          root,
          "Search this subtree",
          `Look for targets ${p} and ${q} below ${n.val}.`,
          [n],
          visited,
          { p, q },
        );
        if (n.val === p || n.val === q) {
          tf(
            e,
            root,
            "Return a target",
            `Node ${n.val} is a requested target.`,
            [n],
            visited,
            { returned: n.val },
          );
          return n;
        }
        const l = go(n.left),
          r = go(n.right),
          answer = l && r ? n : l || r;
        visited.push(n);
        tf(
          e,
          root,
          "Combine child answers",
          `Left returns ${l?.val ?? "null"}, right returns ${r?.val ?? "null"}. ${l && r ? "Targets split here: this is their ancestor." : "Propagate the non-null answer."}`,
          [n],
          visited,
          {
            left: l?.val ?? null,
            right: r?.val ?? null,
            returned: answer?.val ?? null,
          },
        );
        return answer;
      }
      return go(root)?.val ?? null;
    },
  );
  reg(
    "Binary Tree Right Side View",
    { tree: [1, 2, 3, null, 5, null, 4] },
    ({ tree: input }, e) => {
      const root = tree(input),
        out = [],
        visited = [];
      function go(n, depth) {
        if (!n) return;
        const first = depth === out.length;
        if (first) out.push(n.val);
        visited.push(n);
        tf(
          e,
          root,
          first
            ? "First node at this depth"
            : "A closer-right node already covers this depth",
          `Visit right before left. ${first ? `${n.val} is visible from the right.` : `${n.val} is hidden at depth ${depth}.`}`,
          [n],
          visited,
          { depth, visible: out },
          [array("right side view", out)],
        );
        go(n.right, depth + 1);
        go(n.left, depth + 1);
      }
      go(root, 0);
      return out;
    },
  );
  reg(
    "Count Good Nodes in Binary Tree",
    { tree: [3, 1, 4, 3, null, 1, 5] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      let total = 0;
      function go(n, maxSoFar) {
        if (!n) return;
        const good = n.val >= maxSoFar;
        if (good) total++;
        const nextMax = Math.max(maxSoFar, n.val);
        visited.push(n);
        tf(
          e,
          root,
          good ? "This is a good node" : "An ancestor is larger",
          `${n.val} ${good ? "≥" : "<"} path maximum ${Number.isFinite(maxSoFar) ? maxSoFar : "−∞"}. ${good ? "Count this node." : "Do not count this node."}`,
          [n],
          visited,
          {
            pathMaximum: Number.isFinite(maxSoFar) ? maxSoFar : "−∞",
            nextMaximum: nextMax,
            total,
          },
        );
        go(n.left, nextMax);
        go(n.right, nextMax);
      }
      go(root, -Infinity);
      return total;
    },
  );
  reg(
    "Populating Next Right Pointers in Each Node",
    { tree: [1, 2, 3, 4, 5, 6, 7] },
    ({ tree: input }, e) => {
      const root = tree(input);
      let level = root ? [root] : [],
        links = [],
        visited = [];
      const levels = [];
      while (level.length) {
        const next = [],
          values = [];
        for (let i = 0; i < level.length; i++) {
          const n = level[i],
            neighbor = level[i + 1] ?? null;
          n.next = neighbor;
          values.push(n.val);
          visited.push(n);
          links = links.map((link) => ({ ...link, state: "done" }));
          if (neighbor)
            links.push({
              from: n.id,
              to: neighbor.id,
              label: "next",
              state: "active",
            });
          if (n.left) next.push(n.left);
          if (n.right) next.push(n.right);
          e({
            title: "Connect the next node on this level",
            message: `${n.val}.next = ${neighbor?.val ?? "null"}. ${neighbor ? "The link stays within the same breadth-first level." : "The final node of the level terminates with null."}`,
            ...treeFrame(
              root,
              [n.id],
              visited.map((n) => n.id),
              links,
            ),
            arrays: [
              array(
                "current level",
                level.map((n) => n.val),
                [i],
              ),
              array(
                "next level queue",
                next.map((n) => n.val),
              ),
            ],
            vars: { node: n.val, next: neighbor?.val ?? null },
          });
        }
        levels.push(values);
        level = next;
      }
      return levels;
    },
  );
  reg(
    "Binary Tree Maximum Path Sum",
    { tree: [-10, 9, 20, null, null, 15, 7] },
    ({ tree: input }, e) => {
      const root = tree(input);
      if (!root) throw Error("Use a nonempty tree.");
      let best = -Infinity;
      const visited = [];
      function gain(n) {
        if (!n) return 0;
        const left = Math.max(0, gain(n.left)),
          right = Math.max(0, gain(n.right)),
          through = n.val + left + right;
        best = Math.max(best, through);
        const returned = n.val + Math.max(left, right);
        visited.push(n);
        tf(
          e,
          root,
          "Choose a path through this node",
          `Discard negative child gains. Through ${n.val}: ${left} + ${n.val} + ${right} = ${through}. Return only one branch to the parent.`,
          [n],
          visited,
          {
            leftGain: left,
            rightGain: right,
            through,
            globalBest: best,
            returnedGain: returned,
          },
        );
        return returned;
      }
      gain(root);
      return best;
    },
  );
  function requireBST(root) {
    function go(n, lo, hi) {
      if (!n) return true;
      return (
        n.val > lo &&
        n.val < hi &&
        go(n.left, lo, n.val) &&
        go(n.right, n.val, hi)
      );
    }
    if (!go(root, -Infinity, Infinity))
      throw Error(
        "Use a strict binary search tree: all left descendants smaller, all right descendants larger.",
      );
  }
  reg(
    "Valid Binary Search Tree",
    { tree: [5, 1, 4, null, null, 3, 6] },
    ({ tree: input }, e) => {
      const root = tree(input),
        visited = [];
      function go(n, lo, hi) {
        if (!n) return true;
        const ok = n.val > lo && n.val < hi;
        tf(
          e,
          root,
          "Check ancestor bounds",
          `${n.val} must lie strictly between ${Number.isFinite(lo) ? lo : "−∞"} and ${Number.isFinite(hi) ? hi : "+∞"}. ${ok ? "Pass bounds down to the children." : "A bound is violated: the tree is invalid."}`,
          [n],
          visited,
          {
            lowerBound: Number.isFinite(lo) ? lo : "−∞",
            upperBound: Number.isFinite(hi) ? hi : "+∞",
            valid: ok,
          },
        );
        if (!ok) return false;
        visited.push(n);
        return go(n.left, lo, n.val) && go(n.right, n.val, hi);
      }
      return go(root, -Infinity, Infinity);
    },
  );
  reg(
    "Search in a BST",
    { tree: defaultTree, target: 10 },
    ({ tree: input, target }, e) => {
      const root = tree(input);
      requireBST(root);
      integer(target, "target");
      const visited = [];
      let n = root;
      while (n) {
        const match = n.val === target;
        tf(
          e,
          root,
          "Choose one branch",
          `${target} ${match ? "=" : target < n.val ? "<" : ">"} ${n.val}. ${match ? "Return this subtree." : target < n.val ? "Search only the left subtree." : "Search only the right subtree."}`,
          [n],
          visited,
          { target },
        );
        if (match) return serialize(n);
        visited.push(n);
        n = target < n.val ? n.left : n.right;
      }
      tf(e, root, "Null child reached", "The target is absent.", [], visited, {
        target,
      });
      return [];
    },
  );
  reg(
    "Insert into a BST",
    { tree: [4, 2, 7, 1, 3], value: 5 },
    ({ tree: input, value }, e) => {
      let root = tree(input);
      requireBST(root);
      integer(value, "value");
      if (allNodes(root).some((n) => n.val === value)) {
        tf(
          e,
          root,
          "Duplicate key",
          `${value} is already present. The strict BST insertion leaves the tree unchanged.`,
          [allNodes(root).find((n) => n.val === value)],
        );
        return serialize(root);
      }
      const fresh = {
          id: "inserted-node",
          val: value,
          left: null,
          right: null,
        },
        visited = [];
      if (!root) {
        root = fresh;
        tf(
          e,
          root,
          "Create the root",
          `${value} becomes the root of the empty tree.`,
          [root],
        );
        return serialize(root);
      }
      let n = root;
      while (true) {
        const side = value < n.val ? "left" : "right";
        tf(
          e,
          root,
          "Follow the insertion path",
          `${value} ${side === "left" ? "<" : ">"} ${n.val}; inspect its ${side} child.`,
          [n],
          visited,
          { value, branch: side },
        );
        visited.push(n);
        if (!n[side]) {
          n[side] = fresh;
          tf(
            e,
            root,
            "Attach the new leaf",
            `The ${side} pointer of ${n.val} now points to ${value}.`,
            [fresh],
            visited,
            { value },
          );
          break;
        }
        n = n[side];
      }
      return serialize(root);
    },
  );
  reg(
    "Kth Smallest Element",
    { tree: [3, 1, 4, null, 2], k: 2 },
    ({ tree: input, k }, e) => {
      const root = tree(input);
      requireBST(root);
      integer(k, "k", 1, allNodes(root).length);
      const stack = [],
        visited = [],
        out = [];
      let n = root,
        count = 0;
      while (n || stack.length) {
        while (n) {
          stack.push(n);
          tf(
            e,
            root,
            "Descend left",
            "Push the node; its left subtree contains smaller values.",
            [n],
            visited,
            { stack: stack.map((n) => n.val), visitedCount: count },
          );
          n = n.left;
        }
        n = stack.pop();
        count++;
        visited.push(n);
        out.push(n.val);
        tf(
          e,
          root,
          "Visit the next smallest key",
          `${n.val} is key number ${count} in sorted inorder.`,
          [n],
          visited,
          { k, visitedCount: count },
          [array("sorted visits", out)],
        );
        if (count === k) return n.val;
        n = n.right;
      }
    },
  );
  reg(
    "Lowest Common Ancestor of a BST",
    { tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 },
    ({ tree: input, p, q }, e) => {
      const root = tree(input);
      requireBST(root);
      integer(p, "p");
      integer(q, "q");
      if (![p, q].every((v) => allNodes(root).some((n) => n.val === v)))
        throw Error("Choose target values present in the tree.");
      let n = root;
      const visited = [];
      while (n) {
        const side =
          p < n.val && q < n.val
            ? "left"
            : p > n.val && q > n.val
              ? "right"
              : "split";
        tf(
          e,
          root,
          "Compare both targets with this key",
          side === "split"
            ? `Targets split at ${n.val}, or one target equals it. This is the lowest common ancestor.`
            : `Both targets lie to the ${side}; follow that branch.`,
          [n],
          visited,
          { p, q, branch: side },
        );
        if (side === "split") return n.val;
        visited.push(n);
        n = n[side];
      }
      return null;
    },
  );

  function heapView(a, active = []) {
    const nodes = a.map((v, i) => {
      const d = Math.floor(Math.log2(i + 1)),
        first = 2 ** d - 1;
      return {
        id: `h${i}`,
        label: String(v),
        x: ((i - first + 0.5) * 600) / 2 ** d,
        y: 30 + d * 60,
        state: active.includes(i) ? "active" : undefined,
      };
    });
    return {
      nodes,
      edges: a.flatMap((_, i) =>
        [2 * i + 1, 2 * i + 2]
          .filter((j) => j < a.length)
          .map((j) => ({ from: `h${i}`, to: `h${j}` })),
      ),
    };
  }
  function heapStep(e, heap, message, active = [], vars = {}, extras = []) {
    e({
      title: "Maintain heap order",
      message,
      arrays: [array("heap array", heap, active), ...extras],
      ...heapView(heap, active),
      vars,
    });
  }
  function pushHeap(heap, value, min, e, vars = {}) {
    heap.push(value);
    let i = heap.length - 1;
    heapStep(
      e,
      heap,
      `Insert ${value} at the end, then sift upward.`,
      [i],
      vars,
    );
    while (i) {
      const p = (i - 1) >> 1;
      const better = min ? heap[i] < heap[p] : heap[i] > heap[p];
      heapStep(
        e,
        heap,
        `Compare child ${heap[i]} with parent ${heap[p]}. ${better ? "Swap to restore heap order." : "Heap order holds."}`,
        [i, p],
        vars,
      );
      if (!better) break;
      [heap[i], heap[p]] = [heap[p], heap[i]];
      i = p;
    }
  }
  function popHeap(heap, min, e, vars = {}) {
    const root = heap[0],
      tail = heap.pop();
    if (heap.length) {
      heap[0] = tail;
      let i = 0;
      while (true) {
        let best = i;
        for (const j of [2 * i + 1, 2 * i + 2])
          if (
            j < heap.length &&
            (min ? heap[j] < heap[best] : heap[j] > heap[best])
          )
            best = j;
        heapStep(
          e,
          heap,
          `After removing root ${root}, compare the replacement with its children. ${best === i ? "Heap order holds." : "Swap toward the higher-priority child."}`,
          [i, best],
          vars,
        );
        if (best === i) break;
        [heap[i], heap[best]] = [heap[best], heap[i]];
        i = best;
      }
    } else
      heapStep(
        e,
        heap,
        `Remove final root ${root}; the heap is empty.`,
        [],
        vars,
      );
    return root;
  }
  reg(
    "Kth Largest Element in an Array",
    { nums: [3, 2, 1, 5, 6, 4], k: 2 },
    ({ nums: input, k }, e) => {
      const a = nums(input);
      integer(k, "k", 1, a.length);
      const heap = [];
      for (let i = 0; i < a.length; i++) {
        pushHeap(heap, a[i], true, e, { inputIndex: i, k });
        if (heap.length > k) {
          const removed = popHeap(heap, true, e, { inputIndex: i, k });
          heapStep(
            e,
            heap,
            `Discard ${removed}: retain only the largest ${k} values.`,
            [0],
            { k, retained: heap.length },
          );
        }
      }
      heapStep(
        e,
        heap,
        `The weakest retained candidate, ${heap[0]}, is the kth largest.`,
        [0],
        { k },
      );
      return heap[0];
    },
  );
  reg(
    "Kth Largest Element in a Stream",
    { k: 3, nums: [4, 5, 8, 2], additions: [3, 5, 10, 9, 4] },
    ({ k, nums: input, additions }, e) => {
      const initial = nums(input, "nums", 0),
        incoming = nums(additions, "additions", 0);
      integer(k, "k", 1, 15);
      if (initial.length + incoming.length < k)
        throw Error("Provide enough values to reach k total items.");
      const heap = [],
        out = [];
      for (const [phase, values] of [
        ["initial", initial],
        ["add", incoming],
      ])
        for (const value of values) {
          pushHeap(heap, value, true, e, { phase, incoming: value, k });
          if (heap.length > k) popHeap(heap, true, e, { phase, k });
          if (phase === "add") {
            const answer = heap.length >= k ? heap[0] : null;
            out.push(answer);
            heapStep(
              e,
              heap,
              `After adding ${value}, ${answer === null ? "fewer than k values exist yet" : `the kth largest is ${answer}`}.`,
              [0],
              { k, incoming: value },
              [array("returned stream answers", out)],
            );
          }
        }
      return out;
    },
  );
  reg("Last Stone Weight", { stones: [2, 7, 4, 1, 8, 1] }, ({ stones }, e) => {
    const values = nums(stones, "stones", 0);
    if (values.some((v) => !Number.isInteger(v) || v < 1))
      throw Error("Stone weights must be positive integers.");
    const heap = [];
    for (const v of values) pushHeap(heap, v, false, e);
    while (heap.length > 1) {
      const y = popHeap(heap, false, e),
        x = popHeap(heap, false, e);
      heapStep(
        e,
        heap,
        `Smash the two heaviest stones: ${y} and ${x}. ${y === x ? "Both disappear." : `Return their difference ${y - x}.`}`,
        [],
        { heavier: y, lighter: x, remainingWeight: y - x },
      );
      if (y > x) pushHeap(heap, y - x, false, e);
    }
    return heap[0] ?? 0;
  });
  reg(
    "Top K Frequent Elements",
    { nums: [1, 1, 1, 2, 2, 3], k: 2 },
    ({ nums: input, k }, e) => {
      const a = nums(input),
        count = new Map();
      for (let i = 0; i < a.length; i++) {
        count.set(a[i], (count.get(a[i]) ?? 0) + 1);
        arrStep(
          e,
          a,
          `Count occurrence of ${a[i]}.`,
          { frequencies: [...count].map(([v, c]) => `${v}:${c}`) },
          [i],
          { i },
        );
      }
      integer(k, "k", 1, count.size);
      const buckets = Array.from({ length: a.length + 1 }, () => []);
      for (const [value, c] of count) {
        buckets[c].push(value);
        e({
          title: "Place a value in its frequency bucket",
          message: `${value} occurs ${c} times, so append it to bucket ${c}.`,
          arrays: buckets
            .map((values, i) => array(`frequency ${i}`, values))
            .filter((row) => row.values.length),
          vars: { value, frequency: c, k },
        });
      }
      const out = [];
      for (let c = buckets.length - 1; c >= 0; c--)
        for (const value of buckets[c]) {
          out.push(value);
          e({
            title: "Read buckets from high frequency to low",
            message: `Take ${value}, which appears ${c} times.`,
            arrays: [array("selected values", out)],
            vars: { frequency: c, selected: out.length, k },
          });
          if (out.length === k) return out;
        }
      return out;
    },
  );
  reg(
    "Kth Smallest Element in a Sorted Matrix",
    {
      matrix: [
        [1, 5, 9],
        [10, 11, 13],
        [12, 13, 15],
      ],
      k: 8,
    },
    ({ matrix, k }, e) => {
      if (
        !Array.isArray(matrix) ||
        !matrix.length ||
        matrix.length > 8 ||
        matrix.some(
          (row) =>
            !Array.isArray(row) ||
            row.length > 8 ||
            row.some((v) => !Number.isFinite(v)),
        )
      )
        throw Error(
          "matrix must have 1–8 rows, each with at most 8 finite numbers.",
        );
      if (matrix.some((row) => row.some((v, c) => c && v < row[c - 1])))
        throw Error("Each row must be sorted in ascending order.");
      integer(
        k,
        "k",
        1,
        matrix.reduce((sum, row) => sum + row.length, 0),
      );
      const heap = [],
        removed = [],
        done = [];
      function draw(message, active = [], cell = null) {
        const labels = heap.map(([v, r, c]) => `${v} @${r},${c}`);
        e({
          title: "Merge sorted row streams with a min-heap",
          message,
          matrix: {
            label: "sorted rows",
            values: matrix,
            active: cell ? [cell] : [],
            done: copy(done),
          },
          arrays: [
            array("min-heap: value @ row,column", labels, active),
            array("removed in ascending order", removed),
          ],
          vars: {
            k,
            removedCount: removed.length,
            nextMinimum: heap[0]?.[0] ?? null,
          },
        });
      }
      function push(item) {
        heap.push(item);
        let i = heap.length - 1;
        draw(
          `Push ${item[0]} from row ${item[1]}, column ${item[2]}.`,
          [i],
          [item[1], item[2]],
        );
        while (i) {
          const p = (i - 1) >> 1;
          if (heap[p][0] <= heap[i][0]) break;
          [heap[i], heap[p]] = [heap[p], heap[i]];
          draw("Sift the smaller candidate upward to restore min-heap order.", [
            i,
            p,
          ]);
          i = p;
        }
      }
      function pop() {
        const out = heap[0],
          tail = heap.pop();
        if (heap.length) {
          heap[0] = tail;
          let i = 0;
          while (true) {
            let j = i * 2 + 1;
            if (j >= heap.length) break;
            if (j + 1 < heap.length && heap[j + 1][0] < heap[j][0]) j++;
            if (heap[i][0] <= heap[j][0]) break;
            [heap[i], heap[j]] = [heap[j], heap[i]];
            draw(
              "Sift the replacement down after extracting the smallest candidate.",
              [i, j],
            );
            i = j;
          }
        }
        return out;
      }
      matrix.forEach((row, r) => {
        if (row.length) push([row[0], r, 0]);
      });
      let value;
      for (let i = 0; i < k; i++) {
        const [v, r, c] = pop();
        value = v;
        removed.push(v);
        done.push([r, c]);
        draw(
          `Extract number ${i + 1}: ${v}. Only row ${r} needs to offer its next value.`,
          [],
          [r, c],
        );
        if (c + 1 < matrix[r].length) push([matrix[r][c + 1], r, c + 1]);
      }
      return value;
    },
  );
})();
