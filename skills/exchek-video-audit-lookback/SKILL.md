---
name: exchek-video-audit-lookback
description: Render an audit-lookback re-screen video (MP4) from an exchek-audit-lookback JSON sibling. Big purple "X transactions re-screened" tile + new-hits count + animated severity-breakdown bars (high / medium / low). Use when the user wants a quarterly re-screening summary for compliance committee, a board-level evidence artifact for the audit chain, or an alert when a known counterparty newly appears on a screening list.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-audit-lookback

Specialized wrapper that forces the `audit-lookback` template 
emphasis on volume (transactions re-screened) and severity breakdown of
any newly-flagged hits.

## When to invoke
- "Make the quarterly re-screening summary video for the compliance committee"
- "I need a board video showing our Q1 audit lookback found 5 new hits"
- "Render the audit-lookback report as an MP4 for the SharePoint evidence library"

## Inputs
1. Path to an `exchek-audit-lookback` JSON sibling.

## Steps
1. CUI gate (inherited).
2. Narration preflight (inherited). Strongly recommended for this
   template. the volume number is the headline and reads naturally.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template audit-lookback \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. Severity bars are computed from `risk_flags[].severity` counts. If
   the source report's flags don't have severity, all hits collapse to
   "info" and the bars stay empty. review the source determinations.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
