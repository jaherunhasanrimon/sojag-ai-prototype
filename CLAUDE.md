# CLAUDE.md — Ground Rules for AI Assistants

> This file is read by Claude Code, Antigravity, and any other AI coding assistant.
> Every rule here is **non-negotiable** unless the human team explicitly revises it.

## 1. No Machine Learning

- There is **no ML, no computer vision, no object detection, no tracking, no action recognition** in this project.
- "Detections" are **scripted cues** attached to specific timestamps of pre-labelled videos.
- Never import, install, or reference any ML library (TensorFlow, PyTorch, ONNX, OpenCV, etc.).
- Never write code that analyses video frames, pixel data, or audio waveforms for classification.

## 2. No Network Calls

- The app runs **fully offline** after `npm run build && npx serve dist`.
- No `fetch()` or `XMLHttpRequest` to any external URL. No CDN fonts, tiles, analytics, or telemetry.
- The only allowed origins are `localhost` and same-origin static assets in `public/`.
- A Vitest check greps `src/` for `http://` and `https://` (excluding comments and `localhost`).

## 3. Honesty Requirements (Non-Negotiable)

These exist so judges cannot mistake the mock-up for a working AI system:

1. **Persistent banner on every screen:**
   `PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running.`
2. Every confidence value, ID, location, time, unit name, and dispatch status carries an
   `ILLUSTRATIVE` or `SIMULATED` tag visible on that screen (a small footer label is enough).
3. Confidence is a **scripted number** from the cue file, never presented as a probability
   that a crime occurred. UI copy says `"Detection confidence (scripted)"`.
4. Session summary and any "metrics" are labelled `"Demo metrics, not performance evidence"`.
5. Locations are fictional and prefixed `Example` (e.g. `Example public intersection A, Dhaka`).
   Do not use real addresses.
6. Wording never says "thief", "criminal", or "suspect". Use "possible", "potential", "event".

## 4. Coding Standards

- **TypeScript strict mode**; no `any` unless justified in a comment.
- Domain logic lives in `src/domain/` as **pure TypeScript** with unit tests. React components stay thin.
- Stack: Vite + React 18 + TypeScript + Tailwind CSS + Zustand + React Router.
  Do not add dependencies beyond this without asking.
- Tests: Vitest (unit), Playwright (e2e). Run tests at the end of every phase.

## 5. Commit Discipline

- Small commits with clear messages, one feature per commit.
- Update `README.md` when commands or structure change.
- At the end of each phase: run tests, commit, summarise changes, list unfinished items, **stop**.

## 6. Clip Integrity

- Never wire a clip into a scenario if its `source` or `license`/`consent` field is missing
  in `clips.json`. Show a build-time warning.
- Never use wording that identifies a real person, real address, or real incident.
- Clips must be staged/acted by the team or properly licensed. See `design.md` section 9.

## 7. Ambiguity Rule

- If a requirement is ambiguous, **ask the human** instead of guessing.
- List the question and a recommended default.
