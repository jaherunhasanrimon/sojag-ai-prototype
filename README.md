# SOTORKO AI — Prototype Mock-up

> **PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running.**

A clickable, offline control-room mock-up for the Futuremaker GP competition.
It replays pre-selected, pre-labelled videos and demonstrates the operator workflow:
alert → incident screen → human verification → simulated dispatch → closure.

**There is no machine learning in this prototype.** "Detections" are scripted cues
attached to specific timestamps of specific videos.

---

## Quick Start

```bash
npm install
npm run validate:data   # check clips, cues, licences
npm run dev             # starts http://localhost:5173
```

## Production Build & Offline Execution

The app runs **100% offline** with zero CDN or external network dependencies:

```bash
npm run build
npx serve dist          # or python3 -m http.server -d dist 5173
```

---

## Application Routes

| Route | View | Description |
|-------|------|-------------|
| `/` | **Start Page** | Scenario selector, disclaimer, data validation status |
| `/room` | **Combined Control Room** | Primary demo view: Display A (Wall) + B (Incident) + C (Queue) |
| `/wall` | **Surveillance Wall** | Standalone Display A follower for multi-monitor setups |
| `/incident` | **Incident Screen** | Standalone Display B follower for multi-monitor setups |
| `/dashboard` | **Incident Queue** | Standalone Display C follower for multi-monitor setups |
| `/presenter` | **Presenter Panel** | Standalone presenter control console |
| `/summary` | **Session Summary** | Decision audit table, ground-truth labels, JSON data export |

---

## Multi-Window Sync

When running across 3 external monitors or projectors, open:
1. **Monitor 1**: `http://localhost:5173/wall` (Display A)
2. **Monitor 2**: `http://localhost:5173/incident` (Display B)
3. **Monitor 3**: `http://localhost:5173/dashboard` (Display C)
4. **Presenter Laptop**: `http://localhost:5173/presenter` (Leader)

State synchronizes in real time over `BroadcastChannel('sotorko-sync-v1')` with automatic leader failover..

---

## Tests

```bash
npm test                # Runs all 19 Vitest test suites (131 tests)
npm run typecheck       # TypeScript strict typecheck
npm run validate:data   # Validates clips, schemas, and licence integrity
```

---

## Scenarios

| ID | Name | Purpose |
|----|------|---------|
| **S1** | Single incident | Full lifecycle: alert → confirm → dispatch → close |
| **S2** | False alarm | Non-crime clip fires alert; operator dismisses |
| **S3** | Simultaneous incidents | Lock rule: second alert queues, never overwrites |
| **S4** | Escalation | Operator requests review; supervisor decides |
| **S5** | Quiet shift | No alerts, wall just plays continuously |
| **S6** | Full pitch run | Autoplay sequence (~90s hands-free) |

---

## Keyboard Shortcuts (Presenter)

Press anywhere in the app (outside text inputs):

| Key | Action |
|:---:|:---|
| `1`–`6` | Load scenarios S1 through S6 |
| `Space` | Pause / Play demo clock |
| `N` | Fire next scripted alert |
| `R` | Reset demo scenario & clock |
| `M` | Mute / Unmute alarm synthesizer |
| `P` | Toggle presenter overlay modal |
| `F` | Toggle fullscreen |

---

## Documentation

- **Rehearsal & Pitch Script**: [`docs/demo-runbook.md`](docs/demo-runbook.md) — 2-3 minute live path, 60s fallback, timer mode guide.
- **Acceptance Matrix**: [`docs/acceptance.md`](docs/acceptance.md) — Verification of all 10 acceptance criteria.
- **Architecture**: [`docs/architecture.md`](docs/architecture.md) — State machine invariants I1–I7, data flow, sync engine.
- **Design Specifications**: [`docs/design.md`](docs/design.md) — Layout tokens, UI rules, ethical constraints.
- **Clip Checklist**: [`docs/clip-checklist.md`](docs/clip-checklist.md) — Clip provenance and staging status.

---

*All data, locations, times, and metrics shown in this prototype are **ILLUSTRATIVE** and **SIMULATED**.*
