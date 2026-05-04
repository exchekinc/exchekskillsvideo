---
name: exchek-video-partner-compliance
description: Render a distributor / partner flow-down compliance video (MP4) from an exchek-partner-compliance JSON sibling. Partner card with name + country + status + last-review + re-screen-due, alongside a flow-down checklist (EUC, distributor flow-down agreement, annual screening, sanctions watchlist re-check, training acknowledgement, ECP attestation) with per-item green/amber/red checks. Use when the user wants to brief a partner on their compliance status, prep a vendor business review, or surface stale flow-down items before a contract renewal.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-partner-compliance

Specialized wrapper that forces the `partner-compliance` template —
partner identity card on the left + flow-down checklist on the right.

## When to invoke
- "Make a compliance briefing video for our annual review with Vossberg"
- "I need a flow-down status video to send the distributor before contract renewal"
- "Render the partner-compliance summary for the QBR"

## Inputs
1. Path to an `exchek-partner-compliance` JSON sibling.

## Steps
1. CUI gate (inherited).
2. Narration preflight (inherited). Strongly recommended for partner-
   facing deliverables — the partner name reads first, status second.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template partner-compliance \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. The checklist tries to match six standard flow-down items by name
   prefix in the source determinations. If your source uses different
   field names, the template falls back to using the first 4
   determinations as checklist rows.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
