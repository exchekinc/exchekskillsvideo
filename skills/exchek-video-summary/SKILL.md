---
name: exchek-video-summary
description: Render an audit-ready compliance video summary (MP4) from any exchekskills JSON sibling output. Auto-detects the right template (risk-triage, classification, red-flag, compliance-report-card) from the source skill name. Use when the user wants a video version of an existing ExChek report, an executive briefing video, or a shareable summary for clients or stakeholders. The .docx remains the audit-of-record; the video is a summary visualization.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-summary

## Purpose
Turn the structured JSON sibling that every ExChekSkills report emits
(`<basename>.json`, schema 1.0.0) into a 6–12 second branded MP4 suitable for
executive briefings, client deliverables, or compliance training libraries.

This skill is a thin orchestration layer over the
[`scripts/report-to-video.mjs`](../../scripts/report-to-video.mjs) bridge in
this repo, which itself wraps HeyGen HyperFrames.

## When to invoke
- "Make a video summary of my last risk triage report"
- "Render an MP4 from `~/Documents/ExChek-Reports/ExChek-...json`"
- "I need an executive briefing video of this classification"
- "Create a shareable video version of the red-flag assessment"

## Inputs
1. **Required** — path to an ExChekSkills JSON sibling file (the one that
   lives next to the .docx output of any other exchekskills skill).
2. **Optional** — explicit template override
   (`risk-triage`, `classification`, `red-flag`, `compliance-report-card`,
   `training`).
3. **Optional** — output path. Default is `renders/<basename>.mp4` in this
   repo, or wherever the user's `~/Documents/ExChek-Reports` is configured.
4. **Optional** — format (`mp4`, `webm`, `mov`), fps (`24|30|60`), quality
   (`draft|standard|high`).

## Steps

### Step 0 — CUI / classified gate
Inherit from upstream `exchekskills`: refuse if the report's
`cui_check.cui` or `cui_check.classified` is true and `on_prem_required` is
true. Video output is intended for executive consumption, not classified
material.

### Step 1 — Locate the JSON
If the user names a skill but not a file, look in their configured ExChek
output folder (default `~/Documents/ExChek-Reports`) for the most recent
matching `ExChek-<Kind>-YYYY-MM-DD-*.json`. Confirm the chosen file with
the user before rendering.

### Step 2 — Pick the template
Run the bridge in dry-run mode first to confirm template auto-selection:
```bash
node scripts/report-to-video.mjs <report.json> --dry-run
```
This writes `.tmp/<template>-resolved.html` so the user can sanity-check the
mapping without burning a render. Show the user the chosen template; offer
the four named templates if they want to override.

### Step 3 — Render
```bash
node scripts/report-to-video.mjs <report.json> [--template <name>] [--output <path>]
```
On a typical workstation this takes 15–60 seconds depending on quality.
Surface the HyperFrames render output to the user; do not silently swallow
warnings.

### Step 4 — Pair with the audit-of-record
Always remind the user that the `.docx` is the document of record per
15 CFR § 762.6. The MP4 is a summary visualization; it does not satisfy
recordkeeping on its own. Place the MP4 in the same folder as the source
`.docx`/`.json` pair so they travel together.

### Step 5 — Privacy attestation (inherited)
The video inherits the source report's `privacy_attestation` block. Do not
upload the MP4 to a third-party hosting service without confirming the
user's tier permits it.

## Outputs
- `<basename>.mp4` — the rendered video.
- The original `.docx` and `.json` remain unchanged.

## Failure modes
- **`hyperframes` not installed** → run `npx --yes hyperframes doctor` and
  surface the diagnostic.
- **FFmpeg missing** → `brew install ffmpeg` (macOS) or the platform
  equivalent.
- **Template auto-selection wrong** → use `--template` to override; templates
  are listed in `templates/`.
- **Headline reads weirdly** → use `--headline "..."` and `--subhead "..."`
  to override the auto-derivation.

## Compatibility note
Designed for Claude Code first; also runnable on Claude desktop and CoWork
when the workstation has Node ≥22 and FFmpeg available. The HyperFrames
render step requires a local Chrome/Chromium (Puppeteer brings one).
