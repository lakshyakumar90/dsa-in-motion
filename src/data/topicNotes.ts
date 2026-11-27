export interface TopicNote {
  topicIndex: number;
  title: string;
  dsTag: string;
  mentalModel: string;
  whenToUse: string[];
  patternTemplate: string;
  complexityCheatSheet: { operation: string; time: string; space: string }[];
  pitfalls: string[];
}

export const topicNotes: TopicNote[] = [
  {
    topicIndex: 0,
    title: "Foundation",
    dsTag: "Loops · Math · Recursion",
    mentalModel: "Every algorithm is a state invariant maintained across iterations: define what is true after step i before writing a single loop.",
    whenToUse: [
      "Digit extraction, number reversal, palindrome checks, or bit checks (power of two)",
      "Single-pass running aggregates (min, max, second largest, counts)",
      "Divide-and-conquer sorting fundamentals (Merge Sort)"
    ],
    patternTemplate: `// Single-pass invariant template
best = INIT_SENTINEL
for x in nums:
    update(best, x) // invariant: best is optimal for prefix seen so far
return best`,
    complexityCheatSheet: [
      { operation: "Single linear scan", time: "O(N)", space: "O(1)" },
      { operation: "Digit loop (base 10)", time: "O(log10 N)", space: "O(1)" },
      { operation: "Bitwise trick (n & (n - 1))", time: "O(1)", space: "O(1)" },
      { operation: "Merge Sort", time: "O(N log N)", space: "O(N)" }
    ],
    pitfalls: [
      "32-bit signed integer overflow when reversing integers (check against INT_MAX / 10).",
      "Initializing max/min to 0 instead of -Infinity / +Infinity when inputs contain negative numbers."
    ]
  },
  {
    topicIndex: 1,
    title: "Arrays",
    dsTag: "Contiguous Memory · In-Place Pointers",
    mentalModel: "Contiguous memory gives O(1) random access. Avoid O(N) mid-array shifts by maintaining a slow write pointer alongside a fast read pointer.",
    whenToUse: [
      "In-place compaction or deduplication (Remove Duplicates, Move Zeros)",
      "Merging sorted arrays from the back to avoid overwriting unread elements",
      "XOR cancellation or Gauss sum for missing/single element queries"
    ],
    patternTemplate: `// Slow / Fast in-place compaction
write = 0
for read in range(len(nums)):
    if keep(nums[read]):
        nums[write] = nums[read]
        write += 1
return write`,
    complexityCheatSheet: [
      { operation: "Index lookup / update", time: "O(1)", space: "O(1)" },
      { operation: "In-place two-pointer compaction", time: "O(N)", space: "O(1)" },
      { operation: "XOR single/missing scan", time: "O(N)", space: "O(1)" }
    ],
    pitfalls: [
      "Overwriting elements in Merge Sorted Arrays by filling left-to-right instead of right-to-left.",
      "Forgetting to handle empty arrays or single-element edge cases."
    ]
  },
  {
    topicIndex: 2,
    title: "Linked List",
    dsTag: "Nodes [val | next] · Pointer Rewiring",
    mentalModel: "Nodes live anywhere in memory and connect only via next pointers. Always save curr.next BEFORE rewiring curr.next so you never orphan the rest of the list.",
    whenToUse: [
      "Cycle detection or midpoint finding → Floyd's Tortoise & Hare (slow +1, fast +2)",
      "Head deletions or merging two lists → Sentinel dummy node eliminates null-head branches",
      "Reversing lists or pairs → Three-pointer (prev, curr, next) iterative rewiring"
    ],
    patternTemplate: `// Iterative 3-pointer reversal
prev = None
curr = head
while curr:
    nxt = curr.next   // 1. save next
    curr.next = prev  // 2. reverse pointer
    prev = curr       // 3. advance prev
    curr = nxt        // 4. advance curr
return prev`,
    complexityCheatSheet: [
      { operation: "Insert / delete at head", time: "O(1)", space: "O(1)" },
      { operation: "Find middle / detect cycle", time: "O(N)", space: "O(1)" },
      { operation: "Reverse in-place", time: "O(N)", space: "O(1)" }
    ],
    pitfalls: [
      "Checking fast.next without checking fast first (NullPointerException).",
      "Forgetting to update head when the first node is removed — always use a dummy node."
    ]
  },
  {
    topicIndex: 3,
    title: "Strings",
    dsTag: "Character Streams · Frequency Maps",
    mentalModel: "Lowercase English strings have a fixed 26-char alphabet — a fixed-size int[26] array gives O(1) space frequency lookup and beats sorting.",
    whenToUse: [
      "Anagrams, isomorphic mapping, or frequency counts → fixed int[26] / hash map",
      "Palindromes → two pointers converging from ends or expanding from center",
      "Nested decoding (Decode String) → stack of (count, prefix)"
    ],
    patternTemplate: `// Fixed-alphabet frequency count
freq = [0] * 26
for ch in s:
    freq[ord(ch) - ord('a')] += 1`,
    complexityCheatSheet: [
      { operation: "Frequency array scan", time: "O(N)", space: "O(1)" },
      { operation: "Sort-based anagram key", time: "O(N log N)", space: "O(N)" },
      { operation: "Two-pointer palindrome", time: "O(N)", space: "O(1)" }
    ],
    pitfalls: [
      "String concatenation inside loops in immutable-string languages (JS/Python/Java) creates O(N²) copies — use a list/buffer and join once.",
      "Skipping non-alphanumeric characters or case normalization in Valid Palindrome."
    ]
  },
  {
    topicIndex: 4,
    title: "Stack and Queues",
    dsTag: "LIFO Stack · FIFO Queue · Monotonic",
    mentalModel: "A stack remembers the most recent unresolved item (LIFO); a monotonic stack maintains sorted candidates so every element is pushed and popped at most once (O(N) total).",
    whenToUse: [
      "Matching brackets, nested scopes, or postfix (RPN) expression evaluation → Stack",
      "Next Greater Element / Daily Temperatures → Monotonic Decreasing Stack",
      "Multi-source level-by-level spreading (Rotting Oranges) → FIFO Queue (BFS)"
    ],
    patternTemplate: `// Monotonic Decreasing Stack (Next Greater Element)
stack = [] // stores indices
ans = [-1] * len(nums)
for i, x in enumerate(nums):
    while stack and nums[stack[-1]] < x:
        ans[stack.pop()] = x
    stack.append(i)`,
    complexityCheatSheet: [
      { operation: "Push / Pop / Peek", time: "O(1)", space: "O(1)" },
      { operation: "Monotonic stack full pass", time: "O(N)", space: "O(N)" },
      { operation: "Queue using 2 stacks (amortized)", time: "O(1)", space: "O(N)" }
    ],
    pitfalls: [
      "Popping from an empty stack without checking stack.length > 0.",
      "Storing values instead of indices when distance (like Daily Temperatures) is needed."
    ]
  },
  {
    topicIndex: 5,
    title: "Binary Search Algorithm",
    dsTag: "Monotonic Predicate · Range Halving",
    mentalModel: "Binary Search works on ANY monotonic boolean predicate F,F,F,T,T,T — not just sorted arrays. Each comparison eliminates half the remaining search space.",
    whenToUse: [
      "Sorted or rotated sorted arrays, mountain peaks, first/last occurrence",
      "Searching on the answer space (Square Root of X, First Bad Version)",
      "Whenever O(N) scan can be reduced to O(log N) by checking a midpoint condition"
    ],
    patternTemplate: `// Boundary Binary Search (first True)
lo, hi = 0, n - 1
while lo < hi:
    mid = lo + (hi - lo) // 2
    if isFeasible(mid):
        hi = mid       // keep mid
    else:
        lo = mid + 1   // discard mid
return lo`,
    complexityCheatSheet: [
      { operation: "Standard / Rotated Binary Search", time: "O(log N)", space: "O(1)" },
      { operation: "First & Last Occurrence (2 searches)", time: "O(log N)", space: "O(1)" },
      { operation: "Jump Search (Better baseline)", time: "O(√N)", space: "O(1)" }
    ],
    pitfalls: [
      "Infinite loops when setting lo = mid without biasing mid upward (mid = lo + (hi - lo + 1) // 2).",
      "Integer overflow in (lo + hi) / 2 in C++/Java — always use lo + (hi - lo) / 2."
    ]
  },
  {
    topicIndex: 6,
    title: "Two Pointers & Sliding Window",
    dsTag: "Expandable [L..R] Window · Converging L/R",
    mentalModel: "Expand R to include new elements; shrink L only when the window violates the constraint. Each pointer moves forward at most N times → O(N) total.",
    whenToUse: [
      "Longest/shortest contiguous subarray or substring satisfying a condition",
      "Pair/triplet sum on sorted arrays (Two Sum II, Three Sum)",
      "Container with Most Water & Trapping Rain Water (move the shorter boundary inward)"
    ],
    patternTemplate: `// Variable-size Sliding Window
left = 0
for right in range(len(s)):
    add(s[right])
    while not windowValid():
        remove(s[left])
        left += 1
    best = max(best, right - left + 1)`,
    complexityCheatSheet: [
      { operation: "Sliding window (variable / fixed)", time: "O(N)", space: "O(K)" },
      { operation: "Converging two pointers", time: "O(N)", space: "O(1)" },
      { operation: "Three Sum (sort + two pointers)", time: "O(N²)", space: "O(1)" }
    ],
    pitfalls: [
      "Forgetting to skip duplicate values in Three Sum after recording a valid triplet.",
      "Shrinking with `if` instead of `while` when multiple elements must leave the window."
    ]
  },
  {
    topicIndex: 7,
    title: "Binary Tree",
    dsTag: "Hierarchical DFS & Level-Order BFS",
    mentalModel: "Every tree problem is either top-down (pass state from parent to child) or bottom-up postorder (combine left & right subtree answers at the parent).",
    whenToUse: [
      "Depth, diameter, balanced check, max path sum → Bottom-up postorder DFS",
      "Level order, zigzag, right side view → BFS with queue sized per level",
      "LCA & path sums → Recursive subtree delegation"
    ],
    patternTemplate: `// Bottom-up Postorder DFS template
function dfs(node):
    if not node: return BASE
    left = dfs(node.left)
    right = dfs(node.right)
    globalBest = max(globalBest, combine(left, right, node.val))
    return propagateUp(left, right, node.val)`,
    complexityCheatSheet: [
      { operation: "DFS Traversal (Pre/In/Post)", time: "O(N)", space: "O(H)" },
      { operation: "BFS Level Order", time: "O(N)", space: "O(W)" },
      { operation: "Diameter / Max Path Sum", time: "O(N)", space: "O(H)" }
    ],
    pitfalls: [
      "Confusing height (edges/nodes along one branch) with diameter (sum of left + right branches through a node).",
      "Ignoring negative node values in Maximum Path Sum (clamp negative child contributions with max(0, child))."
    ]
  },
  {
    topicIndex: 8,
    title: "Binary Search Tree",
    dsTag: "Ordered Left < Root < Right",
    mentalModel: "An inorder traversal of a valid BST always yields strictly sorted ascending values. Use (minBound, maxBound) to validate every subtree, not just immediate children.",
    whenToUse: [
      "Search, insert, or LCA in a BST → prune half the tree at every step in O(H)",
      "Kth smallest element → iterative inorder traversal stopping at step K",
      "Validating BST → pass (low, high) range bounds downward"
    ],
    patternTemplate: `// BST Range Validation
function isValid(node, low = -Infinity, high = Infinity):
    if not node: return true
    if node.val <= low or node.val >= high: return false
    return isValid(node.left, low, node.val) and isValid(node.right, node.val, high)`,
    complexityCheatSheet: [
      { operation: "Search / Insert / LCA", time: "O(H)", space: "O(1) iter / O(H) rec" },
      { operation: "Kth Smallest (early-stop inorder)", time: "O(H + K)", space: "O(H)" },
      { operation: "Validate BST", time: "O(N)", space: "O(H)" }
    ],
    pitfalls: [
      "Only comparing node.left.val < node.val < node.right.val — misses deeper violations against ancestor bounds.",
      "Assuming BST height H is always O(log N); skewed BSTs have H = N."
    ]
  },
  {
    topicIndex: 9,
    title: "Heap",
    dsTag: "Priority Queue · Tree + Array Dual View",
    mentalModel: "A binary heap is a complete binary tree stored flat in an array: parent(i) = ⌊(i-1)/2⌋, left = 2i+1, right = 2i+2. Keep a min-heap of size K to track the K largest items in O(N log K).",
    whenToUse: [
      "Kth Largest in Array or Stream → Min-heap capped at size K",
      "Repeatedly extract the largest/smallest element (Last Stone Weight) → Max-heap",
      "Top K Frequent Elements → Frequency map + size-K min-heap (or O(N) bucket sort)"
    ],
    patternTemplate: `// Bounded Size-K Min-Heap for Top-K Largest
minHeap = []
for x in nums:
    heappush(minHeap, x)
    if len(minHeap) > k:
        heappop(minHeap)
return minHeap[0]`,
    complexityCheatSheet: [
      { operation: "Push / Pop", time: "O(log K)", space: "O(1)" },
      { operation: "Peek Min/Max", time: "O(1)", space: "O(1)" },
      { operation: "Heapify N items", time: "O(N)", space: "O(1)" }
    ],
    pitfalls: [
      "Using a max-heap of size N when a min-heap of size K cuts memory from O(N) to O(K).",
      "In Python heapq is min-only — negate values to simulate a max-heap."
    ]
  },
  {
    topicIndex: 10,
    title: "Backtracking",
    dsTag: "Decision Tree · Choose → Explore → Undo",
    mentalModel: "Backtracking is DFS over a decision tree where you mutate a single shared path, recurse, and immediately undo the mutation on return. Sort first to skip duplicates at the same depth.",
    whenToUse: [
      "Subsets, Combinations, Permutations, Combination Sum",
      "Constraint satisfaction boards (N-Queens, Word Search)",
      "Palindrome Partitioning & Letter Combinations"
    ],
    patternTemplate: `// Universal Backtracking Template
function backtrack(start, path):
    if isSolution(path):
        result.push([...path]) // copy snapshot!
        return
    for i from start to n - 1:
        if i > start and nums[i] == nums[i - 1]: continue // skip dupes
        path.push(nums[i])       // 1. Choose
        backtrack(i + 1, path)   // 2. Explore
        path.pop()               // 3. Undo`,
    complexityCheatSheet: [
      { operation: "Subsets", time: "O(N · 2^N)", space: "O(N)" },
      { operation: "Permutations", time: "O(N · N!)", space: "O(N)" },
      { operation: "N-Queens", time: "O(N!)", space: "O(N)" }
    ],
    pitfalls: [
      "Pushing a reference to `path` into `result` instead of copying it (`[...path]`).",
      "Forgetting to restore visited grid cells on backtrack in Word Search."
    ]
  },
  {
    topicIndex: 11,
    title: "Greedy Algorithm",
    dsTag: "Sort + Local Dominance · Intervals",
    mentalModel: "A greedy algorithm commits to the locally optimal choice at each step without reconsidering. Sort intervals by start time for merging, or by END time for maximizing non-overlapping picks.",
    whenToUse: [
      "Interval scheduling, merging, or minimum removals (sort by start or end)",
      "Prefix-balance feasibility (Gas Station, Lemonade Change)",
      "Two-pass left-to-right + right-to-left constraints (Candy)"
    ],
    patternTemplate: `// Non-Overlapping Intervals (sort by end time)
intervals.sort((a, b) => a[1] - b[1])
keptEnd = -Infinity
removed = 0
for [start, end] of intervals:
    if start >= keptEnd:
        keptEnd = end
    else:
        removed += 1`,
    complexityCheatSheet: [
      { operation: "Interval sort + linear sweep", time: "O(N log N)", space: "O(1)" },
      { operation: "Gas Station / Stock II / Partition Labels", time: "O(N)", space: "O(1)" }
    ],
    pitfalls: [
      "Sorting by start time instead of end time for Non-Overlapping Intervals.",
      "Applying greedy when subproblems interact (e.g., Coin Change with arbitrary coins requires DP, not greedy)."
    ]
  },
  {
    topicIndex: 12,
    title: "Dynamic Programming",
    dsTag: "Overlapping Subproblems · State Table",
    mentalModel: "Every DP problem follows 4 steps: (1) Brute recursive relation → (2) Top-down Memoization (Better) → (3) Bottom-up Tabulation → (4) Rolling-variable Space Optimization (Optimal).",
    whenToUse: [
      "Count ways, min/max cost, or longest subsequence over choices (Climbing Stairs, House Robber, Coin Change, LIS)",
      "0/1 Knapsack / Subset Sum (Partition Equal Subset Sum)",
      "2D grid paths or interval DP (Unique Paths, Cut a Stick, Super Egg Drop)"
    ],
    patternTemplate: `// Bottom-up 1D DP + Space Optimization
prev2, prev1 = base0, base1
for i from 2 to n:
    curr = transition(prev1, prev2, nums[i])
    prev2, prev1 = prev1, curr
return prev1`,
    complexityCheatSheet: [
      { operation: "Linear 1D DP (space-optimized)", time: "O(N)", space: "O(1)" },
      { operation: "Knapsack / Coin Change", time: "O(N · Target)", space: "O(Target)" },
      { operation: "LIS (Patience Binary Search)", time: "O(N log N)", space: "O(N)" }
    ],
    pitfalls: [
      "Iterating inner weight/target loop forward instead of backward in 1D 0/1 Knapsack (forward reuses items like unbounded knapsack!).",
      "Forgetting to initialize DP array to +Infinity for minimization problems."
    ]
  },
  {
    topicIndex: 13,
    title: "Graphs",
    dsTag: "Vertices, Edges, BFS/DFS, Dijkstra, MST",
    mentalModel: "Choose the right traversal for the edge property: Unweighted shortest path → BFS; Connected components / cycles / topo sort → DFS or Union-Find; Non-negative weighted shortest path → Dijkstra; K-stop shortest path → Bellman-Ford.",
    whenToUse: [
      "Connectivity, cloning, or cycle detection → BFS / DFS / Union-Find (DSU)",
      "Dependency ordering in a DAG → Topological Sort (DFS postorder or Kahn's BFS)",
      "Weighted shortest paths or MST → Dijkstra (min-heap) / Prim / Kruskal"
    ],
    patternTemplate: `// Dijkstra's Shortest Path (non-negative weights)
dist = [Infinity] * V; dist[src] = 0
pq = [(0, src)]
while pq:
    d, u = heappop(pq)
    if d > dist[u]: continue
    for v, w in adj[u]:
        if d + w < dist[v]:
            dist[v] = d + w
            heappush(pq, (dist[v], v))`,
    complexityCheatSheet: [
      { operation: "BFS / DFS / Topo Sort", time: "O(V + E)", space: "O(V + E)" },
      { operation: "Union-Find (path compression + rank)", time: "O(E · α(V))", space: "O(V)" },
      { operation: "Dijkstra (binary heap)", time: "O(E log V)", space: "O(V + E)" },
      { operation: "Bellman-Ford (K stops)", time: "O(K · E)", space: "O(V)" }
    ],
    pitfalls: [
      "Forgetting to mark nodes visited when ENQUEUING in BFS (marking on dequeue causes duplicate queue entries).",
      "Using Dijkstra on graphs with negative edge weights — use Bellman-Ford instead."
    ]
  }
];
