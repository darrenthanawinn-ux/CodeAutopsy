# CodeAutopsy · Vibe-Code Flight Recorder

IceHacks 2026 entry. A visual "flight recorder" debugger that helps beginners and vibe-coders trace,
understand and fix broken AI-generated code.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Use it in Claude Artifacts

`src/CodeAutopsy.jsx` is a single self-contained component (default export, Tailwind classes,
`lucide-react` icons). Paste its contents into a React artifact and it runs as-is.

## What's inside

- **3 preset cases:** Infinite React useEffect Loop, Async API Race Condition, Python Off-By-One Data Wipe
- **Code Inspector:** line numbers, syntax highlighting, Root Cause line (red), Downstream Crash line (amber),
  Broken / Patched toggle with patched lines in emerald
- **Flight Recorder:** Step 1 to Step 4 timeline with variable state, state mutations, metrics, plain-English
  explanation and a recorder log; replay / scrub controls
- **AI Autopsy Report:** The Symptom, The AI Trap, The Fix
- **Interactive Patch Challenge:** choose a patch; wrong picks fail verification with an explanation;
  "Verify & Apply Patch" turns the timeline emerald, step 4 becomes PASSED, and the Case Solved summary appears
- **Paste Custom Code:** static signature scan for off-by-one loops (JS and Python), self-triggering
  useEffect dependencies and unguarded fetch-in-effect races, with an auto-generated patch

Case data is simulated for teaching; custom mode is a heuristic scan, not a full debugger.
