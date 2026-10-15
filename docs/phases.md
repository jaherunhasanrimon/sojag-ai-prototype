# phases.md: Build Plan for the SOTORKO AI Prototype Mock-up

> Read `design.md` (what and why) and `architecture.md` (how) first.
> Work **one phase at a time**. At the end of each phase: run tests, commit, summarise what changed, list anything unfinished, and **stop for human review**. Do not start the next phase until told to.

Effort key: S = under half a day, M = about a day, L = 1-2 days (for one developer working with Claude Code).

## Ground rules for every phase

1. **No ML, no computer vision, no network calls.** Detections are scripted cues only (see `design.md` section 1).
2. Keep the honesty banner and `ILLUSTRATIVE`/`SIMULATED` labels from `design.md` section 2 in place from Phase 1 onward.
3. Domain logic lives in `src/domain/` as pure TypeScript with unit tests; React components stay thin.
4. TypeScript strict mode; no `any` unless justified in a comment.
5. Small commits with clear messages, one feature per commit. Update `README.md` when commands or structure change.
6. If a requirement is ambiguous, ask the human instead of guessing; list the question and a recommended default.
7. Do not add dependencies beyond the stack in `architecture.md` without asking.

---

## Phase 0: Preparation and clip curation (human + Claude, no app code) | S

**Goal:** the project has a clean foundation and the clips and cue data are ready.

**Human tasks**
- Select or stage 10-14 clips (`design.md` sections 8-9). Record source, consent or licence for each.
- Trim clips to 15-60 s, mute or strip audio, convert to H.264 MP4 720p.
- Note, for each crime-like clip and decoy, the second at which the "alert" should fire and the 10 s window to replay.

**Claude Code tasks**
- Create the repo skeleton, `docs/` with the three markdown files, `README.md`, `.gitignore` (ignore `public/videos/*` except `.gitkeep`), and `CLAUDE.md` containing the ground rules above plus the honesty requirements.
- Create `public/data/clips.json`, `cameras.json`, `map.json` and `scenarios/*.json` as **templates with TODO placeholders** and example values clearly marked `ILLUSTRATIVE`.

**Deliverables:** repo skeleton, `CLAUDE.md`, data templates, a short `docs/clip-checklist.md` listing the clips still needed.

**Definition of done:** `git status` clean; the human confirms the clip list and cue timings.

---

## Phase 1: App skeleton, design system and static layout | M

**Goal:** the three-panel control room renders with fake static data, in the deck's visual style.

**Tasks**
- Scaffold Vite + React + TS + Tailwind + Zustand + React Router. Add Vitest.
- Implement tokens from `design.md` section 5 (colours, fonts self-hosted), `Banner`, `Footer`, `PanelShell`.
- Build static `/room` with panels A (3x3 grey tiles), B (incident screen with hard-coded `STK-001` example) and C (queue with 5 hard-coded rows including a `NEW` row), matching slide 6 of the pitch deck.
- Start screen `/` with disclaimer and scenario picker (not wired yet).

**Deliverables:** running app at `npm run dev`; screenshot of `/room` at 1920x1080 saved to `docs/screens/phase1-room.png`.

**Definition of done:** layout holds at 1920x1080 and 1366x768 without overflow; banner and labels visible; lint and typecheck pass.

---

## Phase 2: Data layer and video wall | M

**Goal:** real clips play on the wall, driven by data files.

**Tasks**
- Implement Zod schemas and `loader.ts`; `scripts/validate-data.ts` and `npm run validate:data`.
- Build `VideoTile` and `VideoWall`: muted looping playback, camera ID overlay, recording dot, "FEED OFFLINE" fallback with reconnect attempts.
- Wire `S5` (quiet shift) so the wall plays only plain clips from `scenarios/s5.json`.
- Add `clock.ts` (demo clock with pause and speed) and have tiles follow its play/pause/rate.
- Add `?lowres=1` support and `scripts/make-lowres.sh` (ffmpeg, optional).

**Deliverables:** wall plays 9 tiles; validation script catches missing files, out-of-range cues and missing licence info.

**Definition of done:** S5 runs 3 minutes with no console errors; breaking a file path shows a FEED OFFLINE tile, not a crash.

---

## Phase 3: Cue scheduler, incident store and state machine | L

**Goal:** scripted cues create incidents and the lock rule works, with no UI polish yet.

**Tasks**
- Implement `types.ts`, `stateMachine.ts`, `lockRule.ts`, `priority.ts`, `cueScheduler.ts` exactly as in `architecture.md` sections 4-6.
- Zustand store with actions: `CUE_FIRED`, `PULL`, `CONFIRM`, `DISMISS`, `REQUEST_REVIEW`, `SUPERVISOR_CONFIRM`, `SUPERVISOR_DISMISS`, `SEND_DISPATCH`, `SIM_ACK`, `SIM_ARRIVE`, `CLOSE`, `SWAP`.
- Connect `VideoTile` time ticks to the scheduler. Highlight the tile on `QUEUED`/`ACTIVE`.
- Debug panel (dev only) listing incidents and their status.
- Unit tests for invariants I1-I7, ordering, threshold, de-duplication, seek/loop/skipped ticks.

**Deliverables:** S1 and S3 data authored; tests green.

**Definition of done:** firing a second cue while one is `ACTIVE` never changes the active incident (test proves it); cues fire once across loops; all transitions appear in the audit log.

---

## Phase 4: Incident screen (Display B), alarm and map | L

**Goal:** the centre of the demo looks and behaves like the deck's slide 6.

**Tasks**
- `IncidentScreen`: alarm banner, `FeedView` (second video synced to the alert tile, overlay box from cue), `MiniMap`, field list, chips, status line, `ClipStrip` replay (10 s window), `ActionBar`, `QueueBanner`.
- `alarm.ts` with WebAudio patterns; Start-click unlocks audio; mute button.
- `DispatchSheet` modal on Confirm; Dismiss reason dialog (reason required).
- Empty state "No active incident. Standing by."

**Deliverables:** S1 and S2 run through confirm and dismiss in the UI.

**Definition of done:** every field in `design.md` 5.4 is present; alarm starts on activation and stops on first interaction or mute; dismiss without a reason is impossible; labels remain visible.

---

## Phase 5: Queue dashboard (Display C), dispatch simulator and closure | M

**Goal:** the queue, the lock rule in the UI, and the simulated dispatch timeline.

**Tasks**
- `QueueTable` with sort, status chips, pinned active row, new-row flash, counters; `IncidentDrawer` with timeline and audit log.
- `dispatchSim.ts` timers on the demo clock (ack about 8 s, unit assigned about 15 s, arrival about 45 s; 1x/5x/10x).
- Close incident flow with outcome selector; auto-pull of the next queued incident after 2 s (toggleable).
- Optional swap ("Review this instead") with confirm dialog.
- Supervisor modal for escalation (S4).

**Deliverables:** S1, S2, S3, S4 playable end to end.

**Definition of done:** the lock-rule note is visible on C; S3 shows banner on B and a new row on C without changing B; escalation frees the operator lock and keeps the row pinned.

---

## Phase 6: Presenter tools, autoplay, multi-window sync and summary | L

**Goal:** the demo can be run reliably under pressure and across multiple monitors.

**Tasks**
- Presenter panel with scenario picker, reset, pause/play, speed, "fire next alert", cue list status, keyboard shortcuts (`design.md` 5.7).
- Autoplay script support and authoring of **S6** (about 90 s hands-free run of S1 then S3).
- `/summary` with table, "Demo metrics, not performance evidence" tag, JSON exports (audit log and evidence package).
- `sync.ts`: BroadcastChannel leader/follower, snapshot and intent messages, heartbeat takeover. Routes `/wall`, `/incident`, `/dashboard`.
- Timer-mode fallback when videos fail.

**Deliverables:** three windows stay in sync; S6 runs hands-free; exports valid JSON.

**Definition of done:** closing the leader window hands over leadership within 3 s; operator actions in the `/incident` window update `/dashboard`; reset re-arms all cues.

---

## Phase 7: Polish, offline build, rehearsal and acceptance | M

**Goal:** a demo-ready build that passes every acceptance criterion in `design.md` section 11.

**Tasks**
- Visual polish pass versus the deck (spacing, typography, animation timing, reduced-motion support, focus states).
- Error boundaries per panel; verify no external network requests in the browser devtools.
- Playwright e2e for S3; run all unit tests; fix flakiness.
- `npm run build` and an offline run test (network disabled).
- README with run instructions, keyboard shortcuts, scenario descriptions, clip provenance table.
- Rehearsal script `docs/demo-runbook.md`: 2-3 minute live path (S1, then S3), a 60-second fallback path, and what to say if a video fails (timer mode).
- Screen-record S6 as a backup video.

**Deliverables:** `dist/` build, runbook, backup recording, acceptance checklist with each item ticked and evidence noted.

**Definition of done:** all 10 acceptance criteria pass; the team has rehearsed the runbook twice on the demo laptop.

---

## Suggested review gates

| After phase | Human checks |
|-------------|--------------|
| 0 | Clip list, licences, cue timings plausible and safe |
| 1 | Looks like the deck; labels visible |
| 3 | Lock rule test passes; audit log reads clearly |
| 5 | S1 to S4 feel right to a non-technical viewer |
| 6 | Presenter can run S6 and a manual path without touching a mouse |
| 7 | Full acceptance run, offline |

## Out of scope (do not build)

Machine learning of any kind, real CCTV or RTSP ingestion, real police integration, user accounts or login, databases or servers, face recognition, mobile apps.
