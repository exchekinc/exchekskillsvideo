---
name: exchek-video-classification
description: Render an export classification (ECCN/USML) briefing video (MP4) from an exchek-classify JSON sibling. Animated ECCN reveal with jurisdiction, reason-for-control, license-required, and exception fields. Use when the user wants a visual briefing of a classification determination, a customer-facing classification deliverable, or an internal review video.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-classification

## Purpose
Specialized wrapper around `exchek-video-summary` that forces the
`classification` template — large animated ECCN/USML code reveal, supported
by jurisdiction, RFC, license-req, and exception cards.

## When to invoke
- "Make a video of my latest ECCN classification"
- "I need a customer-facing classification briefing video"
- "Render the USML determination as an MP4"

## Inputs
1. Path to an `exchek-classify` (or `exchek-license`, `exchek-jurisdiction`)
   JSON sibling.

## Steps
1. CUI gate (inherited).
2. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template classification \
     [--output <path>]
   ```
3. Confirm the rendered ECCN/USML code matches the determination in the
   source `.docx`. Mismatch usually means the bridge picked the wrong
   determination row — re-run with `--headline "ECCN: XXXXXX"` and
   `--subhead "..."` to pin the values.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
