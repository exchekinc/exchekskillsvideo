---
name: exchek-video-red-flag
description: Render an attention-grabbing red-flag-assessment video (MP4) from an exchek-red-flag-assessment JSON sibling. High-contrast alert layout, severity-coded indicator cards, and the BIS Supp. 3 to 15 CFR Part 732 reference. Use when the user wants to surface red flags to a compliance officer, run a stand-up alert video, or include an attention-grabbing summary in an internal incident channel.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-red-flag

## Purpose
Specialized wrapper that forces the `red-flag` template. The visual treatment
is intentionally louder than the other templates — designed for incident-style
attention, not for relaxed exec consumption.

## When to invoke
- "Turn the red-flag report into a video for the compliance channel"
- "I need a 30-second alert video for our internal Slack"
- "Render an MP4 of the indicators that tripped on this transaction"

## Inputs
1. Path to an `exchek-red-flag-assessment` JSON sibling. Also accepts
   `exchek-csl` and `exchek-country-risk` JSONs.

## Steps
1. CUI gate (inherited from `exchek-video-summary`).
2. Narration preflight (inherited from `exchek-video-summary` step 0.5):
   ask the user about ElevenLabs narration up-front. For red-flag videos
   the narration is especially impactful ("4 indicators tripped, 2 high
   severity") — recommend it unless the user specifically asks for silent.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template red-flag \
     [--output <path>]
   ```
4. Verify the severity color-coding lines up with the source determinations.
5. The video is **not an alert delivery mechanism** — actual alerting belongs
   in the channel/SIEM the report's metadata routes to. The MP4 is for human
   consumption when the alert is opened.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
