# design.md: SOTORKO AI Prototype Mock-up

> Audience: Claude Code (and the human team). Read this first, then `architecture.md`, then `phases.md`.
> Status: v1. Items under "Assumptions" can be changed by the team; everything else is a requirement.

## 1. Purpose

Build a **clickable, offline control-room mock-up** of SOTORKO AI for the Futuremaker GP competition. It replays a small set of **pre-selected, pre-labelled videos** (some crime-like, some not) and shows what the operator experience *would* look like when an AI system flags an event.

**There is no machine learning in this prototype.** "Detections" are **scripted cues** attached to specific timestamps of specific videos. The value of the prototype is demonstrating the *workflow*: alert → incident screen → human verification → simulated dispatch → closure, including false alarms and simultaneous incidents.

It mirrors slides 5 and 6 of the pitch deck (end-to-end workflow and the three-display control room).

### What it demonstrates
- Multi-camera surveillance wall with one camera highlighting when an event fires.
- Dedicated incident screen with enlarged feed, alarm, map pin, camera ID, timestamp, event type, confidence, priority, recent-event clip and verification controls.
- Incident queue dashboard with priority, status, operator, dispatch progress.
- The **lock rule**: a new alert can never silently overwrite an incident already under review.
- Human verification: confirm, dismiss (false alarm) or request review.
- Simulated dispatch, acknowledgement, arrival and closure; audit log; evidence package.

### What it does NOT do
- No object detection, tracking, action recognition or any other model. No computer vision at all.
- No real police, DMP or emergency integration. No real map data requirement. No cloud. No uploads.
- No facial recognition or identification of people.
- It does not measure or prove accuracy, latency or response-time improvement.

## 2. Honesty requirements (non-negotiable)

These exist so judges cannot mistake the mock-up for a working AI system.

1. A **persistent banner** on every screen: `PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running.`
2. Every confidence value, ID, location, time, unit name and dispatch status carries an `ILLUSTRATIVE` or `SIMULATED` tag somewhere visible on that screen (a small footer label is enough).
3. Confidence is a **scripted number** from the cue file. It is never presented as a probability that a crime occurred. UI copy says "Detection confidence (scripted)".
4. Session summary and any "metrics" are labelled **"Demo metrics, not performance evidence"**.
5. Locations are fictional and prefixed `Example` (e.g. `Example public intersection A, Dhaka`). Do not use real addresses.
6. Wording never says "thief", "criminal" or "suspect". Use "possible", "potential", "event".

## 3. Assumptions (edit if wrong)

| # | Assumption | Impact if wrong |
|---|---|---|
| A1 | Runs on one laptop, fully offline, Chrome or Edge, optionally with 1-2 external monitors | Multi-window sync (section 7) may be unnecessary |
| A2 | 10-14 short video clips (15-60 s each) supplied by the team | Wall tile count and scenario scripts change |
| A3 | Clips are staged/acted by the team or properly licensed (see section 9) | Legal/ethical review needed first |
| A4 | Stack is React + TypeScript + Vite (see `architecture.md`) | Re-plan phases |
| A5 | Presenter drives the demo with keyboard shortcuts during a 2-3 minute live segment | Autoplay-only mode is also provided |
| A6 | UI language is English | Add i18n layer (Bangla labels) as a stretch goal |

## 4. Demo scenarios

Each scenario is a named script (JSON) that sets which clips play on which wall tiles and which cues are armed.

| ID | Name | Story | Teaches |
|----|------|-------|---------|
| S1 | Single incident, full lifecycle | One crime-like clip fires a HIGH alert. Operator confirms. Simulated dispatch runs to closure. | Slide 5 end-to-end workflow |
| S2 | False alarm | A non-crime clip (e.g. play-fighting, sports, hug) fires a LOW/MEDIUM alert. Operator dismisses with a reason. | Human verification, false-alarm branch |
| S3 | Simultaneous incidents | While S1's incident is under review, a second HIGH alert fires on another camera. It queues with a banner; the active incident is not replaced. | Lock rule, queue |
| S4 | Escalation | Operator requests further review; supervisor view allows decision; then confirm or dismiss. | Escalation branch |
| S5 | Quiet shift | Only non-crime clips, no alerts, wall just plays. | Baseline realism, "no alert is a valid outcome" |
| S6 | Full pitch run (autoplay) | Timed sequence of S1 to S3 for the 7-minute pitch (about 90 s). | Hands-free demo and screen recording |

## 5. Screens

Colour tokens (match the deck): navy `#0B1633`, panel `#111C3A`, edge `#24345F`, lime `#C6F432`, cyan `#22D3EE`, purple `#A855F7`, magenta `#E0457B`, amber `#FBBF24`, muted text `#8FA3C7`. Fonts: Arial (headings), Calibri/system sans (body). Self-host fonts; no CDN.

### 5.1 Start screen `/`
- Title, one-paragraph disclaimer, scenario picker (S1-S6), `Start demo` button (this click unlocks audio autoplay), link to `/presenter`.

### 5.2 Combined control room `/room` (primary demo view, 1920x1080 target)
Three panels, same as slide 6: **A** wall (about 38% width), **B** incident screen (about 37%), **C** queue (about 25%). Banner at the top, footer with `ILLUSTRATIVE`/`SIMULATED` labels.

### 5.3 Display A: Surveillance wall
- 3x3 grid (configurable 2x2 to 4x3) of muted, looping video tiles. Each tile shows camera ID (`CAM-01`), a recording dot and optional timestamp overlay.
- All feeds keep running at all times.
- When a cue fires on a tile: magenta border, `ALERT` tag, subtle pulse (respect `prefers-reduced-motion`). Highlight clears when the incident is closed or dismissed.
- Clicking a tile opens it on the incident screen only if there is no active incident; otherwise shows a toast "Incident under review".

### 5.4 Display B: Incident screen
Empty state: "No active incident. Standing by." (calm, dim).

Active state, top to bottom:
1. Alarm banner: `AUDIBLE ALARM ON | NEW HIGH-PRIORITY INCIDENT` with mute button (alarm repeats every 3 s until acknowledged by first interaction).
2. Enlarged live feed (same clip, synced to the wall tile's playback position) with a lime box overlay labelled `possible <event>`. The box coordinates come from the cue file; it is a static or lightly keyframed rectangle, not detection.
3. Mini map with pin (offline SVG map, see architecture) plus location name.
4. Fields: Incident ID (`STK-001`), event title ("Possible physical altercation"), location, camera ID, timestamp.
5. Chips: `Detection confidence (scripted) 92%`, `Priority: HIGH`.
6. Status line: `Awaiting verification | operator review required`.
7. `Recent event clip` strip: replays the 10 s around the cue using the video's time range.
8. Buttons: **Confirm**, **Dismiss**, **Request review**. Dismiss requires a reason (dropdown: Normal activity / Play or sport / Camera artefact / Other + free text). Confirm opens the dispatch sheet (5.6).
9. Queue banner (when others waiting): `2 more alerts queued. Highest: HIGH (STK-006)` (does not steal focus).

### 5.5 Display C: Incident queue dashboard
- Rows: ID, priority chip, event, location, camera, age, status, operator. Sorted HIGH to LOW then oldest first; the active incident is pinned at the top with a `LOCKED / UNDER REVIEW` badge.
- New row slides in with a brief flash. Status chips: Queued, Under review, Review requested, Confirmed, Dispatched, Acknowledged, Arrived, Closed, Dismissed (false alarm).
- Row click opens a drawer with timeline and audit log for that incident.
- Footer counters: Active, Queued, Closed, Dismissed (session only).
- Lock-rule note visible in the panel: "New alerts queue; they never overwrite an incident under review."

### 5.6 Dispatch sheet (modal on Confirm)
- Channel: `Police Control Room (SIMULATED)`. Free-text note (optional). Evidence package auto-attached.
- After sending, a simulated timeline progresses (speed multiplier 1x/5x/10x): Dispatched, Acknowledged (about 8 s), Unit assigned (`Unit P-12, fictional`), Arrived (about 45 s). Operator then clicks **Close incident** and chooses an outcome (Resolved / Handed over / No further action).

### 5.7 Presenter panel `/presenter` (or overlay toggled with `P`)
- Scenario picker, `Reset`, play/pause all, speed multiplier, `Fire next scripted alert`, current cue list with status, mute alarm, toggle banner (banner toggle is disabled in production builds), clock override.
- Keyboard shortcuts: `1-6` scenarios, `N` next alert, `R` reset, `Space` pause/play, `M` mute, `F` fullscreen, `P` presenter overlay.

### 5.8 Supervisor view (modal or `/supervisor`)
- For escalation: shows the incident, operator note, **Approve confirm** or **Dismiss**. One click, no extra screens.

### 5.9 Session summary `/summary`
- Table of alerts: time, camera, event, scripted confidence, ground-truth label (`crime_like` or `non_crime`), operator decision, time to decision.
- Tag: "Demo metrics, not performance evidence."
- Buttons: export audit log (JSON), export evidence package for one incident (JSON).

## 6. Incident rules

1. **Lock rule:** at most one incident is `ACTIVE` (under review) per operator. New alerts become `QUEUED`; they trigger a short notification tone and queue banner, never the full alarm and never a focus change.
2. **Auto-pull:** when the active incident leaves review (confirmed, dismissed), the next queued incident (highest priority, then oldest) becomes `ACTIVE` after a 2 s pause, unless the operator disabled auto-pull.
3. **Optional swap:** operator can explicitly choose "Review this instead" on a queued row; a confirm dialog parks the current incident back in the queue as `PAUSED`.
4. **Alert threshold:** cues with scripted confidence below a configurable threshold (default 0.50) are not shown. Decoy cues sit just above it so that false alarms appear.
5. **Priority** comes from the cue file (`HIGH`/`MEDIUM`/`LOW`), not computed.
6. **Cue de-duplication:** each cue fires once per scenario run, even if a video loops. Reset re-arms all cues.
7. **Audit log:** every state change, button press, mute, and swap is logged with timestamp and actor (`operator`, `supervisor`, `system`).

## 7. Multi-display mode (optional but recommended)

`/wall`, `/incident`, `/dashboard` can be opened in separate windows or monitors and stay in sync through a `BroadcastChannel`. One window is the **leader** (runs the scenario engine and holds state); others are views that send intents (confirm/dismiss) back. Details in `architecture.md`. The combined `/room` view must work without this.

## 8. Clip requirements

Target: about 12 clips in `public/videos/`, H.264 MP4, 1280x720 or lower, 15-60 s, muted or audio stripped, under 25 MB each, with faces blurred or actors' consent documented.

| Group | Count | Examples (staged by team) | Cues |
|-------|-------|---------------------------|------|
| `crime_like` | 4-6 | physical altercation; snatching-like grab; restricted-zone entry; abandoned bag; weapon-like prop (toy/clearly fake); crowd disturbance | HIGH/MEDIUM cue with exact start/end seconds |
| `non_crime` (decoy) | 2-3 | play-fighting; sports/tag; hugging or fast greeting; running for a bus | LOW/MEDIUM cue (false alarm) |
| `non_crime` (plain) | 3-4 | normal pedestrians; traffic; rain; night street; market crowd | no cue |

Each clip needs an entry in `clips.json` (schema in `architecture.md`) including `label`, `source`, `consent`/`license` and `notes`. Claude Code must refuse to wire a clip into a scenario if `source` or `license` is missing (show a build-time warning).

## 9. Clip sourcing and ethics checklist (human task, do before Phase 2)

- Prefer **clips the team staged with consenting adult actors** in a safe place; no real injury, no real weapons (toy/clearly fake props only).
- Do not use footage of real victims or real crimes unless you hold the rights and have considered the people shown. Do not use news footage you do not have a licence for.
- Public research datasets (e.g. UCF-Crime, RWF-2000) have their own terms of use; check them before use and do not redistribute.
- Blur faces and number plates in any non-staged clip.
- Record who is in each clip and that they agreed to appear in a competition demo.
- Keep the real events out of the UI: no names, no real locations.

## 10. Non-functional requirements

- **Offline:** `npm run build` output runs from a static server with no internet. No CDN, no analytics, no external fonts or tiles.
- **Performance:** 9 simultaneous 720p muted videos plus UI at smooth playback on a mid-range laptop; if not, auto-fall back to 480p copies or fewer tiles.
- **Resilience:** if a video fails to load, show a "feed offline" tile (this itself is a useful demo of camera failure) and never crash.
- **Accessibility basics:** keyboard operable buttons, visible focus, colour is never the only signal (icons and text on chips), reduced-motion support.
- **Privacy:** nothing leaves the machine; no uploads; no logging to servers.

## 11. Acceptance criteria

The mock-up is done when all of these pass:

1. Scenario S1 runs hands-free: wall plays, alert fires at the scripted time, alarm sounds after the Start click, incident screen shows every field in 5.4, confirm leads to a simulated dispatch timeline and closure, audit log has every step.
2. Scenario S2 fires a false alarm that the operator dismisses with a reason; the wall highlight clears.
3. Scenario S3 shows a second alert queuing while the first is under review, with no change to the active incident, a banner on B, a new row on C.
4. Scenario S4 escalation works end to end.
5. Scenario S5 produces no alerts for 3 minutes without errors.
6. The persistent prototype banner and `ILLUSTRATIVE`/`SIMULATED` labels are visible on every screen.
7. Session summary exports valid JSON.
8. Works offline after `npm run build` and a static serve; no network requests in the browser devtools.
9. Unit tests for the state machine and lock rule pass; one end-to-end test runs S3.
10. A clip that fails to load degrades gracefully.

## 12. Stretch goals (only after acceptance)

- Bangla label toggle.
- Leaflet map using local tiles when available.
- Screen-recording helper (hotkey to start the S6 autoplay and show a countdown).
- Operator workload view (alerts per hour, demo only).
