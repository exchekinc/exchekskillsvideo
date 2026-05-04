---
name: exchek-video-deemed-export
description: Render a deemed-export determination video (MP4) from an exchek-deemed-export JSON sibling under 15 CFR 734.2(b)(2)(ii) / 734.13. Big YES/NO/REVIEW verdict tile color-coded by outcome, plus four supporting cards (foreign-national status, country of nationality, technology ECCN, license requirement). Use when the user wants a visual briefing for HR or engineering on whether a technology release to a foreign national is a deemed export.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-deemed-export

Specialized wrapper that forces the `deemed-export` template. focused
on the binary determination ("Is this a deemed export?") with the four
fields that drive it.

## When to invoke
- "Make a video for HR/Engineering explaining the deemed-export decision on this hire"
- "I need a 30-second briefing on the 734.13 review for our PRC contractor"
- "Render the deemed-export determination on the MEMS engineering hire"

## Inputs
1. Path to an `exchek-deemed-export` JSON sibling.

## Steps
1. CUI gate (inherited).
2. Narration preflight (inherited). The verdict reads cleanly aloud
   ("Deemed export determination: YES.").
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template deemed-export \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. The verdict tile color-codes by determination value: green for "NO /
   NOT REQUIRED / EXEMPT", red for "YES / REQUIRED", purple for
   "REVIEW".

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
