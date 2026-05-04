---
name: exchek-video-risk-triage
description: Render a focused risk-triage executive briefing video (MP4) from an exchek-risk-triage JSON sibling. Animated risk gauge, top determinations, flagged indicators, and regulatory citations in a 9-second branded summary. Use when the user has a risk triage report and wants a shareable executive video, an escalation briefing, or a stakeholder summary.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-risk-triage

## Purpose
A specialized wrapper around `exchek-video-summary` that forces the
`risk-triage` template, shapes the headline around the overall risk
classification, and emphasizes the escalation recommendation.

## When to invoke
- "Make an exec briefing video for this risk triage"
- "I need a 30-second escalation video for legal"
- "Render the latest risk-triage report as a video"

## Inputs
1. Path to an `exchek-risk-triage` JSON sibling.
2. Optional `--risk` override (`low|medium|high`) if the user wants to
   force the gauge for a hypothetical.

## Steps
1. Inherit step 0 (CUI gate) AND step 0.5 (ElevenLabs narration preflight)
   from [`exchek-video-summary`](../exchek-video-summary/SKILL.md). The
   preflight asks the user about narration up-front and walks them
   through connector / API-key setup if they want it. Do not skip
   straight to render. the user should never discover mid-pipeline that
   they need to install something.
2. Confirm the JSON skill name is `exchek-risk-triage` or
   `exchek-compliance-report` (acceptable substitute). Warn otherwise.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template risk-triage \
     [--risk <level>] [--output <path>]
   ```
4. Surface the animated risk gauge level explicitly to the user:
   "Rendered with overall risk: HIGH" so they catch any mismatch with
   the underlying determination.
5. Pair the MP4 with the source `.docx` in the same folder.

## Outputs
- `<basename>.mp4` (default: `renders/<basename>.mp4`)

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md). the generic
  variant that auto-selects template.
