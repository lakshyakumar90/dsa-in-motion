import type { AnimationFrame, ConceptLabSpec, GeneratedTrace } from "@/types/animation";
import type { Approach, ApproachKind } from "@/types/problem";

/** Load the preserved, pure legacy trace functions once, outside React rendering. */
export function ensureTraceRuntime(): Promise<void> {
  globalThis.__DSA_RUNTIME_READY__ ??= (async () => {
    globalThis.PROBLEM_TRACES = {};
    await Promise.all([
      import("../../dist/traces-foundations.js"),
      import("../../dist/traces-search-trees.js"),
      import("../../dist/traces-dp-graphs.js"),
    ]);
    await import("../../dist/approach-traces.js");
  })();
  return globalThis.__DSA_RUNTIME_READY__;
}

export async function ensureConceptLabs(): Promise<void> {
  await import("../../dist/visuals.js");
}

function removeDuplicatesBruteTrace(input: Record<string, unknown>): GeneratedTrace {
  const nums = [...(Array.isArray(input.nums) ? input.nums as number[] : [])];
  if (nums.some((value, index) => index > 0 && value < nums[index - 1])) {
    throw new Error("Remove Duplicates requires a sorted array.");
  }
  const unique: number[] = [];
  const working = [...nums];
  const frames: AnimationFrame[] = [];
  const source = () => ({ label: "nums", values: [...working] });
  const result = () => ({ label: "Unique[]", values: [...unique], active: unique.length ? [unique.length - 1] : [] });

  // Keep pointer travel, the comparison, and appending a distinct value as
  // separate teaching beats. Duplicate reads deliberately leave Unique[] alone.
  for (let index = 0; index < nums.length; index++) {
    frames.push({
      title: `Move read pointer to index ${index}`,
      message: `Move i to nums[${index}] = ${nums[index]}. The write result stays unchanged while the pointer moves.`,
      arrays: [{ ...source(), pointers: { i: index } }, result()],
      vars: { i: index, value: nums[index], uniqueCount: unique.length },
      why: "Read the input from left to right so original order is preserved.",
      cost: `Pointer move ${index + 1} of ${nums.length}; no array scan beyond this read.`,
      insight: "The sorted order means a duplicate can only match the last unique value.",
      codeLines: { cpp: 6, js: 6, python: 6 },
    });

    const duplicate = unique.length > 0 && unique[unique.length - 1] === nums[index];
    frames.push({
      title: duplicate ? `Compare ${nums[index]} with the last unique value` : `Check whether ${nums[index]} is new`,
      message: duplicate
        ? `nums[${index}] equals Unique[${unique.length - 1}] (${nums[index]}). Skip it; the result does not change.`
        : unique.length === 0
          ? `Unique[] is empty, so ${nums[index]} is the first distinct value. The comparison finds a new value.`
          : `${nums[index]} differs from the last unique value ${unique[unique.length - 1]}. It belongs in the result.`,
      arrays: [{ ...source(), active: [index], pointers: { i: index } }, result()],
      vars: { i: index, value: nums[index], isDuplicate: duplicate, uniqueCount: unique.length },
      why: "Because nums is sorted, comparing with the last kept value is enough to detect duplicates.",
      cost: "One comparison for this input value.",
      insight: duplicate ? "No write to Unique[] happens on this step." : "A distinct value gets its own append step next.",
      codeLines: { cpp: 7, js: 7, python: 7 },
    });

    if (!duplicate) {
      unique.push(nums[index]);
      frames.push({
        title: `Append ${nums[index]} to Unique[]`,
        message: `Write ${nums[index]} at result index ${unique.length - 1}. The live result grows by one value.`,
        arrays: [{ ...source(), active: [index], pointers: { i: index } }, result()],
        vars: { i: index, value: nums[index], resultIndex: unique.length - 1, uniqueCount: unique.length },
        why: "This is the only step that changes the temporary result array during the scan.",
        cost: `Unique[] now holds ${unique.length} of ${nums.length} input values.`,
        insight: "Duplicate values are skipped, so every value in Unique[] appears once.",
        codeLines: { cpp: 8, js: 8, python: 8 },
      });
    }
  }

  // Copy the temporary result back to nums as separate visible writes, as the
  // problem requires the first k slots of the original array to contain it.
  for (let index = 0; index < unique.length; index++) {
    frames.push({
      title: `Move write pointer to index ${index}`,
      message: `Move the write pointer to nums[${index}]. The input values and Unique[] are unchanged while the pointer moves.`,
      arrays: [{ ...source(), pointers: { write: index } }, result()],
      vars: { write: index, value: unique[index], uniqueCount: unique.length },
      why: "Copy the temporary array into the original array's valid prefix, one position at a time.",
      cost: `Position ${index + 1} of ${unique.length}; no value is copied on this pointer step.`,
      insight: "The selected assignment line runs on the following step.",
      codeLines: { cpp: 13, js: 13, python: 11 },
    });

    working[index] = unique[index];
    frames.push({
      title: `Copy ${unique[index]} into nums[${index}]`,
      message: `Write Unique[${index}] = ${unique[index]} into nums[${index}]. Unique[] is unchanged during this copy-back step.`,
      arrays: [{ ...source(), active: [index], pointers: { write: index } }, result()],
      vars: { write: index, value: unique[index], uniqueCount: unique.length },
      why: "The problem checks that the first k positions of the original array contain the unique values.",
      cost: `Copy-back write ${index + 1} of ${unique.length}.`,
      insight: "The returned length is k; values after index k - 1 are ignored.",
      codeLines: { cpp: 14, js: 14, python: 12 },
    });
  }

  const output = { length: unique.length, prefix: [...unique] };
  frames.push({
    title: `Return ${unique.length}`,
    message: `Return Unique.length = ${unique.length}. The first ${unique.length} positions of nums hold the distinct values.`,
    arrays: [source(), result()],
    vars: { uniqueCount: unique.length, result: unique.length },
    output,
    why: "The answer is the number of distinct values collected in Unique[].",
    cost: "The full approach takes O(N) time and O(N) extra space.",
    insight: "No new array values are created during the return step.",
    codeLines: { cpp: 17, js: 17, python: 14 },
  });
  return { input: structuredClone(input), output, frames, mode: "execution" };
}

function removeDuplicatesOptimalTrace(input: Record<string, unknown>): GeneratedTrace {
  const nums = [...(Array.isArray(input.nums) ? input.nums as number[] : [])];
  if (nums.some((value, index) => index > 0 && value < nums[index - 1])) {
    throw new Error("Remove Duplicates requires a sorted array.");
  }
  const working = [...nums];
  const frames: AnimationFrame[] = [];
  const source = (pointers: Record<string, number> = {}, active: number[] = []) => ({ label: "nums", values: [...working], pointers, active });
  const prefix = (slow: number, active = true) => ({
    label: "Unique prefix",
    values: active ? working.slice(0, slow + 1) : [],
    active: active && slow >= 0 ? [slow] : [],
  });

  frames.push({
    title: "Check whether nums is empty",
    message: nums.length ? `nums contains ${nums.length} values, so the first value can start the unique prefix.` : "nums is empty, so there are no unique values to keep.",
    arrays: [source(), prefix(-1, false)],
    vars: { length: nums.length },
    why: "The empty case has no first element for slow to point at.",
    cost: "One length check.",
    insight: "For a non-empty array, nums[0] is already the first distinct value.",
    codeLines: { cpp: 3, js: 3, python: 3 },
  });

  if (nums.length === 0) {
    frames.push({ title: "Return 0", message: "There are no values in nums, so the distinct count is 0.", arrays: [source(), prefix(-1, false)], vars: { length: 0, result: 0 }, output: { length: 0, prefix: [] }, why: "No array position can contain a unique value.", cost: "O(1) time and O(1) extra space.", insight: "The algorithm stops before assigning either pointer.", codeLines: { cpp: 3, js: 3, python: 4 } });
    return { input: structuredClone(input), output: { length: 0, prefix: [] }, frames, mode: "execution" };
  }

  let slow = 0;
  frames.push({
    title: "Set slow to the first unique value",
    message: `Initialize slow = 0. nums[0] = ${working[0]} is the first value in the valid prefix.`,
    arrays: [source({ slow }, [slow]), prefix(slow)],
    vars: { slow, uniqueCount: slow + 1 },
    why: "slow marks the final occupied position in the unique prefix.",
    cost: "One pointer initialization.",
    insight: "fast starts at index 1 because index 0 is already handled.",
    codeLines: { cpp: 4, js: 4, python: 5 },
  });

  for (let fast = 1; fast < nums.length; fast++) {
    frames.push({
      title: `Move fast pointer to index ${fast}`,
      message: `Advance fast to nums[${fast}] = ${working[fast]}. Keep slow at index ${slow}; neither array changes during pointer movement.`,
      arrays: [source({ slow, fast }), prefix(slow)],
      vars: { slow, fast, value: working[fast], uniqueCount: slow + 1 },
      why: "fast scans every input position once while slow stays at the end of the unique prefix.",
      cost: `Scan position ${fast} of ${nums.length - 1}.`,
      insight: "The next step compares nums[fast] with nums[slow].",
      codeLines: { cpp: 6, js: 6, python: 7 },
    });

    const isNew = working[fast] !== working[slow];
    frames.push({
      title: `Compare nums[${fast}] with nums[${slow}]`,
      message: isNew
        ? `${working[fast]} differs from ${working[slow]}, so this value is new. Keep slow where it is until the next step.`
        : `Both values are ${working[fast]}. This is a duplicate, so slow and the unique prefix remain unchanged.`,
      arrays: [source({ slow, fast }, [slow, fast]), prefix(slow)],
      vars: { slow, fast, left: working[slow], right: working[fast], isNew, uniqueCount: slow + 1 },
      why: "Sorted order places duplicates beside each other, so one adjacent comparison is sufficient.",
      cost: "One comparison for this fast index.",
      insight: isNew ? "A distinct value needs a separate slow-pointer move and write." : "No result change occurs for a duplicate.",
      codeLines: { cpp: 8, js: 7, python: 8 },
    });

    if (isNew) {
      slow++;
      frames.push({
        title: `Move slow to index ${slow}`,
        message: `Advance slow by one to open nums[${slow}] for the new value. The array is not written yet.`,
        arrays: [source({ slow, fast }, [slow]), prefix(slow - 1)],
        vars: { slow, fast, uniqueCount: slow },
        why: "The unique prefix has one more distinct value, so its end moves right by one position.",
        cost: "One pointer increment.",
        insight: "The next step copies nums[fast] into nums[slow].",
        codeLines: { cpp: 9, js: 8, python: 9 },
      });

      working[slow] = working[fast];
      frames.push({
        title: `Write ${working[fast]} into nums[${slow}]`,
        message: `Copy nums[${fast}] = ${working[fast]} into nums[${slow}]. The unique prefix now contains ${working.slice(0, slow + 1).join(", ")}.`,
        arrays: [source({ slow, fast }, [slow]), prefix(slow)],
        vars: { slow, fast, value: working[slow], uniqueCount: slow + 1 },
        why: "This write places the new distinct value immediately after the previously kept values.",
        cost: "One in-place assignment; no auxiliary result array is allocated.",
        insight: "The result changes on this write step only.",
        codeLines: { cpp: 10, js: 9, python: 10 },
      });
    }
  }

  const output = { length: slow + 1, prefix: working.slice(0, slow + 1) };
  frames.push({
    title: `Return ${slow + 1}`,
    message: `Return slow + 1 = ${slow + 1}. The first ${slow + 1} positions of nums now contain the unique values.`,
    arrays: [source({ slow }), prefix(slow)],
    vars: { slow, result: slow + 1 },
    output,
    why: "slow is an index, while the answer is a count, so add one.",
    cost: "O(N) time for one scan and O(1) extra space for two pointers.",
    insight: "Only nums[0..k-1] is part of the returned answer.",
    codeLines: { cpp: 13, js: 12, python: 12 },
  });
  return { input: structuredClone(input), output, frames, mode: "execution" };
}

/** Exact, operation-sized traces for the common in-place array exercises. */
function arrayWalkthroughTrace(problemName: string, input: Record<string, unknown>, approach: Approach): GeneratedTrace | undefined {
  const frames: AnimationFrame[] = [];
  const lines = (cpp: string, js: string, python: string) => sourceLines(approach, { cpp, js, python });

  if (problemName === "Remove Element") {
    const original = Array.isArray(input.nums) ? input.nums as number[] : [];
    const nums = [...original];
    const target = Number(input.val ?? 3);
    const kept: number[] = [];
    const arrays = (pointers: Record<string, number> = {}, active: number[] = []) => [
      { label: "nums", values: [...nums], pointers, active },
      { label: "Live result", values: [...kept], active: kept.length ? [kept.length - 1] : [] },
    ];
    const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });

    if (approach.type === "brute") {
      for (let index = 0; index < original.length; index++) {
        emit({ title: `Move read pointer to ${index}`, message: `Read nums[${index}] = ${original[index]}. No value is copied on this pointer step.`, arrays: arrays({ i: index }), vars: { i: index, val: target, kept: kept.length }, codeLines: lines("for (int x", "for (const x", "for x in nums"), why: "The first pass visits each input value once to build a separate filtered list.", cost: `Read ${index + 1} of ${original.length}.`, insight: "The comparison is the next operation." });
        const keep = original[index] !== target;
        emit({ title: `Check nums[${index}] against ${target}`, message: keep ? `${original[index]} is not the target, so it should be kept. The result has not changed yet.` : `${original[index]} equals the target, so skip it. The result stays unchanged.`, arrays: arrays({ i: index }, [index]), vars: { i: index, value: original[index], val: target, keep, kept: kept.length }, codeLines: lines("if (x != val)", "if (x !== val)", "if x != val"), why: "Only values different from val belong in the returned prefix.", cost: "One comparison.", insight: keep ? "Append this value in a separate result write." : "No write is needed for a removed value." });
        if (keep) {
          kept.push(original[index]);
          emit({ title: `Append ${original[index]} to filtered`, message: `Write ${original[index]} at filtered[${kept.length - 1}]. The live result grows by one value.`, arrays: arrays({ i: index }, [index]), vars: { i: index, resultIndex: kept.length - 1, kept: kept.length }, codeLines: lines("filtered.push_back(x)", "filtered.push(x)", "filtered.append(x)"), why: "A temporary list prevents overwriting unread input values.", cost: `One append; filtered now contains ${kept.length} value(s).`, insight: "The result changes only on this append." });
        }
      }
      for (let index = 0; index < kept.length; index++) {
        emit({ title: `Move copy pointer to nums[${index}]`, message: `Position the copy-back pointer at nums[${index}]. The input does not change while the pointer moves.`, arrays: arrays({ write: index }), vars: { write: index, value: kept[index] }, codeLines: lines("for (int i = 0; i < filtered.size()", "for (let i = 0; i < filtered.length", "for i in range(len(filtered))"), why: "The problem requires the first k cells in nums to hold the kept values.", cost: `Copy-back position ${index + 1} of ${kept.length}.`, insight: "The assignment is the next step." });
        nums[index] = kept[index];
        emit({ title: `Copy ${kept[index]} into nums[${index}]`, message: `Write filtered[${index}] into nums[${index}]. This updates one output cell.`, arrays: arrays({ write: index }, [index]), vars: { write: index, value: kept[index] }, codeLines: lines("nums[i] = filtered[i]", "nums[i] = filtered[i]", "nums[i] = filtered[i]"), why: "Only the first k values are part of the answer; the remaining cells can be ignored.", cost: `One assignment; O(N) extra space is used for filtered.`, insight: "This copy-back step changes nums, not the filtered result." });
      }
    } else {
      let write = 0;
      emit({ title: "Initialize write count k", message: "Start k at 0. It marks where the next non-target value belongs.", arrays: arrays({ write }), vars: { k: write }, codeLines: lines("int k = 0", "let k = 0", "k = 0"), why: "Before scanning, no valid values have been copied into the prefix.", cost: "One initialization.", insight: "Each input value gets an independent read step." });
      for (let index = 0; index < original.length; index++) {
        emit({ title: `Move read pointer to ${index}`, message: `Read nums[${index}] = ${nums[index]}. Keep the write pointer at k = ${write} for this step.`, arrays: arrays({ i: index, write }), vars: { i: index, k: write }, codeLines: lines("for (int i = 0", "for (let i = 0", "for i in range(len(nums))"), why: "i scans every input cell, while k only advances when a value is kept.", cost: `Scan index ${index} once.`, insight: "Next, check whether this value equals val." });
        const keep = nums[index] !== target;
        emit({ title: `Compare ${nums[index]} with ${target}`, message: keep ? `${nums[index]} is not val, so it belongs in the prefix. nums and k are unchanged until the write.` : `${nums[index]} equals val, so skip it. The prefix and k do not change.`, arrays: arrays({ i: index, write }, [index]), vars: { i: index, k: write, value: nums[index], keep }, codeLines: lines("if (nums[i] != val)", "if (nums[i] !== val)", "if nums[i] != val"), why: "The comparison decides whether the current value should be retained.", cost: "One comparison.", insight: keep ? "Write this value at nums[k] next." : "The read pointer advances on the next iteration; there is no write." });
        if (keep) {
          nums[write] = nums[index];
          kept.push(nums[write]); // Display mirror of the valid in-place prefix.
          emit({ title: `Write ${nums[write]} at nums[${write}]`, message: `Copy the kept value from index ${index} to index ${write}. The valid prefix now contains ${write + 1} value(s).`, arrays: arrays({ i: index, write }, [write]), vars: { i: index, k: write, value: nums[write] }, codeLines: lines("nums[k] = nums[i]", "nums[k] = nums[i]", "nums[k] = nums[i]"), why: "Because write never passes the read position, this assignment cannot destroy an unread value.", cost: "One in-place assignment; O(1) extra space.", insight: "Advance k separately after the write." });
          write++;
          emit({ title: `Advance k to ${write}`, message: `Move k one cell right. It now marks the first open position after the kept prefix.`, arrays: arrays({ i: index, write }), vars: { i: index, k: write }, codeLines: lines("k++", "k++", "k += 1"), why: "One non-target value was retained, so the prefix length increases by one.", cost: "One counter increment; no array value changes.", insight: "Continue scanning at the next input index." });
        }
      }
    }
    const output = { length: kept.length || (approach.type === "optimal" ? Number(frames.at(-1)?.vars?.k ?? 0) : 0), prefix: [] as number[] };
    output.prefix = approach.type === "brute" ? [...kept] : nums.slice(0, output.length);
    emit({ title: `Return length ${output.length}`, message: `The first ${output.length} cells of nums contain the kept values: [${output.prefix.join(", ")}]. Return ${output.length}.`, arrays: arrays(), vars: { result: output.length, k: output.length }, output, codeLines: approach.type === "brute" ? lines("return filtered.size()", "return filtered.length", "return len(filtered)") : lines("return k", "return k", "return k"), why: "The answer is the length of the valid prefix, not the full storage capacity of nums.", cost: approach.timeExplanation || `Time ${approach.time}; space ${approach.space}.`, insight: "Cells after the returned length are ignored by the problem." });
    return { input: structuredClone(input), output, frames, mode: "execution" };
  }

  if (problemName === "Reverse String") {
    const original = Array.isArray(input.s) ? input.s as string[] : [...String(input.s ?? "")];
    const chars = [...original];
    const reversed: string[] = [];
    const arrays = (pointers: Record<string, number> = {}, active: number[] = [], resultValues = reversed) => [
      { label: "s", values: [...chars], pointers, active },
      { label: "Reversed result", values: [...resultValues] },
    ];
    const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });
    if (approach.type === "brute") {
      for (let index = original.length - 1; index >= 0; index--) {
        emit({ title: `Move read pointer to index ${index}`, message: `Read s[${index}] = ${original[index]} from right to left. The reversed result is unchanged on pointer movement.`, arrays: arrays({ i: index }), vars: { i: index, char: original[index] }, codeLines: lines("for (int i = s.size() - 1", "for (let i = s.length - 1", "for i in range(len(s) - 1"), why: "Reading from the final character to the first creates the reversed order.", cost: `Read ${original.length - index} of ${original.length}.`, insight: "Append the selected character in a separate step." });
        reversed.push(original[index]);
        emit({ title: `Append “${original[index]}” to reversed`, message: `Write ${original[index]} at result index ${reversed.length - 1}. The result now reads “${reversed.join("")}”.`, arrays: arrays({ i: index }, [index]), vars: { i: index, resultIndex: reversed.length - 1, char: original[index] }, codeLines: lines("temp.push_back(s[i])", "temp.push(s[i])", "temp.append(s[i])"), why: "This is the only operation that adds a character to the temporary result.", cost: "One append; O(N) extra space for the copy.", insight: "The original string has not changed yet." });
      }
      chars.splice(0, chars.length, ...reversed);
      emit({ title: "Copy reversed values back into s", message: `Assign the completed temporary sequence to s. It now reads “${chars.join("")}”.`, arrays: arrays({}, chars.map((_, index) => index), chars), vars: { result: chars.join("") }, codeLines: lines("s = temp", "s = temp", "s = temp"), why: "The required answer is an in-place reversal, so the temporary sequence is copied back once it is complete.", cost: "One array replacement; O(N) temporary space.", insight: "The visible result has changed to match the reversed input." });
    } else {
      let left = 0;
      let right = chars.length - 1;
      emit({ title: "Initialize left pointer", message: `Set left to index ${left}, the first character.`, arrays: arrays({ left }), vars: { left }, codeLines: lines("int left = 0", "let left = 0", "left = 0"), why: "The two-pointer method swaps mirror positions from the outside inward.", cost: "One pointer initialization.", insight: "Set right in a separate step." });
      emit({ title: `Initialize right pointer at ${right}`, message: `Set right to index ${right}, the final character. No characters move during initialization.`, arrays: arrays({ left, ...(right >= 0 ? { right } : {}) }), vars: { left, right }, codeLines: lines("int right = (int)s.size() - 1", "let right = s.length - 1", "right = len(s) - 1"), why: "left and right identify the two characters that will be exchanged.", cost: "One pointer initialization.", insight: "Check whether the pointers have crossed before swapping." });
      while (left < right) {
        emit({ title: `Compare left ${left} with right ${right}`, message: `left is before right, so s[${left}] = ${chars[left]} and s[${right}] = ${chars[right]} form a pair to swap.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, leftChar: chars[left], rightChar: chars[right] }, codeLines: lines("while (left < right)", "while (left < right)", "while left < right"), why: "Each valid pair contributes two positions to the reversed string.", cost: "One boundary check.", insight: "The swap itself is the next operation." });
        [chars[left], chars[right]] = [chars[right], chars[left]];
        reversed.splice(0, reversed.length, ...chars);
        emit({ title: `Swap s[${left}] and s[${right}]`, message: `Exchange ${chars[right]} and ${chars[left]}. Both characters are now in their mirrored positions.`, arrays: arrays({ left, right }, [left, right], reversed), vars: { left, right, result: chars.join("") }, codeLines: lines("swap(s[left], s[right])", "[s[left], s[right]] = [s[right], s[left]]", "s[left], s[right] = s[right], s[left]"), why: "Swapping the outer pair puts each character directly in its final position.", cost: "One swap; O(1) extra space.", insight: "Move left and right inward independently." });
        left++;
        emit({ title: `Move left to ${left}`, message: `Advance left one position. right stays at ${right}; the characters do not change.`, arrays: arrays({ left, right }), vars: { left, right }, codeLines: lines("left++", "left++", "left += 1"), why: "The previous left character is already in its final position.", cost: "One pointer increment.", insight: "Move right in a separate step." });
        right--;
        emit({ title: `Move right to ${right}`, message: `Move right one position left. left stays at ${left}; the characters do not change.`, arrays: arrays({ left, ...(right >= 0 ? { right } : {}) }), vars: { left, right }, codeLines: lines("right--", "right--", "right -= 1"), why: "The previous right character is also in its final position.", cost: "One pointer decrement.", insight: "Compare the next inward pair." });
      }
    }
    const output = [...chars].join("");
    emit({ title: "Return the reversed string", message: `Every character is in its reversed position: “${output}”.`, arrays: arrays(), vars: { result: output }, output, codeLines: approach.type === "brute" ? lines("s = temp", "s = temp", "s = temp") : lines("while (left < right)", "while (left < right)", "while left < right"), why: "The pointers meet or cross after all mirror pairs are swapped.", cost: approach.timeExplanation || `Time ${approach.time}; space ${approach.space}.`, insight: "The in-place approach does not allocate a second character array." });
    return { input: structuredClone(input), output, frames, mode: "execution" };
  }

  if (problemName === "Move Zeros") {
    const original = Array.isArray(input.nums) ? input.nums as number[] : [];
    const nums = [...original];
    const result: number[] = [];
    const arrays = (pointers: Record<string, number> = {}, active: number[] = [], output = result) => [
      { label: "nums", values: [...nums], pointers, active },
      { label: "Moved values", values: [...output] },
    ];
    const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });
    if (approach.type === "brute") {
      for (let index = 0; index < original.length; index++) {
        emit({ title: `Move read pointer to ${index}`, message: `Read nums[${index}] = ${original[index]}. The temporary result does not change while the pointer moves.`, arrays: arrays({ read: index }), vars: { read: index, value: original[index] }, codeLines: lines("for (int x", "for (const x", "for x in nums"), why: "Scan the input from left to right to preserve the non-zero order.", cost: `Read ${index + 1} of ${original.length}.`, insight: "Test whether the selected value is zero." });
        const isNonZero = original[index] !== 0;
        emit({ title: `Check ${original[index]} for zero`, message: isNonZero ? `${original[index]} is non-zero, so keep it in the temporary list.` : "This value is zero. Leave it out for now; zeros are padded after all non-zero values.", arrays: arrays({ read: index }, [index]), vars: { read: index, value: original[index], isNonZero, kept: result.length }, codeLines: lines("if (x != 0)", "if (x !== 0)", "if x != 0"), why: "Appending only non-zero values preserves their relative order.", cost: "One comparison.", insight: isNonZero ? "Append this value now." : "The result remains unchanged on a skipped zero." });
        if (isNonZero) {
          result.push(original[index]);
          emit({ title: `Append ${original[index]} to the result`, message: `Write ${original[index]} at result index ${result.length - 1}.`, arrays: arrays({ read: index }, [index]), vars: { read: index, resultIndex: result.length - 1 }, codeLines: lines("temp.push_back(x)", "temp.push(x)", "temp.append(x)"), why: "The temporary list now contains the non-zero prefix in original order.", cost: `One append; O(N) temporary space.`, insight: "Zeros are added after the scan." });
        }
      }
      while (result.length < original.length) {
        const zeroNumber = result.filter((value) => value === 0).length + 1;
        result.push(0);
        emit({ title: `Append trailing zero ${zeroNumber}`, message: `Pad the temporary result with 0 at index ${result.length - 1}. The input array stays unchanged until the final assignment.`, arrays: arrays({}, [result.length - 1]), vars: { write: result.length - 1, value: 0 }, codeLines: lines("temp.push_back(0)", "temp.push(0)", "temp.append(0)"), why: "The output must keep the same length, so each removed zero is restored at the end.", cost: "One append; each zero is added once.", insight: "The complete temporary array is copied back next." });
      }
      nums.splice(0, nums.length, ...result);
      emit({ title: "Copy the temporary values into nums", message: `Replace nums with [${nums.join(", ")}]. Non-zero values keep their original order and zeros follow them.`, arrays: arrays({}, nums.map((_, index) => index), nums), vars: { result: [...nums] }, codeLines: lines("nums = temp", "nums = temp", "nums = temp"), why: "The problem mutates nums, so the temporary result must be assigned back.", cost: "One array copy; O(N) auxiliary space.", insight: "The final order is now visible in nums." });
    } else {
      let insertPos = 0;
      emit({ title: "Initialize insertPos", message: "Start insertPos at 0, the next cell where a non-zero value belongs.", arrays: arrays({ write: insertPos }), vars: { insertPos }, codeLines: lines("int insertPos = 0", "let insertPos = 0", "insert_pos = 0"), why: "The first non-zero value, if any, belongs at index 0.", cost: "One pointer initialization.", insight: "Read each array position in its own step." });
      for (let index = 0; index < original.length; index++) {
        emit({ title: `Move read pointer to ${index}`, message: `Inspect nums[${index}] = ${nums[index]}. insertPos is ${insertPos}, the first open non-zero position.`, arrays: arrays({ read: index, write: insertPos }), vars: { i: index, insertPos }, codeLines: lines("for (int i = 0", "for (let i = 0", "for i in range(len(nums))"), why: "The read pointer scans every cell once; insertPos advances only after a non-zero value.", cost: `Scan ${index + 1} of ${original.length}.`, insight: "Check this value before writing." });
        const isNonZero = nums[index] !== 0;
        emit({ title: `Check nums[${index}]`, message: isNonZero ? `${nums[index]} is non-zero, so it should move to nums[${insertPos}].` : "This is zero. Keep scanning; insertPos does not move.", arrays: arrays({ read: index, write: insertPos }, [index]), vars: { i: index, insertPos, value: nums[index], isNonZero }, codeLines: lines("if (nums[i] != 0)", "if (nums[i] !== 0)", "if nums[i] != 0"), why: "Only non-zero values occupy the next position in the compacted prefix.", cost: "One comparison.", insight: isNonZero ? "Swap the selected value forward." : "The array and result do not change on this step." });
        if (isNonZero) {
          [nums[index], nums[insertPos]] = [nums[insertPos], nums[index]];
          result.splice(0, result.length, ...nums); // Mirror the in-place output for the result lane.
          emit({ title: `Swap nums[${index}] with nums[${insertPos}]`, message: `Move ${nums[insertPos]} into the next non-zero slot. Zeros shift toward the current read position.`, arrays: arrays({ read: index, write: insertPos }, [insertPos]), vars: { i: index, insertPos, result: [...nums] }, codeLines: lines("swap(nums[insertPos], nums[i])", "[nums[insertPos], nums[i]] = [nums[i], nums[insertPos]]", "nums[insert_pos], nums[i] = nums[i], nums[insert_pos]"), why: "Swapping in place keeps the relative order of non-zero values and uses no temporary array.", cost: "One in-place swap; O(1) extra space.", insight: "Advance insertPos separately after placing the value." });
          insertPos++;
          emit({ title: `Advance insertPos to ${insertPos}`, message: `Move insertPos one position right. nums stays unchanged on this pointer step.`, arrays: arrays({ read: index, write: insertPos }), vars: { i: index, insertPos }, codeLines: lines("insertPos++", "insertPos++", "insert_pos += 1"), why: "One non-zero value has been placed, so the next one belongs in the following slot.", cost: "One pointer increment.", insight: "Continue reading the array." });
        }
      }
    }
    const output = [...nums];
    emit({ title: "Finish with zeros at the end", message: `The array is [${output.join(", ")}], with all non-zero values in their original order.`, arrays: arrays(), vars: { result: output }, output, codeLines: approach.type === "brute" ? lines("nums = temp", "nums = temp", "nums = temp") : lines("for (int i = 0", "for (let i = 0", "for i in range(len(nums))"), why: "Every non-zero value has been moved before the remaining zeros.", cost: approach.timeExplanation || `Time ${approach.time}; space ${approach.space}.`, insight: "The in-place approach performs a constant-space scan." });
    return { input: structuredClone(input), output, frames, mode: "execution" };
  }

  if (problemName === "Max Consecutive Ones") {
    const nums = Array.isArray(input.nums) ? input.nums as number[] : [];
    let current = 0;
    let maxCount = 0;
    const arrays = (pointers: Record<string, number> = {}, active: number[] = []) => [{ label: "nums", values: [...nums], pointers, active }];
    const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });
    if (approach.type === "brute") {
      let i = 0;
      while (i < nums.length) {
        emit({ title: `Move i to index ${i}`, message: `Start checking a run at nums[${i}] = ${nums[i]}.`, arrays: arrays({ i }, [i]), vars: { i, maxCount, result: maxCount }, codeLines: lines("while (i < nums.size())", "while (i < nums.length)", "while i < len(nums)"), why: "The outer pointer skips complete runs of ones and zeros.", cost: `Outer scan is at index ${i}.`, insight: "Check whether this value begins a run of ones." });
        if (nums[i] === 0) {
          emit({ title: `Check nums[${i}] = 0`, message: "Zero cannot extend a run of ones, so the current streak ends here.", arrays: arrays({ i }, [i]), vars: { i, maxCount, result: maxCount }, codeLines: lines("if (nums[i] == 1)", "if (nums[i] === 1)", "if nums[i] == 1"), why: "A zero separates one run from the next.", cost: "One comparison.", insight: "Advance i once past this zero." });
          i++;
          emit({ title: `Advance i to ${i}`, message: `Skip the zero at index ${i - 1}; no run length or result changes.`, arrays: arrays(i < nums.length ? { i } : {}), vars: { i, maxCount, result: maxCount }, codeLines: lines("i++", "i++", "i += 1"), why: "The next possible run begins after the zero.", cost: "One pointer increment.", insight: "Continue the outer scan." });
          continue;
        }
        let j = i;
        emit({ title: `Start run pointer j at ${j}`, message: `Set j to the start of this run. The best run found so far is ${maxCount}.`, arrays: arrays({ i, j }, [j]), vars: { i, j, maxCount, result: maxCount }, codeLines: lines("int j = i", "let j = i", "j = i"), why: "The second pointer scans to the end of the current consecutive-ones segment.", cost: "One pointer initialization.", insight: "Check each value at j before moving it." });
        while (j < nums.length) {
          emit({ title: `Check nums[${j}] = ${nums[j]}`, message: nums[j] === 1 ? "This is another one in the same run. Advance j to test the next value." : "This zero ends the run. The run length is j − i; the maximum updates next.", arrays: arrays({ i, j }, [j]), vars: { i, j, maxCount, result: maxCount }, codeLines: lines("while (j < nums.size() && nums[j] == 1)", "while (j < nums.length && nums[j] === 1)", "while j < len(nums) and nums[j] == 1"), why: "The inner loop stops at the first zero or at the end of the array.", cost: "One inner-loop comparison.", insight: nums[j] === 1 ? "Move j one position to the right." : "Compare this run's length with the best seen so far." });
          if (nums[j] === 0) break;
          j++;
          emit({ title: `Advance j to ${j}`, message: `The one at index ${j - 1} extends the run. Keep i fixed at ${i} while j moves.`, arrays: arrays({ i, ...(j < nums.length ? { j } : {}) }, [j - 1]), vars: { i, j, maxCount, result: maxCount }, codeLines: lines("j++", "j++", "j += 1"), why: "j counts the positions in this consecutive run without moving the run's start.", cost: "One pointer increment.", insight: "When j reaches a zero, calculate the run length." });
        }
        const runLength = j - i;
        const previousMax = maxCount;
        maxCount = Math.max(maxCount, runLength);
        emit({ title: `Update best run to ${maxCount}`, message: `This run contains ${runLength} one(s). Compare it with the previous best ${previousMax}; the new maximum is ${maxCount}.`, arrays: arrays({ i, ...(j < nums.length ? { j } : {}) }, Array.from({ length: runLength }, (_, offset) => i + offset)), vars: { i, j, runLength, maxCount, result: maxCount }, codeLines: lines("maxCount = max(maxCount, j - i)", "maxCount = Math.max(maxCount, j - i)", "max_count = max(max_count, j - i)"), why: "Compare the finished segment with every earlier segment to keep the longest.", cost: "One maximum comparison.", insight: "Move i directly to j; every position in this run is already checked." });
        i = j;
        emit({ title: `Move i to next segment at ${i}`, message: `Set i to j = ${j}. The run has been fully checked, so do not rescan its ones.`, arrays: arrays(i < nums.length ? { i } : {}), vars: { i, maxCount, result: maxCount }, codeLines: lines("i = j", "i = j", "i = j"), why: "Jumping to the end of the run avoids checking its values a second time.", cost: "One pointer assignment.", insight: "The next loop begins at the following unprocessed position." });
      }
    } else {
      emit({ title: "Initialize the streak counters", message: "Set current = 0 and maxCount = 0 before scanning.", arrays: arrays(), vars: { current, maxCount, result: maxCount }, codeLines: lines("int current = 0", "let current = 0", "current = 0"), why: "No run has been seen before the first array value.", cost: "Constant initialization.", insight: "Read each array value once." });
      for (let i = 0; i < nums.length; i++) {
        emit({ title: `Move read pointer to ${i}`, message: `Inspect nums[${i}] = ${nums[i]}. The current streak is ${current}; the best remains ${maxCount}.`, arrays: arrays({ i }, [i]), vars: { i, current, maxCount, result: maxCount }, codeLines: lines("for (int x : nums)", "for (const x of nums)", "for x in nums"), why: "A single scan is enough to measure each run as it passes.", cost: `Read ${i + 1} of ${nums.length}.`, insight: "The value decides whether the streak grows or resets." });
        if (nums[i] === 1) {
          current++;
          emit({ title: `Extend the streak to ${current}`, message: `nums[${i}] is 1, so current increases to ${current}.`, arrays: arrays({ i }, [i]), vars: { i, current, maxCount, result: maxCount }, codeLines: lines("current++", "current++", "current += 1"), why: "Adjacent ones belong to the same consecutive run.", cost: "One counter increment.", insight: "Compare current with maxCount next." });
          maxCount = Math.max(maxCount, current);
          emit({ title: `Update maximum to ${maxCount}`, message: `The current streak is ${current}; the longest seen so far is ${maxCount}.`, arrays: arrays({ i }, Array.from({ length: current }, (_, offset) => i - offset)), vars: { i, current, maxCount, result: maxCount }, codeLines: lines("maxCount = max(maxCount, current)", "maxCount = Math.max(maxCount, current)", "max_count = max(max_count, current)"), why: "Update the answer as soon as a streak grows beyond every earlier one.", cost: "One maximum comparison.", insight: "A zero resets the streak on its own step." });
        } else {
          current = 0;
          emit({ title: "Reset current streak to 0", message: `nums[${i}] is zero, so the streak ends. maxCount stays ${maxCount}.`, arrays: arrays({ i }, [i]), vars: { i, current, maxCount, result: maxCount }, codeLines: lines("current = 0", "current = 0", "current = 0"), why: "A run of ones cannot cross a zero.", cost: "One assignment.", insight: "The best result remains available while a new run starts." });
        }
      }
    }
    const output = maxCount;
    emit({ title: `Return ${output}`, message: `The longest consecutive run of ones has length ${output}.`, arrays: arrays(), vars: { maxCount, result: output }, output, codeLines: lines("return maxCount", "return maxCount", "return max_count"), why: "maxCount stores the largest run found during the scan.", cost: approach.timeExplanation || `Time ${approach.time}; space ${approach.space}.`, insight: "The one-pass approach uses two counters and no extra array." });
    return { input: structuredClone(input), output, frames, mode: "execution" };
  }

  if (problemName === "Best Time to Buy and Sell Stocks") {
    const prices = Array.isArray(input.prices) ? input.prices as number[] : [];
    let maxProfit = 0;
    let bestBuyDay: number | undefined;
    let bestSellDay: number | undefined;
    const arrays = (pointers: Record<string, number> = {}, active: number[] = []) => [{ label: "prices", values: [...prices], pointers, active }];
    const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });
    if (approach.type === "brute") {
      for (let buy = 0; buy < prices.length; buy++) {
        emit({ title: `Move buy day to ${buy}`, message: `Consider buying on day ${buy} for ${prices[buy]}.`, arrays: arrays({ buy }, [buy]), vars: { buy, buyPrice: prices[buy], bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("for (int i = 0", "for (let i = 0", "for i in range(len(prices))"), why: "The brute force method tries every day as a possible buy day.", cost: `Buy day ${buy + 1} of ${prices.length}.`, insight: "Only a later day can be used to sell." });
        for (let sell = buy + 1; sell < prices.length; sell++) {
          emit({ title: `Move sell day to ${sell}`, message: `Keep the buy day fixed at ${buy}; inspect selling on day ${sell} for ${prices[sell]}.`, arrays: arrays({ buy, sell }, [sell]), vars: { buy, sell, buyPrice: prices[buy], sellPrice: prices[sell], bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("for (int j = i + 1", "for (let j = i + 1", "for j in range(i + 1"), why: "Selling must happen after buying, so j starts at i + 1.", cost: `Evaluate candidate pair (${buy}, ${sell}).`, insight: "Calculate this pair's profit before updating the best." });
          const profit = prices[sell] - prices[buy];
          emit({ title: `Calculate profit ${profit}`, message: `${prices[sell]} − ${prices[buy]} = ${profit}. Compare this candidate with the best profit ${maxProfit}.`, arrays: arrays({ buy, sell }, [buy, sell]), vars: { buy, sell, profit, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("int profit = prices[j] - prices[i]", "const profit = prices[j] - prices[i]", "profit = prices[j] - prices[i]"), why: "A transaction earns the later selling price minus the earlier buying price.", cost: "One subtraction.", insight: profit > maxProfit ? "This candidate improves the answer." : "The current best stays unchanged." });
          if (profit > maxProfit) {
            maxProfit = profit;
            bestBuyDay = buy;
            bestSellDay = sell;
            emit({ title: `Update maximum profit to ${maxProfit}`, message: `Keep ${maxProfit} as the best profit seen so far by buying on day ${buy} and selling on day ${sell}.`, arrays: arrays({ buy, sell }, [buy, sell]), vars: { buy, sell, profit, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("maxProfit = profit", "maxProfit = profit", "max_profit = profit"), why: "Only a larger valid profit should replace the answer.", cost: "One comparison and assignment.", insight: "Continue checking the remaining buy/sell pairs." });
          }
        }
      }
    } else {
      if (!prices.length) {
        emit({ title: "No trading days", message: "There are no prices, so no transaction can be made.", arrays: arrays(), vars: { maxProfit, result: maxProfit }, codeLines: lines("if (prices.empty())", "if (prices.length === 0)", "if not prices"), why: "A buy and a later sell both require at least one available price.", cost: "One empty-input check.", insight: "Return zero profit." });
      } else {
        let minPrice = prices[0];
        let minPriceDay = 0;
        emit({ title: `Initialize minimum price to ${minPrice}`, message: `Start with day 0's price, ${minPrice}, as the cheapest buy price seen so far.`, arrays: arrays({ buy: 0 }, [0]), vars: { minPrice, minPriceDay, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("int minPrice = prices[0]", "let minPrice = prices[0]", "min_price = prices[0]"), why: "A transaction can only use a buy day before its sell day.", cost: "One initialization.", insight: "Set the best profit to zero." });
        emit({ title: "Initialize maximum profit to 0", message: "No profitable transaction has been found yet.", arrays: arrays({ buy: 0 }, [0]), vars: { minPrice, minPriceDay, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("int maxProfit = 0", "let maxProfit = 0", "max_profit = 0"), why: "If every price falls, choosing no transaction yields zero profit.", cost: "One initialization.", insight: "Scan each price once from left to right." });
        for (let day = 0; day < prices.length; day++) {
          emit({ title: `Move read pointer to day ${day}`, message: `Today's price is ${prices[day]}. The cheapest earlier price is ${minPrice}; best profit is ${maxProfit}.`, arrays: arrays({ read: day, buy: minPriceDay }, [day]), vars: { day, price: prices[day], minPrice, minPriceDay, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("for (int price : prices)", "for (const price of prices)", "for price in prices"), why: "The scan processes days in order, so every candidate buy price is from today or earlier.", cost: `Read day ${day + 1} of ${prices.length}.`, insight: "Update the cheapest buy price before evaluating today's sale." });
          const oldMin = minPrice;
          if (prices[day] < minPrice) { minPrice = prices[day]; minPriceDay = day; }
          emit({ title: minPrice < oldMin ? `Lower minimum buy price to ${minPrice}` : `Keep minimum buy price ${minPrice}`, message: minPrice < oldMin ? `${prices[day]} is lower than the previous minimum ${oldMin}; use it as the new cheapest buy price.` : `${prices[day]} does not beat the minimum ${minPrice}, so keep the earlier buy day.`, arrays: arrays({ read: day, buy: minPriceDay }, [day]), vars: { day, price: prices[day], minPrice, minPriceDay, previousMin: oldMin, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("minPrice = min(minPrice, price)", "minPrice = Math.min(minPrice, price)", "min_price = min(min_price, price)"), why: "The minimum price summarizes the best buy opportunity available before the current sale.", cost: "One minimum comparison.", insight: "Now calculate the profit if today were the sell day." });
          const candidate = prices[day] - minPrice;
          emit({ title: `Calculate today's profit ${candidate}`, message: `${prices[day]} − ${minPrice} = ${candidate}. The result stays ${maxProfit} until a better profit is found.`, arrays: arrays({ read: day, buy: minPriceDay }, [day]), vars: { day, price: prices[day], minPrice, minPriceDay, candidate, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("maxProfit = max(maxProfit, price - minPrice)", "maxProfit = Math.max(maxProfit, price - minPrice)", "max_profit = max(max_profit, price - min_price)"), why: "The best transaction ending today buys at the lowest prior price.", cost: "One subtraction and maximum comparison.", insight: candidate > maxProfit ? "This sale improves the current answer." : "The best result does not change on this comparison." });
          if (candidate > maxProfit) {
            maxProfit = candidate;
            bestBuyDay = minPriceDay;
            bestSellDay = day;
            emit({ title: `Update maximum profit to ${maxProfit}`, message: `Keep ${maxProfit} as the largest profit found so far by buying on day ${bestBuyDay} and selling on day ${bestSellDay}.`, arrays: arrays({ read: day, buy: minPriceDay }, [day]), vars: { day, price: prices[day], minPrice, minPriceDay, candidate, bestBuyDay, bestSellDay, maxProfit, result: maxProfit }, codeLines: lines("maxProfit = max(maxProfit, price - minPrice)", "maxProfit = Math.max(maxProfit, price - minPrice)", "max_profit = max(max_profit, price - min_price)"), why: "The answer only changes when today's candidate exceeds the previous maximum.", cost: "One result update.", insight: "Move to the next trading day." });
          }
        }
      }
    }
    const output = maxProfit;
    emit({ title: `Return profit ${output}`, message: `The maximum profit available is ${output}.`, arrays: arrays(), vars: { bestBuyDay, bestSellDay, maxProfit, result: output }, output, codeLines: lines("return maxProfit", "return maxProfit", "return max_profit"), why: "maxProfit records the best valid buy-before-sell transaction found.", cost: approach.timeExplanation || `Time ${approach.time}; space ${approach.space}.`, insight: approach.type === "optimal" ? "Only the cheapest price so far and best profit are needed." : "Trying every pair takes quadratic time." });
    return { input: structuredClone(input), output, frames, mode: "execution" };
  }

  if (problemName === "Container with Most Water") {
    const heights = Array.isArray(input.heights) ? input.heights as number[] : [];
    let maxWater = 0;
    const arrays = (pointers: Record<string, number> = {}, active: number[] = []) => [{ label: "height", values: [...heights], pointers, active }];
    const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });
    if (approach.type === "brute") {
      for (let left = 0; left < heights.length; left++) {
        emit({ title: `Choose left wall at ${left}`, message: `Try height[${left}] = ${heights[left]} as the left wall.`, arrays: arrays({ left }, [left]), vars: { left, maxWater, result: maxWater }, codeLines: lines("for (int i = 0", "for (let i = 0", "for i in range(len(height))"), why: "The brute force approach checks every possible left wall.", cost: `Left wall ${left + 1} of ${heights.length}.`, insight: "Pair it with each later wall." });
        for (let right = left + 1; right < heights.length; right++) {
          emit({ title: `Choose right wall at ${right}`, message: `Use height[${right}] = ${heights[right]} as the other wall. The shorter wall limits the water height.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, leftHeight: heights[left], rightHeight: heights[right], maxWater, result: maxWater }, codeLines: lines("for (int j = i + 1", "for (let j = i + 1", "for j in range(i + 1"), why: "A container needs two different positions, with width equal to the distance between them.", cost: `Evaluate pair (${left}, ${right}).`, insight: "Calculate width × shorter height." });
          const width = right - left;
          const limitingHeight = Math.min(heights[left], heights[right]);
          const area = width * limitingHeight;
          emit({ title: `Calculate area ${area}`, message: `${width} × min(${heights[left]}, ${heights[right]}) = ${area}. Compare this area with the best ${maxWater}.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, width, limitingHeight, area, maxWater, result: maxWater }, codeLines: lines("int area = (j - i) * min(height[i], height[j])", "const area = (j - i) * Math.min(height[i], height[j])", "area = (j - i) * min(height[i], height[j])"), why: "The shorter wall sets the maximum water height; the gap between walls sets the width.", cost: "One multiply after one minimum comparison.", insight: area > maxWater ? "This pair improves the best area." : "The best area stays the same." });
          if (area > maxWater) {
            maxWater = area;
            emit({ title: `Update maximum area to ${maxWater}`, message: `Store ${maxWater} as the largest container area found so far.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, area, maxWater, result: maxWater }, codeLines: lines("maxArea = max(maxArea, area)", "maxArea = Math.max(maxArea, area)", "max_area = max(max_area, area)"), why: "Only a larger container replaces the current answer.", cost: "One comparison and assignment.", insight: "Continue checking the remaining wall pairs." });
          }
        }
      }
    } else {
      let left = 0;
      let right = heights.length - 1;
      emit({ title: "Initialize left wall", message: "Place left at index 0, the first wall.", arrays: arrays({ left }), vars: { left }, codeLines: lines("int left = 0", "let left = 0", "left = 0"), why: "The widest possible container uses the two outermost walls.", cost: "One pointer initialization.", insight: "Place right at the other end separately." });
      emit({ title: `Initialize right wall at ${right}`, message: `Place right at index ${right}, the last wall.`, arrays: arrays({ left, ...(right >= 0 ? { right } : {}) }), vars: { left, right }, codeLines: lines("int right = (int)height.size() - 1", "let right = height.length - 1", "right = len(height) - 1"), why: "Each inward move reduces the width while searching for a taller limiting wall.", cost: "One pointer initialization.", insight: "Start the best area at zero." });
      emit({ title: "Initialize maximum area to 0", message: "No wall pair has been measured yet, so maxWater starts at 0.", arrays: arrays({ left, ...(right >= 0 ? { right } : {}) }), vars: { left, right, maxWater, result: maxWater }, codeLines: lines("int maxWater = 0", "let maxWater = 0", "max_water = 0"), why: "All valid container areas are non-negative.", cost: "One initialization.", insight: "Measure the current pair before moving either wall." });
      while (left < right) {
        emit({ title: `Inspect walls ${left} and ${right}`, message: `The walls are ${heights[left]} and ${heights[right]}; the width is ${right - left}.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, leftHeight: heights[left], rightHeight: heights[right], maxWater, result: maxWater }, codeLines: lines("while (left < right)", "while (left < right)", "while left < right"), why: "Only pairs with two distinct positions can hold water.", cost: `One boundary check; ${right - left} positions apart.`, insight: "Calculate the width next." });
        const width = right - left;
        emit({ title: `Set width to ${width}`, message: `right − left = ${right} − ${left} = ${width}.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, width, maxWater, result: maxWater }, codeLines: lines("int w = right - left", "const w = right - left", "w = right - left"), why: "The horizontal distance between walls determines the container width.", cost: "One subtraction.", insight: "The shorter wall sets the fill height." });
        const limitingHeight = Math.min(heights[left], heights[right]);
        emit({ title: `Choose limiting height ${limitingHeight}`, message: `min(${heights[left]}, ${heights[right]}) = ${limitingHeight}.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, width, limitingHeight, maxWater, result: maxWater }, codeLines: lines("int h = min(height[left], height[right])", "const h = Math.min(height[left], height[right])", "h = min(height[left], height[right])"), why: "Water spills over the shorter wall, so the taller wall cannot raise the container's height.", cost: "One minimum comparison.", insight: "Multiply width by this height." });
        const area = width * limitingHeight;
        emit({ title: `Calculate area ${area}`, message: `${width} × ${limitingHeight} = ${area}. The answer remains ${maxWater} until the maximum comparison.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, width, limitingHeight, area, maxWater, result: maxWater }, codeLines: lines("maxWater = max(maxWater, w * h)", "maxWater = Math.max(maxWater, w * h)", "max_water = max(max_water, w * h)"), why: "This is the area formed by the current pair of walls.", cost: "One multiplication and maximum comparison.", insight: area > maxWater ? "The result changes on the following update." : "The current result is already at least this large." });
        if (area > maxWater) {
          maxWater = area;
          emit({ title: `Update maximum area to ${maxWater}`, message: `Keep ${maxWater} as the best area found so far.`, arrays: arrays({ left, right }, [left, right]), vars: { left, right, area, maxWater, result: maxWater }, codeLines: lines("maxWater = max(maxWater, w * h)", "maxWater = Math.max(maxWater, w * h)", "max_water = max(max_water, w * h)"), why: "The maximum stores the best result among all measured pairs.", cost: "One result update.", insight: "Move the shorter wall inward to seek a taller boundary." });
        }
        if (heights[left] < heights[right]) {
          left++;
          emit({ title: `Move left wall to ${left}`, message: `The left wall is shorter, so advance left. Keep right fixed at ${right}.`, arrays: arrays({ left, right }, [left]), vars: { left, right, maxWater, result: maxWater }, codeLines: lines("left++", "left++", "left += 1"), why: "Moving the taller wall would reduce width without escaping the height limit; only the shorter side can improve it.", cost: "One pointer increment; the result does not change.", insight: "Recalculate the next pair." });
        } else {
          right--;
          emit({ title: `Move right wall to ${right}`, message: `The right wall is no taller, so move it inward. Keep left fixed at ${left}.`, arrays: arrays({ left, ...(right >= 0 ? { right } : {}) }, [right]), vars: { left, right, maxWater, result: maxWater }, codeLines: lines("right--", "right--", "right -= 1"), why: "The shorter or equal wall is the only side worth replacing while narrowing the search.", cost: "One pointer decrement; the result does not change.", insight: "Recalculate the next pair." });
        }
      }
    }
    const output = maxWater;
    emit({ title: `Return area ${output}`, message: `The largest container area is ${output}.`, arrays: arrays(), vars: { maxWater, result: output }, output, codeLines: approach.type === "brute" ? lines("return maxArea", "return maxArea", "return max_area") : lines("return maxWater", "return maxWater", "return max_water"), why: "Every candidate pair has been considered directly or ruled out by the shorter-wall argument.", cost: approach.timeExplanation || `Time ${approach.time}; space ${approach.space}.`, insight: approach.type === "optimal" ? "The two-pointer scan uses constant extra space." : "Checking every pair takes quadratic time." });
    return { input: structuredClone(input), output, frames, mode: "execution" };
  }

  return undefined;
}

/** Find the source line for the language-specific operation behind a frame. */
function sourceLines(approach: Approach, markers: Partial<Record<"cpp" | "js" | "python", string>>) {
  return Object.fromEntries((Object.keys(markers) as ("cpp" | "js" | "python")[]).flatMap((language) => {
    const marker = markers[language];
    const line = marker ? approach[language].split("\n").findIndex((source) => {
      const text = source.trim();
      return text && !text.startsWith("//") && !text.startsWith("/*") && !text.startsWith("*") && source.includes(marker);
    }) + 1 : 0;
    return line > 0 ? [[language, line]] : [];
  })) as AnimationFrame["codeLines"];
}

/** ChaiCode-style, operation-sized traces for all three Merge Sorted Array strategies. */
function mergeSortedArrayTrace(input: Record<string, unknown>, approach: Approach): GeneratedTrace {
  const nums1 = Array.isArray(input.nums1) ? input.nums1 as number[] : [];
  const nums2 = Array.isArray(input.nums2) ? input.nums2 as number[] : [];
  const m = Number(input.m);
  const n = Number(input.n);
  if (!Number.isInteger(m) || !Number.isInteger(n) || m < 0 || n < 0 || m + n !== nums1.length || n !== nums2.length) {
    throw new Error("nums1 needs m + n slots and nums2 needs exactly n values.");
  }
  if (nums1.slice(0, m).some((value, index) => index > 0 && value < nums1[index - 1]) || nums2.some((value, index) => index > 0 && value < nums2[index - 1])) {
    throw new Error("Both initialized input ranges must be sorted in ascending order.");
  }

  const working = [...nums1];
  const second = [...nums2];
  const result = Array.from({ length: m + n }, () => "·" as number | string);
  let visibleResult: (number | string)[] = [];
  const frames: AnimationFrame[] = [];
  const languageMarkers = (cpp: string, js: string, python: string) => ({ cpp, js, python });
  const cleanPointers = (pointers: Record<string, number | undefined>, length: number) => Object.fromEntries(Object.entries(pointers).filter((entry): entry is [string, number] => entry[1] !== undefined && entry[1] >= 0 && entry[1] < length));
  const arrays = (firstPointers: Record<string, number | undefined> = {}, secondPointers: Record<string, number | undefined> = {}, activeFirst: number[] = [], activeSecond: number[] = [], resultValues?: (number | string)[]) => {
    // Pointer-only frames preserve the last emitted result until a write changes it.
    if (resultValues) visibleResult = [...resultValues];
    return [
      { label: "nums1", values: [...working], pointers: cleanPointers(firstPointers, working.length), active: activeFirst },
      { label: "nums2", values: [...second], pointers: cleanPointers(secondPointers, second.length), active: activeSecond },
      { label: "Merged result", values: [...visibleResult] },
    ];
  };
  const emit = (frame: Omit<AnimationFrame, "arrays"> & { arrays?: AnimationFrame["arrays"] }) => frames.push({ ...frame, arrays: frame.arrays ?? arrays() });
  const finish = (output: number[]): GeneratedTrace => {
    const state: Record<string, unknown> = { m, n };
    for (const frame of frames) {
      const current = Object.fromEntries(Object.entries(frame.vars ?? {}).filter(([, value]) => value !== undefined));
      for (const key of ["i", "j", "w", "write"]) if (key in current) state[key] = current[key];
      frame.vars = { ...state, ...current };
    }
    return { input: structuredClone(input), output, frames, mode: "execution" };
  };
  const move = (pointer: "i" | "j" | "w", index: number, languageMarkersForLine: Partial<Record<"cpp" | "js" | "python", string>>, positions: { i?: number; j?: number; w?: number }, context: string) => {
    const next = { ...positions, [pointer]: index };
    emit({
      title: `Move ${pointer} to index ${index}`,
      message: index < 0 ? `Set ${pointer} to ${index}: this range has no value to point to. ${context}` : `Move ${pointer} to ${pointer === "j" ? `nums2[${index}] = ${second[index]}` : pointer === "i" ? `nums1[${index}] = ${working[index]}` : `the next write slot nums1[${index}]`}. ${context} No value is written on a pointer move.`,
      arrays: arrays({ i: next.i, w: next.w }, { j: next.j }, pointer === "i" ? [index] : pointer === "w" ? [index] : [], pointer === "j" ? [index] : []),
      vars: { i: next.i, j: next.j, w: next.w, m, n },
      why: "Pointer travel is shown separately so you can see exactly which value each index now refers to.",
      cost: "One index assignment; input and result values stay unchanged.",
      insight: "The comparison or write is a separate next step.",
      codeLines: sourceLines(approach, languageMarkersForLine),
    });
    return index;
  };

  if (approach.type === "brute") {
    let j = -1;
    let w = -1;
    const workingResult: (number | string)[] = [...working.slice(0, m), ...Array.from({ length: n }, () => "·")];
    for (let source = 0; source < n; source++) {
      j = source;
      emit({ title: `Move j to nums2[${j}]`, message: `Move j to nums2[${j}] = ${second[j]}. The write position and both arrays stay unchanged.`, arrays: arrays({}, { j }), vars: { j, destination: m + j, value: second[j] }, why: "Read each nums2 value from left to right before placing it into nums1's padding.", cost: `Copy ${j + 1} of ${n}; no sort has happened yet.`, insight: "The destination pointer gets its own step before the copy.", codeLines: sourceLines(approach, languageMarkers("for (int j", "for (let j", "for j in range")) });
      w = m + j;
      emit({ title: `Move write position to nums1[${w}]`, message: `Set the destination to nums1[${w}], the next free padding slot. nums1 and nums2 values stay unchanged on this step.`, arrays: arrays({ write: w }, { j }), vars: { j, write: w }, why: "The initialized part of nums1 occupies indices 0 through m − 1, so copying begins at m.", cost: "One destination index calculation.", insight: "Next, copy this one value into the selected slot.", codeLines: sourceLines(approach, languageMarkers("nums1[m + j]", "nums1[m + j]", "nums1[m + j]")) });
      working[w] = second[j];
      workingResult[w] = second[j];
      emit({ title: `Copy ${second[j]} into nums1[${w}]`, message: `Write nums2[${j}] = ${second[j]} into nums1[${w}]. The working result changes now; sorting will put it in final order.`, arrays: arrays({ write: w }, { j }, [w], [j], workingResult), vars: { j, write: w, copied: second[j] }, why: "This reuses nums1's n padding slots to hold all values before sorting.", cost: `One assignment; ${n - j - 1} nums2 value(s) remain to copy.`, insight: "The working result is not sorted until the final sort.", codeLines: sourceLines(approach, languageMarkers("nums1[m + j]", "nums1[m + j]", "nums1[m + j]")) });
    }
    working.sort((a, b) => a - b);
    for (let index = 0; index < working.length; index++) result[index] = working[index];
    const output = [...working];
    emit({ title: "Sort the combined array", message: `Sort nums1 in ascending order. The output becomes [${output.join(", ")}]; this single library operation accounts for the extra log-factor cost.`, arrays: arrays({}, {}, output.map((_, index) => index), [], output), vars: { result: output }, output, why: "Sorting the combined m + n values is what makes the brute-force approach correct.", cost: `O((m + n) log(m + n)) time. Built-in sort auxiliary memory depends on the language/runtime.`, insight: "The sorted result changes here, when sort(nums1) executes.", codeLines: sourceLines(approach, languageMarkers("sort(nums1.begin()", "nums1.sort(", "nums1.sort(")) });
    return finish(output);
  }

  if (approach.type === "better") {
    const temp: number[] = [];
    let i = 0;
    let j = 0;
    let write = 0;
    const mergeLine = languageMarkers("if (nums1[i] <= nums2[j])", "if (nums1[i] <= nums2[j])", "if nums1[i] <= nums2[j]:");
    if (m > 0) emit({ title: "Move i to nums1[0]", message: `Place i at the first initialized value, nums1[0] = ${working[0]}. j stays still and the result is unchanged.`, arrays: arrays({ i }, {}), vars: { i, j, write }, why: "A forward merge begins with the smallest unconsumed value in each sorted input.", cost: "One pointer initialization.", insight: "Place j independently before comparing the two values.", codeLines: sourceLines(approach, languageMarkers("int i = 0", "let i = 0", "i = 0")) });
    if (n > 0) emit({ title: "Move j to nums2[0]", message: `Place j at the first nums2 value, nums2[0] = ${second[0]}. i stays still and the result is unchanged.`, arrays: arrays({ i: m > 0 ? i : undefined }, { j }), vars: { i, j, write }, why: "Both pointers now identify the smallest value not yet merged from their respective inputs.", cost: "One pointer initialization.", insight: "A comparison is the next step; no result write happens until then.", codeLines: sourceLines(approach, languageMarkers("int j = 0", "let j = 0", "j = 0")) });
    while (i < m && j < n) {
      const takeFirst = working[i] <= second[j];
      emit({ title: `Compare ${working[i]} and ${second[j]}`, message: `${working[i]} ${takeFirst ? "≤" : ">"} ${second[j]}, so ${takeFirst ? `nums1[${i}]` : `nums2[${j}]`} supplies the next smallest value. The result does not change on a comparison.`, arrays: arrays({ i }, { j }, [i], [j]), vars: { i, j, write, leftValue: working[i], rightValue: second[j], take: takeFirst ? "nums1" : "nums2" }, why: "Both remaining tails are sorted, so the smaller current value must come next.", cost: "One value comparison.", insight: "The selected value is appended in its own write step.", codeLines: sourceLines(approach, mergeLine) });
      const value = takeFirst ? working[i] : second[j];
      temp.push(value);
      result[write] = value;
      emit({ title: `Append ${value} to Merged[${write}]`, message: `Write ${value} into the next result slot. Merged[] is now [${temp.join(", ")}].`, arrays: arrays({ i }, { j }, [], [], temp), vars: { i, j, write, value, mergedCount: temp.length }, why: "The new array can safely grow from the front because it does not overwrite either input.", cost: `One append; ${m + n - temp.length} value(s) remain to merge.`, insight: "The result tracker changes only on this append step.", codeLines: sourceLines(approach, takeFirst ? languageMarkers("merged.push_back(nums1[i])", "merged.push(nums1[i])", "merged.append(nums1[i])") : languageMarkers("merged.push_back(nums2[j])", "merged.push(nums2[j])", "merged.append(nums2[j])")) });
      write++;
      if (takeFirst) {
        i++;
        emit({ title: `Move i to ${i}`, message: `nums1[${i - 1}] was appended, so advance i to ${i}. j stays at ${j}; Merged[] does not change.`, arrays: arrays({ i: i < m ? i : undefined }, { j }), vars: { i, j, write }, why: "Only the pointer that supplied the appended value advances.", cost: "One source-pointer increment.", insight: "The other input pointer remains available for the next comparison.", codeLines: sourceLines(approach, languageMarkers("i += 1", "i += 1", "i += 1")) });
      } else {
        j++;
        emit({ title: `Move j to ${j}`, message: `nums2[${j - 1}] was appended, so advance j to ${j}. i stays at ${i}; Merged[] does not change.`, arrays: arrays({ i }, { j: j < n ? j : undefined }), vars: { i, j, write }, why: "Only the pointer that supplied the appended value advances.", cost: "One source-pointer increment.", insight: "The other input pointer remains available for the next comparison.", codeLines: sourceLines(approach, languageMarkers("j += 1", "j += 1", "j += 1")) });
      }
    }
    while (i < m) {
      const value = working[i];
      temp.push(value); result[write] = value;
      emit({ title: `Append remaining nums1[${i}]`, message: `Append ${value} to Merged[${write}].`, arrays: arrays({ i }, { j: n }, [], [], temp), vars: { i, j: n, write, value }, why: "The remaining nums1 values are already sorted, so they can be appended directly.", cost: "One result write.", insight: "No more comparisons are needed for this tail.", codeLines: sourceLines(approach, languageMarkers("while (i < m)", "while (i < m)", "while i < m")) });
      write++;
      i++;
      if (i < m) emit({ title: `Move i to ${i}`, message: `Advance i to the next remaining nums1 value. The result stays unchanged.`, arrays: arrays({ i, write }, { j: n }), vars: { i, j: n, write }, why: "The current tail value has been appended, so i moves to the next one.", cost: "One pointer increment.", insight: "Each tail value gets its own append step.", codeLines: sourceLines(approach, languageMarkers("i += 1", "i += 1", "i += 1")) });
    }
    while (j < n) {
      const value = second[j];
      temp.push(value); result[write] = value;
      emit({ title: `Append remaining nums2[${j}]`, message: `Append ${value} to Merged[${write}].`, arrays: arrays({ i: m }, { j }, [], [], temp), vars: { i: m, j, write, value }, why: "The remaining nums2 values are already sorted, so they can be appended directly.", cost: "One result write.", insight: "The merged result is complete before copy-back starts.", codeLines: sourceLines(approach, languageMarkers("while (j < n)", "while (j < n)", "while j < n")) });
      write++;
      j++;
      if (j < n) emit({ title: `Move j to ${j}`, message: `Advance j to the next remaining nums2 value. The result stays unchanged.`, arrays: arrays({ i: m, write }, { j }), vars: { i: m, j, write }, why: "The current tail value has been appended, so j moves to the next one.", cost: "One pointer increment.", insight: "Each tail value gets its own append step.", codeLines: sourceLines(approach, languageMarkers("j += 1", "j += 1", "j += 1")) });
    }
    for (let index = 0; index < temp.length; index++) {
      emit({ title: `Move copy pointer to index ${index}`, message: `Move the copy-back position to nums1[${index}]. Merged[] stays complete and nums1 is not written on this step.`, arrays: arrays({ write: index }, {}, [], [], temp), vars: { write: index, value: temp[index] }, why: "The problem requires the final values to be stored in nums1, so copy the completed buffer back.", cost: "One write-index move.", insight: "The copy-back assignment is the next visible operation.", codeLines: sourceLines(approach, languageMarkers("nums1[k] = merged[k]", "nums1[k] = merged[k]", "nums1[k] = merged[k]")) });
      working[index] = temp[index];
      emit({ title: `Copy Merged[${index}] into nums1[${index}]`, message: `Write ${temp[index]} into nums1[${index}]. The returned nums1 is becoming correct one slot at a time.`, arrays: arrays({ write: index }, {}, [index], [], temp), vars: { write: index, value: temp[index] }, why: "This copies the sorted temporary result to the output array required by the problem.", cost: `Copy ${index + 1} of ${temp.length}; the buffer uses O(m + n) extra space.`, insight: "The merged output was already available; this step updates nums1 in place from that buffer.", codeLines: sourceLines(approach, languageMarkers("nums1[k] = merged[k]", "nums1[k] = merged[k]", "nums1[k] = merged[k]")) });
    }
    const output = [...working];
    emit({ title: "Return nums1", message: `All ${output.length} values have been copied back: [${output.join(", ")}].`, arrays: arrays({}, {}, [], [], temp), vars: { result: output }, output, why: "The sorted buffer is now reflected in nums1, so the in-place output requirement is satisfied.", cost: "O(m + n) time and O(m + n) auxiliary space.", insight: "The extra array makes front-to-back merging safe, but it costs linear memory.", codeLines: sourceLines(approach, languageMarkers("return nums1", "return nums1", "return nums1")) });
    return finish(output);
  }

  // Optimal: move each pointer independently, compare, write, then move the
  // selected source pointer and write pointer on their own frames.
  let i = -1;
  let j = -1;
  let w = -1;
  const pointerLine = languageMarkers("int i = m - 1", "let i = m - 1", "i = m - 1");
  i = move("i", m - 1, pointerLine, { i }, "The valid nums1 range ends at m − 1.");
  j = move("j", n - 1, languageMarkers("int j = n - 1", "let j = n - 1", "j = n - 1"), { i, j }, "nums2's largest remaining value is at its final index.");
  w = move("w", m + n - 1, languageMarkers("int w = m + n - 1", "let w = m + n - 1", "w = m + n - 1"), { i, j, w }, "The final output slot is at the end of nums1.");

  while (j >= 0) {
    const takeFirst = i >= 0 && working[i] > second[j];
    const value = takeFirst ? working[i] : second[j];
    emit({ title: `Compare nums1[${i}] and nums2[${j}]`, message: i < 0 ? `nums1 has no unplaced initialized values left, so nums2[${j}] = ${second[j]} must fill nums1[${w}].` : `${working[i]} ${takeFirst ? ">" : "≤"} ${second[j]}. ${takeFirst ? `nums1[${i}]` : `nums2[${j}]`} is larger, so it belongs in the rightmost open slot.`, arrays: arrays({ i, w }, { j }, i >= 0 ? [i] : [], [j], result.some((value) => value !== "·") ? result : undefined), vars: { i, j, w, leftValue: i >= 0 ? working[i] : "exhausted", rightValue: second[j], chosen: takeFirst ? "nums1" : "nums2" }, why: "The largest unplaced value belongs at the rightmost open index, protecting unread nums1 values.", cost: "One comparison; no array or result value changes on this step.", insight: "The assignment into nums1[w] happens next, before either pointer moves.", codeLines: sourceLines(approach, languageMarkers("if (i >= 0 && nums1[i] > nums2[j])", "if (i >= 0 && nums1[i] > nums2[j])", "if i >= 0 and nums1[i] > nums2[j]:")) });
    working[w] = value;
    result[w] = value;
    emit({ title: `Write ${value} into nums1[${w}]`, message: `Place ${value} at the right edge, nums1[${w}]. The live result now shows every value placed so far in its final index.`, arrays: arrays({ i, w }, { j }, [w], [j], result), vars: { i, j, w, value }, why: "Writing from the back uses the padding or a nums1 slot whose old value has already been compared.", cost: "One in-place write; the extra-space usage remains O(1).", insight: "Only this assignment changes the output. Pointer movement is shown next, one at a time.", codeLines: sourceLines(approach, takeFirst ? languageMarkers("nums1[w] = nums1[i]", "nums1[w] = nums1[i]", "nums1[w] = nums1[i]") : languageMarkers("nums1[w] = nums2[j]", "nums1[w] = nums2[j]", "nums1[w] = nums2[j]")) });
    if (takeFirst) {
      i--;
      emit({ title: `Move i left to ${i}`, message: `The value came from nums1, so move i left to ${i}. j and w stay still for this step.`, arrays: arrays({ i, w }, { j }), vars: { i, j, w }, why: "The selected nums1 value has been consumed; the next candidate is immediately to its left.", cost: "One pointer decrement; no value changes.", insight: "Move w separately after updating the source pointer.", codeLines: sourceLines(approach, languageMarkers("i -= 1", "i -= 1", "i -= 1")) });
    } else {
      j--;
      emit({ title: `Move j left to ${j}`, message: `The value came from nums2, so move j left to ${j}. i and w remain still for this step.`, arrays: arrays({ i, w }, { j }), vars: { i, j, w }, why: "The selected nums2 value has been consumed; the next candidate is immediately to its left.", cost: "One pointer decrement; no value changes.", insight: "Move w separately after updating the source pointer.", codeLines: sourceLines(approach, languageMarkers("j -= 1", "j -= 1", "j -= 1")) });
    }
    w--;
    emit({ title: `Move write pointer w to ${w}`, message: `Move w one slot left to ${w}. Both input pointers stay where they are; the merged values do not change.`, arrays: arrays({ i, w }, { j }), vars: { i, j, w }, why: "The next largest unplaced value belongs in the next slot to the left.", cost: "One pointer decrement; no array assignment.", insight: "The next step compares the two current tails again.", codeLines: sourceLines(approach, languageMarkers("w -= 1", "w -= 1", "w -= 1")) });
  }
  const output = [...working];
  emit({ title: "nums2 is exhausted", message: `j is now ${j}, so every nums2 value has been placed. Any remaining nums1 prefix already occupies its final slots: [${output.join(", ")}].`, arrays: arrays({ i, w }, { j }, [], [], output), vars: { i, j, w, result: output }, output, why: "When nums2 runs out, all remaining nums1 values are already in their final positions.", cost: "O(m + n) time and O(1) extra space: each value is placed once.", insight: "The remaining prefix requires no additional writes.", codeLines: sourceLines(approach, languageMarkers("while (j >= 0)", "while (j >= 0)", "while j >= 0")) });
  return finish(output);
}

function resultSignature(frame: AnimationFrame): string {
  const variableValues = Object.fromEntries(Object.entries(frame.vars ?? {}).filter(([key]) => /result|output|answers?|returns?|solutions?|profit|total|count|best|found|sum|ways|matches|area|water|valid|length|diameter|distance|cost|minimum|maximum|surviv/i.test(key)));
  const resultArrays = (frame.arrays ?? []).filter((array) => /result|output|answer|merged|sorted visits|window maxima|itinerary|topological order|partition lengths|days to wait|valid prefix|unique|retained prefix|kept values/i.test(array.label ?? ""));
  try { return JSON.stringify({ output: frame.output, variables: variableValues, arrays: resultArrays }); }
  catch { return ""; }
}

/** Split simultaneous pointer changes without replaying the completed frame. */
function expandPointerMovements(frames: AnimationFrame[]): AnimationFrame[] {
  const expanded: AnimationFrame[] = [];
  let previousArrays: NonNullable<AnimationFrame["arrays"]> = [];
  let previousFrame: AnimationFrame | undefined;

  for (const frame of frames) {
    const arrays = frame.arrays ?? [];
    const changes: { arrayIndex: number; name: string; from?: number; to?: number }[] = [];
    arrays.forEach((array, arrayIndex) => {
      const before = previousArrays[arrayIndex]?.pointers ?? {};
      const after = array.pointers ?? {};
      for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
        if (before[name] !== after[name] && after[name] !== undefined) {
          changes.push({ arrayIndex, name, from: before[name], to: after[name] });
        }
      }
    });

    if (changes.length > 1) {
      const progressive = arrays.map((array, index) => ({ ...(previousArrays[index] ?? array), pointers: { ...(previousArrays[index]?.pointers ?? {}) } }));
      const arrayValuesChanged = arrays.some((array, index) => JSON.stringify(array.values) !== JSON.stringify(previousArrays[index]?.values));
      const resultChanged = resultSignature(frame) !== resultSignature(previousFrame ?? {});
      const { output: _output, vars: _vars, ...movementFrame } = frame;
      changes.forEach((change, changeIndex) => {
        const target = progressive[change.arrayIndex];
        if (!target) return;
        target.pointers = { ...(target.pointers ?? {}), [change.name]: change.to! };
        const movement = change.from === undefined
          ? `Place ${change.name} at index ${change.to}.`
          : `Move ${change.name} from index ${change.from} to index ${change.to}.`;
        const intermediate = arrays.map((array, index) => ({
          ...(previousArrays[index] ?? array),
          label: array.label,
          pointers: { ...(progressive[index]?.pointers ?? {}) },
          ...(index === change.arrayIndex ? { active: [change.to!] } : {}),
        }));
        expanded.push({
          ...movementFrame,
          title: `Move ${change.name} pointer · ${changeIndex + 1} of ${changes.length}`,
          message: `${movement} Keep the other pointers still for this step.${changeIndex === changes.length - 1 && !arrayValuesChanged && !resultChanged && frame.message ? ` ${frame.message}` : ""}`,
          arrays: intermediate,
        });
      });
      // An actual write or result change is its own event, after the pointers
      // have moved. Pure pointer frames do not get duplicated.
      if (arrayValuesChanged || resultChanged) expanded.push(frame);
    } else {
      expanded.push(frame);
    }
    previousArrays = arrays.map((array) => ({ ...array, pointers: { ...(array.pointers ?? {}) } }));
    previousFrame = frame;
    if (expanded.length > 1_000) throw new Error("This example creates too many animation steps.");
  }
  return expanded;
}

/** Keep the legacy model registry behind one typed boundary for the React UI. */
export function getConceptLabRegistry(): Record<string, ConceptLabSpec> {
  return (globalThis.LABS ?? {}) as unknown as Record<string, ConceptLabSpec>;
}

export function createTrace(
  problemName: string,
  approach: Approach,
  allApproaches: Approach[],
  input?: Record<string, unknown>,
): GeneratedTrace {
  const base = globalThis.PROBLEM_TRACES[problemName];
  if (!base) throw new Error(`No reference trace is registered for ${problemName}.`);

  if (problemName === "Remove Duplicates") {
    return approach.type === "brute"
      ? removeDuplicatesBruteTrace(input ?? base.input)
      : removeDuplicatesOptimalTrace(input ?? base.input);
  }

  const arrayWalkthrough = arrayWalkthroughTrace(problemName, input ?? base.input, approach);
  if (arrayWalkthrough) return arrayWalkthrough;

  if (problemName === "Merge Sorted Arrays") {
    return mergeSortedArrayTrace(input ?? base.input, approach);
  }

  const useConceptualWalkthrough: boolean = approach.type !== "optimal";
  const spec = useConceptualWalkthrough && globalThis.buildApproachTrace
    ? globalThis.buildApproachTrace(
        problemName,
        approach as unknown as Record<string, unknown>,
        allApproaches as unknown as Record<string, unknown>[],
        input ?? base.input,
      )
    : base;

  const rawFrames: AnimationFrame[] = [];
  const output = spec.run(structuredClone(input ?? spec.input), (frame) => {
    if (rawFrames.length >= 500) throw new Error("This example creates too many animation steps.");
    rawFrames.push(frame);
  });
  if (rawFrames.length === 0) throw new Error(`The ${problemName} trace returned no frames.`);
  const frames = expandPointerMovements(rawFrames);
  // Returning happens at the final emitted operation. Attach the value to that
  // frame instead of inventing an extra end screen after the trace is complete.
  const lastFrameIndex = frames.length - 1;
  if (output !== undefined && frames[lastFrameIndex]?.output === undefined) {
    frames[lastFrameIndex] = {
      ...frames[lastFrameIndex],
      output: structuredClone(output),
      message: `${frames[lastFrameIndex].message ?? "The algorithm has completed this operation."} Return the current final value.`,
    };
  }
  return {
    input: structuredClone(input ?? spec.input),
    output,
    frames,
    mode: useConceptualWalkthrough ? "conceptual" : "execution",
  };
}

export function approachKindLabel(kind: ApproachKind): string {
  return kind === "brute" ? "Brute force" : kind === "better" ? "Better" : "Optimal";
}
