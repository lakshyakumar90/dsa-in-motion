/* Exact worked traces for Foundation, Arrays, Linked Lists, Strings and Stacks. */
(() => {
  const R = globalThis.PROBLEM_TRACES || (globalThis.PROBLEM_TRACES = {});
  const arr = (x, name = "nums") => {
    if (
      !Array.isArray(x) ||
      x.length > 24 ||
      x.some((v) => typeof v !== "number" || !Number.isFinite(v))
    )
      throw Error(`${name} must be an array of at most 24 finite numbers.`);
    return [...x];
  };
  const str = (x, name = "s") => {
    if (typeof x !== "string" || x.length > 60)
      throw Error(`${name} must be a string of at most 60 characters.`);
    return x;
  };
  const integer = (x, name = "n") => {
    if (!Number.isSafeInteger(x))
      throw Error(`${name} must be a safe integer.`);
    return x;
  };
  const A = (label, values, active = [], pointers = {}) => ({
    label,
    values: [...values],
    active,
    pointers,
  });
  const frame = (emit, title, message, arrays = [], vars = {}, extra = {}) =>
    emit({ title, message, arrays, vars, ...extra });
  function reg(name, input, fn) {
    R[name] = {
      input,
      run(i, e) {
        let last = {};
        const capture = (f) => {
          last = f;
          e(f);
        };
        frame(
          capture,
          "Read the input",
          `Start ${name} with the supplied input.`,
          [],
          i,
        );
        const answer = fn(i, capture);
        e({
          ...last,
          title: "Result",
          message: `${name} is complete.`,
          output: answer,
        });
        return answer;
      },
    };
  }
  reg("Sum", { a: 4, b: 7 }, ({ a, b }, e) => {
    integer(a, "a");
    integer(b, "b");
    frame(
      e,
      "Add both operands",
      `${a} + ${b} = ${a + b}`,
      [A("Operands", [a, b], [0, 1])],
      { a, b, sum: a + b },
    );
    return a + b;
  });
  reg("Second Largest", { s: "dfa12321afd" }, ({ s }, e) => {
    s = str(s);
    let seen = Array(10).fill(false);
    for (let j = 0; j < s.length; j++) {
      if (/[0-9]/.test(s[j])) seen[+s[j]] = true;
      frame(
        e,
        "Record the digit",
        /\d/.test(s[j])
          ? `Digit ${s[j]} is present.`
          : `Ignore non-digit ${s[j]}.`,
        [
          A("String", [...s], [j]),
          A(
            "Digits 0–9",
            seen.map((v, j) => (v ? j : "·")),
            /\d/.test(s[j]) ? [+s[j]] : [],
          ),
        ],
      );
    }
    let count = 0;
    for (let d = 9; d >= 0; d--) {
      if (seen[d]) count++;
      frame(
        e,
        "Scan descending digits",
        `Digit ${d}: ${seen[d] ? "present" : "absent"}. Distinct digits encountered = ${count}.`,
        [
          A(
            "Digits",
            seen.map((v, j) => (v ? j : "·")),
            [d],
          ),
        ],
        { count },
      );
      if (count === 2) return d;
    }
    return -1;
  });
  reg("Palindrome Number", { x: 1221 }, ({ x }, e) => {
    integer(x, "x");
    if (x < 0 || (x % 10 === 0 && x !== 0)) {
      frame(
        e,
        "Reject the boundary case",
        "A negative number or nonzero trailing zero cannot be a palindrome.",
        [],
        { x },
      );
      return false;
    }
    let half = 0;
    while (x > half) {
      let digit = x % 10;
      half = half * 10 + digit;
      x = Math.floor(x / 10);
      frame(
        e,
        "Reverse one digit",
        `Move digit ${digit} from the remaining number into the reversed half.`,
        [
          A("Remaining digits", [...String(x)]),
          A("Reversed half", [...String(half)]),
        ],
        { x, half },
      );
    }
    frame(
      e,
      "Compare the halves",
      "For odd length, remove the middle digit from the reversed half.",
      [],
      {
        remaining: x,
        reversedHalf: half,
        withoutMiddle: Math.floor(half / 10),
      },
    );
    return x === half || x === Math.floor(half / 10);
  });
  reg("Reverse Integer", { x: -120 }, ({ x }, e) => {
    integer(x, "x");
    let sign = Math.sign(x),
      r = 0;
    x = Math.abs(x);
    while (x) {
      let d = x % 10;
      r = r * 10 + d;
      x = Math.floor(x / 10);
      frame(
        e,
        "Append the last digit",
        `Remove ${d} and append it to the reversed number.`,
        [A("Remaining", [...String(x)]), A("Reversed", [...String(r)])],
        { sign, reversed: r },
      );
    }
    r *= sign;
    frame(
      e,
      "Check the 32-bit range",
      "Return zero if the reversed value overflows a signed 32-bit integer.",
      [],
      { reversed: r },
    );
    return r >= -(2 ** 31) && r < 2 ** 31 ? r : 0;
  });
  for (const [name, kind] of [
    ["Count Negative Numbers in an Array", "negative"],
    ["Find Smallest Number in an Array", "min"],
    ["Find Largest Number in an Array", "max"],
  ])
    reg(name, { nums: [4, -2, 9, -7, 0] }, ({ nums }, e) => {
      let a = arr(nums);
      if (kind !== "negative" && !a.length)
        throw Error("Use a nonempty array.");
      let result = kind === "negative" ? 0 : a[0];
      for (let j = 0; j < a.length; j++) {
        let old = result;
        result =
          kind === "negative"
            ? result + (a[j] < 0)
            : kind === "min"
              ? Math.min(result, a[j])
              : Math.max(result, a[j]);
        frame(
          e,
          kind === "negative" ? "Count negatives" : "Update the best value",
          `${a[j]} ${result !== old ? "changes" : "does not change"} the running answer.`,
          [A("Input", a, [j], { scan: j })],
          { answer: result },
        );
      }
      return result;
    });
  reg(
    "Binary Search",
    { nums: [1, 3, 5, 7, 9, 11, 13], target: 9 },
    ({ nums, target }, e) => {
      let a = arr(nums);
      integer(target, "target");
      if (a.some((v, j) => j && v <= a[j - 1]))
        throw Error("nums must be strictly increasing.");
      let lo = 0,
        hi = a.length - 1;
      while (lo <= hi) {
        let mid = lo + Math.floor((hi - lo) / 2);
        frame(
          e,
          "Compare the middle",
          `Compare ${a[mid]} with target ${target}.`,
          [A("Sorted array", a, [mid], { lo, mid, hi })],
          { lo, hi, mid, target },
        );
        if (a[mid] === target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
        frame(
          e,
          "Discard an impossible half",
          `Only indices ${lo} through ${hi} can still contain the target.`,
          [A("Sorted array", a, [], { lo, hi })],
          { lo, hi },
        );
      }
      return -1;
    },
  );
  reg("Merge Sort", { nums: [4, 1, 3, 2] }, ({ nums }, e) => {
    let a = arr(nums);
    function sort(v, offset) {
      if (v.length < 2) return v;
      let m = Math.floor(v.length / 2);
      frame(
        e,
        "Split the range",
        `Divide [${v}] into [${v.slice(0, m)}] and [${v.slice(m)}].`,
        [
          A(
            "Original input",
            a,
            Array.from({ length: v.length }, (_, j) => offset + j),
          ),
          A("Left", v.slice(0, m)),
          A("Right", v.slice(m)),
        ],
      );
      let l = sort(v.slice(0, m), offset),
        r = sort(v.slice(m), offset + m),
        out = [],
        i = 0,
        j = 0;
      while (i < l.length || j < r.length) {
        let takeLeft = j === r.length || (i < l.length && l[i] <= r[j]);
        out.push(takeLeft ? l[i++] : r[j++]);
        frame(
          e,
          "Merge sorted halves",
          `Take the smaller available front value: ${out.at(-1)}.`,
          [
            A("Left", l, [], { i }),
            A("Right", r, [], { j }),
            A("Merged", out, [out.length - 1]),
          ],
        );
      }
      return out;
    }
    return sort(a, 0);
  });
  reg("Power of Two", { n: 16 }, ({ n }, e) => {
    integer(n);
    if (n <= 0) return false;
    let b = BigInt(n),
      c = b - 1n;
    frame(
      e,
      "Write the bits",
      "A power of two contains exactly one set bit.",
      [A("n", [...b.toString(2)]), A("n − 1", [...c.toString(2)])],
      { n },
    );
    let mask = b & c;
    frame(
      e,
      "Clear the lowest set bit",
      "n & (n − 1) removes exactly the lowest 1 bit.",
      [A("Bitwise AND", [...mask.toString(2)])],
      { remainingBits: mask.toString(2) },
    );
    return mask === 0n;
  });
  reg("Remove Duplicates", { nums: [0, 0, 1, 1, 2, 3, 3] }, ({ nums }, e) => {
    let a = arr(nums);
    if (a.some((v, j) => j && v < a[j - 1]))
      throw Error("nums must be sorted.");
    let k = 0;
    for (let r = 0; r < a.length; r++) {
      if (r === 0 || a[r] !== a[r - 1]) a[k++] = a[r];
      frame(
        e,
        "Build a unique prefix",
        `Read index ${r}. The first ${k} positions are distinct.`,
        [
          A("Array", a, [r], { read: r, write: k }),
          A("Valid prefix", a.slice(0, k)),
        ],
        { k },
      );
    }
    return { length: k, prefix: a.slice(0, k) };
  });
  reg(
    "Remove Element",
    { nums: [3, 2, 2, 3, 4], val: 3 },
    ({ nums, val }, e) => {
      let a = arr(nums),
        k = 0;
      integer(val, "val");
      for (let r = 0; r < a.length; r++) {
        if (a[r] !== val) a[k++] = a[r];
        frame(
          e,
          "Keep or discard",
          `Value ${nums[r]} ${nums[r] === val ? "matches the removed value" : "belongs in the valid prefix"}.`,
          [
            A("Array", a, [r], { read: r, write: k }),
            A("Retained prefix", a.slice(0, k)),
          ],
          { val, k },
        );
      }
      return { length: k, prefix: a.slice(0, k) };
    },
  );
  reg("Reverse String", { s: "hello" }, ({ s }, e) => {
    let a = [...str(s)],
      l = 0,
      r = a.length - 1;
    while (l < r) {
      frame(e, "Choose the symmetric pair", `Swap positions ${l} and ${r}.`, [
        A("Characters", a, [l, r], { left: l, right: r }),
      ]);
      [a[l], a[r]] = [a[r], a[l]];
      frame(e, "Swap the pair", "Both outside positions are now final.", [
        A("Characters", a, [l, r]),
      ]);
      l++;
      r--;
    }
    return a.join("");
  });
  reg(
    "Best Time to Buy and Sell Stocks",
    { prices: [7, 1, 5, 3, 6, 4] },
    ({ prices }, e) => {
      let a = arr(prices, "prices"),
        low = Infinity,
        profit = 0,
        buy = -1;
      for (let day = 0; day < a.length; day++) {
        if (a[day] < low) {
          low = a[day];
          buy = day;
        }
        profit = Math.max(profit, a[day] - low);
        frame(
          e,
          "Consider selling today",
          `Best prior buy is ${low}; today’s profit is ${a[day] - low}.`,
          [A("Prices", a, [day], { buy, sell: day })],
          { minimumPrice: low, bestProfit: profit },
        );
      }
      return profit;
    },
  );
  reg(
    "Merge Sorted Arrays",
    { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
    ({ nums1, m, nums2, n }, e) => {
      let a = arr(nums1, "nums1"),
        b = arr(nums2, "nums2");
      integer(m, "m");
      integer(n, "n");
      if (m < 0 || n < 0 || m + n !== a.length || n !== b.length)
        throw Error("nums1 needs m+n slots and nums2 needs n elements.");
      let i = m - 1,
        j = n - 1,
        k = m + n - 1;
      while (j >= 0) {
        frame(
          e,
          "Choose the larger tail",
          "Write backwards so unread values are never overwritten.",
          [A("nums1", a, [], { i, write: k }), A("nums2", b, [], { j })],
        );
        if (i >= 0 && a[i] > b[j]) a[k--] = a[i--];
        else a[k--] = b[j--];
        frame(
          e,
          "Fill the merged suffix",
          "The suffix to the right of write is complete.",
          [A("nums1", a, [k + 1], { i, write: k }), A("nums2", b, [], { j })],
        );
      }
      return a;
    },
  );
  reg("Move Zeros", { nums: [0, 1, 0, 3, 12] }, ({ nums }, e) => {
    let a = arr(nums),
      write = 0;
    for (let read = 0; read < a.length; read++) {
      if (a[read] !== 0) {
        [a[write], a[read]] = [a[read], a[write]];
        write++;
      }
      frame(
        e,
        "Compact nonzero values",
        "Swap the next nonzero into the first available prefix slot.",
        [A("Array", a, [read], { read, write })],
        { nonzeroCount: write },
      );
    }
    return a;
  });
  reg("Max Consecutive Ones", { nums: [1, 1, 0, 1, 1, 1] }, ({ nums }, e) => {
    let a = arr(nums),
      run = 0,
      best = 0;
    if (a.some((v) => v !== 0 && v !== 1))
      throw Error("Use only zeros and ones.");
    a.forEach((v, j) => {
      run = v === 1 ? run + 1 : 0;
      best = Math.max(best, run);
      frame(
        e,
        "Update the current run",
        v ? "Extend the consecutive run." : "Zero ends the current run.",
        [A("Binary array", a, [j], { scan: j })],
        { run, best },
      );
    });
    return best;
  });
  reg("Missing Number", { nums: [3, 0, 1] }, ({ nums }, e) => {
    let a = arr(nums),
      n = a.length;
    if (
      a.some((v) => !Number.isInteger(v) || v < 0 || v > n) ||
      new Set(a).size !== n
    )
      throw Error("Use distinct integers from 0 through nums.length.");
    let result = n;
    for (let i = 0; i < n; i++) {
      result ^= i ^ a[i];
      frame(
        e,
        "Cancel paired numbers",
        `XOR the index ${i} and value ${a[i]}; paired values cancel.`,
        [A("Values", a, [i])],
        { index: i, xor: result },
      );
    }
    return result;
  });
  reg("Single Number", { nums: [4, 1, 2, 1, 2] }, ({ nums }, e) => {
    let a = arr(nums),
      result = 0;
    if (
      a.some((v) => !Number.isInteger(v) || v < -2147483648 || v > 2147483647)
    )
      throw Error("Use signed 32-bit integers.");
    for (let i = 0; i < a.length; i++) {
      result ^= a[i];
      frame(
        e,
        "XOR the next value",
        `Equal pairs cancel; ${result} is the XOR of the processed prefix.`,
        [A("Values", a, [i])],
        { xor: result },
      );
    }
    return result;
  });

  /* Linked-list nodes retain their identity while edges and pointer labels move. */
  function linked(
    e,
    a,
    next,
    vars = {},
    active = [],
    message = "Follow the node references.",
  ) {
    let ids = a.map((_, i) => String(i));
    frame(e, "Linked-list state", message, [], vars, {
      nodes: a.map((v, i) => ({
        id: ids[i],
        label: String(v),
        x: 60 + i * 85,
        y: 120,
        state: active.includes(i) ? "active" : "muted",
      })),
      edges: next.flatMap((to, from) =>
        to === null || to === undefined
          ? []
          : [{ from: String(from), to: String(to) }],
      ),
    });
  }
  const chain = (a) => a.map((_, i) => (i + 1 < a.length ? i + 1 : null));
  function indices(next, head, limit = 50) {
    let a = [],
      seen = new Set();
    while (
      head !== null &&
      head !== undefined &&
      a.length < limit &&
      !seen.has(head)
    ) {
      a.push(head);
      seen.add(head);
      head = next[head];
    }
    return a;
  }
  reg(
    "Design Linked List",
    {
      operations: [
        ["addAtHead", 1],
        ["addAtTail", 3],
        ["addAtIndex", 1, 2],
        ["get", 1],
        ["deleteAtIndex", 1],
        ["get", 1],
      ],
    },
    ({ operations }, e) => {
      if (!Array.isArray(operations) || operations.length > 20)
        throw Error("Use up to 20 linked-list operations.");
      let a = [],
        answer = [];
      for (let op of operations) {
        let [name, i, v] = op;
        if (name === "addAtHead") a.unshift(i);
        else if (name === "addAtTail") a.push(i);
        else if (name === "addAtIndex") {
          if (i <= a.length) a.splice(Math.max(0, i), 0, v);
        } else if (name === "deleteAtIndex") {
          if (i >= 0 && i < a.length) a.splice(i, 1);
        } else if (name === "get")
          answer.push(i >= 0 && i < a.length ? a[i] : -1);
        else throw Error("Unknown linked-list operation.");
        linked(
          e,
          a,
          chain(a),
          { operation: name, index: i, returns: answer },
          [],
          `Execute ${op.join(" ")}. Relink affected neighbors.`,
        );
      }
      return { list: a, returns: answer };
    },
  );
  reg("Middle of Linked List", { values: [1, 2, 3, 4, 5] }, ({ values }, e) => {
    let a = arr(values, "values"),
      next = chain(a),
      slow = 0,
      fast = 0;
    if (!a.length) return [];
    while (fast !== null && next[fast] !== null) {
      slow = next[slow];
      fast = next[next[fast]];
      linked(
        e,
        a,
        next,
        { slow, fast },
        [slow, fast],
        "Slow advances once; fast advances twice.",
      );
    }
    return a.slice(slow);
  });
  reg("Reverse Linked List", { values: [1, 2, 3, 4, 5] }, ({ values }, e) => {
    let a = arr(values, "values"),
      next = chain(a),
      prev = null,
      curr = a.length ? 0 : null;
    linked(e, a, next, { prev, curr });
    while (curr !== null) {
      let saved = next[curr];
      frame(
        e,
        "Save the untouched suffix",
        `Save next = ${saved ?? "null"} before changing the arrow.`,
        [],
        { prev, curr, next: saved },
      );
      next[curr] = prev;
      linked(
        e,
        a,
        next,
        { prev, curr, savedNext: saved },
        [curr],
        "Turn curr.next back toward prev.",
      );
      prev = curr;
      curr = saved;
    }
    return a.slice().reverse();
  });
  reg(
    "Linked List Cycle",
    { values: [3, 2, 0, -4], pos: 1 },
    ({ values, pos }, e) => {
      let a = arr(values, "values");
      integer(pos, "pos");
      if (pos < -1 || pos >= a.length)
        throw Error("pos must be -1 or a valid node index.");
      let next = chain(a);
      if (a.length) next[a.length - 1] = pos === -1 ? null : pos;
      let slow = a.length ? 0 : null,
        fast = slow;
      for (
        let count = 0;
        fast !== null && next[fast] !== null && count < 100;
        count++
      ) {
        slow = next[slow];
        fast = next[next[fast]];
        linked(
          e,
          a,
          next,
          { slow, fast },
          [slow, fast],
          "Advance slow by one edge and fast by two.",
        );
        if (slow === fast) {
          frame(
            e,
            "Pointers meet",
            "Equal node identities prove that a cycle exists.",
            [],
            { meetingNode: slow },
          );
          return true;
        }
      }
      return false;
    },
  );
  reg("Palindrome Linked List", { values: [1, 2, 2, 1] }, ({ values }, e) => {
    let a = arr(values, "values"),
      next = chain(a),
      slow = 0,
      fast = 0;
    while (fast < a.length && fast + 1 < a.length) {
      slow++;
      fast += 2;
      linked(
        e,
        a,
        next,
        { slow, fast: fast < a.length ? fast : null },
        [slow],
        "Locate the second half with fast and slow pointers.",
      );
    }
    let prev = null,
      curr = slow < a.length ? slow : null;
    while (curr !== null) {
      let n = next[curr];
      next[curr] = prev;
      linked(
        e,
        a,
        next,
        { prev, curr },
        [curr],
        "Reverse the second half for a forward comparison.",
      );
      prev = curr;
      curr = n;
    }
    let l = 0,
      r = prev;
    while (r !== null) {
      linked(
        e,
        a,
        next,
        { left: l, right: r },
        [l, r],
        `Compare ${a[l]} and ${a[r]}.`,
      );
      if (a[l] !== a[r]) return false;
      l++;
      r = next[r];
    }
    return true;
  });
  for (const name of ["Intersection of two Linked Lists"])
    reg(
      name,
      { listA: [4, 1], listB: [5, 6, 1], shared: [8, 4, 5] },
      ({ listA, listB, shared }, e) => {
        let av = arr(listA, "listA"),
          bv = arr(listB, "listB"),
          sv = arr(shared, "shared"),
          a = [...av, ...sv],
          b = [...bv, ...sv],
          aid = [...av.map((_, i) => "a" + i), ...sv.map((_, i) => "s" + i)],
          bid = [...bv.map((_, i) => "b" + i), ...sv.map((_, i) => "s" + i)],
          p = 0,
          q = 0,
          passA = false,
          passB = false;
        let pathA = [...aid, null, ...bid, null],
          pathB = [...bid, null, ...aid, null];
        for (let k = 0; k < pathA.length; k++) {
          let pa = pathA[k],
            pb = pathB[k];
          let nodes = [
            ...av.map((v, i) => ({
              id: "a" + i,
              label: String(v),
              x: 50 + i * 75,
              y: 70,
              state: pa === "a" + i || pb === "a" + i ? "active" : "done",
            })),
            ...bv.map((v, i) => ({
              id: "b" + i,
              label: String(v),
              x: 50 + i * 75,
              y: 190,
              state: pa === "b" + i || pb === "b" + i ? "active" : "done",
            })),
            ...sv.map((v, i) => ({
              id: "s" + i,
              label: String(v),
              x: 320 + i * 75,
              y: 130,
              state: pa === "s" + i || pb === "s" + i ? "active" : "done",
            })),
          ];
          let edges = [];
          for (let list of [aid, bid])
            for (let j = 0; j < list.length - 1; j++)
              if (
                !edges.some((x) => x.from === list[j] && x.to === list[j + 1])
              )
                edges.push({ from: list[j], to: list[j + 1] });
          frame(
            e,
            "Walk both paths",
            "At null, switch to the other head. Both pointers then walk the same total distance.",
            [],
            { pointerA: pa ?? "null", pointerB: pb ?? "null" },
            { nodes, edges },
          );
          if (pa === pb) return pa === null ? null : sv[Number(pa.slice(1))];
        }
        return null;
      },
    );
  reg(
    "Remove Linked List Elements",
    { values: [1, 2, 6, 3, 4, 5, 6], val: 6 },
    ({ values, val }, e) => {
      let a = arr(values, "values"),
        next = chain(a),
        head = a.length ? 0 : null,
        prev = null,
        curr = head;
      while (curr !== null) {
        let n = next[curr];
        if (a[curr] === val) {
          if (prev === null) head = n;
          else next[prev] = n;
          next[curr] = null;
          linked(
            e,
            a,
            next,
            { head, prev, curr },
            [curr],
            `Bypass node ${curr}, whose value matches ${val}.`,
          );
        } else {
          prev = curr;
          linked(
            e,
            a,
            next,
            { head, prev, curr },
            [curr],
            "Retain this node and advance the predecessor.",
          );
        }
        curr = n;
      }
      return indices(next, head).map((i) => a[i]);
    },
  );
  reg(
    "Remove nth node from end of List",
    { values: [1, 2, 3, 4, 5], n: 2 },
    ({ values, n }, e) => {
      let a = arr(values, "values");
      integer(n);
      if (n < 1 || n > a.length)
        throw Error("n must be between 1 and the list length.");
      let next = chain(a),
        fast = 0;
      for (let k = 0; k < n; k++) {
        fast = fast === null ? null : next[fast];
        linked(
          e,
          a,
          next,
          { fast, gap: k + 1 },
          [fast],
          "Advance fast to create a gap of n nodes.",
        );
      }
      let slow = -1;
      while (fast !== null) {
        slow = slow === -1 ? 0 : next[slow];
        fast = next[fast];
        linked(
          e,
          a,
          next,
          { slow: slow === -1 ? "dummy" : slow, fast },
          [slow, fast],
          "Move both pointers until fast reaches null.",
        );
      }
      let removed = slow === -1 ? 0 : next[slow],
        head = removed === 0 ? next[0] : 0;
      if (slow !== -1) next[slow] = next[removed];
      next[removed] = null;
      linked(
        e,
        a,
        next,
        { head, removed },
        [removed],
        "Bypass the nth node from the end.",
      );
      return indices(next, head).map((i) => a[i]);
    },
  );
  reg(
    "Remove Duplicates from Sorted List",
    { values: [1, 1, 2, 3, 3] },
    ({ values }, e) => {
      let a = arr(values, "values"),
        next = chain(a),
        curr = a.length ? 0 : null;
      if (a.some((v, i) => i && v < a[i - 1]))
        throw Error("values must be sorted.");
      while (curr !== null && next[curr] !== null) {
        let n = next[curr];
        if (a[curr] === a[n]) {
          next[curr] = next[n];
          next[n] = null;
          linked(
            e,
            a,
            next,
            { curr },
            [curr, n],
            "Equal adjacent values: bypass the duplicate node.",
          );
        } else {
          curr = n;
          linked(
            e,
            a,
            next,
            { curr },
            [curr],
            "A new distinct value begins here.",
          );
        }
      }
      return indices(next, a.length ? 0 : null).map((i) => a[i]);
    },
  );
  reg("Odd Even Linked List", { values: [1, 2, 3, 4, 5] }, ({ values }, e) => {
    let a = arr(values, "values"),
      next = chain(a);
    if (a.length < 2) return a;
    let odd = 0,
      even = 1,
      evenHead = 1;
    while (even !== null && next[even] !== null) {
      next[odd] = next[even];
      odd = next[odd];
      next[even] = next[odd];
      even = next[even];
      linked(
        e,
        a,
        next,
        { odd, even, evenHead },
        [odd, even],
        "Link the next odd-positioned node, then the next even-positioned node.",
      );
    }
    next[odd] = evenHead;
    linked(
      e,
      a,
      next,
      { odd, evenHead },
      [odd, evenHead],
      "Join the odd chain to the saved even head.",
    );
    return indices(next, 0).map((i) => a[i]);
  });
  reg(
    "Add Two Numbers",
    { list1: [2, 4, 3], list2: [5, 6, 4] },
    ({ list1, list2 }, e) => {
      let a = arr(list1, "list1"),
        b = arr(list2, "list2");
      if ([...a, ...b].some((v) => !Number.isInteger(v) || v < 0 || v > 9))
        throw Error("List values must be decimal digits.");
      let carry = 0,
        out = [];
      for (let i = 0; i < a.length || i < b.length || carry; i++) {
        let total = (a[i] ?? 0) + (b[i] ?? 0) + carry;
        out.push(total % 10);
        carry = Math.floor(total / 10);
        frame(
          e,
          "Add one digit and the carry",
          `${a[i] ?? 0} + ${b[i] ?? 0} + incoming carry gives ${total}.`,
          [
            A("First number (reverse digits)", a, [i]),
            A("Second number", b, [i]),
            A("Result digits", out, [i]),
          ],
          { total, carry },
        );
      }
      return out;
    },
  );
  reg(
    "Merge Two Sorted Lists",
    { list1: [1, 2, 4], list2: [1, 3, 4] },
    ({ list1, list2 }, e) => {
      let a = arr(list1, "list1"),
        b = arr(list2, "list2");
      if (
        a.some((v, i) => i && v < a[i - 1]) ||
        b.some((v, i) => i && v < b[i - 1])
      )
        throw Error("Both lists must be sorted.");
      let i = 0,
        j = 0,
        out = [];
      while (i < a.length || j < b.length) {
        let takeA = j === b.length || (i < a.length && a[i] <= b[j]);
        out.push(takeA ? a[i++] : b[j++]);
        frame(
          e,
          "Append the smaller head",
          "The output remains sorted because each input suffix is sorted.",
          [
            A("First list", a, [], { head: i }),
            A("Second list", b, [], { head: j }),
            A("Merged chain", out, [out.length - 1]),
          ],
        );
      }
      return out;
    },
  );
  reg("Rotate List", { values: [1, 2, 3, 4, 5], k: 2 }, ({ values, k }, e) => {
    let a = arr(values, "values");
    integer(k, "k");
    if (k < 0) throw Error("k must be nonnegative.");
    if (!a.length) return [];
    let next = chain(a),
      shift = k % a.length;
    next[a.length - 1] = 0;
    linked(
      e,
      a,
      next,
      { k, shift },
      [a.length - 1, 0],
      "Temporarily connect tail to head to form a ring.",
    );
    let tail = a.length - shift - 1;
    for (let j = 0; j <= tail; j++)
      linked(
        e,
        a,
        next,
        { newTailCandidate: j },
        [j],
        "Walk to the node just before the new head.",
      );
    let head = next[tail];
    next[tail] = null;
    linked(
      e,
      a,
      next,
      { head, tail },
      [head, tail],
      "Break the ring after the new tail.",
    );
    return indices(next, head).map((i) => a[i]);
  });
  reg("Swap Nodes in Pairs", { values: [1, 2, 3, 4, 5] }, ({ values }, e) => {
    let a = arr(values, "values"),
      next = chain(a),
      head = a.length ? 0 : null,
      prev = null,
      curr = head;
    while (curr !== null && next[curr] !== null) {
      let b = next[curr],
        after = next[b];
      next[b] = curr;
      next[curr] = after;
      if (prev === null) head = b;
      else next[prev] = b;
      linked(
        e,
        a,
        next,
        { head, previousTail: prev, first: curr, second: b },
        [curr, b],
        "Relink previous → second → first → after. Node values stay unchanged.",
      );
      prev = curr;
      curr = after;
    }
    return indices(next, head).map((i) => a[i]);
  });

  /* Strings: characters, counts, boundaries, and parsing stacks. */
  reg("Length of Last Word", { s: "Hello World  " }, ({ s }, e) => {
    s = str(s);
    let i = s.length - 1,
      count = 0;
    while (i >= 0 && s[i] === " ") {
      frame(
        e,
        "Skip trailing spaces",
        "A trailing space is not part of the last word.",
        [A("Characters", [...s], [i])],
        { i },
      );
      i--;
    }
    while (i >= 0 && s[i] !== " ") {
      count++;
      frame(
        e,
        "Count the last word",
        "Move left until the previous word boundary.",
        [A("Characters", [...s], [i])],
        { length: count },
      );
      i--;
    }
    return count;
  });
  reg(
    "Find Words Containing Character",
    { words: ["leet", "code", "apple"], x: "e" },
    ({ words, x }, e) => {
      if (!Array.isArray(words) || words.length > 20)
        throw Error("words must be an array of at most 20 strings.");
      if (
        words.reduce((n, w) => n + (typeof w === "string" ? w.length : 0), 0) >
        200
      )
        throw Error("Use at most 200 characters across all words.");
      x = str(x, "x");
      if (x.length !== 1) throw Error("x must be a single character.");
      let out = [];
      for (let i = 0; i < words.length; i++) {
        let word = str(words[i], "word"),
          found = false;
        for (let j = 0; j < word.length; j++) {
          if (word[j] === x) found = true;
          frame(
            e,
            "Inspect this word",
            `Compare ${word[j]} with ${x}.`,
            [A("Word", [...word], [j])],
            { wordIndex: i, found },
          );
          if (found) break;
        }
        if (found) out.push(i);
        frame(
          e,
          "Record the matching index",
          found
            ? `Word ${i} contains ${x}.`
            : `Word ${i} does not contain ${x}.`,
          [A("Matching indices", out)],
          { wordIndex: i },
        );
      }
      return out;
    },
  );
  reg(
    "Jewels and Stones",
    { jewels: "aA", stones: "aAAbbbb" },
    ({ jewels, stones }, e) => {
      let j = new Set(str(jewels, "jewels")),
        s = str(stones, "stones"),
        count = 0;
      for (let i = 0; i < s.length; i++) {
        let match = j.has(s[i]);
        count += match;
        frame(
          e,
          "Test membership",
          `${s[i]} ${match ? "is" : "is not"} a jewel.`,
          [A("Stones", [...s], [i]), A("Jewel types", [...j])],
          { count },
        );
      }
      return count;
    },
  );
  reg(
    "Find Most Frequent Vowel and Consonant",
    { s: "successes" },
    ({ s }, e) => {
      s = str(s);
      if (/[^a-z]/.test(s)) throw Error("Use lowercase English letters.");
      let counts = {},
        v = 0,
        c = 0;
      for (let i = 0; i < s.length; i++) {
        counts[s[i]] = (counts[s[i]] ?? 0) + 1;
        let vowel = "aeiou".includes(s[i]);
        if (vowel) v = Math.max(v, counts[s[i]]);
        else c = Math.max(c, counts[s[i]]);
        frame(
          e,
          "Update the frequency table",
          `${s[i]} is a ${vowel ? "vowel" : "consonant"}.`,
          [
            A("String", [...s], [i]),
            A(
              "Counts",
              Object.entries(counts).map(([k, v]) => `${k}:${v}`),
            ),
          ],
          { maxVowel: v, maxConsonant: c },
        );
      }
      return v + c;
    },
  );
  reg("Split a String in Balanced Strings", { s: "RLRRLLRLRL" }, ({ s }, e) => {
    s = str(s);
    if (/[^LR]/.test(s)) throw Error("Use only L and R.");
    let balance = 0,
      count = 0,
      start = 0;
    for (let i = 0; i < s.length; i++) {
      balance += s[i] === "L" ? 1 : -1;
      if (balance === 0) count++;
      frame(
        e,
        balance === 0
          ? "Close a balanced segment"
          : "Extend the current segment",
        balance === 0
          ? `Segment ${start}…${i} has equal L and R.`
          : "Track the difference between L and R.",
        [A("String", [...s], [i], { segmentStart: start, scan: i })],
        { balance, count },
      );
      if (balance === 0) start = i + 1;
    }
    if (balance !== 0) throw Error("The full input must be balanced.");
    return count;
  });
  reg("Reverse String II", { s: "abcdefg", k: 2 }, ({ s, k }, e) => {
    let a = [...str(s)];
    integer(k, "k");
    if (k < 1) throw Error("k must be positive.");
    for (let start = 0; start < a.length; start += 2 * k) {
      let l = start,
        r = Math.min(start + k - 1, a.length - 1);
      frame(
        e,
        "Choose the first k in this block",
        "Reverse the first k characters of each 2k block.",
        [A("Characters", a, [], { left: l, right: r })],
        { k, blockStart: start },
      );
      while (l < r) {
        [a[l], a[r]] = [a[r], a[l]];
        frame(
          e,
          "Swap the symmetric characters",
          `Swap indices ${l} and ${r}.`,
          [A("Characters", a, [l, r])],
        );
        l++;
        r--;
      }
    }
    return a.join("");
  });
  reg(
    "Valid Palindrome",
    { s: "A man, a plan, a canal: Panama" },
    ({ s }, e) => {
      s = str(s);
      let l = 0,
        r = s.length - 1;
      while (l < r) {
        if (!/[a-z0-9]/i.test(s[l])) {
          frame(
            e,
            "Skip punctuation",
            "Move the left boundary past a non-alphanumeric character.",
            [A("String", [...s], [l], { left: l, right: r })],
          );
          l++;
          continue;
        }
        if (!/[a-z0-9]/i.test(s[r])) {
          frame(
            e,
            "Skip punctuation",
            "Move the right boundary past a non-alphanumeric character.",
            [A("String", [...s], [r], { left: l, right: r })],
          );
          r--;
          continue;
        }
        frame(
          e,
          "Compare normalized characters",
          `Compare ${s[l].toLowerCase()} and ${s[r].toLowerCase()}.`,
          [A("String", [...s], [l, r], { left: l, right: r })],
        );
        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;
        l++;
        r--;
      }
      return true;
    },
  );
  reg("Largest Odd Number in a String", { num: "35420" }, ({ num }, e) => {
    num = str(num, "num");
    if (!/^\d+$/.test(num)) throw Error("num must contain decimal digits.");
    for (let i = num.length - 1; i >= 0; i--) {
      frame(
        e,
        "Find the rightmost odd digit",
        `${num[i]} is ${+num[i] % 2 ? "odd: keep the prefix ending here" : "even: remove this suffix digit"}.`,
        [A("Digits", [...num], [i])],
        { end: i },
      );
      if (+num[i] % 2) return num.slice(0, i + 1);
    }
    return "";
  });
  reg(
    "Longest Common Prefix",
    { strs: ["flower", "flow", "flight"] },
    ({ strs }, e) => {
      if (!Array.isArray(strs) || !strs.length || strs.length > 12)
        throw Error("Use 1–12 strings.");
      strs = strs.map((x) => str(x));
      let out = "";
      for (let i = 0; i < strs[0].length; i++) {
        let match = true;
        for (let j = 1; j < strs.length; j++) {
          frame(
            e,
            "Compare the same column",
            `Compare character ${i} in string 0 and string ${j}.`,
            strs.map((s, k) =>
              A(`String ${k}`, [...s], k === 0 || k === j ? [i] : []),
            ),
            { prefix: out },
          );
          if (strs[j][i] !== strs[0][i]) {
            match = false;
            break;
          }
        }
        if (!match) return out;
        out += strs[0][i];
        frame(
          e,
          "Extend the common prefix",
          `All strings contain ${out} at the beginning.`,
          [A("Prefix", [...out])],
        );
      }
      return out;
    },
  );
  reg("Valid Anagram", { s: "anagram", t: "nagaram" }, ({ s, t }, e) => {
    s = str(s);
    t = str(t, "t");
    if (s.length !== t.length) return false;
    let counts = {};
    for (let i = 0; i < s.length; i++) {
      counts[s[i]] = (counts[s[i]] ?? 0) + 1;
      counts[t[i]] = (counts[t[i]] ?? 0) - 1;
      frame(
        e,
        "Balance both character counts",
        `Add ${s[i]} from s and subtract ${t[i]} from t.`,
        [
          A("s", [...s], [i]),
          A("t", [...t], [i]),
          A(
            "Balance",
            Object.entries(counts).map(([k, v]) => `${k}:${v}`),
          ),
        ],
      );
    }
    return Object.values(counts).every((v) => v === 0);
  });
  reg("Isomorphic Strings", { s: "paper", t: "title" }, ({ s, t }, e) => {
    s = str(s);
    t = str(t, "t");
    if (s.length !== t.length) return false;
    let forward = {},
      back = {};
    for (let i = 0; i < s.length; i++) {
      let a = s[i],
        b = t[i],
        conflict =
          (a in forward && forward[a] !== b) || (b in back && back[b] !== a);
      frame(
        e,
        "Check the two-way mapping",
        conflict
          ? "This pair conflicts with an existing mapping."
          : `Map ${a} ↔ ${b}.`,
        [
          A("s", [...s], [i]),
          A("t", [...t], [i]),
          A(
            "Mapping",
            Object.entries(forward).map(([k, v]) => `${k}→${v}`),
          ),
        ],
        { conflict },
      );
      if (conflict) return false;
      forward[a] = b;
      back[b] = a;
    }
    return true;
  });
  reg(
    "Group Anagrams",
    { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] },
    ({ strs }, e) => {
      if (!Array.isArray(strs) || strs.length > 20)
        throw Error("Use at most 20 strings.");
      let groups = {};
      for (let i = 0; i < strs.length; i++) {
        let s = str(strs[i]),
          key = [...s].sort().join("");
        (groups[key] ??= []).push(s);
        frame(
          e,
          "Group by canonical signature",
          `${s} sorts to ${key}; words with the same signature are anagrams.`,
          [
            A("Words", strs, [i]),
            ...Object.entries(groups).map(([k, v]) =>
              A(`Signature ${k || "empty"}`, v),
            ),
          ],
          { signature: key },
        );
      }
      return Object.values(groups);
    },
  );
  reg("Minimum Add to Make Parentheses Valid", { s: "()))((" }, ({ s }, e) => {
    s = str(s);
    if (/[^()]/.test(s)) throw Error("Use only parentheses.");
    let open = 0,
      add = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") open++;
      else if (open) open--;
      else add++;
      frame(
        e,
        "Match or insert an opener",
        s[i] === "("
          ? "Save an unmatched opener."
          : open >= 0
            ? "Close an opener if available; otherwise insert one."
            : "",
        [
          A("Parentheses", [...s], [i]),
          A("Unmatched openers", Array(open).fill("(")),
        ],
        { open, insertions: add },
      );
    }
    return add + open;
  });
  reg("Reverse Words in a String", { s: "  the sky  is blue " }, ({ s }, e) => {
    s = str(s);
    let words = [],
      word = "";
    for (let i = 0; i <= s.length; i++) {
      if (i === s.length || s[i] === " ") {
        if (word) {
          words.push(word);
          frame(
            e,
            "Finish a word",
            `Save “${word}”; repeated spaces do not create words.`,
            [A("Words", words, [words.length - 1])],
          );
          word = "";
        }
      } else word += s[i];
    }
    let l = 0,
      r = words.length - 1;
    while (l < r) {
      [words[l], words[r]] = [words[r], words[l]];
      frame(e, "Swap the outside words", `Swap word ${l} and word ${r}.`, [
        A("Words", words, [l, r]),
      ]);
      l++;
      r--;
    }
    return words.join(" ");
  });
  reg("Sum of Beauty of All Substrings", { s: "aabcb" }, ({ s }, e) => {
    s = str(s);
    if (s.length > 14 || /[^a-z]/.test(s))
      throw Error("Use up to 14 lowercase letters.");
    let total = 0;
    for (let l = 0; l < s.length; l++) {
      let counts = {};
      for (let r = l; r < s.length; r++) {
        counts[s[r]] = (counts[s[r]] ?? 0) + 1;
        let v = Object.values(counts),
          beauty = Math.max(...v) - Math.min(...v);
        total += beauty;
        frame(
          e,
          "Extend this substring",
          `Substring “${s.slice(l, r + 1)}”: max frequency − min positive frequency = ${beauty}.`,
          [
            A(
              "String",
              [...s],
              Array.from({ length: r - l + 1 }, (_, j) => l + j),
              { left: l, right: r },
            ),
            A(
              "Counts",
              Object.entries(counts).map(([k, v]) => `${k}:${v}`),
            ),
          ],
          { beauty, total },
        );
      }
    }
    return total;
  });
  reg("Decode String", { s: "3[a2[c]]" }, ({ s }, e) => {
    s = str(s);
    let counts = [],
      prefixes = [],
      curr = "",
      num = 0;
    for (let i = 0; i < s.length; i++) {
      let c = s[i];
      if (/\d/.test(c)) num = num * 10 + +c;
      else if (c === "[") {
        counts.push(num);
        prefixes.push(curr);
        num = 0;
        curr = "";
      } else if (c === "]") {
        if (!counts.length) throw Error("Unbalanced encoded string.");
        let n = counts.pop();
        if (curr.length * n > 200)
          throw Error("Decoded output is limited to 200 characters.");
        curr = prefixes.pop() + curr.repeat(n);
      } else curr += c;
      frame(
        e,
        c === "]" ? "Close and expand the group" : "Parse the next token",
        `Read ${c}; keep repeat counts and prior prefixes on parallel stacks.`,
        [
          A("Encoded string", [...s], [i]),
          A("Repeat-count stack", counts),
          A("Prefix stack", prefixes),
          A("Current decoded characters", [...curr]),
        ],
        { number: num },
      );
    }
    if (counts.length) throw Error("Unbalanced encoded string.");
    return curr;
  });
  reg("Count and Say", { n: 5 }, ({ n }, e) => {
    integer(n);
    if (n < 1 || n > 8) throw Error("Use n between 1 and 8.");
    let curr = "1";
    for (let term = 2; term <= n; term++) {
      let next = "";
      for (let i = 0; i < curr.length;) {
        let j = i;
        while (j < curr.length && curr[j] === curr[i]) j++;
        next += `${j - i}${curr[i]}`;
        frame(
          e,
          "Describe one equal run",
          `There are ${j - i} copies of digit ${curr[i]}.`,
          [
            A(
              "Previous term",
              [...curr],
              Array.from({ length: j - i }, (_, k) => i + k),
            ),
            A("Next term", [...next]),
          ],
          { term },
        );
        i = j;
      }
      curr = next;
    }
    return curr;
  });
  reg("Reorganize String", { s: "aaabbc" }, ({ s }, e) => {
    s = str(s);
    let counts = {};
    for (let c of s) counts[c] = (counts[c] ?? 0) + 1;
    if (Math.max(0, ...Object.values(counts)) > Math.ceil(s.length / 2)) {
      frame(
        e,
        "Check feasibility",
        "One character occurs too often to separate every pair.",
        [
          A(
            "Counts",
            Object.entries(counts).map(([k, v]) => `${k}:${v}`),
          ),
        ],
      );
      return "";
    }
    let out = "",
      prev = "";
    while (out.length < s.length) {
      let candidates = Object.keys(counts)
        .filter((c) => counts[c] > 0 && c !== prev)
        .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
      if (!candidates.length) return "";
      let c = candidates[0];
      out += c;
      counts[c]--;
      prev = c;
      frame(
        e,
        "Take the largest available count",
        `Append ${c}; the previously used character is temporarily unavailable.`,
        [
          A("Output", [...out], [out.length - 1]),
          A(
            "Remaining counts",
            Object.entries(counts).map(([k, v]) => `${k}:${v}`),
          ),
        ],
        { previous: prev },
      );
    }
    return out;
  });
  reg("Repeated String Match", { a: "abcd", b: "cdabcdab" }, ({ a, b }, e) => {
    a = str(a, "a");
    b = str(b, "b");
    if (!a.length) throw Error("a must not be empty.");
    let built = "",
      limit = Math.ceil(b.length / a.length) + 1;
    for (let count = 1; count <= limit; count++) {
      built += a;
      frame(
        e,
        "Append one complete copy",
        `After ${count} copies, test whether b is a contiguous substring.`,
        [A("Repeated a", [...built]), A("Target b", [...b])],
        { copies: count, matchIndex: built.indexOf(b) },
      );
      if (built.includes(b)) return count;
    }
    return -1;
  });

  /* Stacks and queues expose push, pop, transfers and monotonic decisions. */
  reg(
    "Implement Stack",
    { operations: [["push", 1], ["push", 2], ["top"], ["pop"], ["empty"]] },
    ({ operations }, e) => {
      if (!Array.isArray(operations) || operations.length > 24)
        throw Error("Use at most 24 operations.");
      let stack = [],
        out = [];
      for (let [op, v] of operations) {
        if (op === "push") stack.push(v);
        else if (op === "pop") out.push(stack.length ? stack.pop() : null);
        else if (op === "top") out.push(stack.at(-1) ?? null);
        else if (op === "empty") out.push(!stack.length);
        else throw Error("Use push, pop, top or empty.");
        frame(
          e,
          "Execute stack operation",
          `${op}${v === undefined ? "" : ` ${v}`}: the newest value is at the right-hand top.`,
          [
            A(
              "Stack (bottom → top)",
              stack,
              stack.length ? [stack.length - 1] : [],
            ),
          ],
          { operation: op, returns: out },
        );
      }
      return { stack, returns: out };
    },
  );
  reg(
    "Implement Queue using Stacks",
    {
      operations: [
        ["push", 1],
        ["push", 2],
        ["peek"],
        ["pop"],
        ["push", 3],
        ["pop"],
      ],
    },
    ({ operations }, e) => {
      if (!Array.isArray(operations) || operations.length > 24)
        throw Error("Use at most 24 operations.");
      let input = [],
        output = [],
        out = [];
      for (let [op, v] of operations) {
        if (op === "push") input.push(v);
        else if (["pop", "peek"].includes(op)) {
          if (!output.length)
            while (input.length) {
              output.push(input.pop());
              frame(
                e,
                "Transfer to reverse the order",
                "Move the newest input-stack item to the output stack. The oldest item ends on top.",
                [
                  A("Input stack", input),
                  A("Output stack", output, [output.length - 1]),
                ],
              );
            }
          out.push(
            op === "pop" ? (output.pop() ?? null) : (output.at(-1) ?? null),
          );
        } else if (op === "empty") out.push(!input.length && !output.length);
        else throw Error("Use push, pop, peek or empty.");
        frame(
          e,
          "Execute queue operation",
          `${op} follows first-in, first-out order.`,
          [A("Input stack", input), A("Output stack", output)],
          { operation: op, returns: out },
        );
      }
      return { queue: [...output].reverse().concat(input), returns: out };
    },
  );
  reg("Valid Parentheses", { s: "({[]})" }, ({ s }, e) => {
    s = str(s);
    if (/[^()[\]{}]/.test(s)) throw Error("Use only (), [] and {}.");
    let stack = [],
      pairs = { ")": "(", "]": "[", "}": "{" };
    for (let i = 0; i < s.length; i++) {
      let c = s[i];
      if ("([{".includes(c)) {
        stack.push(c);
        frame(
          e,
          "Push an opener",
          `Opening bracket ${c} must be matched before earlier openers.`,
          [A("String", [...s], [i]), A("Stack", stack, [stack.length - 1])],
        );
      } else {
        let top = stack.pop(),
          ok = top === pairs[c];
        frame(
          e,
          "Match the top opener",
          `${c} expects ${pairs[c]}; the popped opener is ${top ?? "missing"}.`,
          [A("String", [...s], [i]), A("Stack", stack)],
          { matches: ok },
        );
        if (!ok) return false;
      }
    }
    return stack.length === 0;
  });
  reg(
    "Min Stack",
    {
      operations: [
        ["push", -2],
        ["push", 0],
        ["push", -3],
        ["getMin"],
        ["pop"],
        ["top"],
        ["getMin"],
      ],
    },
    ({ operations }, e) => {
      if (!Array.isArray(operations) || operations.length > 24)
        throw Error("Use up to 24 operations.");
      let values = [],
        mins = [],
        out = [];
      for (let [op, v] of operations) {
        if (op === "push") {
          values.push(v);
          mins.push(Math.min(v, mins.at(-1) ?? Infinity));
        } else if (op === "pop") {
          out.push(values.pop() ?? null);
          mins.pop();
        } else if (op === "top") out.push(values.at(-1) ?? null);
        else if (op === "getMin") out.push(mins.at(-1) ?? null);
        else throw Error("Use push, pop, top or getMin.");
        frame(
          e,
          "Keep a minimum per depth",
          `${op}: each minimum slot records the smallest value at that stack depth.`,
          [
            A("Values", values, values.length ? [values.length - 1] : []),
            A("Minimum history", mins, mins.length ? [mins.length - 1] : []),
          ],
          { returns: out },
        );
      }
      return { values, minimum: mins.at(-1) ?? null, returns: out };
    },
  );
  reg("Remove Outermost Parentheses", { s: "(()())(())" }, ({ s }, e) => {
    s = str(s);
    if (/[^()]/.test(s)) throw Error("Use only parentheses.");
    let depth = 0,
      out = "";
    for (let i = 0; i < s.length; i++) {
      let c = s[i],
        keep;
      if (c === "(") {
        keep = depth > 0;
        if (keep) out += c;
        depth++;
      } else {
        depth--;
        if (depth < 0) throw Error("Input must be balanced.");
        keep = depth > 0;
        if (keep) out += c;
      }
      frame(
        e,
        keep ? "Keep the inner bracket" : "Remove an outer bracket",
        `Current nesting depth is ${depth}.`,
        [A("Input", [...s], [i]), A("Output", [...out])],
        { depth, kept: keep },
      );
    }
    if (depth) throw Error("Input must be balanced.");
    return out;
  });
  reg(
    "Evaluate Reverse Polish Notation",
    { tokens: ["2", "1", "+", "3", "*"] },
    ({ tokens }, e) => {
      if (!Array.isArray(tokens) || tokens.length > 30)
        throw Error("Use at most 30 RPN tokens.");
      let stack = [];
      for (let i = 0; i < tokens.length; i++) {
        let t = String(tokens[i]);
        if (["+", "-", "*", "/"].includes(t)) {
          if (stack.length < 2) throw Error("Invalid postfix expression.");
          let b = stack.pop(),
            a = stack.pop();
          if (t === "/" && b === 0) throw Error("Division by zero.");
          let result =
            t === "+"
              ? a + b
              : t === "-"
                ? a - b
                : t === "*"
                  ? a * b
                  : Math.trunc(a / b);
          stack.push(result);
          frame(
            e,
            "Apply the operator",
            `${a} ${t} ${b} = ${result}. Right operand is popped first.`,
            [
              A("Tokens", tokens, [i]),
              A("Operand stack", stack, [stack.length - 1]),
            ],
          );
        } else {
          if (!/^-?\d+$/.test(t)) throw Error("Use integers and + - * /.");
          stack.push(+t);
          frame(e, "Push an operand", `Save ${t} for a later operator.`, [
            A("Tokens", tokens, [i]),
            A("Operand stack", stack, [stack.length - 1]),
          ]);
        }
      }
      if (stack.length !== 1)
        throw Error("Expression must leave exactly one result.");
      return stack[0];
    },
  );
  reg(
    "Next Greater Element",
    { nums1: [4, 1, 2], nums2: [1, 3, 4, 2] },
    ({ nums1, nums2 }, e) => {
      let query = arr(nums1, "nums1"),
        a = arr(nums2, "nums2");
      if (new Set(a).size !== a.length || query.some((v) => !a.includes(v)))
        throw Error("nums2 must be distinct and contain every nums1 value.");
      let stack = [],
        next = {};
      for (let i = 0; i < a.length; i++) {
        while (stack.length && a[stack.at(-1)] < a[i]) {
          let j = stack.pop();
          next[a[j]] = a[i];
          frame(
            e,
            "Resolve a smaller waiting value",
            `${a[i]} is the first greater value to the right of ${a[j]}.`,
            [
              A("nums2", a, [i, j]),
              A("Unresolved indices", stack),
              A(
                "Answers",
                Object.entries(next).map(([k, v]) => `${k}→${v}`),
              ),
            ],
          );
        }
        stack.push(i);
        frame(
          e,
          "Wait for a greater value",
          "The stack holds indices with decreasing values.",
          [
            A("nums2", a, [i]),
            A(
              "Unresolved values",
              stack.map((j) => a[j]),
            ),
          ],
        );
      }
      return query.map((v) => next[v] ?? -1);
    },
  );
  reg(
    "Daily Temperatures",
    { temperatures: [73, 74, 75, 71, 69, 72, 76, 73] },
    ({ temperatures }, e) => {
      let a = arr(temperatures, "temperatures"),
        stack = [],
        answer = Array(a.length).fill(0);
      for (let i = 0; i < a.length; i++) {
        while (stack.length && a[i] > a[stack.at(-1)]) {
          let j = stack.pop();
          answer[j] = i - j;
          frame(
            e,
            "Resolve a cooler day",
            `Day ${j} waits ${i - j} days for temperature ${a[i]}.`,
            [
              A("Temperatures", a, [j, i]),
              A("Waiting day indices", stack),
              A("Days to wait", answer, [j]),
            ],
          );
        }
        stack.push(i);
        frame(
          e,
          "Push the unresolved day",
          "Keep days whose warmer successor has not appeared.",
          [
            A("Temperatures", a, [i]),
            A("Waiting day indices", stack),
            A("Days to wait", answer),
          ],
        );
      }
      return answer;
    },
  );
  reg("Next Greater Element - II", { nums: [1, 2, 1] }, ({ nums }, e) => {
    let a = arr(nums),
      stack = [],
      answer = Array(a.length).fill(-1);
    for (let k = 0; k < a.length * 2; k++) {
      let i = k % a.length;
      while (stack.length && a[i] > a[stack.at(-1)]) {
        let j = stack.pop();
        answer[j] = a[i];
        frame(
          e,
          "Resolve through the circular scan",
          `${a[i]} is next greater for index ${j}.`,
          [
            A("Circular values", a, [i, j]),
            A("Answer", answer, [j]),
            A("Waiting indices", stack),
          ],
          { pass: Math.floor(k / a.length) + 1 },
        );
      }
      if (k < a.length) stack.push(i);
      frame(
        e,
        "Advance around the ring",
        "Only the first pass adds indices; the second resolves wraparound answers.",
        [
          A("Circular values", a, [i]),
          A("Answer", answer),
          A("Waiting indices", stack),
        ],
        { pass: Math.floor(k / a.length) + 1 },
      );
    }
    return answer;
  });
  reg(
    "Rotting Oranges",
    {
      grid: [
        [2, 1, 1],
        [1, 1, 0],
        [0, 1, 1],
      ],
    },
    ({ grid }, e) => {
      if (
        !Array.isArray(grid) ||
        !grid.length ||
        grid.length > 8 ||
        !Array.isArray(grid[0]) ||
        !grid[0].length ||
        grid[0].length > 8
      )
        throw Error("Use a nonempty grid up to 8×8.");
      let g = grid.map((r) => {
          if (
            !Array.isArray(r) ||
            r.length !== grid[0].length ||
            r.some((v) => ![0, 1, 2].includes(v))
          )
            throw Error("Use a rectangular grid with values 0, 1 and 2.");
          return [...r];
        }),
        q = [],
        fresh = 0;
      for (let r = 0; r < g.length; r++)
        for (let c = 0; c < g[0].length; c++) {
          if (g[r][c] === 2) q.push([r, c]);
          if (g[r][c] === 1) fresh++;
        }
      let minute = 0,
        head = 0;
      while (head < q.length && fresh) {
        let stop = q.length,
          changed = [];
        for (; head < stop; head++) {
          let [r, c] = q[head];
          for (let [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            let nr = r + dr,
              nc = c + dc;
            if (g[nr]?.[nc] === 1) {
              g[nr][nc] = 2;
              fresh--;
              q.push([nr, nc]);
              changed.push([nr, nc]);
              frame(
                e,
                "Spread to a fresh neighbor",
                `Orange (${nr}, ${nc}) becomes rotten in minute ${minute + 1}.`,
                [
                  A(
                    "BFS queue",
                    q.slice(head + 1).map((x) => `(${x})`),
                  ),
                ],
                { minute: minute + 1, fresh },
                {
                  matrix: {
                    label: "0 empty · 1 fresh · 2 rotten",
                    values: g,
                    active: [[nr, nc]],
                    done: [[r, c]],
                  },
                },
              );
            }
          }
        }
        if (changed.length) minute++;
        frame(
          e,
          "Finish a simultaneous wave",
          "All oranges discovered in this wave spread during the next minute.",
          [],
          { minute, fresh },
          { matrix: { label: "Orange grid", values: g, active: changed } },
        );
      }
      return fresh ? -1 : minute;
    },
  );
})();
