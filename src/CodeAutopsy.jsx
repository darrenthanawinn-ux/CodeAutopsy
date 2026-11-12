import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Brain,
  Bug,
  Check,
  CheckCircle2,
  Clipboard,
  ClipboardPaste,
  Clock,
  Code2,
  Cpu,
  Database,
  Eye,
  FileCode2,
  FlaskConical,
  GitCompare,
  Lightbulb,
  Loader2,
  Microscope,
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Stethoscope,
  Terminal,
  Trophy,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";

/* ==========================================================================
   CodeAutopsy · Vibe-Code Flight Recorder
   IceHacks 2026 · single-file React component (Tailwind + lucide-react)
   ========================================================================== */

// ==== DATA START ====

/* ---------- tiny syntax highlighter (no dependencies) ---------- */

const JS_KEYWORDS = new Set(
  "import export default from const let var function return if else for while new await async try catch throw typeof of in class extends null undefined true false this".split(
    " "
  )
);
const PY_KEYWORDS = new Set(
  "def return if elif else for while in import from as try except raise with class None True False not and or is pass lambda yield".split(
    " "
  )
);

function tokenizeLine(line, lang) {
  const isPy = lang === "python";
  const re = isPy
    ? /(#.*$)|((?:[fFrRbB]{1,2})?(?:"""[^]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'))|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g
    : /(\/\/.*$)|(`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)/g;
  const kw = isPy ? PY_KEYWORDS : JS_KEYWORDS;
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), c: "text-zinc-400" });
    const text = m[0];
    let c = "text-zinc-200";
    if (m[1]) c = "text-zinc-500 italic";
    else if (m[2]) c = "text-emerald-300";
    else if (m[3]) c = "text-amber-300";
    else if (m[4]) {
      if (kw.has(text)) c = "text-indigo-300";
      else if (line[m.index + text.length] === "(") c = "text-cyan-300";
      else if (/^[A-Z]/.test(text)) c = "text-sky-300";
    }
    out.push({ t: text, c });
    last = m.index + text.length;
  }
  if (last < line.length) out.push({ t: line.slice(last), c: "text-zinc-400" });
  return out;
}

const findLine = (code, needle) => {
  if (!needle) return -1;
  return code.split("\n").findIndex((l) => l.includes(needle));
};

// Lines of `newCode` that do not exist (as trimmed text) in `oldCode`.
function changedLines(oldCode, newCode) {
  const count = {};
  oldCode.split("\n").forEach((l) => {
    const k = l.trim();
    count[k] = (count[k] || 0) + 1;
  });
  const out = new Set();
  newCode.split("\n").forEach((l, i) => {
    const k = l.trim();
    if (!k || /^[\]})\s;,]+$/.test(k)) return; // blank or bracket-only lines are never "patched"
    if (count[k] > 0) count[k] -= 1;
    else out.add(i);
  });
  return out;
}

/* ---------- small builders for timeline data ---------- */

const V = (n, v, hot, tag) => ({ n, v, hot, tag }); // variable
const M = (what, from, to) => ({ what, from, to }); // state mutation
const K = (k, v, hot) => ({ k, v, hot }); // metric

const STATUS = {
  ok: {
    text: "OK",
    chip: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
    bar: "bg-cyan-400",
    ring: "ring-cyan-400/40",
    fg: "text-cyan-300",
  },
  warn: {
    text: "SUSPECT",
    chip: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    bar: "bg-amber-400",
    ring: "ring-amber-400/40",
    fg: "text-amber-300",
  },
  crash: {
    text: "CRASH",
    chip: "text-rose-300 bg-rose-500/10 border-rose-500/30",
    bar: "bg-rose-500",
    ring: "ring-rose-500/40",
    fg: "text-rose-300",
  },
  pass: {
    text: "PASSED",
    chip: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    bar: "bg-emerald-400",
    ring: "ring-emerald-400/40",
    fg: "text-emerald-300",
  },
};

const SEVERITY_CLS = {
  CRITICAL: "text-rose-300 bg-rose-500/10 border-rose-500/30",
  HIGH: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  RESOLVED: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
};

/* ---------- preset case files ---------- */

const RAW_CASES = [
  /* ===================== CASE 1 · useEffect loop ===================== */
  {
    id: "effect-loop",
    title: "Infinite React useEffect Loop",
    icon: Zap,
    lang: "javascript",
    langLabel: "React · JSX",
    file: "UserDashboard.jsx",
    severity: "CRITICAL",
    tag: "Tab freezes · 429 request storm",
    bugClass: "Self-triggering dependency",
    rootNeedle: "}, [stats]);",
    crashNeedle: "setStats({ visits: data.visits + 1 });",
    brokenCode: [
      'import { useState, useEffect } from "react";',
      "",
      "export default function UserDashboard({ userId }) {",
      "  const [user, setUser] = useState(null);",
      "  const [stats, setStats] = useState({ visits: 0 });",
      "",
      "  useEffect(() => {",
      "    fetch(`/api/users/${userId}`)",
      "      .then((res) => res.json())",
      "      .then((data) => {",
      "        setUser(data);",
      "        setStats({ visits: data.visits + 1 });",
      "      });",
      "  }, [stats]);",
      "",
      "  return (",
      '    <div className="card">',
      '      <h1>{user ? user.name : "Loading..."}</h1>',
      "      <p>Visits: {stats.visits}</p>",
      "    </div>",
      "  );",
      "}",
    ].join("\n"),
    patchedCode: [
      'import { useState, useEffect } from "react";',
      "",
      "export default function UserDashboard({ userId }) {",
      "  const [user, setUser] = useState(null);",
      "  const [stats, setStats] = useState({ visits: 0 });",
      "",
      "  useEffect(() => {",
      "    let cancelled = false;",
      "    fetch(`/api/users/${userId}`)",
      "      .then((res) => res.json())",
      "      .then((data) => {",
      "        if (cancelled) return;",
      "        setUser(data);",
      "        setStats((prev) => ({ ...prev, visits: data.visits + 1 }));",
      "      });",
      "    return () => { cancelled = true; };",
      "  }, [userId]);",
      "",
      "  return (",
      '    <div className="card">',
      '      <h1>{user ? user.name : "Loading..."}</h1>',
      "      <p>Visits: {stats.visits}</p>",
      "    </div>",
      "  );",
      "}",
    ].join("\n"),
    steps: [
      {
        label: "Step 1",
        title: "Initial render",
        t: "0 ms",
        status: "ok",
        at: ["useState({ visits: 0 })"],
        vars: [V("userId", "42"), V("user", "null"), V("stats", "{ visits: 0 }", "new", "object ref #1")],
        mutations: [],
        metrics: [K("Renders", "1"), K("Fetches", "0"), K("Heap", "14.2 MB")],
        log: "[react] mounted <UserDashboard userId={42} />",
        why: "React mounts the component and creates two pieces of state. The effect has not run yet - React schedules it for right after the first paint. Everything is healthy so far.",
        fix: {
          why: "Same healthy first render. The difference is coming up: the patched effect only lists [userId], the one outside value it actually reads.",
        },
      },
      {
        label: "Step 2",
        title: "Effect runs, request fires",
        t: "4 ms",
        status: "ok",
        at: ["fetch(`/api/users/${userId}`)"],
        vars: [
          V("userId", "42"),
          V("stats", "{ visits: 0 }", "new", "object ref #1"),
          V("in-flight", "GET /api/users/42"),
          V("deps snapshot", "[ stats#1 ]", "new", "what React will compare next"),
        ],
        mutations: [],
        metrics: [K("Renders", "1"), K("Fetches", "1"), K("Heap", "14.6 MB")],
        log: "GET /api/users/42 ... pending",
        why: "After paint, the effect runs for the first time and starts a fetch. React also saves a snapshot of the dependency list. Here that snapshot is [stats] - a pointer to object #1. Remember it: React will compare against it after every render.",
        fix: {
          vars: [
            V("userId", "42"),
            V("stats", "{ visits: 0 }", "new", "object ref #1"),
            V("in-flight", "GET /api/users/42"),
            V("deps snapshot", "[ 42 ]", "good", "only userId is watched"),
          ],
          why: "The effect runs once and React snapshots the patched dependency list: [42]. A cancel flag is also created so an outdated response can be ignored later.",
        },
      },
      {
        label: "Step 3",
        title: "setStats() builds a new object",
        t: "212 ms",
        status: "warn",
        at: ["setStats({ visits: data.visits + 1 });", "setStats((prev) =>"],
        vars: [
          V("data.visits", "7"),
          V("user", "{ name: 'Ada' }", "new"),
          V("stats", "{ visits: 8 }", "bad", "object ref #2  (#2 !== #1)"),
        ],
        mutations: [M("stats", "{ visits: 0 }  #1", "{ visits: 8 }  #2")],
        metrics: [K("Renders", "2"), K("Fetches", "1"), K("Heap", "15.1 MB")],
        log: "GET /api/users/42 -> 200 (212 ms)",
        why: "The response arrives and the effect calls setStats({ visits: 8 }). The curly braces create a brand-new object, and React checks changes by identity (Object.is), so #2 is 'different' from #1. One re-render is normal - but notice this effect now writes to the very value it is being watched by.",
        fix: {
          status: "ok",
          vars: [
            V("data.visits", "7"),
            V("user", "{ name: 'Ada' }", "new"),
            V("stats", "{ visits: 8 }", "good", "object ref #2 (nobody is watching it)"),
          ],
          why: "setStats(prev => ...) still creates a new object, and React still re-renders to show 'Visits: 8'. The difference: [userId] is the only dependency, and 42 === 42, so the effect is skipped.",
        },
      },
      {
        label: "Step 4: CRASH",
        title: "Effect re-runs... forever",
        t: "212 ms -> infinity",
        status: "crash",
        at: ["}, [stats]);", "}, [userId]);"],
        vars: [
          V("deps check", "[ stats#2 ] vs [ stats#1 ]", "bad", "changed -> run effect again"),
          V("stats", "{ visits: 8 }", "bad", "object ref #3,412 (and counting)"),
          V("error", "Maximum update depth exceeded", "bad"),
        ],
        mutations: [M("effect", "scheduled once", "re-scheduled after every response")],
        metrics: [K("Renders", "3,412+", "bad"), K("Fetches", "3,411", "bad"), K("Heap", "212 MB", "bad")],
        log: "GET /api/users/42 -> 429 Too Many Requests",
        why: "React compares [stats#2] with the saved [stats#1]: they differ, so it runs the effect again. That fires another fetch, whose response calls setStats with yet another new object, which changes the dependency again. The loop never settles: the CPU pegs at 100%, the API starts answering 429, and React eventually throws 'Maximum update depth exceeded'.",
        fix: {
          label: "Step 4: PASSED",
          status: "pass",
          title: "Component settles",
          t: "214 ms",
          vars: [
            V("deps check", "[ 42 ] vs [ 42 ]", "good", "unchanged -> effect skipped"),
            V("stats", "{ visits: 8 }", "good"),
            V("UI", "Visits: 8", "good", "stable"),
          ],
          mutations: [M("effect", "scheduled once", "ran exactly once")],
          metrics: [K("Renders", "2", "good"), K("Fetches", "1", "good"), K("Heap", "15.2 MB", "good")],
          log: "[react] idle - 2 renders, 1 request",
          why: "The component settles after 2 renders and 1 request. If userId changes later, exactly one new fetch starts - and the cleanup flag stops the old response from overwriting the new one.",
        },
      },
    ],
    report: {
      symptom: {
        headline: "The page freezes and the server starts rejecting you",
        body: "The Network tab fills with hundreds of identical GET /api/users/42 calls per second until the API answers 429. The CPU fan spins up, the tab becomes unresponsive and React logs 'Maximum update depth exceeded'.",
      },
      trap: {
        headline: "LLMs treat the dependency array as a wish list",
        body: "The model reads the dependency array as 'when should this refresh?' and adds the state it displays. It never simulates the effect's own setStats call, and it does not 'feel' that an object literal gets a new identity every time - so {visits: 8} is always different from {visits: 0}.",
      },
      fix: {
        headline: "Watch what you read, update with the functional form",
        body: "List only values the effect reads from outside ([userId]). Update state with setStats(prev => ...) so you never need the current value in the list, and add a cleanup flag so a slow response for an old userId cannot overwrite a newer one.",
      },
    },
    challenge: {
      prompt: "Four replays crash at the same place. Which patch actually breaks the loop?",
      options: [
        {
          id: "a",
          label: "Delete the dependency array entirely",
          snippet: "  });   // no second argument",
          correct: false,
          feedback:
            "Without a dependency array an effect runs after EVERY render - including the one setStats just caused. That is a faster infinite loop, not a fix.",
        },
        {
          id: "b",
          label: "Depend on [userId], use a functional update, add a cancel flag",
          snippet: "  setStats((prev) => ({ ...prev, visits: data.visits + 1 }));\n}, [userId]);",
          correct: true,
          feedback: "Correct.",
        },
        {
          id: "c",
          label: "Keep [stats] and silence the linter",
          snippet: "  // eslint-disable-next-line react-hooks/exhaustive-deps\n}, [stats]);",
          correct: false,
          feedback:
            "The linter was never the problem. The effect still depends on a value it writes, so the loop keeps spinning - you have only hidden a warning that could have helped you.",
        },
      ],
    },
    lesson: "Rule of thumb: if an effect writes to state X, X must never appear in that same effect's dependency array.",
    solved:
      "UserDashboard now renders twice and fetches once. The effect re-runs only when userId changes, and stale responses are ignored.",
  },

  /* ===================== CASE 2 · async race ===================== */
  {
    id: "async-race",
    title: "Async API Race Condition",
    icon: Radio,
    lang: "javascript",
    langLabel: "React · JSX",
    file: "ProductSearch.jsx",
    severity: "HIGH",
    tag: "Wrong results, then a white screen",
    bugClass: "Async race condition",
    rootNeedle: "setResults(data.items);",
    crashNeedle: "results.map((item)",
    brokenCode: [
      'import { useState, useEffect } from "react";',
      "",
      "export default function ProductSearch() {",
      '  const [query, setQuery] = useState("");',
      "  const [results, setResults] = useState([]);",
      "  const [loading, setLoading] = useState(false);",
      "",
      "  useEffect(() => {",
      "    if (!query) return;",
      "    setLoading(true);",
      "    fetch(`/api/search?q=${query}`)",
      "      .then((res) => res.json())",
      "      .then((data) => {",
      "        setResults(data.items);",
      "        setLoading(false);",
      "      });",
      "  }, [query]);",
      "",
      "  return (",
      "    <div>",
      "      <input value={query} onChange={(e) => setQuery(e.target.value)} />",
      "      {loading && <p>Searching...</p>}",
      "      <ul>",
      "        {results.map((item) => (",
      "          <li key={item.id}>{item.name}</li>",
      "        ))}",
      "      </ul>",
      "    </div>",
      "  );",
      "}",
    ].join("\n"),
    patchedCode: [
      'import { useState, useEffect } from "react";',
      "",
      "export default function ProductSearch() {",
      '  const [query, setQuery] = useState("");',
      "  const [results, setResults] = useState([]);",
      "  const [loading, setLoading] = useState(false);",
      "",
      "  useEffect(() => {",
      "    if (!query) {",
      "      setResults([]);",
      "      return;",
      "    }",
      "    const controller = new AbortController();",
      "    setLoading(true);",
      "    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })",
      "      .then((res) => res.json())",
      "      .then((data) => {",
      "        setResults(data.items ?? []);",
      "        setLoading(false);",
      "      })",
      "      .catch((err) => {",
      '        if (err.name !== "AbortError") setLoading(false);',
      "      });",
      "    return () => controller.abort();",
      "  }, [query]);",
      "",
      "  return (",
      "    <div>",
      "      <input value={query} onChange={(e) => setQuery(e.target.value)} />",
      "      {loading && <p>Searching...</p>}",
      "      <ul>",
      "        {results.map((item) => (",
      "          <li key={item.id}>{item.name}</li>",
      "        ))}",
      "      </ul>",
      "    </div>",
      "  );",
      "}",
    ].join("\n"),
    steps: [
      {
        label: "Step 1",
        title: "Keystroke: 'ip'",
        t: "0 ms",
        status: "ok",
        at: ["fetch(`/api/search?q="],
        vars: [
          V("query", '"ip"', "new"),
          V("results", "[]"),
          V("request A", "GET q=ip", "new", "server needs ~900 ms"),
        ],
        mutations: [M("query", '""', '"ip"')],
        metrics: [K("In flight", "1"), K("Renders", "2"), K("Errors", "0")],
        log: "GET /api/search?q=ip ... pending",
        why: "The user types two letters and the effect fires request A. Short queries are slow on this server (it scans everything), so A will take about 900 ms. So far this is perfectly normal.",
        fix: {
          vars: [
            V("query", '"ip"', "new"),
            V("results", "[]"),
            V("request A", "GET q=ip", "new", "has its own AbortController"),
          ],
          why: "Same request, but the patched effect first creates an AbortController so this request can be cancelled if it becomes outdated.",
        },
      },
      {
        label: "Step 2",
        title: "Keystroke: 'iphone'",
        t: "180 ms",
        status: "warn",
        at: ["fetch(`/api/search?q=", "return () => controller.abort();"],
        vars: [
          V("query", '"iphone"', "new"),
          V("request A", "GET q=ip", "bad", "still running - nobody cancels it"),
          V("request B", "GET q=iphone", "new", "server needs ~120 ms"),
        ],
        mutations: [M("query", '"ip"', '"iphone"')],
        metrics: [K("In flight", "2", "bad"), K("Renders", "3"), K("Errors", "0")],
        log: "GET /api/search?q=iphone ... pending  (q=ip still pending)",
        why: "More typing re-runs the effect and sends request B. Nothing tells request A to stop, so two requests are now racing. The server answers specific queries much faster than vague ones, so B is likely to win - and A is about to become a stale request that still wants to write into state.",
        fix: {
          status: "ok",
          vars: [
            V("query", '"iphone"', "new"),
            V("request A", "GET q=ip", "good", "aborted by effect cleanup"),
            V("request B", "GET q=iphone", "new", "the only live request"),
          ],
          metrics: [K("In flight", "1", "good"), K("Renders", "3"), K("Errors", "0")],
          log: "request A aborted (AbortError) - request B pending",
          why: "Before React re-runs the effect it runs the previous effect's cleanup: controller.abort(). Request A is cancelled on the spot, so only request B is left.",
        },
      },
      {
        label: "Step 3",
        title: "Fast response B lands",
        t: "300 ms",
        status: "warn",
        at: ["setResults(data.items);", "setResults(data.items ?? []);"],
        vars: [
          V("response B", "{ items: [3 products] }", "new"),
          V("results", "[iPhone 15, iPhone 15 Pro, iPhone SE]", "new"),
        ],
        mutations: [M("results", "[]", "[iPhone 15, iPhone 15 Pro, iPhone SE]")],
        metrics: [K("In flight", "1"), K("Renders", "4"), K("Errors", "0")],
        log: "GET /api/search?q=iphone -> 200 (120 ms)",
        why: "Response B arrives first and setResults(data.items) writes three phones into state. The screen looks exactly right - which is why this bug survives manual testing. It only appears when responses arrive out of order, and localhost is almost always in order.",
        fix: {
          status: "ok",
          vars: [
            V("response B", "{ items: [3 products] }", "new"),
            V("results", "[iPhone 15, iPhone 15 Pro, iPhone SE]", "good"),
          ],
          metrics: [K("In flight", "0", "good"), K("Renders", "4"), K("Errors", "0", "good")],
          why: "Response B writes its three phones. Because the write is data.items ?? [], even a malformed body could never put undefined into state.",
        },
      },
      {
        label: "Step 4: CRASH",
        title: "Stale response A lands",
        t: "900 ms",
        status: "crash",
        at: ["results.map((item)", 'if (err.name !== "AbortError")'],
        vars: [
          V("response A", "{ error: 'rate_limited' }", "bad", "late + wrong shape"),
          V("data.items", "undefined", "bad"),
          V("results", "undefined", "bad", "was: [3 products]"),
          V("error", "TypeError: Cannot read properties of undefined (reading 'map')", "bad"),
        ],
        mutations: [M("results", "[iPhone 15, iPhone 15 Pro, iPhone SE]", "undefined")],
        metrics: [K("In flight", "0"), K("Renders", "5", "bad"), K("Errors", "1", "bad")],
        log: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')",
        why: "The late response for 'ip' lands and overwrites newer data. This one is an error body ({ error: 'rate_limited' }), so data.items is undefined and setResults(undefined) runs. On the next render results.map is called on undefined: TypeError, and the whole component tree unmounts to a white screen.",
        fix: {
          label: "Step 4: PASSED",
          status: "pass",
          title: "Stale response ignored",
          t: "900 ms",
          vars: [
            V("request A", "rejected: AbortError", "good", "caught and ignored"),
            V("results", "[iPhone 15, iPhone 15 Pro, iPhone SE]", "good", "untouched"),
            V("UI", "3 correct products", "good"),
          ],
          mutations: [M("results", "[3 products]", "[3 products]  (no change)")],
          metrics: [K("In flight", "0", "good"), K("Renders", "4", "good"), K("Errors", "0", "good")],
          log: "[search] stale request ignored - UI stable",
          why: "Request A's promise rejects with an AbortError, which the catch block ignores. results still holds the three correct phones. And if an error body ever slipped through anyway, '?? []' keeps .map safe.",
        },
      },
    ],
    report: {
      symptom: {
        headline: "Wrong results - then a sudden white screen",
        body: "Search works when you type slowly, then randomly shows results for an old query, or the whole page goes blank with 'Cannot read properties of undefined (reading map)'. It never reproduces on localhost because the dev server answers instantly and in order.",
      },
      trap: {
        headline: "LLMs write the happy path of ONE request",
        body: "Tutorial-style training code shows a single fetch inside useEffect with no cleanup, so the model never imagines request #1 finishing after request #2. It also trusts the response shape (data.items) with no fallback, turning a harmless stale response into a crash.",
      },
      fix: {
        headline: "Cancel what you no longer need",
        body: "Abort the previous request in the effect cleanup (AbortController), ignore the resulting AbortError, and never trust a response shape: data.items ?? []. Encode the query with encodeURIComponent while you are there.",
      },
    },
    challenge: {
      prompt: "Out-of-order responses are overwriting fresh data. Which patch closes the race?",
      options: [
        {
          id: "a",
          label: "Debounce the input by 300 ms",
          snippet: "const q = useDebounce(query, 300);\n}, [q]);",
          correct: false,
          feedback:
            "Debouncing reduces how often requests overlap but never guarantees their order. A slow request can still land after a fast one and overwrite newer results.",
        },
        {
          id: "b",
          label: "Wrap results.map in try / catch",
          snippet: "try { return results.map(render); } catch { return null; }",
          correct: false,
          feedback:
            "That hides the symptom (the crash) but keeps the real defect: stale responses still overwrite fresh ones, so users silently see the wrong results.",
        },
        {
          id: "c",
          label: "Abort in cleanup + default data.items to []",
          snippet: "return () => controller.abort();\nsetResults(data.items ?? []);",
          correct: true,
          feedback: "Correct.",
        },
      ],
    },
    lesson: "Every async effect needs an answer to: 'what happens if this response arrives after I have moved on?'",
    solved:
      "ProductSearch now cancels outdated requests and can never store a malformed response. Out-of-order replies are harmless.",
  },

  /* ===================== CASE 3 · python off-by-one ===================== */
  {
    id: "py-off-by-one",
    title: "Python Off-By-One Data Wipe",
    icon: Database,
    lang: "python",
    langLabel: "Python 3",
    file: "archive_orders.py",
    severity: "CRITICAL",
    tag: "Silent data loss · no exception thrown",
    bugClass: "Off-by-one slice + unverified delete",
    rootNeedle: "rows[start : start + batch_size - 1]",
    crashNeedle: 'cur.executemany("DELETE FROM orders WHERE id = ?", ids)',
    brokenCode: [
      "import sqlite3",
      "",
      "",
      "def archive_old_orders(db_path, batch_size=100):",
      '    """Copy completed orders into the archive table, then purge them."""',
      "    conn = sqlite3.connect(db_path)",
      "    cur = conn.cursor()",
      '    cur.execute("SELECT id, customer, total FROM orders WHERE status = ?", ("completed",))',
      "    rows = cur.fetchall()",
      "",
      "    archived = 0",
      "    for start in range(0, len(rows), batch_size):",
      "        batch = rows[start : start + batch_size - 1]",
      '        cur.executemany("INSERT INTO archive VALUES (?, ?, ?)", batch)',
      "        archived += len(batch)",
      "",
      "    ids = [(r[0],) for r in rows]",
      '    cur.executemany("DELETE FROM orders WHERE id = ?", ids)',
      "    conn.commit()",
      '    print(f"Archived {archived} orders")',
      "    return archived",
    ].join("\n"),
    patchedCode: [
      "import sqlite3",
      "",
      "",
      "def archive_old_orders(db_path, batch_size=100):",
      '    """Copy completed orders into the archive table, then purge them."""',
      "    conn = sqlite3.connect(db_path)",
      "    cur = conn.cursor()",
      '    cur.execute("SELECT id, customer, total FROM orders WHERE status = ?", ("completed",))',
      "    rows = cur.fetchall()",
      "",
      "    archived_ids = []",
      "    for start in range(0, len(rows), batch_size):",
      "        batch = rows[start : start + batch_size]",
      '        cur.executemany("INSERT INTO archive VALUES (?, ?, ?)", batch)',
      "        archived_ids.extend((r[0],) for r in batch)",
      "",
      "    if len(archived_ids) != len(rows):",
      "        conn.rollback()",
      '        raise RuntimeError("Archive mismatch - refusing to delete")',
      "",
      '    cur.executemany("DELETE FROM orders WHERE id = ?", archived_ids)',
      "    conn.commit()",
      '    print(f"Archived {len(archived_ids)} orders")',
      "    return len(archived_ids)",
    ].join("\n"),
    steps: [
      {
        label: "Step 1",
        title: "Fetch 250 completed orders",
        t: "0 ms",
        status: "ok",
        at: ["rows = cur.fetchall()"],
        vars: [
          V("batch_size", "100"),
          V("rows", "250 rows", "new", "order ids 1 ... 250"),
          V("archive table", "0 rows"),
        ],
        mutations: [],
        metrics: [K("orders", "250"), K("archive", "0"), K("lost", "0")],
        log: "SELECT ... WHERE status = 'completed' -> 250 rows",
        why: "The job loads every completed order into memory: 250 rows. Nothing has been copied or deleted yet, and the plan is simple - copy in batches of 100, then purge what was copied.",
        fix: {
          why: "Same start. The patched job will remember exactly which order ids it copies, so the purge can be based on proof instead of hope.",
        },
      },
      {
        label: "Step 2",
        title: "Batch 1 slices 99 rows, not 100",
        t: "6 ms",
        status: "warn",
        at: ["rows[start : start + batch_size - 1]", "rows[start : start + batch_size]"],
        vars: [
          V("start", "0"),
          V("slice", "rows[0:99]", "bad", "end index is exclusive"),
          V("batch", "99 rows (ids 1 ... 99)", "bad"),
          V("skipped", "order #100", "bad", "never inserted"),
        ],
        mutations: [M("archive table", "0 rows", "99 rows")],
        metrics: [K("orders", "250"), K("archive", "99", "bad"), K("lost", "1", "bad")],
        log: "INSERT INTO archive ... 99 rows",
        why: "The AI wrote start + batch_size - 1, as if the end index were inclusive (like SQL BETWEEN or a Java loop bound). Python slices are END-EXCLUSIVE, so rows[0:99] stops one row early and order #100 is silently skipped. No error, no warning.",
        fix: {
          status: "ok",
          vars: [
            V("start", "0"),
            V("slice", "rows[0:100]", "good", "exactly 100 rows"),
            V("batch", "100 rows (ids 1 ... 100)", "good"),
            V("archived_ids", "100 ids", "good"),
          ],
          mutations: [M("archive table", "0 rows", "100 rows")],
          metrics: [K("orders", "250"), K("archive", "100", "good"), K("lost", "0", "good")],
          log: "INSERT INTO archive ... 100 rows",
          why: "rows[start : start + batch_size] takes exactly 100 rows because the end index is exclusive. The patched loop also records every id it copies.",
        },
      },
      {
        label: "Step 3",
        title: "Batches 2 and 3 repeat the mistake",
        t: "13 ms",
        status: "warn",
        at: ["rows[start : start + batch_size - 1]", "rows[start : start + batch_size]"],
        vars: [
          V("start", "100, then 200"),
          V("rows[100:199]", "99 rows", "bad", "order #200 skipped"),
          V("rows[200:299]", "50 rows", "new", "slice clamps - nothing skipped here"),
          V("archived", "248", "bad", "99 + 99 + 50"),
        ],
        mutations: [M("archive table", "99 rows", "248 rows")],
        metrics: [K("orders", "250"), K("archive", "248", "bad"), K("lost", "2", "bad")],
        log: "INSERT INTO archive ... 99 + 50 rows",
        why: "Batch 2 drops order #200. Batch 3 happens to be short (only 50 rows left), so the slice just clamps to the end of the list and loses nothing - exactly the inconsistency that lets this bug slip through tests with small data. Running total: 248 archived out of 250.",
        fix: {
          status: "ok",
          vars: [
            V("start", "100, then 200"),
            V("rows[100:200]", "100 rows", "good"),
            V("rows[200:300]", "50 rows", "good", "clamped by Python, as intended"),
            V("archived_ids", "250 ids", "good", "100 + 100 + 50"),
          ],
          mutations: [M("archive table", "100 rows", "250 rows")],
          metrics: [K("orders", "250"), K("archive", "250", "good"), K("lost", "0", "good")],
          log: "INSERT INTO archive ... 100 + 50 rows",
          why: "Every batch is complete: 100 + 100 + 50 = 250 ids archived and recorded.",
        },
      },
      {
        label: "Step 4: CRASH",
        title: "Purge deletes all 250",
        t: "15 ms",
        status: "crash",
        at: ['cur.executemany("DELETE FROM orders'],
        vars: [
          V("ids", "250 ids", "bad", "built from rows, not from batches"),
          V("DELETE", "250 rows removed", "bad"),
          V("archive table", "248 rows", "bad"),
          V("orders #100, #200", "exist nowhere now", "bad"),
        ],
        mutations: [M("orders table", "250 rows", "0 rows"), M("archive table", "248 rows", "248 rows (2 short)")],
        metrics: [K("orders", "0"), K("archive", "248", "bad"), K("lost", "2", "bad")],
        log: "Archived 248 orders   <- exit code 0, no traceback",
        why: "The delete list is rebuilt from rows (everything that was fetched), not from what was actually archived. So orders #100 and #200 are wiped from orders but never reached archive. The function prints 'Archived 248 orders', commits and returns normally - nobody notices until a customer asks where order #100 went. This is the worst kind of crash: no exception, just missing data.",
        fix: {
          label: "Step 4: PASSED",
          status: "pass",
          title: "Verified purge",
          t: "15 ms",
          vars: [
            V("integrity check", "250 == 250", "good", "archived_ids vs rows"),
            V("DELETE", "250 archived ids", "good"),
            V("archive table", "250 rows", "good"),
          ],
          mutations: [M("orders table", "250 rows", "0 rows"), M("archive table", "0 rows", "250 rows")],
          metrics: [K("orders", "0"), K("archive", "250", "good"), K("lost", "0", "good")],
          log: "Archived 250 orders",
          why: "Before deleting, the patched code checks that every fetched row was archived. On a mismatch it rolls back and raises instead of purging. Then it deletes only the ids it just archived: orders 250 -> 0, archive 0 -> 250, nothing lost.",
        },
      },
    ],
    report: {
      symptom: {
        headline: "No error, no failing test - just missing orders",
        body: "The nightly job logs 'Archived 248 orders' while 250 were purged. Two customers' orders (#100 and #200) now exist in neither table, and finance notices a week later. Nothing ever raised an exception.",
      },
      trap: {
        headline: "LLMs blend index conventions across languages",
        body: "'start + batch_size - 1' is right for inclusive ranges (SQL BETWEEN, Java loop bounds) but Python slices are end-exclusive. The model also built the delete list from the whole fetch instead of from what was proven archived, so a small bug in step A silently becomes data loss in step B.",
      },
      fix: {
        headline: "Delete only what you have proven you copied",
        body: "Slice with rows[start : start + batch_size], build the delete list from the ids you actually inserted, and compare counts before deleting - roll back and raise if they differ. Destructive steps should depend on proof, not on assumptions.",
      },
    },
    challenge: {
      prompt: "The purge destroys rows that were never archived. Which patch makes it safe?",
      options: [
        {
          id: "a",
          label: "Slice to start + batch_size, delete only archived ids, abort on mismatch",
          snippet: "batch = rows[start : start + batch_size]\nif len(archived_ids) != len(rows):\n    conn.rollback()",
          correct: true,
          feedback: "Correct.",
        },
        {
          id: "b",
          label: "Raise batch_size to 101 so the missing row is covered",
          snippet: "def archive_old_orders(db_path, batch_size=101):",
          correct: false,
          feedback:
            "The slice would still drop the last row of every full batch - you moved the bug instead of removing it. With 202+ rows it comes right back.",
        },
        {
          id: "c",
          label: "Remove the DELETE so nothing can be lost",
          snippet: "# cur.executemany('DELETE FROM orders ...', ids)",
          correct: false,
          feedback:
            "No delete means no data loss, but the function no longer does its job: the orders table never shrinks. You traded a bug for a silently removed feature.",
        },
      ],
    },
    lesson: "Never delete based on what you intended to copy. Delete based on what you verified you copied.",
    solved:
      "archive_old_orders now archives all 250 orders, verifies the count and deletes only what it has proven is safe. A mismatch rolls back instead of wiping data.",
  },
];

function prepareCase(c) {
  return {
    ...c,
    rootLine: findLine(c.brokenCode, c.rootNeedle),
    crashLine: findLine(c.brokenCode, c.crashNeedle),
    steps: c.steps.map((s) => ({
      ...s,
      lineB: findLine(c.brokenCode, s.at[0]),
      lineP: findLine(c.patchedCode, s.at.length > 1 ? s.at[1] : s.at[0]),
    })),
  };
}

const CASES = RAW_CASES.map(prepareCase);

/* ---------- custom code: static signature analyzer ---------- */

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const indentOf = (line) => (/^\s*/.exec(line) || [""])[0];

function offByOneCase({ lang, arr, idx, root, crash, patchedLines, cond, fixedCond }) {
  const py = lang === "python";
  const errName = py ? "IndexError: list index out of range" : "TypeError: Cannot read properties of undefined";
  return {
    lang,
    bugClass: "Off-by-one loop bound",
    severity: "HIGH",
    tag: py ? "IndexError on the last pass" : "TypeError / NaN on the last pass",
    root,
    crash,
    patchedLines,
    map: (i) => i,
    steps: [
      {
        label: "Step 1",
        title: "Loop starts",
        t: "0 ms",
        status: "ok",
        at: root,
        vars: [V(arr + " length", "N  (e.g. 3)"), V(idx, "0", "new")],
        mutations: [],
        metrics: [K("Iterations", "1"), K("Errors", "0")],
        log: "loop: " + idx + " = 0",
        why: "The loop begins at " + idx + " = 0, the first real element. Arrays count from zero, so the valid positions run from 0 up to N - 1.",
        fix: {},
      },
      {
        label: "Step 2",
        title: "Last valid pass",
        t: "1 ms",
        status: "ok",
        at: root,
        vars: [V(idx, "N - 1", "new"), V(arr + "[" + idx + "]", "last real element", "new")],
        mutations: [M(idx, "N - 2", "N - 1")],
        metrics: [K("Iterations", "N"), K("Errors", "0")],
        log: "loop: " + idx + " = N - 1",
        why: "On the final real pass " + idx + " equals N - 1 and " + arr + "[" + idx + "] is the last item. A correct loop should stop right after this pass.",
        fix: { why: "The patched condition (" + fixedCond + ") is still true here, and becomes false on the very next check." },
      },
      {
        label: "Step 3",
        title: "Extra pass (off-by-one)",
        t: "1 ms",
        status: "warn",
        at: root,
        vars: [
          V(idx, "N", "bad", "one past the end"),
          V(cond, "still true", "bad"),
          V(arr + "[" + idx + "]", "undefined", "bad"),
        ],
        mutations: [M(idx, "N - 1", "N")],
        metrics: [K("Iterations", "N + 1", "bad"), K("Errors", "0")],
        log: "loop: " + idx + " = N   <- one too many",
        why: "The condition " + cond + " is still true when " + idx + " equals N, so the loop runs one extra time. There is no element at position N, so " + arr + "[" + idx + "] is " + (py ? "out of range" : "undefined") + ".",
        fix: {
          status: "ok",
          title: "Loop exits cleanly",
          vars: [V(idx, "N", "good", "check fails -> exit"), V(fixedCond, "false", "good")],
          metrics: [K("Iterations", "N", "good"), K("Errors", "0", "good")],
          log: "loop finished after N passes",
          why: "With " + fixedCond + " the check fails at " + idx + " = N and the loop ends before touching the missing element.",
        },
      },
      {
        label: "Step 4: CRASH",
        title: "Reading past the end",
        t: "2 ms",
        status: "crash",
        at: crash,
        vars: [V(arr + "[" + idx + "]", py ? "out of range" : "undefined", "bad"), V("error", errName, "bad")],
        mutations: [],
        metrics: [K("Iterations", "N + 1", "bad"), K("Errors", "1", "bad")],
        log: errName,
        why: "The code touches " + arr + "[" + idx + "] which does not exist, so the program throws" + (py ? "" : " (or quietly produces NaN / undefined if it only does math)") + ". The bug is in the loop condition, but the crash shows up here, a line later.",
        fix: {
          label: "Step 4: PASSED",
          status: "pass",
          title: "All items processed",
          vars: [V("result", "correct", "good", "every item visited exactly once")],
          metrics: [K("Iterations", "N", "good"), K("Errors", "0", "good")],
          log: "done - no errors",
          why: "Every real item is visited exactly once and nothing reads past the end of the " + (py ? "list" : "array") + ".",
        },
      },
    ],
    report: {
      symptom: {
        headline: py ? "Works on most inputs, then IndexError" : "Works on most inputs, then TypeError or NaN",
        body: "The code runs fine until the loop reaches its last iteration, where it reads one element past the end. Depending on the language that means an exception, 'undefined', or a result quietly turning into NaN.",
      },
      trap: {
        headline: "LLMs mix up inclusive and exclusive bounds",
        body: "Models remember '<=' from 1-based maths, SQL BETWEEN and range(1, n + 1) patterns, then carry them into zero-based indexing. The loop 'reads naturally' as 'up to and including the length', which is exactly one step too far.",
      },
      fix: {
        headline: "Stop before the length, or skip the index",
        body: py
          ? "Use range(len(items)), or better, iterate directly with 'for item in items' so there is no index to get wrong."
          : "Use '< items.length', or better, iterate directly with 'for (const item of items)' so there is no index to get wrong.",
      },
    },
    lesson: "Valid indexes are 0 to length - 1. If your loop can reach length, it will eventually read nothing.",
    solved: "The loop now visits every element exactly once and stops cleanly before the end of the " + (py ? "list" : "array") + ".",
  };
}

function ruleOffByOneJs(lines) {
  const re = /for\s*\(\s*(?:let|var|const)?\s*(\w+)\s*=\s*0\s*;\s*\1\s*<=\s*([\w.$[\]]+?)\.length\s*;/;
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    const idx = m[1];
    const arr = m[2];
    let crash = i;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].includes(arr + "[" + idx + "]")) {
        crash = j;
        break;
      }
    }
    const patchedLines = lines.slice();
    patchedLines[i] = lines[i].replace("<=", "<");
    return offByOneCase({
      lang: "javascript",
      arr,
      idx,
      root: i,
      crash,
      patchedLines,
      cond: idx + " <= " + arr + ".length",
      fixedCond: idx + " < " + arr + ".length",
    });
  }
  return null;
}

function ruleOffByOnePy(lines) {
  const re = /for\s+(\w+)\s+in\s+range\(\s*len\(\s*([\w.]+)\s*\)\s*\+\s*1\s*\)/;
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    const idx = m[1];
    const arr = m[2];
    let crash = i;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].includes(arr + "[" + idx + "]")) {
        crash = j;
        break;
      }
    }
    const patchedLines = lines.slice();
    patchedLines[i] = lines[i].replace(/range\(\s*len\(\s*([\w.]+)\s*\)\s*\+\s*1\s*\)/, "range(len($1))");
    return offByOneCase({
      lang: "python",
      arr,
      idx,
      root: i,
      crash,
      patchedLines,
      cond: idx + " in range(len(" + arr + ") + 1)",
      fixedCond: idx + " in range(len(" + arr + "))",
    });
  }
  return null;
}

function ruleEffectSelfDep(lines) {
  const depRe = /^\s*\}\s*,\s*\[([^\]]*)\]\s*\)\s*;?\s*(\/\/.*)?$/;
  for (let i = 0; i < lines.length; i++) {
    const dm = depRe.exec(lines[i]);
    if (!dm) continue;
    let s = -1;
    for (let k = i; k >= 0; k--) {
      if (/useEffect\s*\(/.test(lines[k])) {
        s = k;
        break;
      }
    }
    if (s < 0) continue;
    const deps = dm[1]
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    for (const d of deps) {
      if (!/^[A-Za-z_$][\w$]*$/.test(d)) continue;
      const setter = "set" + cap(d);
      let setLine = -1;
      for (let k = s; k < i; k++) {
        if (lines[k].includes(setter + "(")) {
          setLine = k;
          break;
        }
      }
      if (setLine < 0) continue;
      const remaining = deps.filter((x) => x !== d);
      const patchedLines = lines.slice();
      patchedLines[i] =
        lines[i].replace(/\[[^\]]*\]/, "[" + remaining.join(", ") + "]") +
        (dm[2] ? "" : " // patched: effect no longer depends on state it writes");
      return {
        lang: "javascript",
        bugClass: "Self-triggering useEffect",
        severity: "CRITICAL",
        tag: "Tab freezes · render storm",
        root: i,
        crash: setLine,
        patchedLines,
        map: (k) => k,
        steps: [
          {
            label: "Step 1",
            title: "First render",
            t: "0 ms",
            status: "ok",
            at: s,
            vars: [V(d, "v0", "new"), V("deps", "[ " + d + " ] = [ v0 ]")],
            mutations: [],
            metrics: [K("Renders", "1"), K("Effect runs", "0")],
            log: "[react] mounted",
            why: "The component renders with " + d + " = v0 and registers an effect that is allowed to re-run whenever [" + d + "] changes.",
            fix: { vars: [V(d, "v0", "new"), V("deps", "[ " + remaining.join(", ") + " ]", "good")] },
          },
          {
            label: "Step 2",
            title: "Effect writes state",
            t: "2 ms",
            status: "warn",
            at: setLine,
            vars: [V(d, "v0"), V(setter + "(...)", "queues v1", "bad")],
            mutations: [M(d, "v0", "v1")],
            metrics: [K("Renders", "2"), K("Effect runs", "1")],
            log: setter + "(...) called inside useEffect",
            why: "The effect calls " + setter + "(...). That schedules another render in which " + d + " has a different value - and " + d + " is on this effect's watch list.",
            fix: {
              status: "ok",
              vars: [V(d, "v0"), V(setter + "(...)", "runs once", "good")],
              why: "In the patched effect the dependency list no longer includes " + d + ", so this write is just a one-time update.",
            },
          },
          {
            label: "Step 3",
            title: "Dependency check fails",
            t: "3 ms",
            status: "warn",
            at: i,
            vars: [V("previous deps", "[ v0 ]"), V("current deps", "[ v1 ]", "bad", "changed -> run effect again")],
            mutations: [M("effect", "idle", "re-scheduled")],
            metrics: [K("Renders", "2"), K("Effect runs", "2", "bad")],
            log: "[react] deps changed -> re-running effect",
            why: "React compares [" + d + "] from the last render with the new one. v0 !== v1, so it decides the effect must run again - and running it changes " + d + " again.",
            fix: {
              status: "ok",
              vars: [V("deps", "[ " + remaining.join(", ") + " ]", "good", "nothing in it changes")],
              metrics: [K("Renders", "2"), K("Effect runs", "1", "good")],
              log: "[react] deps unchanged -> effect skipped",
              why: "The patched list is checked after each render, but nothing in it ever changes, so the effect does not run again.",
            },
          },
          {
            label: "Step 4: CRASH",
            title: "Render storm",
            t: "3 ms -> infinity",
            status: "crash",
            at: setLine,
            vars: [V("renders", "1,000+", "bad"), V("error", "Maximum update depth exceeded", "bad")],
            mutations: [],
            metrics: [K("Renders", "1,000+", "bad"), K("CPU", "100%", "bad")],
            log: "Uncaught Error: Maximum update depth exceeded",
            why: "Each render triggers the effect, the effect triggers " + setter + ", which triggers another render... React finally aborts with 'Maximum update depth exceeded', or the tab simply freezes.",
            fix: {
              label: "Step 4: PASSED",
              status: "pass",
              title: "Component settles",
              vars: [V("renders", "2", "good"), V("UI", "stable", "good")],
              metrics: [K("Renders", "2", "good"), K("CPU", "idle", "good")],
              log: "[react] idle",
              why: "The component settles after its first updates and stays idle.",
            },
          },
        ],
        report: {
          symptom: {
            headline: "The page freezes the moment it loads",
            body: "CPU jumps to 100%, the tab stops responding and the console shows 'Maximum update depth exceeded' or thousands of repeated logs.",
          },
          trap: {
            headline: "LLMs treat the dependency array as a trigger list",
            body: "The model adds the state it is displaying so the effect 'stays in sync', without simulating that the effect itself changes that state. Each run creates the exact change that schedules the next run.",
          },
          fix: {
            headline: "Never depend on state the effect writes",
            body: "Remove '" + d + "' from the dependency list and use the functional update " + setter + "(prev => ...) when the new value depends on the old one. If you really need a re-run, trigger it from an event handler instead.",
          },
        },
        lesson: "If an effect writes to state X, X must never appear in that same effect's dependency array.",
        solved: "The effect no longer watches the state it writes, so the render loop is gone and the component settles after its first update.",
      };
    }
  }
  return null;
}

function ruleEffectFetchRace(lines) {
  for (let s = 0; s < lines.length; s++) {
    if (!/useEffect\s*\(/.test(lines[s])) continue;
    let end = -1;
    for (let k = s + 1; k < lines.length; k++) {
      if (/^\s*\}\s*,\s*\[[^\]]*\]\s*\)/.test(lines[k])) {
        end = k;
        break;
      }
    }
    if (end < 0) continue;
    const block = lines.slice(s, end + 1).join("\n");
    if (!/\bfetch\s*\(|axios\./.test(block)) continue;
    if (/AbortController|\bignore\b|cancelled|isMounted|return\s*\(\s*\)\s*=>/.test(block)) continue;
    let fetchLine = -1;
    let setLine = -1;
    for (let k = s; k <= end; k++) {
      if (fetchLine < 0 && /\bfetch\s*\(|axios\./.test(lines[k])) fetchLine = k;
      else if (fetchLine >= 0 && setLine < 0 && /\bset[A-Z]\w*\s*\(/.test(lines[k])) setLine = k;
    }
    if (fetchLine < 0 || setLine < 0) continue;
    let mapLine = -1;
    for (let k = end + 1; k < lines.length; k++) {
      if (/\.map\s*\(/.test(lines[k])) {
        mapLine = k;
        break;
      }
    }
    const crash = mapLine >= 0 ? mapLine : setLine;
    const canPatch =
      /\{\s*$/.test(lines[s]) &&
      /^\s*set[A-Z]/.test(lines[setLine]) &&
      /;\s*$/.test(lines[setLine]) &&
      /\{\s*$/.test(lines[setLine - 1]);
    let patchedLines = null;
    let map = (k) => k;
    if (canPatch) {
      const inserts = [s + 1, setLine, end];
      patchedLines = [];
      lines.forEach((ln, i) => {
        if (i === s + 1) patchedLines.push(indentOf(lines[s]) + "  let ignore = false;");
        if (i === setLine) patchedLines.push(indentOf(lines[setLine]) + "if (ignore) return;");
        if (i === end) patchedLines.push(indentOf(lines[end]) + "  return () => { ignore = true; };");
        patchedLines.push(ln);
      });
      map = (k) => k + inserts.filter((x) => x <= k).length;
    }
    return {
      lang: "javascript",
      bugClass: "Async race condition",
      severity: "HIGH",
      tag: "Stale response overwrites fresh data",
      root: setLine,
      crash,
      patchedLines,
      map,
      steps: [
        {
          label: "Step 1",
          title: "Request #1 starts",
          t: "0 ms",
          status: "ok",
          at: fetchLine,
          vars: [V("input", "first value", "new"), V("request #1", "slow (~900 ms)", "new")],
          mutations: [],
          metrics: [K("In flight", "1"), K("Errors", "0")],
          log: "request #1 ... pending",
          why: "The effect fires request #1 for the first input. This one happens to be slow. Up to here the code behaves.",
          fix: { why: "Same request - but the patched effect also arms an 'ignore' flag that its cleanup will flip." },
        },
        {
          label: "Step 2",
          title: "Input changes, #1 not cancelled",
          t: "180 ms",
          status: "warn",
          at: fetchLine,
          vars: [
            V("input", "second value", "new"),
            V("request #1", "still running", "bad", "nothing cancels it"),
            V("request #2", "fast (~120 ms)", "new"),
          ],
          mutations: [M("input", "first value", "second value")],
          metrics: [K("In flight", "2", "bad"), K("Errors", "0")],
          log: "request #2 ... pending (request #1 still pending)",
          why: "A new input re-runs the effect and sends request #2, but request #1 is never cancelled and nothing marks it as outdated. Two requests are now racing to write into the same state.",
          fix: {
            status: "ok",
            vars: [V("request #1", "outdated", "good", "cleanup set ignore = true"), V("request #2", "fast (~120 ms)", "new")],
            metrics: [K("In flight", "2"), K("Errors", "0")],
            log: "cleanup ran: request #1 marked ignore",
            why: "Before the effect re-runs, React calls the previous effect's cleanup, which flips ignore = true for request #1. Its answer will now be thrown away.",
          },
        },
        {
          label: "Step 3",
          title: "Fast response lands",
          t: "300 ms",
          status: "warn",
          at: setLine,
          vars: [V("response #2", "correct data", "new"), V("state", "data for second value", "new")],
          mutations: [M("state", "empty", "data for second value")],
          metrics: [K("In flight", "1"), K("Errors", "0")],
          log: "request #2 -> 200 (120 ms)",
          why: "Response #2 arrives first and is written to state. The screen looks right, which is why this bug survives manual testing - it only appears when responses arrive out of order.",
          fix: {
            status: "ok",
            vars: [V("response #2", "correct data", "new"), V("state", "data for second value", "good")],
            metrics: [K("In flight", "1"), K("Errors", "0", "good")],
            why: "Response #2 is still the live request, so it is written to state as before.",
          },
        },
        {
          label: "Step 4: CRASH",
          title: "Stale response overwrites it",
          t: "900 ms",
          status: "crash",
          at: crash,
          vars: [
            V("response #1", "late (and maybe the wrong shape)", "bad"),
            V("state", "data for FIRST value", "bad", "older request won"),
          ],
          mutations: [M("state", "data for second value", "data for first value")],
          metrics: [K("In flight", "0"), K("Errors", "1", "bad")],
          log: "stale response applied -> wrong data on screen",
          why: "The slow response for the OLD input finally lands and the unguarded set call overwrites the newer data. The user sees results for something they are no longer searching for - or, if the late response has an unexpected shape, the render crashes.",
          fix: {
            label: "Step 4: PASSED",
            status: "pass",
            title: "Stale response ignored",
            vars: [V("response #1", "discarded", "good", "ignore flag is true"), V("state", "data for second value", "good")],
            metrics: [K("In flight", "0", "good"), K("Errors", "0", "good")],
            log: "[effect] stale response ignored",
            why: "Response #1 arrives, sees ignore === true, and returns before touching state. The newest data stays on screen.",
          },
        },
      ],
      report: {
        symptom: {
          headline: "Results sometimes belong to an older input",
          body: "Everything works when you go slowly. Type or click quickly and the screen occasionally shows data for a previous value, or crashes when the late response has a different shape.",
        },
        trap: {
          headline: "LLMs write the happy path of ONE request",
          body: "Tutorial-style training code shows a single fetch inside useEffect with no cleanup. The model never imagines request #1 finishing after request #2, so nothing guards the state update.",
        },
        fix: {
          headline: "Ignore or cancel outdated requests",
          body: "Give the effect a cleanup that cancels the request (AbortController) or flips an 'ignore' flag, and check that flag before every state update that happens after an await or .then().",
        },
      },
      lesson: "Every async effect needs an answer to: 'what happens if this response arrives after I have moved on?'",
      solved: "The effect now throws away outdated responses, so only the newest request can update state.",
    };
  }
  return null;
}

function finalizeCustom(code, r) {
  const patchedCode = r.patchedLines ? r.patchedLines.join("\n") : null;
  const py = r.lang === "python";
  return {
    id: "custom",
    title: "Custom Case · " + r.bugClass,
    icon: Microscope,
    lang: r.lang,
    langLabel: py ? "Python" : "JavaScript · JSX",
    file: py ? "pasted_code.py" : "pasted-code.jsx",
    severity: r.severity,
    tag: r.tag,
    bugClass: r.bugClass,
    brokenCode: code,
    patchedCode,
    rootLine: r.root,
    crashLine: r.crash,
    steps: r.steps.map((s) => ({
      ...s,
      lineB: s.at,
      lineP: patchedCode ? r.map(s.at) : -1,
    })),
    report: r.report,
    challenge: null,
    lesson: r.lesson,
    solved: r.solved,
  };
}

function analyzeCode(code) {
  if (!code || !code.trim()) return null;
  const lines = code.split("\n");
  const rules = [ruleOffByOneJs, ruleOffByOnePy, ruleEffectSelfDep, ruleEffectFetchRace];
  for (const rule of rules) {
    const r = rule(lines);
    if (r) return finalizeCustom(code, r);
  }
  return null;
}

const SAMPLES = [
  {
    id: "s1",
    label: "JS · off-by-one",
    code: [
      "function sumPrices(items) {",
      "  let total = 0;",
      "  for (let i = 0; i <= items.length; i++) {",
      "    total += items[i].price;",
      "  }",
      "  return total;",
      "}",
    ].join("\n"),
  },
  {
    id: "s2",
    label: "Python · range + 1",
    code: [
      "def average_scores(scores):",
      "    total = 0",
      "    for i in range(len(scores) + 1):",
      "        total += scores[i]",
      "    return total / len(scores)",
    ].join("\n"),
  },
  {
    id: "s3",
    label: "React · effect loop",
    code: [
      'import { useState, useEffect } from "react";',
      "",
      "export default function Counter() {",
      "  const [count, setCount] = useState(0);",
      "",
      "  useEffect(() => {",
      "    setCount(count + 1);",
      "  }, [count]);",
      "",
      "  return <p>{count}</p>;",
      "}",
    ].join("\n"),
  },
  {
    id: "s4",
    label: "React · fetch race",
    code: [
      'import { useState, useEffect } from "react";',
      "",
      "export default function Profile({ id }) {",
      "  const [profile, setProfile] = useState(null);",
      "",
      "  useEffect(() => {",
      "    fetch(`/api/profile/${id}`)",
      "      .then((res) => res.json())",
      "      .then((data) => {",
      "        setProfile(data);",
      "      });",
      "  }, [id]);",
      "",
      "  return <h1>{profile ? profile.name : 'Loading'}</h1>;",
      "}",
    ].join("\n"),
  },
];

const CSS_TEXT = `
.ca-scroll::-webkit-scrollbar{height:8px;width:8px}
.ca-scroll::-webkit-scrollbar-thumb{background:#3f3f46;border-radius:8px}
.ca-scroll::-webkit-scrollbar-track{background:transparent}
@keyframes ca-pop{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}
.ca-pop{animation:ca-pop .3s ease-out both}
@keyframes ca-scan{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
.ca-scan{animation:ca-scan 1.1s linear infinite}
`;

// ==== DATA END ====

/* ---------- presentational helpers ---------- */

const Badge = ({ cls, children }) => (
  <span className={"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium " + cls}>
    {children}
  </span>
);

const ROW_STYLES = {
  plain: { row: "border-transparent", tag: null, tagCls: "" },
  root: {
    row: "border-rose-500 bg-rose-500/10",
    tag: "ROOT CAUSE",
    tagCls: "bg-rose-500/20 text-rose-300",
  },
  crash: {
    row: "border-amber-400 bg-amber-500/10",
    tag: "CRASH SITE",
    tagCls: "bg-amber-500/20 text-amber-300",
  },
  fixed: {
    row: "border-emerald-400 bg-emerald-500/10",
    tag: "PATCHED",
    tagCls: "bg-emerald-500/20 text-emerald-300",
  },
};

function CodeRow({ n, text, lang, kind, focus }) {
  const style = ROW_STYLES[kind];
  return (
    <div
      data-line={n}
      className={
        "flex items-stretch border-l-2 " + style.row + (focus ? " ring-1 ring-inset ring-cyan-400/50" : "")
      }
    >
      <span className="w-10 shrink-0 select-none pr-3 text-right text-zinc-600 tabular-nums">{n + 1}</span>
      <span className={"w-5 shrink-0 select-none text-center " + (focus ? "text-cyan-300" : "text-transparent")}>
        {focus ? "▶" : "·"}
      </span>
      <code className="whitespace-pre pr-4">
        {text.length === 0
          ? " "
          : tokenizeLine(text, lang).map((tk, i) => (
              <span key={i} className={tk.c}>
                {tk.t}
              </span>
            ))}
      </code>
      {style.tag && (
        <span
          className={
            "ml-auto mr-2 shrink-0 self-center rounded px-1.5 py-0.5 text-xs font-semibold " + style.tagCls
          }
        >
          {style.tag}
        </span>
      )}
    </div>
  );
}

const TONES = {
  rose: { box: "border-rose-500/30", icon: "text-rose-300 bg-rose-500/10", label: "text-rose-300" },
  amber: { box: "border-amber-500/30", icon: "text-amber-300 bg-amber-500/10", label: "text-amber-300" },
  emerald: { box: "border-emerald-500/30", icon: "text-emerald-300 bg-emerald-500/10", label: "text-emerald-300" },
};

function ReportCard({ icon: Icon, tone, label, headline, body }) {
  const t = TONES[tone];
  return (
    <div className={"rounded-xl border bg-zinc-950/60 p-4 " + t.box}>
      <div className="flex items-center gap-2">
        <span className={"grid h-8 w-8 place-items-center rounded-lg " + t.icon}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={"text-xs font-semibold uppercase tracking-widest " + t.label}>{label}</span>
      </div>
      <h4 className="mt-3 text-sm font-semibold text-zinc-100">{headline}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</p>
    </div>
  );
}

const resolveStep = (s, applied) => (applied && s.fix ? { ...s, ...s.fix } : s);

const HOT_VAR = {
  bad: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  new: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
};
const HOT_METRIC = { bad: "text-rose-300", good: "text-emerald-300" };

/* ==========================================================================
   Main component
   ========================================================================== */

export default function CodeAutopsy() {
  const [caseId, setCaseId] = useState(CASES[0].id);
  const [customCode, setCustomCode] = useState(SAMPLES[0].code);
  const [customCase, setCustomCase] = useState(null);
  const [customRan, setCustomRan] = useState(false);
  const [codeView, setCodeView] = useState("broken");
  const [applied, setApplied] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [copyState, setCopyState] = useState("idle");
  const [solvedIds, setSolvedIds] = useState([]);

  const verifyTimer = useRef(null);
  const copyTimer = useRef(null);
  const codeBoxRef = useRef(null);

  const isCustom = caseId === "custom";
  const active = isCustom ? customCase : CASES.find((c) => c.id === caseId) || null;
  const lastStep = active ? active.steps.length - 1 : 0;

  /* ----- derived view state ----- */
  const rawStep = active ? active.steps[Math.min(stepIdx, lastStep)] : null;
  const step = rawStep ? resolveStep(rawStep, applied) : null;
  const showingPatched = !!(active && codeView === "patched" && active.patchedCode);
  const code = active ? (showingPatched ? active.patchedCode : active.brokenCode) : "";
  const lines = useMemo(() => code.split("\n"), [code]);
  const fixedSet = useMemo(
    () => (active && active.patchedCode ? changedLines(active.brokenCode, active.patchedCode) : new Set()),
    [active]
  );
  const focusIdx = step ? (showingPatched ? step.lineP : step.lineB) : -1;
  const stale = !!(customCase && customCase.brokenCode !== customCode);

  /* ----- effects ----- */
  useEffect(
    () => () => {
      clearTimeout(verifyTimer.current);
      clearTimeout(copyTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!playing || !active) return undefined;
    const id = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, lastStep));
    }, 1800);
    return () => clearInterval(id);
  }, [playing, active, lastStep]);

  useEffect(() => {
    if (playing && stepIdx >= lastStep) setPlaying(false);
  }, [playing, stepIdx, lastStep]);

  useEffect(() => {
    const box = codeBoxRef.current;
    if (!box || focusIdx < 0) return;
    const el = box.querySelector('[data-line="' + focusIdx + '"]');
    if (el && typeof box.scrollTo === "function") {
      box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight / 2 + 12), behavior: "smooth" });
    }
  }, [focusIdx, codeView, caseId, customCase]);

  /* ----- actions ----- */
  const resetRun = () => {
    clearTimeout(verifyTimer.current);
    setApplied(false);
    setCodeView("broken");
    setStepIdx(0);
    setPicked(null);
    setVerifying(false);
    setVerifyMsg(null);
    setPlaying(false);
  };

  const selectCase = (id) => {
    resetRun();
    setCaseId(id);
  };

  const nextCase = () => {
    const i = CASES.findIndex((c) => c.id === caseId);
    selectCase(CASES[(i + 1) % CASES.length].id);
  };

  const goStep = (i) => {
    setPlaying(false);
    setStepIdx(Math.max(0, Math.min(i, lastStep)));
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (stepIdx >= lastStep) setStepIdx(0);
    setPlaying(true);
  };

  const runAutopsy = () => {
    resetRun();
    setCustomCase(analyzeCode(customCode));
    setCustomRan(true);
  };

  const loadSample = (s) => {
    resetRun();
    setCustomCode(s.code);
    setCustomCase(null);
    setCustomRan(false);
  };

  const autoPick = () => {
    if (!active || !active.challenge) return;
    const right = active.challenge.options.find((o) => o.correct);
    if (right) {
      setPicked(right.id);
      setVerifyMsg(null);
    }
  };

  const verifyPatch = () => {
    if (!active || applied || verifying) return;
    let outcome;
    if (active.challenge) {
      if (!picked) {
        setVerifyMsg({
          kind: "warn",
          text: "Pick a patch strategy first - or use 'Auto-select recommended fix' to let CodeAutopsy choose.",
        });
        return;
      }
      const opt = active.challenge.options.find((o) => o.id === picked);
      outcome = opt && opt.correct ? { ok: true } : { ok: false, text: opt ? opt.feedback : "Unknown option." };
    } else if (active.patchedCode) {
      const again = analyzeCode(active.patchedCode);
      outcome = again
        ? { ok: false, text: "The patched code still matches the '" + again.bugClass + "' signature. Review the highlighted lines." }
        : { ok: true };
    } else {
      setVerifyMsg({
        kind: "warn",
        text: "No automatic patch exists for this pattern. Follow 'The Fix' in the autopsy report and apply it by hand.",
      });
      return;
    }
    setVerifying(true);
    setVerifyMsg(null);
    verifyTimer.current = setTimeout(() => {
      setVerifying(false);
      if (outcome.ok) {
        setApplied(true);
        setCodeView("patched");
        setStepIdx(lastStep);
        setPlaying(false);
        setSolvedIds((prev) => (prev.includes(active.id) ? prev : prev.concat(active.id)));
      } else {
        setVerifyMsg({ kind: "error", text: outcome.text });
      }
    }, 1100);
  };

  const copyCode = async () => {
    let next = "ok";
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      next = "fail";
    }
    setCopyState(next);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 1600);
  };

  const kindOf = (i) => {
    if (showingPatched) return fixedSet.has(i) ? "fixed" : "plain";
    if (active && i === active.rootLine) return "root";
    if (active && i === active.crashLine) return "crash";
    return "plain";
  };

  const failing = !applied;

  /* ======================================================================
     Render
     ====================================================================== */
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-200 antialiased">
      <style>{CSS_TEXT}</style>

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-indigo-600 shadow-lg shadow-rose-900/40">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-zinc-50">
                  Code<span className="text-rose-400">Autopsy</span>
                </h1>
                <Badge cls="border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                  <Activity className="h-3 w-3" />
                  Vibe-Code Flight Recorder
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">Trace, understand and fix broken AI-generated code</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge cls="border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              <Sparkles className="h-3 w-3" />
              IceHacks 2026
            </Badge>
            {active && (
              <Badge cls={failing ? STATUS.crash.chip : STATUS.pass.chip}>
                {failing ? (
                  <AlertOctagon className="h-3 w-3 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {failing ? "FAILING" : "PASSED"}
              </Badge>
            )}
          </div>
        </div>

        {/* Case selector */}
        <div className="border-t border-zinc-900">
          <div className="ca-scroll mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
            {CASES.map((c) => {
              const Icon = c.icon;
              const on = caseId === c.id;
              const solved = solvedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => selectCase(c.id)}
                  className={
                    "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition " +
                    (on
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-200"
                      : "border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200")
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{c.title}</span>
                  {solved && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </button>
              );
            })}
            <button
              onClick={() => selectCase("custom")}
              className={
                "flex shrink-0 items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition " +
                (isCustom
                  ? "border-indigo-400/60 bg-indigo-500/10 text-indigo-200"
                  : "border-zinc-700 bg-zinc-900/90 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200")
              }
            >
              <ClipboardPaste className="h-4 w-4" />
              <span>Paste Custom Code</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5">
        {/* ---------------- Custom code input ---------------- */}
        {isCustom && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ClipboardPaste className="h-4 w-4 text-indigo-300" />
              <h2 className="text-sm font-semibold text-zinc-100">Paste Custom Code</h2>
              <span className="text-xs text-zinc-500">
                Static signature scan: off-by-one loops, self-triggering effects, fetch races
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s)}
                    className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-400 transition hover:border-indigo-500/40 hover:text-indigo-200"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder="Paste a buggy JavaScript, React or Python snippet here..."
              className="ca-scroll w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-200 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={runAutopsy}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-cyan-400 hover:to-indigo-400"
              >
                <Microscope className="h-4 w-4" />
                Run Autopsy
              </button>
              <button
                onClick={() => {
                  setCustomCode("");
                  setCustomCase(null);
                  setCustomRan(false);
                  resetRun();
                }}
                className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
              >
                Clear
              </button>
              {stale && (
                <span className="flex items-center gap-1.5 text-xs text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Code changed since the last autopsy - run it again.
                </span>
              )}
            </div>
          </section>
        )}

        {isCustom && customRan && !customCase && (
          <section className="ca-pop rounded-xl border border-zinc-800 bg-zinc-900/90 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-zinc-300">
                <Eye className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">No known failure signature matched</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                  Custom mode is a fast static scan, not a full debugger. It looks for four classic AI-generated
                  bugs: off-by-one loop bounds (JS and Python), a useEffect that depends on state it writes, and an
                  unguarded fetch inside useEffect. Try one of the samples above, or open a preset case to see the
                  full flight recorder.
                </p>
              </div>
            </div>
          </section>
        )}

        {isCustom && !customRan && (
          <section className="rounded-xl border border-dashed border-zinc-800 p-5 text-center text-sm text-zinc-500">
            Paste code (or load a sample) and press <span className="text-cyan-300">Run Autopsy</span> to open the
            flight recorder.
          </section>
        )}

        {active && (
          <>
            {/* ---------------- Case strip ---------------- */}
            <section className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-zinc-50">{active.title}</h2>
                  <Badge cls={applied ? SEVERITY_CLS.RESOLVED : SEVERITY_CLS[active.severity]}>
                    {applied ? "RESOLVED" : active.severity}
                  </Badge>
                  <Badge cls="border-zinc-700 bg-zinc-800/60 text-zinc-300">
                    <Code2 className="h-3 w-3" />
                    {active.langLabel}
                  </Badge>
                </div>
                <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                  {applied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                  )}
                  {applied ? "Patch verified - replay passes" : active.tag}
                </p>
              </div>
              <button
                onClick={resetRun}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
              >
                <RotateCcw className="h-4 w-4" />
                Reset case
              </button>
            </section>

            {/* ---------------- Split screen ---------------- */}
            <div className="grid gap-5 lg:grid-cols-2">
              {/* ===== Left: Code Inspector ===== */}
              <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90">
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-3">
                  <FileCode2 className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-semibold text-zinc-100">Code Inspector</h3>
                  <span className="truncate font-mono text-xs text-zinc-500">{active.file}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs">
                      <button
                        onClick={() => setCodeView("broken")}
                        className={
                          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition " +
                          (codeView === "broken" ? "bg-rose-500/20 text-rose-200" : "text-zinc-500 hover:text-zinc-300")
                        }
                      >
                        <Bug className="h-3 w-3" />
                        Broken Code
                      </button>
                      <button
                        onClick={() => active.patchedCode && setCodeView("patched")}
                        disabled={!active.patchedCode}
                        className={
                          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition " +
                          (codeView === "patched" && active.patchedCode
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "text-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40")
                        }
                      >
                        <Wand2 className="h-3 w-3" />
                        Patched Code
                      </button>
                    </div>
                    <button
                      onClick={copyCode}
                      title="Copy code"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                    >
                      {copyState === "ok" ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : copyState === "fail" ? (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-800 bg-zinc-950/40 px-4 py-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
                    Root cause
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
                    Downstream crash
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                    Patched
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-cyan-300">▶</span>
                    Recorder head
                  </span>
                </div>

                {applied && !showingPatched && (
                  <div className="flex items-center gap-2 border-b border-zinc-800 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    The patch is applied. You are viewing the original broken code for comparison.
                  </div>
                )}
                {!applied && showingPatched && (
                  <div className="flex items-center gap-2 border-b border-zinc-800 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300">
                    <Eye className="h-3.5 w-3.5" />
                    Previewing the patch. Use 'Verify & Apply Patch' below to run it through the recorder.
                  </div>
                )}

                <div
                  ref={codeBoxRef}
                  className="ca-scroll relative h-96 overflow-auto bg-zinc-950/70 font-mono text-sm leading-6"
                >
                  <div className="w-max min-w-full py-2">
                    {lines.map((text, i) => (
                      <CodeRow
                        key={i}
                        n={i}
                        text={text}
                        lang={active.lang}
                        kind={kindOf(i)}
                        focus={i === focusIdx}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* ===== Right: Flight Recorder ===== */}
              <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90">
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-4 py-3">
                  <Activity className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-semibold text-zinc-100">Flight Recorder</h3>
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                    <span
                      className={
                        "h-2 w-2 rounded-full " + (playing ? "animate-pulse bg-rose-500" : "bg-zinc-600")
                      }
                    />
                    {playing ? "REC" : "paused"}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => goStep(0)}
                      title="Rewind"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => goStep(stepIdx - 1)}
                      disabled={stepIdx === 0}
                      title="Previous step"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-40"
                    >
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500/20 px-3 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
                    >
                      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {playing ? "Pause" : "Replay"}
                    </button>
                    <button
                      onClick={() => goStep(stepIdx + 1)}
                      disabled={stepIdx >= lastStep}
                      title="Next step"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-40"
                    >
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-4">
                  {/* scrubber */}
                  <div className="flex items-center gap-1 px-1">
                    {active.steps.map((s, i) => {
                      const st = resolveStep(s, applied);
                      const cfg = STATUS[st.status];
                      return (
                        <React.Fragment key={i}>
                          <button
                            onClick={() => goStep(i)}
                            aria-label={"Go to " + st.label}
                            className={
                              "h-3.5 w-3.5 shrink-0 rounded-full transition " +
                              (i <= stepIdx ? cfg.bar : "bg-zinc-700") +
                              (i === stepIdx ? " ring-2 " + cfg.ring : "")
                            }
                          />
                          {i < lastStep && (
                            <div
                              className={
                                "h-0.5 flex-1 rounded " +
                                (i < stepIdx ? STATUS[resolveStep(active.steps[i + 1], applied).status].bar : "bg-zinc-800")
                              }
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* step buttons */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {active.steps.map((s, i) => {
                      const st = resolveStep(s, applied);
                      const cfg = STATUS[st.status];
                      const on = i === stepIdx;
                      return (
                        <button
                          key={i}
                          onClick={() => goStep(i)}
                          className={
                            "rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition " +
                            (on
                              ? cfg.chip + " ring-1 " + cfg.ring
                              : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200")
                          }
                        >
                          <span className="flex items-center gap-1.5">
                            <span className={"h-2 w-2 shrink-0 rounded-full " + cfg.bar} />
                            {st.label}
                          </span>
                          <span className="mt-0.5 block truncate font-normal text-zinc-500">{st.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* step detail */}
                  {step && (
                    <div
                      key={active.id + "-" + stepIdx + "-" + (applied ? "fixed" : "broken")}
                      className="ca-pop space-y-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-zinc-50">{step.title}</h4>
                        <Badge cls={STATUS[step.status].chip}>
                          {step.status === "pass" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : step.status === "crash" ? (
                            <XCircle className="h-3 w-3" />
                          ) : step.status === "warn" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          {STATUS[step.status].text}
                        </Badge>
                        <span className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-zinc-500">
                          <Clock className="h-3 w-3" />
                          t = {step.t}
                        </span>
                      </div>

                      {/* variables */}
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                          <Eye className="h-3.5 w-3.5" />
                          Variable state
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {step.vars.map((v, i) => (
                            <div
                              key={v.n + "-" + i}
                              className={
                                "rounded-lg border px-3 py-2 font-mono text-xs " +
                                (HOT_VAR[v.hot] || "border-zinc-800 bg-zinc-950/60 text-zinc-300")
                              }
                            >
                              <div className="text-zinc-500">{v.n}</div>
                              <div className="mt-0.5 break-words font-semibold">{v.v}</div>
                              {v.tag && <div className="mt-0.5 break-words font-normal text-zinc-500">{v.tag}</div>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* mutations */}
                      <div>
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                          <GitCompare className="h-3.5 w-3.5" />
                          Memory / state mutations
                        </div>
                        {step.mutations && step.mutations.length > 0 ? (
                          <div className="space-y-1.5">
                            {step.mutations.map((m, i) => (
                              <div
                                key={i}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-xs"
                              >
                                <span className="text-cyan-300">{m.what}</span>
                                <span className="text-zinc-500 line-through">{m.from}</span>
                                <ArrowRight className="h-3 w-3 text-zinc-600" />
                                <span className={"font-semibold " + STATUS[step.status].fg}>{m.to}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs text-zinc-600">
                            No mutations recorded at this step.
                          </div>
                        )}
                      </div>

                      {/* metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        {step.metrics.map((k, i) => (
                          <div key={k.k + "-" + i} className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                              <Cpu className="h-3 w-3" />
                              {k.k}
                            </div>
                            <div className={"mt-0.5 font-mono text-sm font-semibold " + (HOT_METRIC[k.hot] || "text-zinc-200")}>
                              {k.v}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* plain english */}
                      <div
                        className={
                          "rounded-xl border p-4 " +
                          (step.status === "crash"
                            ? "border-rose-500/30 bg-rose-500/10"
                            : step.status === "warn"
                            ? "border-amber-500/30 bg-amber-500/10"
                            : step.status === "pass"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-zinc-800 bg-zinc-950/60")
                        }
                      >
                        <div
                          className={
                            "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest " +
                            STATUS[step.status].fg
                          }
                        >
                          <Brain className="h-3.5 w-3.5" />
                          {applied
                            ? "Why it works now"
                            : step.status === "ok"
                            ? "What is happening"
                            : "Why the AI's logic fails here"}
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-300">{step.why}</p>
                      </div>

                      {/* recorder log */}
                      <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs">
                        <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className={"break-words " + STATUS[step.status].fg}>{step.log}</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* ---------------- AI Autopsy Report ---------------- */}
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Stethoscope className="h-4 w-4 text-rose-300" />
                <h3 className="text-sm font-semibold text-zinc-100">AI Autopsy Report</h3>
                <Badge cls="border-zinc-700 bg-zinc-800/60 text-zinc-300">
                  <Bug className="h-3 w-3" />
                  {active.bugClass}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <ReportCard
                  icon={AlertTriangle}
                  tone="rose"
                  label={applied ? "The Symptom (now gone)" : "The Symptom"}
                  headline={active.report.symptom.headline}
                  body={active.report.symptom.body}
                />
                <ReportCard
                  icon={Brain}
                  tone="amber"
                  label="The AI Trap"
                  headline={active.report.trap.headline}
                  body={active.report.trap.body}
                />
                <ReportCard
                  icon={Wand2}
                  tone="emerald"
                  label="The Fix"
                  headline={active.report.fix.headline}
                  body={active.report.fix.body}
                />
              </div>
            </section>

            {/* ---------------- Patch challenge + verification ---------------- */}
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-indigo-300" />
                  <h3 className="text-sm font-semibold text-zinc-100">Interactive Patch Challenge</h3>
                </div>

                {active.challenge ? (
                  <>
                    <p className="text-sm text-zinc-300">{active.challenge.prompt}</p>
                    <div className="mt-3 space-y-2">
                      {active.challenge.options.map((o) => {
                        const on = picked === o.id;
                        const isRight = applied && o.correct;
                        return (
                          <button
                            key={o.id}
                            onClick={() => {
                              if (applied || verifying) return;
                              setPicked(o.id);
                              setVerifyMsg(null);
                            }}
                            className={
                              "w-full rounded-lg border p-3 text-left transition " +
                              (isRight
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : on
                                ? "border-indigo-400/60 bg-indigo-500/10"
                                : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700")
                            }
                          >
                            <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                              <span
                                className={
                                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border " +
                                  (isRight
                                    ? "border-emerald-400 bg-emerald-400"
                                    : on
                                    ? "border-indigo-300 bg-indigo-400"
                                    : "border-zinc-600")
                                }
                              >
                                {(on || isRight) && <Check className="h-3 w-3 text-zinc-950" />}
                              </span>
                              <span className="text-zinc-500">{o.id.toUpperCase()}.</span>
                              {o.label}
                            </span>
                            <pre className="ca-scroll mt-2 overflow-x-auto rounded-md bg-zinc-950 px-2.5 py-2 font-mono text-xs text-zinc-400">
                              {o.snippet}
                            </pre>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-400">
                    For pasted code, the patch is generated automatically. Verifying re-scans the patched code with the
                    same signature checks - if nothing matches any more, the replay passes.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={verifyPatch}
                    disabled={applied || verifying}
                    className={
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition " +
                      (applied
                        ? "cursor-default border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-indigo-900/30 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-70")
                    }
                  >
                    {verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : applied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {verifying ? "Replaying with patch..." : applied ? "Patch Verified" : "Verify & Apply Patch"}
                  </button>
                  {!applied && active.challenge && (
                    <button
                      onClick={autoPick}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 underline-offset-2 transition hover:text-cyan-300 hover:underline"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      Auto-select recommended fix
                    </button>
                  )}
                </div>
              </section>

              <section
                className={
                  "rounded-xl border p-4 " +
                  (applied ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/90")
                }
              >
                {applied ? (
                  <div className="ca-pop">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                        <Trophy className="h-6 w-6 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-emerald-300">Case Solved</h3>
                        <p className="text-sm text-zinc-400">{active.title}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-300">{active.solved}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        ["Replay", "PASSED"],
                        ["Lines patched", String(fixedSet.size)],
                        ["Severity", "Resolved"],
                        ["Steps", active.steps.length + " / " + active.steps.length + " clean"],
                      ].map((t) => (
                        <div key={t[0]} className="rounded-lg border border-emerald-500/20 bg-zinc-950/60 px-3 py-2">
                          <div className="text-xs text-zinc-500">{t[0]}</div>
                          <div className="mt-0.5 text-sm font-semibold text-emerald-300">{t[1]}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                      {active.lesson}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={nextCase}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
                      >
                        Next case
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={resetRun}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Replay the broken version
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-cyan-300" />
                      <h3 className="text-sm font-semibold text-zinc-100">Verification Console</h3>
                    </div>
                    <div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs leading-relaxed">
                      <div className="text-zinc-400">
                        <span className="text-cyan-300">$</span> codeautopsy replay --case {active.id}
                      </div>
                      <div className="text-rose-300">
                        ✕ status: FAILING - {resolveStep(active.steps[lastStep], false).label}
                      </div>
                      {!verifying && !verifyMsg && <div className="text-zinc-500">▸ waiting for a patch to verify...</div>}
                      {verifying && (
                        <>
                          <div className="text-zinc-400">▸ applying patch to a sandbox copy...</div>
                          <div className="text-zinc-400">▸ re-running {active.steps.length} recorded steps...</div>
                          <div className="relative mt-1 h-1 overflow-hidden rounded bg-zinc-800">
                            <div className="ca-scan absolute inset-y-0 left-0 w-1/3 rounded bg-cyan-400" />
                          </div>
                        </>
                      )}
                      {verifyMsg && verifyMsg.kind === "error" && (
                        <>
                          <div className="text-rose-300">✕ verification failed - replay still crashes</div>
                          <div className="whitespace-pre-wrap break-words text-zinc-300">{verifyMsg.text}</div>
                          <div className="text-zinc-500">▸ pick another strategy and verify again.</div>
                        </>
                      )}
                      {verifyMsg && verifyMsg.kind === "warn" && (
                        <div className="whitespace-pre-wrap break-words text-amber-300">! {verifyMsg.text}</div>
                      )}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                      Tip: scrub through the four recorder steps first. The red line is where the bug is created, the
                      amber line is where it explodes.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-zinc-900 px-4 py-6 text-center text-xs text-zinc-600">
        CodeAutopsy · built for IceHacks 2026 · case data is simulated for teaching, custom mode uses static signature
        matching
      </footer>
    </div>
  );
}
