---
name: exchek-video-recordkeeping
description: Render a 15 CFR 762 recordkeeping-status video (MP4) from an exchek-recordkeeping JSON sibling. Color-coded retention-status tile (compliant green / at-risk amber / gap red), three secondary cards (records covered · oldest record · days to expiry), and an animated 5-year retention-window timeline showing how close any records are to expiring. Use when the user wants a quarterly recordkeeping review video, a compliance committee evidence artifact, or an alert when records are approaching their 5-year disposition window.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-recordkeeping

Specialized wrapper that forces the `recordkeeping` template — focuses
on the 5-year retention window under 15 CFR 762.6 with a visual
timeline showing how close any records are to expiry.

## When to invoke
- "Make a quarterly recordkeeping summary video for the audit committee"
- "I need a video showing our 762 retention status — we have records expiring next month"
- "Render the recordkeeping review for the SharePoint compliance evidence library"

## Inputs
1. Path to an `exchek-recordkeeping` JSON sibling.

## Steps
1. CUI gate (inherited).
2. Narration preflight (inherited).
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template recordkeeping \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. The status tile color-codes from the `Retention status` determination:
   - "Compliant / On track / Current" → green
   - "At-risk / Warn / Review" → amber
   - "Gap / Expired / Overdue / Missing" → red

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
