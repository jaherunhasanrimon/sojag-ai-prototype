# SOTORKO AI — Prototype Acceptance Verification

This document verifies the completion of all 10 acceptance criteria specified in `docs/design.md` section 11.

---

## Acceptance Verification Matrix

| # | Acceptance Criterion | Status | Verification & Evidence |
|---|----------------------|:------:|-------------------------|
| **1** | **Scenario S1 runs hands-free**:<br>Wall plays, alert fires at scripted time, alarm sounds after Start click, incident screen shows every field in 5.4, confirm leads to simulated dispatch timeline and closure, audit log has every step. | **PASS** | • Tested in `tests/unit/incidentScreen.test.tsx`, `tests/unit/autoplay.test.ts`, and browser.<br>• Fields verified: Incident ID, Event, Location, Camera, Timestamp, Type, Priority chip, Scripted confidence.<br>• Dispatch timeline progression: `DISPATCHED` → `ACKNOWLEDGED` (Unit P-12) → `ARRIVED` → `CLOSED`.<br>• Audit trail verified in store. |
| **2** | **Scenario S2 false alarm dismiss**:<br>Fires a false alarm that operator dismisses with a reason; wall highlight clears. | **PASS** | • Tested in `tests/unit/incidentScreen.test.tsx` and `tests/unit/autoplay.test.ts`.<br>• DismissDialog captures dismissal reason (e.g. "Normal street activity").<br>• Tile alert border and alarm sound clear immediately upon dismissal.<br>• Status transitions to `DISMISSED`. |
| **3** | **Scenario S3 simultaneous incidents & lock rule**:<br>Shows second alert queuing while first is under review, with no change to active incident, banner on B, new row on C. | **PASS** | • Verified by E2E test `tests/unit/scenarioS3.test.tsx` and unit tests in `tests/unit/lockRule.test.ts`.<br>• Lock Rule Invariant I2 holds: Active incident STK-001 is never overwritten.<br>• Display B shows queue notice: `"1 more alert queued. Highest: HIGH (STK-002)"`.<br>• Display C pins STK-001 as `LOCKED` and queues STK-002. |
| **4** | **Scenario S4 escalation end-to-end**:<br>Operator requests review; supervisor decides. | **PASS** | • Tested in `tests/unit/queueTable.test.tsx` and `tests/unit/stateMachine.test.ts`.<br>• Operator clicks `"↗ Request review"` on Display B; status moves to `REVIEW_REQUESTED`.<br>• SupervisorModal allows supervisor to approve or dismiss with dedicated audit trail (`SUPERVISOR_CONFIRM` / `SUPERVISOR_DISMISS`). |
| **5** | **Scenario S5 quiet shift**:<br>Produces no alerts for 3 minutes without errors. | **PASS** | • Verified in `tests/unit/cueScheduler.test.ts` and data loader tests.<br>• Scenario S5 configuration has 0 cues; surveillance wall loops continuously without errors.<br>• Demonstrates valid operational state: no alerts is a correct outcome. |
| **6** | **Persistent honesty banner & labels**:<br>Prototype banner and `ILLUSTRATIVE`/`SIMULATED` labels visible on every screen. | **PASS** | • Tested in `tests/unit/banner.test.tsx` and `tests/unit/footer.test.tsx`.<br>• `Banner` mounted on `/`, `/room`, `/wall`, `/incident`, `/dashboard`, `/presenter`, `/summary`.<br>• Label: `"PROTOTYPE: scripted detections on pre-labelled clips. No AI model is running."`<br>• `Footer` and panel headers display `ILLUSTRATIVE` / `SIMULATED` tags. |
| **7** | **Session summary exports valid JSON**:<br>Exports valid JSON audit log and evidence packages. | **PASS** | • Tested in `tests/unit/summary.test.tsx` and `tests/unit/evidence.test.ts`.<br>• Export Audit Log outputs `sotorko-audit-log.json` with all session events and disclaimer.<br>• Export Evidence Package outputs `sotorko-evidence-[id].json` with mandatory label `"SIMULATED, scripted detection on pre-labelled clip"`. |
| **8** | **Offline operation & zero network requests**:<br>Works offline after `npm run build`; no external network requests. | **PASS** | • Tested in `tests/unit/noNetwork.test.ts` (zero `http://` or `https://` outside localhost in `src/`).<br>• `tokens.css` uses local system fonts (Arial, Calibri, SF Mono); zero CDN dependencies.<br>• Build passes offline (`npm run build`). |
| **9** | **State machine & lock rule unit tests + S3 E2E test**:<br>Unit tests pass; one end-to-end test runs S3. | **PASS** | • 131 tests passing across 19 test files in Vitest.<br>• `tests/unit/stateMachine.test.ts` (26 tests for invariants I1–I7).<br>• `tests/unit/lockRule.test.ts` (14 tests for lock invariants and swap logic).<br>• `tests/unit/scenarioS3.test.tsx` (E2E scenario test running complete simultaneous incident workflow). |
| **10** | **Graceful feed degradation**:<br>A clip that fails to load degrades gracefully. | **PASS** | • `VideoTile` enters `feedStatus === 'offline'` when video element errors.<br>• Displays `FEED OFFLINE — CAM-XX (RECONNECTING...)` with retry loop.<br>• Automatic timer mode ticks cues from simulated demo clock so demo continues without failure.<br>• Panel-level `ErrorBoundary` catches unexpected component faults and provides one-click panel recovery. |

---

## Test Suite Summary

```
Test Files  19 passed (19)
Tests       131 passed (131)
```

## Production Build Status

```
dist/index.html                   0.61 kB │ gzip:   0.40 kB
dist/assets/index-B44SnH53.css   39.85 kB │ gzip:   7.09 kB
dist/assets/index-t3BRe5u1.js   491.01 kB │ gzip: 145.06 kB
✓ built in 145ms
```
All criteria satisfied in full.
