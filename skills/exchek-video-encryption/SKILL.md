---
name: exchek-video-encryption
description: Render an encryption-controls briefing video (MP4) from an exchek-encryption JSON sibling. Animated ECCN reveal (5A992 / 5D992 etc.) with ENC notification status, mass-market eligibility, and semi-annual reporting cards. Use when the user wants a visual briefing of an encryption classification under 15 CFR 740.17.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-encryption

Specialized wrapper that forces the `encryption` template — large
animated ECCN code reveal, supported by three status cards (ENC
notification, mass-market eligibility, semi-annual report) with
color-coded badges (ok / warn / todo).

## When to invoke
- "Make a video of my latest encryption determination"
- "I need an ENC compliance briefing for the security review board"
- "Render the 5A992 classification as an MP4 with the mass-market status"

## Inputs
1. Path to an `exchek-encryption` JSON sibling.

## Steps
1. CUI gate (inherited from `exchek-video-summary`).
2. Narration preflight (inherited): for encryption topics, narration is
   highly recommended — the spelled-out ECCN ("5 A 992 dot c") reads
   far more naturally than viewers can scan it.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template encryption \
     [--audio-file ~/.cache/exchek/vo-<input_hash>.mp3] [--output <path>]
   ```
4. Verify the ENC notification status badge matches your records — a
   mismatch usually means the source determination's label didn't match
   the regex `/notification|notify/i`. Override with `--headline` or
   re-tag the source determination.

## Outputs
- `<basename>.mp4`

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
