# SOTORKO AI — Control Room Demo Runbook & Rehearsal Script

> **PROTOTYPE DISCLOSURE**: This system is an offline, zero-ML prototype demonstrating the *operator verification workflow* of a public safety control room. All detections are scripted cues attached to specific timestamps of pre-labelled video clips. Confidence values are scripted numbers. All locations, incident IDs, and unit dispatches are simulated.

---

## 1. Quick Rehearsal Paths

### Path A: Primary Competition Pitch (2–3 Minutes)
**Target**: Demonstrate core operator value, human-in-the-loop verification, and strict lock-rule queueing.

1. **Setup**:
   - Open browser to `http://localhost:5173/`
   - Unmute laptop audio (or press `M` in app to unmute)
   - Explain premise: *"Today we are showing you SOTORKO AI's operator workflow interface. Note our persistent banner: this prototype runs zero computer vision models today; every detection is a deterministic scripted cue demonstrating how an operator safely manages incidents."*

2. **Run Scenario S1: Single Incident Full Lifecycle (60 seconds)**:
   - Click **S1** (or press key `1`), then click **Start Demo**.
   - Watch the Surveillance Wall play feeds. Feeds tick from local clock.
   - At timestamp `00:00:12`: Alert fires on CAM-01. WebAudio pulsing alarm sounds.
   - Point out **Display B**:
     - Enlarged camera view with bounding box.
     - Location: *Gulshan-2 Circle North (SIMULATED)*.
     - Confidence chip: *Detection confidence (scripted) 92%*.
     - Mini-map highlighting camera coordinates.
     - 10-second contextual clip strip below the feed.
   - Click **✓ Confirm** (or hotkey).
   - In the simulated Dispatch Sheet, note that the 10-second clip and audit trail are auto-attached.
   - Click **📡 Send dispatch**.
   - Point to **Display C**: Incident status transitions from `CONFIRMED` → `DISPATCHED` → `ACKNOWLEDGED` (Unit P-12) → `ARRIVED`.
   - On unit arrival, click **✔ Close incident** → Select *Resolved*.

3. **Run Scenario S3: Simultaneous Incidents & Lock Rule (60–90 seconds)**:
   - Press `3` (or open Presenter Panel via `P` and click S3).
   - Alert 1 fires on Tile 0 (`STK-001`, altercation) → Operator begins review.
   - At timestamp `00:00:10`: Alert 2 fires on Tile 1 (`STK-002`, crowd surge) while Alert 1 is under review.
   - **Key Pitch Highlight (The Lock Rule)**:
     - *"Notice what just happened: In traditional systems, incoming alerts overwrite the screen, causing panic and lost context. In SOTORKO AI, Invariant Rule I2 guarantees that an alert under review is never overwritten."*
     - Point out the yellow banner on Display B: `1 more alert queued. Highest: HIGH (STK-002)`.
     - Point out Display C: `STK-001` is pinned with a green `LOCKED` badge; `STK-002` safely queues in priority order.
   - Operator completes Alert 1 review (`Confirm` + `Dispatch`).
   - Click **Review next** or wait for auto-pull: `STK-002` smoothly promotes into Display B.

4. **Session Summary Table**:
   - Click **Summary Table ↗** (or navigate to `/summary`).
   - Show the summary table with ground truth labels (`crime_like` vs `non_crime`).
   - Highlight the banner: **"Demo metrics, not performance evidence."**
   - Click **Export Audit Log (JSON)** and **Export Evidence Package (JSON)** to demonstrate tamper-evident data export.

---

### Path B: 60-Second Rapid Fallback Path
**Target**: Ultra-fast overview when pitch time is cut short.

1. Navigate to `/room` and press `6` to launch **Scenario S6: Full pitch run (Autoplay)**.
2. Hands-free pitch script:
   - *"SOTORKO AI acts as an intelligent triage buffer for emergency operators. As feeds stream on Display A, scripted events trigger instant operator focus on Display B."*
   - Watch the autoplay fire the alert, confirm the incident, auto-dispatch, and transition.
   - *"Our architecture enforces strict human verification before any unit dispatch, and mathematically guarantees through state machine invariants that high-stress simultaneous events never cause screen overrides."*
3. Finish at `/summary` and export the evidence package.

---

## 2. "What If a Video Fails?" — Timer Mode Protocol

The prototype features an automatic **FEED OFFLINE** fallback:
- If a clip file is missing or corrupted, the video tile does not crash. It displays `FEED OFFLINE — CAM-XX (RECONNECTING...)`.
- The tile automatically ticks cues from the simulated demo clock (`useDemoClock`).
- **What to say to judges**:
  > *"Camera dropouts are a daily reality in public safety infrastructure. SOTORKO AI handles feed dropouts gracefully: offline feeds are flagged immediately with automatic reconnection timers, while the scheduling engine preserves operational continuity."*

---

## 3. Multi-Window Multi-Monitor Setup

For demonstrations using multiple monitors or projectors:

| Screen | Route | Role |
|--------|-------|------|
| **Monitor 1 (Left)** | `http://localhost:5173/wall` | Fullscreen Surveillance Wall (Display A follower) |
| **Monitor 2 (Center)** | `http://localhost:5173/incident` | Fullscreen Incident Screen (Display B follower) |
| **Monitor 3 (Right)** | `http://localhost:5173/dashboard` | Fullscreen Incident Queue (Display C follower) |
| **Presenter Laptop** | `http://localhost:5173/presenter` (or `/room`) | Sync Leader & Presenter Controls |

- All windows connect automatically via `BroadcastChannel('sotorko-sync-v1')`.
- Any action taken on any screen synchronizes instantaneously across all other displays.
- If the presenter window is closed, one of the follower windows automatically takes over leadership within 3 seconds.

---

## 4. Keyboard Shortcuts Cheat Sheet

Press keys anywhere in the application (except while typing in textareas/inputs):

| Key | Function | Detail |
|:---:|:---|:---|
| `1` | Scenario S1 | Single incident, full lifecycle |
| `2` | Scenario S2 | False alarm dismiss (shows negative case handling) |
| `3` | Scenario S3 | Simultaneous incidents & lock rule demonstration |
| `4` | Scenario S4 | Supervisor review escalation |
| `5` | Scenario S5 | Quiet shift (wall plays, no alerts for 3 minutes) |
| `6` | Scenario S6 | Full pitch autoplay (~90s hands-free) |
| `Space` | Pause / Play | Toggles simulated demo clock |
| `N` | Fire Next Alert | Instantly triggers the next armed cue in scenario |
| `R` | Reset Demo | Clears incidents, resets clock and scheduler |
| `M` | Mute / Unmute | Toggles WebAudio alarm synthesizer |
| `P` | Presenter Panel | Toggles floating presenter control overlay modal |
| `F` | Fullscreen | Toggles browser fullscreen mode |

---

## 5. Judge Q&A & Honesty Talking Points

- **Q: "Is there an AI model detecting crimes in these videos?"**
  - **A**: *"No. As clearly stated on our honesty banner, this prototype contains zero machine learning models. Every detection is a scripted cue tied to pre-labelled video clips. Our goal today is to prove the operational human-machine interface, the invariant state machine, and the operator workflow before training custom models."*

- **Q: "Can an AI make an automated dispatch decision without a human?"**
  - **A**: *"Never. SOTORKO AI enforces human verification as an architectural invariant. An automated cue can only propose an event for human operator confirmation. Only an operator or supervisor can authorize a dispatch."*

- **Q: "What if two urgent alerts arrive at the exact same millisecond?"**
  - **A**: *"Our lock rule (Invariant I2) ensures the incident currently under review is never interrupted or overwritten. The incoming incident is safely prioritized in the Incident Queue (Display C), and a non-intrusive alert notification appears on Display B."*
