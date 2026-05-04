# ElevenLabs setup (narration)

ExChek video skills can render either **silent** or **narrated**. Narration
goes through ElevenLabs because it handles regulatory/legalese pronunciation
better than browser TTS and produces audio that travels well over Slack and
LinkedIn. This doc is the canonical setup walkthrough. both the SKILL.md
preflight and CLI users should land here.

## Decision: which surface are you on?

| Surface | What "configured" means | One-click? |
|---|---|---|
| **Claude.ai web (Code or CoWork)** | ElevenLabs **connector** added under Connectors | Yes |
| **Claude desktop / Claude Code CLI (local)** | `ELEVENLABS_API_KEY` env var **or** the ElevenLabs MCP plugin | No, one-time |
| **Claude CoWork (sandbox)** | ElevenLabs connector added at workspace level | Yes |

The SKILL.md preflight will tell you which path applies. it detects the
runtime first.

## Path 1. Claude.ai web / Claude CoWork (connector)

1. In the Claude web/desktop sidebar, open **Connectors**.
2. Find **ElevenLabs** in the directory. Click **Connect**.
3. Authenticate with your ElevenLabs account; pick a default voice (we
   recommend a calm professional read. `Adam`, `Rachel`, or your
   organization's brand voice).
4. Return to your Claude conversation. The skill will detect
   `mcp__ElevenLabs_Player__generate_tts` is now available and proceed.

You only do this once per workspace. CoWork connectors persist across
sessions.

## Path 2. Claude Code CLI / desktop (API key)

You have two options. Either is fine; pick whichever your team uses for
other API keys.

### 2a. API key as an env var (simplest)

```bash
# Ephemeral (this session only):
export ELEVENLABS_API_KEY="sk_..."

# Persistent (recommended):
echo 'export ELEVENLABS_API_KEY="sk_..."' >> ~/.zshrc
source ~/.zshrc
```

The bridge does **not** read this directly. it's read by the ElevenLabs
MCP / by the wrapping skill that calls the TTS API. If you'd rather not
expose the key to the wider shell, use option 2b.

### 2b. ElevenLabs MCP plugin

```bash
claude mcp add elevenlabs npx -y @elevenlabs/elevenlabs-mcp \
  --env ELEVENLABS_API_KEY=sk_...
```

The MCP scopes the key to the Claude process only. Restart your Claude
Code session after install.

Verify with `claude mcp list`. you should see `elevenlabs` in the output.

## Voice selection

The skill defaults to a single professional voice for consistency. If you
want a custom voice:

1. In Claude, ask: "Use ElevenLabs voice `<name>` for the narration."
2. The skill stores this preference at `~/.config/exchek/video.json`
   under `tts.voice` (manual: edit that file).

Voice changes are visual/branding only. they don't affect compliance.

## What gets narrated

The narration is derived deterministically from the source report's
view-model:

| Template | Approx. script |
|---|---|
| `risk-triage` | "Risk triage. Overall risk {level}. {supporting determination}. Recommendation: {first action}." |
| `classification` | "Export classification. Code {ECCN spelled out}. {jurisdiction} jurisdiction. License {required/not required}." |
| `red-flag` | "Red flag assessment. {N} indicators tripped, {M} high severity. {first action}." |
| `compliance-report-card` | "Compliance report card. Overall grade {grade}. Top concern: {first flag}." |
| `training` | "Lesson: {headline}. Key point: {first determination}. Reference: {first CFR}. Next: {first action}." |

To preview the script for any report without rendering:

```bash
node scripts/report-to-video.mjs <report.json> --audio-script-only
```

The exact phrasing lives in `scripts/lib/audio-script.mjs`. The bridge
clamps each script to a per-template word budget so the narration fits the
9-12s motion.

## Privacy considerations

- The narration text inherits the source report's privacy attestation
  tier. **Do not** narrate a CUI/classified report. the TTS provider
  becomes a covered processor, which is out of tier for the standard
  attestation.
- The skill's preflight refuses TTS generation when
  `cui_check.cui` or `cui_check.classified` is true on the source JSON
 . even if ElevenLabs is configured. The skill renders silent in that
  case.

## Cost

ElevenLabs charges per character. A typical 9-second video is ~120
characters of script. under one cent per render at standard tier. Worth
mentioning to whoever owns the ElevenLabs bill before you batch a
training library.
