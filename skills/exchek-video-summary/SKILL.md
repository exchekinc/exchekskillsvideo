---
name: exchek-video-summary
description: Render an audit-ready compliance video summary (MP4) from any exchekskills JSON sibling output. Auto-detects the right template (risk-triage, classification, red-flag, compliance-report-card) from the source skill name. Use when the user wants a video version of an existing ExChek report, an executive briefing video, or a shareable summary for clients or stakeholders. The .docx remains the audit-of-record; the video is a summary visualization.
compatibility: Claude Code, Claude desktop, Claude CoWork, Claude web
---

# exchek-video-summary

## Purpose
Turn the structured JSON sibling that every ExChekSkills report emits
(`<basename>.json`, schema 1.0.0) into a 6–12 second branded MP4 suitable for
executive briefings, client deliverables, or compliance training libraries.

This skill is a thin orchestration layer over the
[`scripts/report-to-video.mjs`](../../scripts/report-to-video.mjs) bridge in
this repo, which itself wraps HeyGen HyperFrames.

## When to invoke
- "Make a video summary of my last risk triage report"
- "Render an MP4 from `~/Documents/ExChek-Reports/ExChek-...json`"
- "I need an executive briefing video of this classification"
- "Create a shareable video version of the red-flag assessment"

## Inputs
1. **Required** — path to an ExChekSkills JSON sibling file (the one that
   lives next to the .docx output of any other exchekskills skill).
2. **Optional** — explicit template override
   (`risk-triage`, `classification`, `red-flag`, `compliance-report-card`,
   `training`).
3. **Optional** — output path. Default is `renders/<basename>.mp4` in this
   repo, or wherever the user's `~/Documents/ExChek-Reports` is configured.
4. **Optional** — format (`mp4`, `webm`, `mov`), fps (`24|30|60`), quality
   (`draft|standard|high`).

## Steps

### Step 0 — CUI / classified gate
Inherit from upstream `exchekskills`: refuse if the report's
`cui_check.cui` or `cui_check.classified` is true and `on_prem_required` is
true. Video output is intended for executive consumption, not classified
material.

### Step 0.5 — Narration preflight (ElevenLabs)

Before any rendering, decide narration vs silent and resolve credentials
**up front** so the user isn't surprised mid-render.

**Step 0.5a — ask the user (only on first run per session):**

> "ExChek videos can be rendered silent or with ElevenLabs narration.
> Narrated videos are ~10× more shareable for executive briefings. Want
> me to set up ElevenLabs now? (yes / silent / what does it cost?)"

If they say *silent*, jump to step 1 with `--no-audio` queued.

If they say *yes*, run the detection in 0.5b. If they ask about cost,
quote ~1 cent per video (see
[`references/elevenlabs-setup.md`](references/elevenlabs-setup.md)) and
ask again.

**Step 0.5b — detect what's available:**

```javascript
// Pseudocode for the skill loop, not literal:
if (mcp_tool_available("mcp__ElevenLabs_Player__generate_tts")) {
  // Connector / MCP is wired up. Proceed.
  narration = "elevenlabs-mcp";
} else if (process.env.ELEVENLABS_API_KEY) {
  // Local key. Skill will use direct REST API call.
  narration = "elevenlabs-direct";
} else {
  // Nothing wired. Tell the user how, then halt.
  narration = "needs-setup";
}
```

**Step 0.5c — if `needs-setup`, prompt by surface:**

The runtime determines which message to show:

- **Claude.ai web / Claude CoWork:**

  > "I need ElevenLabs to generate narration. In the sidebar:
  > **Connectors → ElevenLabs → Connect**. Then come back and say 'ready'.
  > Or say 'silent' to render without narration."

- **Claude Code CLI / Claude desktop (local):**

  > "I need ElevenLabs to generate narration. Either:
  > 1. Set `ELEVENLABS_API_KEY=sk_...` in your shell, or
  > 2. Install the MCP: `claude mcp add elevenlabs npx -y @elevenlabs/elevenlabs-mcp --env ELEVENLABS_API_KEY=sk_...`
  >
  > Then say 'ready'. Or say 'silent' to render without narration."

**Do not proceed to step 1 until the user picks one of: configured, silent, or cancel.**
This is the central UX requirement — the user should never get partway
through a render and find out they need to install something.

### Step 0.6 — Generate narration audio (only if narration enabled)

Get the script the bridge will read:

```bash
node scripts/report-to-video.mjs <report.json> --audio-script-only
```

Show the script to the user, ask to confirm or edit. Once approved,
generate the audio:

- **MCP path** — call `mcp__ElevenLabs_Player__generate_tts` with the
  approved script, save to `~/.cache/exchek/vo-<input_hash>.wav`.
- **Direct API path** — POST to `api.elevenlabs.io/v1/text-to-speech/<voice_id>`
  with the script, save to the same cache path.

The cache is keyed on `input_hash`, so re-renders of the same report
reuse the audio (deterministic).

### Step 1 — Locate the JSON
If the user names a skill but not a file, look in their configured ExChek
output folder (default `~/Documents/ExChek-Reports`) for the most recent
matching `ExChek-<Kind>-YYYY-MM-DD-*.json`. Confirm the chosen file with
the user before rendering.

### Step 2 — Pick the template
Run the bridge in dry-run mode first to confirm template auto-selection:
```bash
node scripts/report-to-video.mjs <report.json> --dry-run
```
This writes `.tmp/<template>-resolved.html` so the user can sanity-check the
mapping without burning a render. Show the user the chosen template; offer
the four named templates if they want to override.

### Step 3 — Render
With narration:
```bash
node scripts/report-to-video.mjs <report.json> \
  --audio-file ~/.cache/exchek/vo-<input_hash>.wav \
  [--template <name>] [--output <path>]
```

Silent:
```bash
node scripts/report-to-video.mjs <report.json> --no-audio \
  [--template <name>] [--output <path>]
```

On a typical workstation this takes 15–60 seconds depending on quality.
Surface the HyperFrames render output to the user; do not silently swallow
warnings.

### Step 4 — Pair with the audit-of-record
Always remind the user that the `.docx` is the document of record per
15 CFR § 762.6. The MP4 is a summary visualization; it does not satisfy
recordkeeping on its own. Place the MP4 in the same folder as the source
`.docx`/`.json` pair so they travel together.

### Step 5 — Privacy attestation (inherited)
The video inherits the source report's `privacy_attestation` block. Do not
upload the MP4 to a third-party hosting service without confirming the
user's tier permits it.

## Outputs
- `<basename>.mp4` — the rendered video.
- The original `.docx` and `.json` remain unchanged.

## Failure modes
- **`hyperframes` not installed** → run `npx --yes hyperframes doctor` and
  surface the diagnostic.
- **FFmpeg missing** → `brew install ffmpeg` (macOS) or the platform
  equivalent.
- **Template auto-selection wrong** → use `--template` to override; templates
  are listed in `templates/`.
- **Headline reads weirdly** → use `--headline "..."` and `--subhead "..."`
  to override the auto-derivation.

## Compatibility note
Designed for Claude Code first; also runnable on Claude desktop and CoWork.

- **Claude Code / Claude desktop (local)** — full render path. Requires
  Node ≥22 and FFmpeg locally; HyperFrames brings Chromium via Puppeteer.
- **Claude CoWork (sandbox)** — invocation works, but the render step's
  native dependencies (FFmpeg, Chromium) are not reliably present. The
  bridge auto-detects this and switches to **bundle mode**: it writes a
  portable `renders/bundle-<basename>/` folder containing the resolved
  composition, a manifest, the source report, and `RENDER.md` instructions.
  The user downloads the folder and renders it on any host with FFmpeg.
  See [`references/cowork.md`](references/cowork.md) for the full workflow.

If auto-detection guesses wrong, force a path with `--force-bundle` or
`--force-render`.
