---
name: exchek-video-ecp
description: Render an Export Compliance Program (ECP) maturity video (MP4) from an exchek-ecp JSON sibling. Big purple maturity-grade tile + an 8-element coverage grid based on BIS guidance (management commitment · risk assessment · authorization · recordkeeping · training · audits · reporting violations · corrective actions), each with a per-element progress bar color-coded green/amber/red. Use when the user wants a board-level ECP review video or a leave-behind for executive sponsorship of compliance.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-ecp

Specialized wrapper that forces the `ecp` template — large overall
maturity grade tile + an 8-element coverage grid mapping to BIS's
ECP guidance (15 CFR 732 Supp. 2).

## When to invoke
- "Make a video summary of our annual ECP review for the board"
- "I need an executive briefing on our compliance program maturity"
- "Render the ECP review video to send to senior management"

## Inputs
1. Path to an `exchek-ecp` JSON sibling. Determinations should include
   the eight ECP element names (or close variants) so the template can
   match them — the data-mapper does fuzzy matching on the first word
   of each element name.

## Steps
1. CUI gate (inherited).
2. Narration preflight (inherited). For a board-level deliverable,
   narration is recommended — the spoken summary surfaces the maturity
   grade and top gap right at the start.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template ecp \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. Per-element coverage is read from the determination's `confidence`
   field if present, else parsed as a percentage from the `value`
   string. Elements scoring < 50% are flagged red; 50-74% amber; 75%+
   purple/green.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
