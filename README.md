# SOTORKO AI — Prototype Mock-up

> **PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running.**

A clickable, offline control-room mock-up for the Futuremaker GP competition.
It replays pre-selected, pre-labelled videos and demonstrates the operator workflow:
alert → incident screen → human verification → simulated dispatch → closure.

**There is no machine learning in this prototype.** "Detections" are scripted cues
attached to specific timestamps of specific videos.

## Quick Start

```bash
npm install
npm run validate:data   # check clips, cues, licences
npm run dev             # http://localhost:5173
```

## Offline Build

```bash
npm run build
npx serve dist
```

## Tests

```bash
npm run test            # Vitest unit tests
npm run test:e2e        # Playwright (S3 simultaneous incidents)
```

## Project Structure

```
docs/           design.md, architecture.md, phases.md, clip-checklist.md
public/
  videos/       MP4 clips (git-ignored, see .gitkeep)
  data/         clips.json, cameras.json, map.json, scenarios/
src/
  domain/       Pure TypeScript: state machine, lock rule, cue scheduler
  store/        Zustand store, BroadcastChannel sync
  services/     Alarm, clock, data loader
  components/   React UI components
  pages/        Route-level page components
  styles/       Design tokens
tests/
  unit/         State machine, lock rule, cue scheduler tests
  e2e/          Playwright specs
scripts/        Data validation, ffmpeg helpers
```

## Scenarios

| ID | Name | Purpose |
|----|------|---------|
| S1 | Single incident | Full lifecycle: alert → confirm → dispatch → close |
| S2 | False alarm | Non-crime clip fires alert; operator dismisses |
| S3 | Simultaneous incidents | Lock rule: second alert queues, never overwrites |
| S4 | Escalation | Operator requests review; supervisor decides |
| S5 | Quiet shift | No alerts, wall just plays |
| S6 | Full pitch run | Autoplay S1→S3 sequence (~90s) |

## Keyboard Shortcuts (Presenter)

| Key | Action |
|-----|--------|
| `1`–`6` | Load scenario |
| `N` | Fire next scripted alert |
| `R` | Reset |
| `Space` | Pause / Play |
| `M` | Mute alarm |
| `F` | Fullscreen |
| `P` | Toggle presenter overlay |

## Clip Provenance

All clips must be staged by the team (with documented consent) or properly licensed.
See `docs/clip-checklist.md` for the current status and `design.md` section 9 for ethics guidelines.

---

*All data, locations, times, and metrics shown in this prototype are **ILLUSTRATIVE** and **SIMULATED**.*
