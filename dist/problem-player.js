/* Each problem supplies an algorithm, not a slide deck. Capture snapshots and
   replay them with persistent DOM elements so changes remain understandable. */
globalThis.PROBLEM_TRACES = {};
(() => {
  const h = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const pretty = (v) =>
    typeof v === "string"
      ? v
      : (JSON.stringify(v, (_, x) =>
          typeof x === "number" && !Number.isFinite(x) ? String(x) : x,
        ) ?? "undefined");
  const clone = (v) => structuredClone(v);
  const icon = (name) => {
    const paths = {
      play: "M9 5l11 7-11 7z",
      pause: "M8 5v14M16 5v14",
      next: "M5 5l10 7-10 7zM19 5v14",
      back: "M19 5L9 12l10 7zM5 5v14",
      reset: "M3 11a9 9 0 1 1 2.5 7M3 4v7h7",
      chevron: "M9 5l7 7-7 7",
      close: "M6 6l12 12M6 18L18 6",
      menu: "M4 6h16M4 12h16M4 18h16",
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] ?? paths.chevron}"/></svg>`;
  };
  globalThis.UI_ICON = icon;
  class ProblemPlayer {
    constructor(root, name, compact = false, options = {}) {
      this.root = root;
      this.compact = compact;
      this.name = name;
      this.options = options;
      this.approachIndex = options.approachIndex ?? 0;
      this.allApproaches = options.approaches || null;
      this.approachSpec = null;
      this.spec = this._resolveSpec();
      this.frames = [];
      this.index = 0;
      this.timer = null;
      this.speed = 1100;
      this.groups = new Map();
      this.build();
      this._updateApproachLabel();
      this.load(this.spec.input);
      this.hidden = () => {
        if (document.hidden) this.pause();
      };
      document.addEventListener("visibilitychange", this.hidden);
      this.resize = new ResizeObserver(() => this.render(false));
      this.resize.observe(this.root);
    }
    _resolveSpec() {
      const base = PROBLEM_TRACES[this.name];
      if (
        this.allApproaches &&
        this.allApproaches.length &&
        typeof globalThis.buildApproachTrace === "function"
      ) {
        const idx = Math.max(
          0,
          Math.min(this.approachIndex, this.allApproaches.length - 1),
        );
        this.approachSpec = buildApproachTrace(
          this.name,
          this.allApproaches[idx],
          this.allApproaches,
          base?.input,
        );
        return this.approachSpec;
      }
      return base;
    }
    setApproach(idx, input) {
      this.approachIndex = idx;
      this.spec = this._resolveSpec();
      try {
        this.load(input ?? this.spec.input);
      } catch (e) {
        this.root.querySelector(".trace-error").textContent = e.message;
      }
      this._updateApproachLabel();
    }
    _updateApproachLabel() {
      const el = this.root.querySelector(".player-approach");
      if (!el) return;
      if (this.allApproaches && this.allApproaches.length) {
        const a =
          this.allApproaches[
            Math.max(
              0,
              Math.min(this.approachIndex, this.allApproaches.length - 1),
            )
          ];
        const lbl =
          a.type === "brute"
            ? "Brute Force"
            : a.type === "better"
              ? "Better"
              : "Optimal";
        el.hidden = false;
        el.textContent = `${lbl} · ${a.time} · ${a.space}`;
        el.dataset.type = a.type || "optimal";
      } else el.hidden = true;
    }
    build() {
      this.root.className =
        "problem-player" + (this.compact ? " is-compact" : "");
      this.root.innerHTML = `<div class="player-heading"><div><span class="player-dot"></span><b>${h(this.name)}</b><span class="player-approach" hidden></span></div><span class="player-badge">Live algorithm trace</span></div><div class="trace-layout"><div class="trace-stage"><div class="trace-coach" aria-live="polite"><span class="coach-step"></span><strong class="coach-title"></strong><p class="coach-message"></p><div class="coach-flow"></div></div><div class="trace-panels"></div><div class="trace-result" hidden></div></div><aside class="trace-inspector"><span class="inspector-label">Current state</span><h3 class="trace-title"></h3><p class="trace-message" aria-live="polite" aria-atomic="true"></p><div class="trace-deepdive" hidden><div class="deep-row"><span>Why</span><p class="deep-why"></p></div><div class="deep-row"><span>Cost</span><p class="deep-cost"></p></div><div class="deep-row"><span>Takeaway</span><p class="deep-insight"></p></div></div><dl class="trace-vars"></dl></aside></div><div class="trace-controls"><div class="transport"><button class="reset" aria-label="Reset animation">${icon("reset")}</button><button class="back" aria-label="Previous animation step">${icon("back")}</button><button class="play" aria-label="Play animation">${icon("play")}<span>Play</span></button><button class="next" aria-label="Next animation step">${icon("next")}</button></div><input type="range" aria-label="Animation step" min="0" value="0"><span class="trace-counter"></span><select aria-label="Animation speed"><option value="1800">0.5×</option><option value="1100" selected>1×</option><option value="650">2×</option></select></div><div class="trace-legend"><span><i class="active-key"></i>Current operation</span><span><i class="done-key"></i>Processed / selected</span><span><i></i>Waiting</span><small>Use ← / → to step</small></div><details class="trace-inputs"><summary>Change the example <span>JSON input</span></summary><p>Edit the input, then rebuild the animation. Small inputs make each operation easier to follow.</p><textarea aria-label="Animation input" spellcheck="false"></textarea><div><button class="apply-input">Run this input</button><button class="restore-input">Restore example</button></div><p class="trace-error" role="alert"></p></details>`;
      const q = (s) => this.root.querySelector(s);
      q("textarea").value = JSON.stringify(this.spec.input, null, 2);
      q(".play").onclick = () => this.toggle();
      q(".next").onclick = () => this.step(1);
      q(".back").onclick = () => this.step(-1);
      q(".reset").onclick = () => this.go(0);
      q("input[type=range]").oninput = (e) => this.go(+e.target.value);
      q("select").onchange = (e) => {
        const was = !!this.timer;
        this.pause();
        this.speed = +e.target.value;
        if (was) this.toggle();
      };
      q(".apply-input").onclick = () => {
        try {
          this.load(JSON.parse(q("textarea").value));
          q(".trace-error").textContent = "";
        } catch (e) {
          q(".trace-error").textContent = e.message;
        }
      };
      q(".restore-input").onclick = () => {
        q("textarea").value = JSON.stringify(this.spec.input, null, 2);
        this.load(this.spec.input);
        q(".trace-error").textContent = "";
      };
      this.root.tabIndex = 0;
      this.root.setAttribute("aria-label", `${this.name} animation player`);
      this.root.onkeydown = (e) => {
        if (["TEXTAREA", "INPUT", "SELECT"].includes(e.target.tagName)) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          this.step(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.step(-1);
        }
        if (e.code === "Space") {
          e.preventDefault();
          this.toggle();
        }
      };
    }
    load(input) {
      this.pause();
      if (!this.spec || typeof this.spec.run !== "function")
        throw Error("No animation available for this approach yet.");
      let count = 0;
      const inspect = (v, depth = 0) => {
        if (depth > 8)
          throw Error("Use a shallower input (at most 8 nested levels).");
        if (++count > 450)
          throw Error("Use a smaller example (at most 450 values).");
        if (
          typeof v === "number" &&
          (!Number.isFinite(v) || Math.abs(v) > Number.MAX_SAFE_INTEGER)
        )
          throw Error(
            "Use finite numbers within JavaScript’s safe numeric range.",
          );
        if (typeof v === "string" && v.length > 80)
          throw Error("Use strings of at most 80 characters.");
        if (Array.isArray(v) && v.length > 32)
          throw Error("Use arrays of at most 32 items.");
        if (v && typeof v === "object")
          Object.values(v).forEach((x) => inspect(x, depth + 1));
      };
      if (!input || Array.isArray(input) || typeof input !== "object")
        throw Error(
          "Input must be a JSON object with the example’s field names.",
        );
      inspect(input);
      const frames = [];
      const emit = (f) => {
        if (
          !frames.length &&
          !((f.arrays ?? []).length || f.nodes?.length || f.matrix)
        ) {
          const arrays = Object.entries(input)
            .filter(
              ([, v]) =>
                (Array.isArray(v) &&
                  v.every((x) => x === null || typeof x !== "object")) ||
                typeof v === "string",
            )
            .map(([label, v]) => ({
              label,
              values: typeof v === "string" ? [...v] : v,
            }));
          if (!arrays.length)
            arrays.push({
              label: "Input values",
              values: Object.values(input).map((v) =>
                typeof v === "object" ? JSON.stringify(v) : v,
              ),
            });
          f = { ...f, arrays };
        }

        if (frames.length >= 500)
          throw Error(
            "This example generates too many steps. Try a smaller input.",
          );
        if (
          !((f.arrays ?? []).length || f.nodes?.length || f.matrix) &&
          frames.length
        ) {
          const prev = frames.at(-1);
          f = {
            ...f,
            arrays: prev.arrays,
            nodes: prev.nodes,
            edges: prev.edges,
            matrix: prev.matrix,
          };
        }
        frames.push(clone(f));
      };
      let start = performance.now();
      const result = this.spec.run(clone(input), emit);
      if (performance.now() - start > 2000)
        throw Error("This example takes too long. Try a smaller input.");
      if (!frames.length)
        throw Error("No steps were generated for this input.");
      if (frames.at(-1).output === undefined)
        frames.push({
          ...clone(frames.at(-1)),
          title: "Result",
          message:
            "The algorithm has finished. Compare the result with the input and replay any step.",
          output: clone(result),
        });
      this.frames = frames;
      this.index = 0;
      this.groups.clear();
      this.root.querySelector(".trace-panels").replaceChildren();
      this.render(false);
    }
    pause() {
      clearInterval(this.timer);
      this.timer = null;
      const b = this.root.querySelector(".play");
      b.innerHTML = icon("play") + "<span>Play</span>";
      b.setAttribute("aria-label", "Play animation");
    }
    toggle() {
      if (this.timer) {
        this.pause();
        return;
      }
      if (this.index >= this.frames.length - 1) this.index = 0;
      this.root.querySelector(".play").innerHTML =
        icon("pause") + "<span>Pause</span>";
      this.root
        .querySelector(".play")
        .setAttribute("aria-label", "Pause animation");
      this.render(false);
      this.timer = setInterval(() => {
        this.index = Math.min(this.index + 1, this.frames.length - 1);
        this.render();
        if (this.index === this.frames.length - 1) this.pause();
      }, this.speed);
    }
    go(index) {
      this.pause();
      this.index = Math.max(0, Math.min(index, this.frames.length - 1));
      this.render();
    }
    step(n) {
      this.go(this.index + n);
    }
    render(animate = true) {
      if (!this.frames.length) return;
      const f = this.frames[this.index],
        q = (s) => this.root.querySelector(s);
      // Explain the current frame beside the visual, using only recorded state.
      q(".coach-step").textContent = `STEP ${this.index + 1} OF ${this.frames.length}`;
      q(".coach-title").textContent = f.title ?? `Step ${this.index + 1}`;
      q(".coach-message").textContent = f.message ?? "";
      const pointers = (f.arrays || []).flatMap(a => Object.entries(a.pointers || {}).map(([name, index]) => `${name} → ${a.label || "array"}[${index}]`));
      q(".coach-flow").textContent = pointers.length ? pointers.join("   •   ") : (f.output !== undefined ? `Result → ${pretty(f.output)}` : "Read the highlighted state below ↓");
      q(".trace-title").textContent = f.title ?? `Step ${this.index + 1}`;
      q(".trace-message").textContent = f.message ?? "";
      const dd = q(".trace-deepdive");
      if (dd) {
        const hasDeep = !!(f.why || f.cost || f.insight);
        dd.hidden = !hasDeep;
        if (hasDeep) {
          dd.querySelector(".deep-why").textContent = f.why || "—";
          dd.querySelector(".deep-cost").textContent = f.cost || "—";
          dd.querySelector(".deep-insight").textContent = f.insight || "—";
        }
      }
      q(".trace-vars").innerHTML = Object.entries(f.vars ?? {})
        .map(
          ([k, v]) =>
            `<div><dt>${h(k)}</dt><dd title="${h(pretty(v))}">${h(pretty(v))}</dd></div>`,
        )
        .join("");
      q(".trace-counter").textContent =
        `${this.index + 1} / ${this.frames.length}`;
      q("input[type=range]").max = this.frames.length - 1;
      q("input[type=range]").value = this.index;
      q(".back").disabled = this.index === 0;
      q(".next").disabled = this.index === this.frames.length - 1;
      const result = q(".trace-result");
      result.hidden = f.output === undefined;
      if (f.output !== undefined)
        result.innerHTML = `<span>Output</span><strong>${h(pretty(f.output))}</strong>`;
      const wanted = new Set();
      const panel = (key, label, cls = "") => {
        wanted.add(key);
        let data = this.groups.get(key);
        if (!data) {
          let el = document.createElement("section");
          el.className = `trace-panel ${cls}`;
          el.innerHTML =
            '<div class="trace-panel-label"></div><div class="trace-panel-content"></div>';
          q(".trace-panels").append(el);
          data = { el, items: new Map() };
          this.groups.set(key, data);
        }
        data.el.querySelector(".trace-panel-label").textContent = label;
        return data;
      };
      if (
        ["Trapping Rain Water", "Container with Most Water"].includes(this.name)
      ) {
        const heights = (f.arrays ?? []).find((a) => /height/i.test(a.label));
        if (heights) {
          const water = (f.arrays ?? []).find((a) =>
            /water above/i.test(a.label),
          );
          this.bars(
            panel("elevation", "Elevation and water level", "elevation-panel"),
            heights,
            water,
            animate,
          );
        }
      }
      (f.arrays ?? []).forEach((arr, j) => {
        let data = panel("a" + j, arr.label ?? "Values", "array-panel");
        this.array(data, arr, animate);
      });
      if (f.nodes) {
        const data = panel(
          "graph",
          f.graphLabel ?? "Connections",
          "graph-panel",
        );
        this.graph(data, f, animate);
      }
      if (f.matrix) {
        const data = panel("matrix", f.matrix.label ?? "Table", "matrix-panel");
        this.matrix(data, f.matrix, animate);
      }
      for (let [key, data] of this.groups) {
        if (!wanted.has(key)) {
          data.el.remove();
          this.groups.delete(key);
        }
      }
      if (this.compact) {
        const prefer = f.nodes
          ? "graph"
          : wanted.has("elevation")
            ? "elevation"
            : Array.from(wanted)[0];
        for (let [key, data] of this.groups)
          data.el.classList.toggle("hero-visible", key === prefer);
      }
      if (!wanted.size) {
        const data = panel("state", "Operation");
        data.el.querySelector(".trace-panel-content").innerHTML =
          '<p class="trace-empty">Follow the variables and explanation as the algorithm runs.</p>';
      }
    }
    array(data, a, animate) {
      let target = data.el.querySelector(".trace-panel-content"),
        values = a.values ?? [],
        old = new Map();
      for (let [key, el] of data.items)
        old.set(key, el.getBoundingClientRect());
      const counts = new Map(),
        keys = new Set();
      const changed =
        /table|dp|ways|count|frequency|distance|result|answer|prefix|suffix|bit/i.test(
          a.label ?? "",
        );
      for (let i = 0; i < values.length; i++) {
        let val = values[i],
          id = pretty(val),
          n = counts.get(id) ?? 0;
        counts.set(id, n + 1);
        let key = changed ? "index:" + i : id + ":" + n;
        keys.add(key);
        let el = data.items.get(key);
        if (!el) {
          el = document.createElement("div");
          el.className = "trace-cell";
          data.items.set(key, el);
        }
        target.append(el);
        let pointers = Object.entries(a.pointers ?? {})
          .filter(([, v]) => v === i)
          .map(([k]) => k);
        el.className =
          "trace-cell" +
          ((a.active ?? []).includes(i) ? " is-active" : "") +
          ((a.done ?? []).includes(i) ? " is-done" : "");
        el.innerHTML = `<span class="cell-pointer">${h(pointers.join(" / "))}</span><b title="${h(pretty(val))}">${h(pretty(val))}</b><small>${i}</small>`;
        el.setAttribute(
          "aria-label",
          `${a.label ?? "Array"} index ${i}: ${pretty(val)}${pointers.length ? ", " + pointers.join(", ") : ""}`,
        );
      }
      for (let [key, el] of data.items) {
        if (!keys.has(key)) {
          el.remove();
          data.items.delete(key);
        }
      }
      target.className = "trace-panel-content trace-array";
      if (!values.length)
        target.innerHTML = '<span class="trace-empty">Empty</span>';
      if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches)
        for (let [key, el] of data.items) {
          const before = old.get(key),
            after = el.getBoundingClientRect();
          if (before && (before.x !== after.x || before.y !== after.y)) {
            el.getAnimations().forEach((a) => a.cancel());
            el.animate(
              [
                {
                  transform: `translate(${before.x - after.x}px,${before.y - after.y}px)`,
                },
                { transform: "translate(0,0)" },
              ],
              {
                duration: Math.min(500, this.speed * 0.7),
                easing: "cubic-bezier(.16,1,.3,1)",
              },
            );
          } else if (!before)
            el.animate(
              [
                { opacity: 0.3, transform: "translateY(-8px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 300 },
            );
        }
    }
    bars(data, a, water, animate) {
      const target = data.el.querySelector(".trace-panel-content"),
        ns = "http://www.w3.org/2000/svg",
        values = a.values,
        waters = water?.values ?? values.map(() => 0),
        max = Math.max(1, ...values.map((v, i) => v + (waters[i] ?? 0))),
        gap = Math.min(46, 560 / Math.max(1, values.length)),
        bw = gap * 0.7;
      let svg = target.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 620 240");
        svg.setAttribute("class", "elevation-svg");
        svg.setAttribute("role", "img");
        svg.setAttribute(
          "aria-label",
          "Elevation map with water above each column",
        );
        target.append(svg);
      }
      values.forEach((v, i) => {
        let key = "bar:" + i,
          g = data.items.get(key);
        if (!g) {
          g = document.createElementNS(ns, "g");
          g.innerHTML =
            '<rect class="elevation-ground"/><rect class="elevation-water"/><text class="elevation-value" text-anchor="middle"/><text class="elevation-index" text-anchor="middle"/>';
          svg.append(g);
          data.items.set(key, g);
        }
        let x = 310 + (i - (values.length - 1) / 2) * gap - bw / 2,
          base = 195,
          height = (v / max) * 155,
          wh = ((waters[i] ?? 0) / max) * 155;
        g.querySelectorAll("rect").forEach((r) => {
          r.setAttribute("x", x);
          r.setAttribute("width", bw);
          r.setAttribute("rx", 2);
          r.style.transition = animate
            ? "y 450ms ease-out,height 450ms ease-out,fill 200ms"
            : "none";
        });
        let ground = g.querySelector(".elevation-ground");
        ground.style.y = base - height + "px";
        ground.style.height = Math.max(1, height) + "px";
        ground.style.fill = (a.active ?? []).includes(i)
          ? "var(--accent)"
          : "var(--green)";
        let w = g.querySelector(".elevation-water");
        w.style.y = base - height - wh + "px";
        w.style.height = wh + "px";
        let text = g.querySelector(".elevation-value");
        text.setAttribute("x", x + bw / 2);
        text.setAttribute("y", base - height - wh - 10);
        text.textContent = v;
        let idx = g.querySelector(".elevation-index");
        idx.setAttribute("x", x + bw / 2);
        idx.setAttribute("y", base + 22);
        idx.textContent = i;
      });
      for (let [key, g] of data.items)
        if (key.startsWith("bar:") && +key.slice(4) >= values.length) {
          g.remove();
          data.items.delete(key);
        }
    }
    matrix(data, m, animate) {
      const target = data.el.querySelector(".trace-panel-content"),
        rows = m.values ?? [];
      let cols = Math.max(0, ...rows.map((r) => r.length));
      let old = data.matrixValues ?? [];
      target.className = "trace-panel-content trace-matrix-scroll";
      target.innerHTML = `<table class="trace-matrix"><tbody>${rows.map((row, r) => `<tr>${row.map((v, c) => `<td class="${(m.active ?? []).some((x) => x[0] === r && x[1] === c) ? "is-active" : (m.done ?? []).some((x) => x[0] === r && x[1] === c) ? "is-done" : ""} ${animate && old[r]?.[c] !== v ? "cell-updated" : ""}" title="Row ${r}, column ${c}">${h(pretty(v))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      data.matrixValues = clone(rows);
    }
    graph(data, f, animate) {
      const target = data.el.querySelector(".trace-panel-content"),
        nodes = f.nodes ?? [],
        edges = f.edges ?? [];
      const hasCoordinates = nodes.every(
        (n) => Number.isFinite(n.x) && Number.isFinite(n.y),
      );
      const rowCounts = hasCoordinates
        ? [...new Set(nodes.map((n) => n.y))].map(
            (y) => nodes.filter((n) => n.y === y).length,
          )
        : [0];
      const w = Math.max(
        280,
        target.clientWidth || 640,
        Math.max(...rowCounts) * 48 + 40,
      );
      const height =
        hasCoordinates && rowCounts.length === 1
          ? 150
          : nodes.length > 15
            ? 330
            : 270;
      target.className = "trace-panel-content trace-graph";
      let svg = target.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${w} ${height}`);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Algorithm node and edge diagram");
        svg.innerHTML =
          '<defs><marker id="trace-arrow" viewBox="0 0 10 10" refX="25" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="context-stroke"/></marker></defs><g class="graph-edges"></g><g class="graph-nodes"></g>';
        target.append(svg);
      }
      svg.setAttribute("viewBox", `0 0 ${w} ${height}`);
      svg.style.width = w + "px";
      svg.style.maxWidth = "none";
      const positions = new Map();
      let hasXY = nodes.every(
        (n) => Number.isFinite(n.x) && Number.isFinite(n.y),
      );
      let xs = nodes.map((n) => n.x),
        ys = nodes.map((n) => n.y),
        minX = Math.min(...xs),
        maxX = Math.max(...xs),
        minY = Math.min(...ys),
        maxY = Math.max(...ys);
      nodes.forEach((n, i) => {
        let p = hasXY
          ? [
              maxX === minX
                ? w / 2
                : 45 + ((n.x - minX) / (maxX - minX)) * (w - 90),
              maxY === minY
                ? height / 2
                : 35 + ((n.y - minY) / (maxY - minY)) * (height - 70),
            ]
          : [
              w / 2 +
                Math.cos(
                  (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2,
                ) *
                  Math.min(w / 2 - 35, 50 + nodes.length * 20),
              height / 2 +
                Math.sin(
                  (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2,
                ) *
                  (height / 2 - 35),
            ];
        positions.set(String(n.id), p);
      });
      const ns = "http://www.w3.org/2000/svg",
        ng = svg.querySelector(".graph-nodes"),
        eg = svg.querySelector(".graph-edges");
      const nodeIds = new Set();
      nodes.forEach((n) => {
        let id = String(n.id),
          key = "node:" + id;
        nodeIds.add(key);
        let g = data.items.get(key);
        if (!g) {
          g = document.createElementNS(ns, "g");
          g.innerHTML = '<circle r="21"/><text text-anchor="middle" dy="4"/>';
          ng.append(g);
          data.items.set(key, g);
        }
        let [x, y] = positions.get(id);
        g.style.transition = animate
          ? "transform 450ms cubic-bezier(.16,1,.3,1)"
          : "none";
        g.style.transform = `translate(${x}px,${y}px)`;
        g.setAttribute("class", "trace-node " + (n.state ?? ""));
        g.querySelector("text").textContent = n.label;
      });
      for (let [key, g] of data.items)
        if (key.startsWith("node:") && !nodeIds.has(key)) {
          g.remove();
          data.items.delete(key);
        }
      eg.innerHTML = edges
        .map((e) => {
          let p = positions.get(String(e.from)),
            q = positions.get(String(e.to));
          if (!p || !q) return "";
          let color =
            e.state === "active"
              ? "var(--accent)"
              : e.state === "done"
                ? "var(--green)"
                : "var(--line)";
          return `<g><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${color}" stroke-width="${e.state ? 3 : 2}" ${e.directed === false ? "" : 'marker-end="url(#trace-arrow)"'}/>${e.label !== undefined ? `<text x="${(p[0] + q[0]) / 2}" y="${(p[1] + q[1]) / 2 - 6}" text-anchor="middle" class="edge-label">${h(e.label)}</text>` : ""}</g>`;
        })
        .join("");
    }
    destroy() {
      this.pause();
      this.resize.disconnect();
      document.removeEventListener("visibilitychange", this.hidden);
    }
  }
  globalThis.ProblemPlayer = ProblemPlayer;
})();
