---
name: exchek-video-training
description: Render a 12-second compliance training lesson video (MP4) from any exchekskills JSON sibling. Lesson-card layout with key points, CFR citation block, and a "what to do next" action list. Use when the user wants to convert a regulatory determination into a training asset, build a library of teachable moments, or onboard new compliance staff with consistent visual material.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-training

## Purpose
Specialized wrapper that forces the `training` template. designed for
internal training libraries rather than exec briefings. Layout emphasizes
the CFR citation and the action list so each video doubles as a quick
reference.

## When to invoke
- "Make a training lesson out of this classification report"
- "Build me a 12-second teachable for the deemed-export memo"
- "Convert the ECP audit findings into onboarding videos"

## Inputs
1. Path to any ExChekSkills JSON sibling.
2. Optional `--headline` to phrase the lesson title pedagogically
   ("When does ENC notification apply?" rather than "5A992 / 5D992").

## Steps
1. CUI gate (inherited from `exchek-video-summary`).
2. Narration preflight (inherited from `exchek-video-summary` step 0.5).
   Training videos are the highest-ROI use case for narration. strongly
   recommend the user enable ElevenLabs unless they specifically want silent.
3. Run:
   ```bash
   node scripts/report-to-video.mjs <report.json> --template training \
     [--headline "..."] [--output <path>]
   ```
4. For a training library, run in batch:
   ```bash
   for f in ~/Documents/ExChek-Reports/*.json; do
     node scripts/report-to-video.mjs "$f" --template training \
       --output "training-library/$(basename "$f" .json).mp4"
   done
   ```

## Outputs
- `<basename>.mp4` per source report.

## See also
- [`exchek-video-summary`](../exchek-video-summary/SKILL.md)
