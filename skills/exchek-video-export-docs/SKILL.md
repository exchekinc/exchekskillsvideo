---
name: exchek-video-export-docs
description: Render an export-documentation readiness video (MP4) from an exchek-export-docs JSON sibling. Three document cards in a row — Commercial Invoice, Shipper's Letter (SLI), and AES filing — each populated with key fields and a status badge (READY / DRAFT / TODO). Use when the user wants a quick audit-ready packet preview before vessel sailing or AES submission.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-export-docs

Specialized wrapper that forces the `export-docs` template — three
document cards (Commercial Invoice, SLI, AES Filing) in a row, each
populated from the source determinations.

## When to invoke
- "Make a video showing the export packet is ready for the Vossberg shipment"
- "I need a 30-second briefing for the carrier on what we filed"
- "Render the export-documents pack as an MP4 deliverable"

## Inputs
1. Path to an `exchek-export-docs` JSON sibling.

## Steps
1. CUI gate (inherited).
2. Narration preflight (inherited). Useful for sharing the packet via
   Slack/email where viewers may not click into the .docx.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template export-docs \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. The three cards inherit a single status badge (`status` determination
   on the source). For per-document statuses, use determinations named
   like "Commercial Invoice status", "SLI status", "AES status" — the
   template will surface them.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
