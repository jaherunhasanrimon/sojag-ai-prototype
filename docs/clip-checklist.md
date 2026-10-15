# Clip Checklist — SOTORKO AI Prototype

> **Human task.** This checklist tracks which video clips are needed, staged, and ready.
> See `design.md` sections 8–9 for full requirements and ethics guidelines.

## Requirements per clip

- H.264 MP4, 1280×720 or lower, 15–60 seconds
- Muted or audio stripped
- Under 25 MB each
- Faces blurred OR actors' consent documented
- Entry in `public/data/clips.json` with `source`, `consent`/`license` filled in

---

## Crime-like clips (4–6 needed, HIGH/MEDIUM cues)

| # | Category | Clip ID | File | Duration | Cue at (sec) | Clip window | Status |
|---|----------|---------|------|----------|---------------|-------------|--------|
| 1 | Physical altercation | `clip_altercation_01` | `videos/???` | ~30s | TODO | TODO–TODO | ⬜ Not staged |
| 2 | Snatching-like grab | `clip_snatching_01` | `videos/???` | ~25s | TODO | TODO–TODO | ⬜ Not staged |
| 3 | Restricted zone entry | `clip_restricted_zone_01` | `videos/???` | ~20s | TODO | TODO–TODO | ⬜ Not staged |
| 4 | Abandoned bag | `clip_abandoned_bag_01` | `videos/???` | ~35s | TODO | TODO–TODO | ⬜ Not staged |
| 5 | Crowd disturbance | `clip_crowd_disturbance_01` | `videos/???` | ~40s | TODO | TODO–TODO | ⬜ Not staged |

## Decoy non-crime clips (2–3 needed, LOW/MEDIUM cues — false alarms)

| # | Category | Clip ID | File | Duration | Cue at (sec) | Clip window | Status |
|---|----------|---------|------|----------|---------------|-------------|--------|
| 6 | Play-fighting | `clip_play_fight_01` | `videos/???` | ~20s | TODO | TODO–TODO | ⬜ Not staged |
| 7 | Sports / tag | `clip_sports_01` | `videos/???` | ~25s | TODO | TODO–TODO | ⬜ Not staged |
| 8 | Fast greeting / hug | `clip_greeting_01` | `videos/???` | ~15s | TODO | TODO–TODO | ⬜ Not staged |

## Plain non-crime clips (3–4 needed, no cues)

| # | Category | Clip ID | File | Duration | Status |
|---|----------|---------|------|----------|--------|
| 9 | Normal pedestrians | `clip_pedestrians_01` | `videos/???` | ~45s | ⬜ Not staged |
| 10 | Traffic | `clip_traffic_01` | `videos/???` | ~60s | ⬜ Not staged |
| 11 | Rain / night street | `clip_rain_01` | `videos/???` | ~30s | ⬜ Not staged |
| 12 | Market crowd | `clip_market_01` | `videos/???` | ~50s | ⬜ Not staged |

---

## Per-clip checklist (fill in for each clip)

For each clip above, confirm:

- [ ] Filmed / sourced
- [ ] Trimmed to 15–60 seconds
- [ ] Converted to H.264 MP4, ≤720p
- [ ] Audio muted or stripped
- [ ] Under 25 MB
- [ ] Faces blurred OR actors' written consent obtained
- [ ] No real weapons (toy/clearly fake props only)
- [ ] No real victims, real crimes, or news footage without a licence
- [ ] `clips.json` entry updated: `source`, `consent`, `license` fields filled
- [ ] Cue timing noted (for crime-like and decoy clips): exact second and 10s replay window
- [ ] File placed in `public/videos/` and filename updated in `clips.json`

## Ethics reminders (from `design.md` section 9)

- Prefer clips staged by the team with consenting adult actors in a safe place.
- No real injury, no real weapons (toy/clearly fake props only).
- Do not use footage of real victims or real crimes unless you hold the rights.
- Do not use news footage without a licence.
- Public research datasets (UCF-Crime, RWF-2000) have their own terms — check before use.
- Blur faces and number plates in any non-staged clip.
- Record who is in each clip and that they agreed to appear in a competition demo.
- Keep real events out of the UI: no names, no real locations.

---

*Status key: ⬜ Not staged → 🟡 Staged, not processed → ✅ Ready*
