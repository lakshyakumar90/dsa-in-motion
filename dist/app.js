(() => {
  const $ = (s) => document.querySelector(s),
    esc = (v) =>
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
  const topics = CURRICULUM.topics;
  const questions = topics.flatMap((t, ti) =>
    t.resources.map((q, qi) => ({ ...q, ti, qi })),
  );
  const byId = new Map(questions.map((q) => [q.id, q]));
  let labs = [],
    heroIndex = 0,
    lang = "cpp",
    filter = { query: "", difficulty: "All", topic: "All", status: "All" };
  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }
  const progress = read("dsa-motion-progress", {}),
    bookmarks = read("dsa-motion-bookmarks", {}),
    notes = read("dsa-motion-notes", {});
  function save(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      toast("Browser storage is unavailable. Changes last for this visit.");
    }
  }
  function toast(s) {
    $("#toast").textContent = s;
    $("#toast").classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 2200);
  }
  function topicName(i) {
    return TOPICS[i].title;
  }
  function doneCount(i) {
    return questions.filter(
      (q) => (i === undefined || q.ti === i) && progress[q.id],
    ).length;
  }
  function progressHTML() {
    let n = doneCount();
    return `<div class="progress-row"><span>${n} / 165 understood</span><span class="progress-track"><i style="width:${(n / 165) * 100}%"></i></span><small>Saved on this browser</small></div>`;
  }
  function qrow(q) {
    return `<div class="qrow"><button data-complete="${q.id}" class="${progress[q.id] ? "completed" : ""}" aria-label="${progress[q.id] ? "Mark incomplete" : "Mark understood"}: ${esc(q.name)}" aria-pressed="${!!progress[q.id]}">${progress[q.id] ? "☑" : "□"}</button><a href="#question/${q.id}">${esc(q.name)} <small>↗</small></a><span class="difficulty ${q.level}">${q.level}</span><button data-bookmark="${q.id}" class="${bookmarks[q.id] ? "bookmarked" : ""}" aria-label="${bookmarks[q.id] ? "Remove bookmark" : "Bookmark"}: ${esc(q.name)}" aria-pressed="${!!bookmarks[q.id]}">${bookmarks[q.id] ? "★" : "☆"}</button></div>`;
  }
  function attachRows() {
    document.querySelectorAll("[data-complete]").forEach(
      (b) =>
        (b.onclick = () => {
          let id = b.dataset.complete;
          progress[id] = !progress[id];
          save("dsa-motion-progress", progress);
          updateSidebarProgress();
          b.classList.toggle("completed", progress[id]);
          b.textContent = progress[id] ? "☑" : "□";
          b.setAttribute("aria-pressed", !!progress[id]);
          b.setAttribute(
            "aria-label",
            `${progress[id] ? "Mark incomplete" : "Mark understood"}: ${byId.get(id).name}`,
          );
          if (location.hash.startsWith("#questions")) {
            const y = scrollY;
            renderSheet(false);
            scrollTo(0, y);
          }
          toast(progress[id] ? "Marked understood" : "Marked incomplete");
        }),
    );
    document.querySelectorAll("[data-bookmark]").forEach(
      (b) =>
        (b.onclick = () => {
          let id = b.dataset.bookmark;
          bookmarks[id] = !bookmarks[id];
          save("dsa-motion-bookmarks", bookmarks);
          b.classList.toggle("bookmarked", bookmarks[id]);
          b.textContent = bookmarks[id] ? "★" : "☆";
          b.setAttribute("aria-pressed", !!bookmarks[id]);
          b.setAttribute(
            "aria-label",
            `${bookmarks[id] ? "Remove bookmark" : "Bookmark"}: ${byId.get(id).name}`,
          );
          if (
            location.hash.startsWith("#questions") &&
            filter.status === "Bookmarked"
          ) {
            let y = scrollY;
            renderSheet(false);
            scrollTo(0, y);
          }
          toast(bookmarks[id] ? "Bookmarked" : "Bookmark removed");
        }),
    );
  }
  function mini(i) {
    return `<div class="mini-bars" aria-hidden="true">${Array.from({ length: 9 }, (_, j) => `<i style="height:${8 + ((i * 7 + j * 11) % 27)}px;${j === 4 ? "opacity:1" : ""}"></i>`).join("")}</div>`;
  }
  function cards() {
    return topics
      .map(
        (t, i) =>
          `<a href="#topic/${i}" class="topic-card"><div class="top"><span>Topic ${String(i + 1).padStart(2, "0")}</span><span>${t.resources.length} questions</span></div>${mini(i)}<h3>${topicName(i)}</h3><p>${TOPICS[i].short}</p><div class="bottom"><span>${doneCount(i) ? `${doneCount(i)} understood` : "Explore the idea & model"}</span><span>↗</span></div></a>`,
      )
      .join("");
  }
  function home() {
    document.title = "DSA in Motion — See the algorithm.";
    $("#main").innerHTML =
      `<section class="hero"><div class="hero-inner"><div class="hero-copy"><div class="tag"><b>3D</b> Algorithms you can turn, change, and understand</div><h1>Learn DSA<br><em>in motion.</em></h1><p>Stop memorizing solutions. See why they work.<br>From your first array to graphs and dynamic programming, build intuition one interactive model at a time.</p><div class="actions"><a class="btn primary" href="#topic/0">Start learning <span>↗</span></a><a class="textlink" href="#questions">Explore the question sheet</a></div><div class="source-note"><span class="line"></span>Following the <a href="https://namastedev.com/namaste-dsa-sheet" target="_blank" rel="noopener">Namaste DSA Sheet ↗</a><span>·</span> C++ / JS / Python</div></div><div class="hero-model"><div class="model-card"><div class="model-top"><span id="hero-label"></span><div class="live">Interactive model</div></div><div id="hero-lab"></div><div class="model-description"><h3 id="hero-name"></h3><p id="hero-description"></p></div></div><div class="hero-model-bottom"><span id="hero-counter"></span><div class="dots" aria-label="Choose a model"></div><div class="arrowbuttons"><button id="hero-prev" aria-label="Previous model">←</button><button id="hero-next" aria-label="Next model">→</button></div></div></div></div></section><div class="stats"><div class="stat"><strong>165</strong><span>Questions to work through</span></div><div class="stat"><strong>14</strong><span>Topics, from first principles</span></div><div class="stat"><strong>165</strong><span>Problem-specific animations</span></div><div class="stat"><strong>3</strong><span>Languages for every solution</span></div></div><section class="wrap section"><div class="section-head"><div><div class="eyebrow">The learning path</div><h2>From “I’ve seen this”<br>to “I understand this.”</h2></div><p>Follow the sheet in order, or jump to the idea you’re stuck on. Each topic connects an explanation, a working model, and practice.</p></div><div class="topic-grid">${cards()}</div></section><section class="rhythm"><div class="wrap section"><div class="eyebrow">A better way to practice</div><h2>See it. Move it. Code it.</h2><div class="steps-grid"><div><b>01 / Understand</b><h3>Find the invariant.</h3><p>Learn what stays true at every step. That is the reason an algorithm works.</p></div><div><b>02 / Experiment</b><h3>Make the model move.</h3><p>Change an input, follow the pointers, and replay the moment an idea clicks.</p></div><div><b>03 / Implement</b><h3>Read it in your language.</h3><p>Original C++, JavaScript, and Python solutions, with time and space analysis.</p></div><div><b>04 / Remember</b><h3>Keep your own trail.</h3><p>Bookmark hard questions, save notes, and track understanding on this browser.</p></div></div></div></section><div class="wrap"><div class="cta-band"><div><h2>Your first “aha” is one model away.</h2><p>No account needed. Pick a topic and start moving things.</p></div><a class="btn primary" href="#lab">Open the playground <span>↗</span></a></div></div>`;
    showHero();
    $("#hero-prev").onclick = () => {
      heroIndex = (heroIndex + 5) % 6;
      showHero();
    };
    $("#hero-next").onclick = () => {
      heroIndex = (heroIndex + 1) % 6;
      showHero();
    };
  }
  function showHero() {
    if (labs.length) labs.forEach((l) => l.destroy());
    labs = [];
    let ids = ["water", "binary", "tree", "linked", "dp", "graph"],
      id = ids[heroIndex],
      x = LABS[id];
    $("#hero-label").textContent =
      `Topic ${String(x.topic + 1).padStart(2, "0")} / ${topicName(x.topic)}`;
    $("#hero-name").textContent = x.title;
    $("#hero-description").textContent = x.description;
    $("#hero-counter").textContent = `0${heroIndex + 1} / 06`;
    $(".dots").innerHTML = ids
      .map(
        (_, i) =>
          `<button aria-label="Show ${LABS[ids[i]].title}" class="${i === heroIndex ? "active" : ""}" data-model="${i}"></button>`,
      )
      .join("");
    document.querySelectorAll("[data-model]").forEach(
      (b) =>
        (b.onclick = () => {
          heroIndex = +b.dataset.model;
          showHero();
        }),
    );
    let l = new ProblemPlayer($("#hero-lab"), heroQuestions[id], true);
    l.index =
      id === "water" ? 8 : id === "tree" ? 4 : Math.min(2, l.frames.length - 1);
    l.render(false);
    labs.push(l);
  }
  function learn() {
    document.title = "Learning path — DSA in Motion";
    $("#main").innerHTML =
      `<div class="wrap"><div class="page-title"><div class="eyebrow">Your curriculum</div><h1>One idea at a time.</h1><p>Fourteen topics, in the order of the Namaste DSA Sheet. Start with the explanation, experiment in the pattern lab, then test yourself on the questions.</p>${progressHTML()}</div><div class="topic-grid">${cards()}</div><div class="cta-band"><p>Already know the concepts? Go straight to practice.</p><a class="btn" href="#questions">Open the question sheet ↗</a></div></div>`;
  }
  function renderSheet(initial = true) {
    document.title = "Question sheet — DSA in Motion";
    if (initial)
      $("#main").innerHTML =
        `<div class="wrap"><div class="page-title"><div class="eyebrow">The Namaste DSA Sheet, visualized</div><h1>Practice with a picture.</h1><p>All 165 questions, with original explanations and solutions in three languages. Use a topic’s pattern lab to build intuition, then solve the exact problem.</p><div id="sheet-progress">${progressHTML()}</div></div><div class="filters"><input id="search" aria-label="Search questions" placeholder="Search questions or companies…" value="${esc(filter.query)}"><select id="difficulty" aria-label="Filter difficulty"><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select><select id="topic-filter" aria-label="Filter topic"><option value="All">All topics</option>${TOPICS.map((t, i) => `<option value="${i}">${t.title}</option>`).join("")}</select>${["All", "Bookmarked", "Completed"].map((s) => `<button data-status="${s}" class="${filter.status === s ? "selected" : ""}">${s}</button>`).join("")}</div><p id="result-count" style="color:var(--muted);font-size:12px"></p><div id="sheet-results"></div><div class="source-panel">Question names, topic order, difficulty labels, and source links: <a href="https://namastedev.com/namaste-dsa-sheet" target="_blank" rel="noopener">Namaste DSA Sheet ↗</a>. Explanations and solutions are independently written.</div><div style="height:50px"></div></div>`;
    const matching = questions.filter(
      (q) =>
        (filter.difficulty === "All" || q.level === filter.difficulty) &&
        (filter.topic === "All" || q.ti === +filter.topic) &&
        (filter.status === "All" ||
          (filter.status === "Bookmarked" && bookmarks[q.id]) ||
          (filter.status === "Completed" && progress[q.id])) &&
        `${q.name} ${q.companies.join(" ")} ${topicName(q.ti)}`
          .toLowerCase()
          .includes(filter.query.toLowerCase()),
    );
    $("#sheet-results").innerHTML =
      topics
        .map((t, i) => {
          const qs = matching.filter((q) => q.ti === i);
          return qs.length
            ? `<details class="sheet-group" open><summary><span>${String(i + 1).padStart(2, "0")} &nbsp; ${topicName(i)}</span><small>${doneCount(i)} / ${t.resources.length} &nbsp;⌄</small></summary>${qs.map(qrow).join("")}</details>`
            : "";
        })
        .join("") ||
      '<div class="empty">No questions match these filters. Clear the search or choose another topic.</div>';
    $("#result-count").textContent =
      `${matching.length} question${matching.length === 1 ? "" : "s"} shown`;
    $("#sheet-progress").innerHTML = progressHTML();
    attachRows();
    if (initial) {
      $("#difficulty").value = filter.difficulty;
      $("#topic-filter").value = filter.topic;
      $("#search").oninput = (e) => {
        filter.query = e.target.value;
        renderSheet(false);
      };
      $("#difficulty").onchange = (e) => {
        filter.difficulty = e.target.value;
        renderSheet(false);
      };
      $("#topic-filter").onchange = (e) => {
        filter.topic = e.target.value;
        renderSheet(false);
      };
      document.querySelectorAll("[data-status]").forEach(
        (b) =>
          (b.onclick = () => {
            filter.status = b.dataset.status;
            document
              .querySelectorAll("[data-status]")
              .forEach((x) => x.classList.toggle("selected", x === b));
            renderSheet(false);
          }),
      );
    }
  }
  function sidebar(i, currentId = null) {
    return `<div class="curriculum-mobile-bar"><button id="curriculum-open" aria-expanded="false" aria-controls="curriculum-sidebar">${UI_ICON("menu")} Browse curriculum</button><span>${topicName(i)}</span></div><button class="sidebar-backdrop" aria-label="Close curriculum" hidden></button><aside class="sidebar" id="curriculum-sidebar" aria-label="Curriculum navigation"><div class="sidebar-inner"><div class="sidebar-heading"><a href="#learn">Your learning path</a><button id="curriculum-close" aria-label="Close curriculum">${UI_ICON("close")}</button></div><label class="sidebar-search"><input type="search" id="curriculum-search" aria-label="Find a question in the sidebar" placeholder="Find a question…"></label><div class="sidebar-scroll">${TOPICS.map(
      (t, j) =>
        `<details class="sidebar-topic" ${j === i ? "open" : ""} data-topic="${j}"><summary><span class="sidebar-topic-number">${String(j + 1).padStart(2, "0")}</span><span>${t.title}</span><small>${doneCount(j)}/${topics[j].resources.length}</small>${UI_ICON("chevron")}</summary><div class="sidebar-questions"><a class="topic-overview ${j === i && !currentId ? "active" : ""}" href="#topic/${j}" ${j === i && !currentId ? 'aria-current="page"' : ""}>Concept & pattern lab</a>${questions
          .filter((q) => q.ti === j)
          .map(
            (q) =>
              `<a class="sidebar-question ${q.id === currentId ? "active" : ""}" href="#question/${q.id}" data-question-name="${esc(q.name.toLowerCase())}" ${q.id === currentId ? 'aria-current="page"' : ""}><i class="${progress[q.id] ? "understood" : ""}" aria-label="${progress[q.id] ? "Understood" : "Incomplete"}"></i><span>${esc(q.name)}</span></a>`,
          )
          .join("")}</div></details>`,
    ).join(
      "",
    )}<p class="sidebar-no-results" hidden>No matching questions.</p></div><a class="sidebar-all" href="#questions">View full question sheet ${UI_ICON("chevron")}</a></div></aside>`;
  }
  function updateSidebarProgress() {
    const bar = $("#curriculum-sidebar");
    if (!bar) return;
    bar.querySelectorAll(".sidebar-question").forEach((a) => {
      let q = byId.get(a.hash.split("/")[1]);
      if (q) {
        a.querySelector("i").classList.toggle("understood", !!progress[q.id]);
        a.querySelector("i").setAttribute(
          "aria-label",
          progress[q.id] ? "Understood" : "Incomplete",
        );
      }
    });
    bar.querySelectorAll(".sidebar-topic").forEach((d) => {
      const i = +d.dataset.topic;
      d.querySelector("small").textContent =
        doneCount(i) + "/" + topics[i].resources.length;
    });
  }
  function initSidebar() {
    const bar = $("#curriculum-sidebar");
    if (!bar) return;
    const toggle = (open) => {
      bar.classList.toggle("drawer-open", open);
      $(".sidebar-backdrop").hidden = !open;
      $("#curriculum-open").setAttribute("aria-expanded", open);
      document.body.classList.toggle("curriculum-is-open", open);
      if (open) $("#curriculum-search").focus();
      else $("#curriculum-open").focus();
    };
    $("#curriculum-open").onclick = () => toggle(true);
    $("#curriculum-close").onclick = () => toggle(false);
    $(".sidebar-backdrop").onclick = () => toggle(false);
    bar.onkeydown = (e) => {
      if (e.key === "Escape") {
        toggle(false);
        return;
      }
      if (e.key === "Tab" && bar.classList.contains("drawer-open")) {
        const els = [...bar.querySelectorAll("a,button,input,summary")].filter(
          (el) => el.getClientRects().length,
        );
        let first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    $("#curriculum-search").oninput = (e) => {
      let term = e.target.value.toLowerCase().trim(),
        total = 0;
      bar.querySelectorAll(".sidebar-topic").forEach((d) => {
        let found = 0;
        d.querySelectorAll("[data-question-name]").forEach((a) => {
          a.hidden = !!term && !a.dataset.questionName.includes(term);
          if (!a.hidden) found++;
        });
        d.hidden = !!term && !found;
        if (term) d.open = !!found;
        else d.open = +d.dataset.topic === +bar.dataset.currentTopic;
        total += found;
      });
      $(".sidebar-no-results").hidden = !!total;
    };
    bar.dataset.currentTopic = iFromSidebar();
    requestAnimationFrame(() => {
      let a = bar.querySelector('[aria-current="page"]'),
        scroll = bar.querySelector(".sidebar-scroll");
      if (a)
        scroll.scrollTop = Math.max(
          0,
          a.offsetTop - scroll.offsetTop - scroll.clientHeight * 0.35,
        );
    });
    function iFromSidebar() {
      return bar.querySelector(".sidebar-topic[open]")?.dataset.topic ?? 0;
    }
  }

  function topicPage(i) {
    if (!TOPICS[i]) {
      location.hash = "#learn";
      return;
    }
    let t = TOPICS[i];
    document.title = `${t.title} — DSA in Motion`;
    $("#main").innerHTML =
      `<div class="study">${sidebar(i)}<article class="lesson"><div class="breadcrumbs"><a href="#learn">Learning path</a> / Topic ${String(i + 1).padStart(2, "0")}</div><div class="tag"><b>${topics[i].resources.length}</b> questions · 3 languages</div><h1>${t.title}</h1><p class="lead">${t.idea}</p><div class="insight"><b>The invariant</b>${t.invariant}</div><h2>Move the idea around.</h2><p>${esc(SOLUTIONS[topicQuestions[i]].idea)}</p><div id="topic-lab"></div><h2>Why it works</h2><ol>${t.explain.map((s) => `<li>${s}</li>`).join("")}</ol><div class="insight"><b>A mistake to watch for</b>${t.pitfall}</div><h2>Check your intuition</h2><div class="quiz"><p>${t.quiz}</p><div class="options">${t.options.map((s, j) => `<button data-answer="${j}">${s}</button>`).join("")}</div><p class="feedback" aria-live="polite"></p></div><h2>Put it into practice</h2><p>Each question has an explanation, complexity analysis, and a solution in C++, JavaScript, and Python.</p><div class="sheet-group lesson-list">${questions
        .filter((q) => q.ti === i)
        .map(qrow)
        .join(
          "",
        )}</div><div class="end-nav">${i ? `<a href="#topic/${i - 1}">← ${topicName(i - 1)}</a>` : '<a href="#learn">← Learning path</a>'}${i < 13 ? `<a href="#topic/${i + 1}">${topicName(i + 1)} →</a>` : '<a href="#questions">All questions →</a>'}</div></article></div>`;
    labs.push(new ProblemPlayer($("#topic-lab"), topicQuestions[i]));
    initSidebar();
    attachRows();
    document.querySelectorAll("[data-answer]").forEach(
      (b) =>
        (b.onclick = () => {
          const ok = +b.dataset.answer === t.answer;
          $(".feedback").textContent = ok
            ? `Exactly. ${t.why}`
            : `Try again. ${t.options[+b.dataset.answer]} does not fit the invariant.`;
          $(".quiz").classList.toggle("correct", ok);
        }),
    );
  }
  const heroQuestions = {
    water: "Trapping Rain Water",
    binary: "Binary Search",
    tree: "Level Order Traversal",
    linked: "Reverse Linked List",
    dp: "Climbing Stairs",
    graph: "Find if Path Exists in Graph",
  };
  const topicQuestions = [
    "Find Largest Number in an Array",
    "Trapping Rain Water",
    "Reverse Linked List",
    "Longest Substring Without Repeating Characters",
    "Valid Parentheses",
    "Binary Search",
    "Trapping Rain Water",
    "Level Order Traversal",
    "Search in a BST",
    "Kth Largest Element in an Array",
    "Subsets - The Power Set",
    "Non Overlapping Intervals",
    "Climbing Stairs",
    "Find if Path Exists in Graph",
  ];
  const exactLabs = {
    "Trapping Rain Water": "water",
    "Binary Search": "binary",
    "Reverse Linked List": "linked",
    "Longest Substring Without Repeating Characters": "window",
    "Valid Parentheses": "stack",
    "Climbing Stairs": "dp",
    "Level Order Traversal": "tree",
    "Search in a BST": "bst",
    "Subsets - The Power Set": "subsets",
  };
  function codeMarkup(code) {
    return globalThis.CodeHighlight
      ? CodeHighlight.highlight(code, {
          language: { cpp: "cpp", js: "javascript", python: "python" }[lang],
        }).value
      : esc(code);
  }
  function renderCode(solution) {
    const code = solution[lang].trimEnd();
    $("#solution-code").innerHTML = codeMarkup(code);
    $("#code-gutter").innerHTML = code
      .split("\n")
      .map((_, i) => `<span>${i + 1}</span>`)
      .join("");
    $("#code-file").textContent =
      "solution." + { cpp: "cpp", js: "js", python: "py" }[lang];
    $("#code-lines").textContent = code.split("\n").length + " lines";
    $("#code-environment").textContent =
      lang === "cpp"
        ? "C++ function snippet · include the standard headers and use the standard namespace."
        : lang === "python"
          ? "Python 3 · standard judge node types are assumed where referenced."
          : "JavaScript · standard judge node types are assumed where referenced.";
    document.querySelectorAll("[data-lang]").forEach((b) => {
      let active = b.dataset.lang === lang;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active);
      b.tabIndex = active ? 0 : -1;
    });
  }

  function questionPage(id) {
    const q = byId.get(id);
    if (!q) {
      $("#main").innerHTML =
        '<div class="wrap section"><h1>Question not found.</h1><a href="#questions">Return to the sheet</a></div>';
      return;
    }
    const s = (globalThis.SOLUTIONS ?? {})[q.name],
      t = TOPICS[q.ti],
      exact = true,
      lab = null;
    document.title = `${q.name} — DSA in Motion`;
    $("#main").innerHTML =
      `<div class="study">${sidebar(q.ti, q.id)}<article class="lesson"><div class="breadcrumbs"><a href="#questions">Question sheet</a> / <a href="#topic/${q.ti}">${t.title}</a> / ${q.qi + 1}</div><span class="difficulty ${q.level}">${q.level}</span><h1>${esc(q.name)}</h1>${s?.statement ? `<p class="lead">${esc(s.statement)}</p>` : ""}<div class="practice-actions"><button id="understood" class="${progress[id] ? "done" : ""}">${progress[id] ? "✓ Understood" : "Mark understood"}</button><button id="bookmark-question">${bookmarks[id] ? "★ Bookmarked" : "☆ Bookmark"}</button><a class="textlink" href="${esc(q.leetcode)}" target="_blank" rel="noopener">Open source problem ↗</a></div>${s ? `<h2>The idea</h2><p>${esc(s.idea)}</p>${s.example ? `<div class="insight"><b>Example</b>${esc(s.example)}</div>` : ""}<h2>Work through the solution</h2><ol>${s.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol><div class="complexities"><span>Time <b>${esc(s.time)}</b></span><span>Extra space <b>${esc(s.space)}</b></span></div>` : '<p class="empty">Solution content could not load. Reload the page to try again.</p>'}<div class="lesson-jumps" aria-label="On this page"><button data-jump="question-animation">Animation</button><button data-jump="question-code">Code</button><button data-jump="question-notes">Your notes</button></div><h2 id="question-animation">Watch this solution unfold</h2><p>Follow the actual algorithm for this question. Each step shows the operation, the data it changes, and the variables that explain why.</p><div id="question-lab"></div>${
        s
          ? `<h2 id="question-code">The implementation</h2><p>Switch languages to compare the same approach. Copy the function into your practice environment.</p>${/Linked List|Binary Tree|Binary Search Tree|Graphs/.test(t.title) ? "<p><small>ListNode, TreeNode, and graph Node types follow the standard judge definitions where referenced. C++ snippets use the standard library; include the relevant headers and using namespace std. Python annotations use the usual typing imports.</small></p>" : ""}${q.name === "Second Largest" ? '<div class="insight"><b>Source-link discrepancy</b>The sheet names an array question but links to “Second Largest Digit in a String”. This solution follows the linked problem and finds the second-largest distinct digit in an alphanumeric string. The row title alone is ambiguous.</div>' : ""}<div class="codebox"><div class="codebar"><div class="language-tabs" role="tablist" aria-label="Solution language">${[
              ["cpp", "C++"],
              ["js", "JavaScript"],
              ["python", "Python"],
            ]
              .map(
                ([k, v]) =>
                  `<button role="tab" data-lang="${k}" aria-controls="code-panel" aria-selected="${k === lang}" class="${k === lang ? "active" : ""}">${v}</button>`,
              )
              .join(
                "",
              )}</div><div class="code-tools"><button id="wrap-code" aria-pressed="false">Wrap</button><button class="copy" id="copy-code">Copy code</button></div></div><div class="code-filebar"><span id="code-file"></span><small id="code-lines"></small></div><div class="code-scroll" id="code-panel" role="tabpanel" tabindex="0" aria-label="Formatted solution"><div id="code-gutter" class="code-gutter" aria-hidden="true"></div><pre><code id="solution-code"></code></pre></div><div class="code-environment" id="code-environment"></div></div>`
          : ""
      }<h2 id="question-notes">Your notes</h2><p>Write the clue you want to recognize next time. Saved only on this browser.</p><textarea class="notes" aria-label="Personal notes" placeholder="What made this problem click?">${esc(notes[id] ?? "")}</textarea><div class="source-panel" style="margin-top:30px">Listed in the <a href="https://namastedev.com/namaste-dsa-sheet" target="_blank" rel="noopener">Namaste DSA Sheet ↗</a>. <a href="${esc(q.blog)}" target="_blank" rel="noopener">Source editorial ↗</a> · <a href="${esc(q.video)}" target="_blank" rel="noopener">Source video ↗</a><br>Companies listed by the source: ${q.companies.map(esc).join(", ")}. Independent educational companion; not an official question bank.</div><div class="end-nav"><a href="#topic/${q.ti}">← ${t.title}</a>${questions[questions.indexOf(q) + 1] ? `<a href="#question/${questions[questions.indexOf(q) + 1].id}">Next question →</a>` : '<a href="#questions">Back to sheet →</a>'}</div></article></div>`;
    labs.push(new ProblemPlayer($("#question-lab"), q.name));
    initSidebar();
    document.querySelectorAll("[data-jump]").forEach(
      (b) =>
        (b.onclick = () =>
          document.getElementById(b.dataset.jump).scrollIntoView({
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          })),
    );
    $("#understood").onclick = () => {
      progress[id] = !progress[id];
      save("dsa-motion-progress", progress);
      updateSidebarProgress();
      $("#understood").textContent = progress[id]
        ? "✓ Understood"
        : "Mark understood";
      $("#understood").classList.toggle("done", progress[id]);
      toast(progress[id] ? "Marked understood" : "Marked incomplete");
    };
    $("#bookmark-question").onclick = () => {
      bookmarks[id] = !bookmarks[id];
      save("dsa-motion-bookmarks", bookmarks);
      $("#bookmark-question").textContent = bookmarks[id]
        ? "★ Bookmarked"
        : "☆ Bookmark";
    };
    $(".notes").oninput = (e) => {
      notes[id] = e.target.value;
      save("dsa-motion-notes", notes);
    };
    renderCode(s);
    document.querySelectorAll("[data-lang]").forEach((b) => {
      b.onclick = () => {
        lang = b.dataset.lang;
        renderCode(s);
      };
      b.onkeydown = (e) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          let keys = ["cpp", "js", "python"],
            n = keys.indexOf(lang);
          lang =
            keys[
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? 2
                  : (n + (e.key === "ArrowRight" ? 1 : 2)) % 3
            ];
          renderCode(s);
          document.querySelector('[data-lang="' + lang + '"]').focus();
        }
      };
    });
    $("#wrap-code").onclick = () => {
      const on = $(".codebox").classList.toggle("wrap-code");
      $("#wrap-code").setAttribute("aria-pressed", on);
    };
    $("#copy-code")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(s[lang]);
        toast("Code copied");
      } catch {
        toast("Select the code and copy it with your keyboard.");
      }
    });
  }
  function playground() {
    document.title = "Animation library — DSA in Motion";
    $("#main").innerHTML =
      `<div class="wrap"><div class="page-title"><h1>Every problem.<br>Every step, visible.</h1><p>Choose any of the 165 questions. These animations execute each problem’s algorithm, with editable examples, real intermediate state, and a result you can verify.</p></div><div class="filters"><select id="animation-topic" aria-label="Animation topic"><option value="All">All topics</option>${TOPICS.map((t, i) => `<option value="${i}">${t.title}</option>`).join("")}</select><select id="animation-question" aria-label="Choose a problem animation"></select></div><div id="playground-lab"></div><div class="cta-band"><p id="playground-topic"></p><a class="btn" id="playground-question" href="#questions">Open explanation and code</a></div></div>`;
    function choose(id) {
      let q = byId.get(id);
      labs.forEach((l) => l.destroy());
      labs = [];
      labs.push(new ProblemPlayer($("#playground-lab"), q.name));
      $("#playground-topic").innerHTML =
        `<a class="textlink" href="#topic/${q.ti}">${topicName(q.ti)}</a>`;
      $("#playground-question").href = "#question/" + q.id;
    }
    function options() {
      let t = $("#animation-topic").value,
        qs = questions.filter((q) => t === "All" || q.ti === +t);
      $("#animation-question").innerHTML = qs
        .map((q) => `<option value="${q.id}">${esc(q.name)}</option>`)
        .join("");
      choose(qs[0].id);
    }
    $("#animation-topic").onchange = options;
    $("#animation-question").onchange = (e) => choose(e.target.value);
    options();
  }

  function route() {
    labs.forEach((l) => l.destroy());
    labs = [];
    document.body.classList.remove("curriculum-is-open");
    const [page, arg] = (location.hash.slice(1) || "home").split("/");
    $("nav").classList.remove("open");
    document
      .querySelectorAll("nav a")
      .forEach((a) =>
        a.classList.toggle(
          "active",
          a.hash === `#${page}` || (page === "topic" && a.hash === "#learn"),
        ),
      );
    if (page === "home") home();
    else if (page === "learn") learn();
    else if (page === "questions") renderSheet();
    else if (page === "topic") topicPage(+arg);
    else if (page === "question") questionPage(arg);
    else if (page === "lab") playground();
    else learn();
    scrollTo({ top: 0, behavior: "instant" });
  }
  $(".skip").onclick = (e) => {
    e.preventDefault();
    $("#main").focus();
    $("#main").scrollIntoView({ behavior: "instant" });
  };
  if (read("dsa-motion-light", false)) document.body.classList.add("light");
  $("#theme").onclick = () => {
    document.body.classList.toggle("light");
    save("dsa-motion-light", document.body.classList.contains("light"));
    $("#theme").setAttribute(
      "aria-label",
      `Toggle ${document.body.classList.contains("light") ? "dark" : "light"} theme`,
    );
  };
  $("#mobile-menu").onclick = () => $("nav").classList.toggle("open");
  addEventListener("hashchange", route);
  addEventListener("pagehide", () => labs.forEach((l) => l.destroy()));
  route();
})();
