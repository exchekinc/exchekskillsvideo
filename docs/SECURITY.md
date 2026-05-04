# Security — ExChek Skills Video

Plain-English security model for the SMB manufacturer who owns this
install. No security background assumed.

This is the video-rendering companion to ExChekSkills. It inherits
every protection in the upstream
[`exchekskills` security doc](https://github.com/exchekinc/exchekskills/blob/main/docs/SECURITY.md)
because every video is generated from a `.json` sibling that the upstream
skills already produced and audit-stamped. This document covers what
**this** repository adds on top.

> **One-line summary**: the video render reads your local ExChek `.json`
> reports, optionally calls one or two external AI vendors (ElevenLabs,
> HeyGen) for narration/avatars when you ask it to, and writes a `.mp4`
> next to the source `.docx`. The `.docx` remains the audit-of-record.

---

## What this plugin can and cannot do on your machine

- It can **read** the `.json` and `.docx` files in your ExChek output
  folder (default `~/Documents/ExChek-Reports`).
- It can **write** finished `.mp4` files to the folder you point it at
  (default `renders/` in this repo, or wherever you pass `--output`).
- It can **launch a local headless Chrome / Chromium** (via
  HyperFrames + Puppeteer) to render the HTML composition to frames.
  This Chrome instance is bound to localhost and lasts the duration of
  the render.
- It can **call up to two third-party APIs**, but only when you opt in:
    - **ElevenLabs** for narration (when `--audio-file` is requested or
      a video skill's narration preflight is accepted).
    - **HeyGen Avatar API** for talking-head avatars (planned v0.4).
- It cannot install other software, change your system settings, or
  send your data anywhere else without your explicit opt-in.

---

## What changed vs. upstream `exchekskills`

The upstream skills make exactly two outbound calls — `www.ecfr.gov`
and `data.trade.gov`. This repo is more permissive **only when you ask
for narration or avatars**:

| Capability                     | Outbound call?            | Triggered by                                   |
|--------------------------------|--------------------------|------------------------------------------------|
| Render silent MP4              | None                     | default                                        |
| Render narrated MP4            | ElevenLabs API           | `--audio-file` or skill narration preflight    |
| Render with avatar (v0.4)      | HeyGen Avatar API        | `--avatar` flag or skill avatar preflight      |
| HyperFrames CLI install        | npm registry             | first `npm install`                            |
| Puppeteer Chromium auto-fetch  | googleapis.com (storage) | first `npx hyperframes` invocation             |

If you want **zero third-party calls beyond upstream's two**, render
silent (`--no-audio`) and skip avatars. The render pipeline does
everything else locally.

---

## Where your data lives

Same convention as upstream — owner-only files, deletable on uninstall.
This repo adds two cache directories you should know about:

| OS                          | Path                                                                  | What's there                                |
|-----------------------------|-----------------------------------------------------------------------|---------------------------------------------|
| macOS (Cowork)              | `~/Library/Application Support/Claude-3p/plugins/data/exchekskillsvideo-*/` | Plugin runtime data (mirrors upstream)      |
| macOS (Claude Code)         | `~/.claude/plugins/data/exchekskillsvideo-*/`                         | Plugin runtime data (mirrors upstream)      |
| Windows                     | `%LOCALAPPDATA%\Claude-3p\plugins\data\exchekskillsvideo-*\`           | Plugin runtime data (mirrors upstream)      |
| **All OS — narration cache**| `~/.cache/exchek/vo-<input_hash>.mp3`                                | Cached ElevenLabs audio (per source report) |
| **All OS — temp render dir**| `$TMPDIR/exchekvideo-<rand>/`                                         | The resolved `index.html` + audio for one render. Auto-deleted on success; left intact on failure for inspection. |

Files are owner-only (`0600` for keys, `0644` for non-secret artifacts).
Other accounts on the same machine cannot read them.

The narration cache is **content-addressed by the source report's
`input_hash`**. That means: same source `.json` always reuses the same
audio. Re-rendering the same report does not re-charge ElevenLabs.

If you uninstall the plugin, the runtime data folder is deleted unless
you pass `--keep-data`. The `~/.cache/exchek/` audio cache is **not**
deleted automatically — clear it with `rm -rf ~/.cache/exchek` if you
want to invalidate cached narrations or revoke any audio that was
generated for a sensitive report.

---

## What ElevenLabs receives (and what it doesn't)

When narration is enabled, the bridge derives a short script from the
source report's view-model and POSTs it to `api.elevenlabs.io`. What
gets sent:

- **The narration script** — typically 15–35 words. Examples:
    - Risk-triage: `Risk triage. Overall risk Medium. Hold for review. Recommendation: Request signed end-use certificate from Acme Robotics GmbH.`
    - Classification: `Export classification. Code 6 A 993 dot a. EAR jurisdiction. License No (NLR).`
- **A voice ID and model ID** (e.g., `EXAVITQu4vr4xnSDxMaL` + `eleven_turbo_v2_5`).

What is **not** sent:

- The full `.docx` audit report.
- The full source `.json` (no privacy attestation, no input hash, no
  CFR pull timestamps).
- The brand bar metadata (skill name, model, hash) shown in the video.
- Customer or consignee details that are not present in the user-visible
  determinations / actions / flags rendered on screen.

You can preview exactly what would be sent before any TTS call by
running:

```bash
node scripts/report-to-video.mjs <report.json> --audio-script-only
```

This prints the script to stdout and exits without making any network
calls. Use this to confirm nothing sensitive is about to be exfiltrated.

### CUI / classified gate

If the source report has `cui_check.cui` or `cui_check.classified` set
to true, the skill-layer narration preflight **refuses to submit the
script to ElevenLabs**. The video renders silent, with a note in the
report-to-video output explaining why. This refusal is enforced even if
the user explicitly opts in.

---

## Prompt injection — inherited defenses

Every report this video tool consumes was already produced by upstream
`exchekskills`, which:

1. Sanitizes input (zero-width, RTL, control, look-alike chars stripped
   before the AI reasons on it).
2. Cannot have its CUI gate bypassed, even by hostile pasted content.
3. Stamps every report with an AI-disclosure block.

The video skills add one defense on top: every rendered video shows
an **AI disclaimer** in ExChek purple at the bottom of the frame —
"AI can make mistakes — please double-check responses" — followed by
the regulatory pointer back to the `.docx` audit-of-record. This is
hard-coded in the brand layer; templates cannot suppress it.

---

## Audit-log integration

This repo does not maintain its own audit log. Every render writes
the source report's `input_hash` and `docx_basename` into the
HyperFrames bundle manifest (when `--bundle` is used) and into the
brand bar of the rendered MP4. Together, these allow a downstream
auditor to:

1. Read the `input_hash` shown on the rendered video.
2. Find the matching entry in the upstream ExChek audit log.
3. Re-render the bundle to verify the MP4 reproduces byte-for-byte
   (modulo FFmpeg encoder version).

If the chain breaks — `input_hash` on the video doesn't match any
audit entry, or re-rendering produces a different MP4 — that's a
signal worth investigating.

---

## Trade.gov API key — same as upstream

Inherits upstream's keychain handling. This repo doesn't read or write
the Trade.gov key.

## ElevenLabs API key — handling

If you choose to enable narration:

- **Claude Code CLI** — store the key in your shell profile
  (`export ELEVENLABS_API_KEY=sk_...`) **or** install the
  ElevenLabs MCP plugin (`claude mcp add elevenlabs npx -y
  @elevenlabs/elevenlabs-mcp --env ELEVENLABS_API_KEY=sk_...`).
  The MCP plugin scopes the key to the Claude process and never
  exposes it to your shell history.
- **Claude.ai web / CoWork** — add the **ElevenLabs connector** in the
  sidebar. The connector handles auth; no key passes through your
  workspace files.

The bridge layer (`scripts/report-to-video.mjs`) **never reads the API
key directly**. It only consumes a finished audio file via
`--audio-file`. The TTS call is always made by the skill orchestration
layer (or the user, via shell). This separation keeps the bridge
narration-agnostic and prevents key handling from creeping into
committed code.

## HeyGen API key — handling (planned v0.4)

When the avatar feature ships, it will follow the same pattern as
ElevenLabs above. Same keychain / MCP / connector options, same
bridge-layer separation.

---

## Render-time security considerations

- HyperFrames runs **headless Chromium** during render. This Chromium
  instance binds to localhost only, lasts the duration of the render
  (typically 8–15 seconds), and has no persistent profile. It can
  load remote assets that the composition references (e.g.,
  `cdn.jsdelivr.net` for GSAP). The bundled templates only load GSAP
  from CDN; if you author a custom template that loads from elsewhere,
  consider whether you want that resource auditable.
- The resolved `index.html` written to `$TMPDIR/exchekvideo-*/` may
  contain the full source view-model (determinations, flags, citations)
  inlined as `window.__hfData`. On render success the temp dir is
  deleted. On failure it is **left intact** so you can debug. Clean it
  up manually if it contained sensitive content:
  `rm -rf /tmp/exchekvideo-*` (macOS).
- The render's `.mp4` output inherits the privacy posture of the source
  report. **Do not upload the MP4 to a third-party hoster** without
  confirming the source report's `privacy_attestation.tier` permits it.

---

## Things you should still do

- **Read the report before publishing the video.** The video summarizes
  4–5 fields from a 5–15 page audit document. If you wouldn't put the
  determination in the lobby of your office, don't put it in a 9-second
  video.
- **Review the narration script before TTS.** `--audio-script-only`
  prints what will be spoken. The 22-word budget is short; check that
  it doesn't accidentally include something you'd rather not have
  read aloud.
- **Keep your AI tier honest.** The video skills inherit upstream's
  privacy attestation. If you switched tiers since the source report
  was produced, regenerate the source first.
- **Clear `~/.cache/exchek/`** when revoking access to a sensitive
  report. Cached audio is not automatically invalidated.
- **Rotate the audit key** if you ever suspect the machine was
  compromised. (Inherited from upstream.)

---

## Reporting a security issue

Email `matt@exchek.us`. Do not file a public GitHub issue for security
problems.
