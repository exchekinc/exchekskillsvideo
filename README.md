# exchekskillsvideo

**Branded, narrated, audit-traceable compliance videos — generated from
the same `.json` audit your `.docx` already lives next to.**

The video-rendering companion to
[`exchekskills`](https://github.com/exchekinc/exchekskills). Reads the
schema-1.0.0 JSON sibling that every ExChek skill emits, picks an
HTML template, and renders an MP4 using
[HeyGen HyperFrames](https://github.com/heygen-com/hyperframes).
Optionally narrates the result via ElevenLabs.

> The `.docx` from `exchekskills` remains the audit-of-record per
> 15 CFR § 762.6. The `.mp4` rendered here is a summary visualization
> for executives, clients, training, incident channels, and customer
> deliverables. It supplements the audit document; it does not replace
> it.

---

## At a glance

| What | Where | Notes |
|---|---|---|
| 5 video templates | [`templates/`](templates) | risk-triage · classification · red-flag · compliance-report-card · training |
| 5 Claude skill wrappers | [`skills/`](skills) | One generic + four template-specific, all carry the same SKILL.md preflight |
| Bridge CLI | [`scripts/report-to-video.mjs`](scripts/report-to-video.mjs) | Reads JSON sibling → renders MP4 |
| Batch script | [`scripts/render-all-narrated.sh`](scripts/render-all-narrated.sh) | Batch all 5 demos with ElevenLabs narration |
| Roadmap | [ROADMAP.md](ROADMAP.md) | Captions (v0.2) · Portrait (v0.3) · **HeyGen avatars (v0.4)** · more |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full data flow + view-model contract |
| Security model | [docs/SECURITY.md](docs/SECURITY.md) | Plain-English; what we send to ElevenLabs and what we don't |
| License | [LICENSE.md](LICENSE.md) | ExChek proprietary (canonical from upstream) + third-party addendum |

---

## The five video skills

Every skill wraps the same bridge — the difference is template selection,
preflight messaging, and the use case it's designed for.

| Skill | Template | Length | Best for |
|---|---|---|---|
| [`exchek-video-summary`](skills/exchek-video-summary/SKILL.md) | auto-detect | 9–12s | Generic — pick the right template from the source skill name |
| [`exchek-video-risk-triage`](skills/exchek-video-risk-triage/SKILL.md) | risk-triage | ~9s | Executive briefing of a transaction risk determination |
| [`exchek-video-classification`](skills/exchek-video-classification/SKILL.md) | classification | ~9s | ECCN/USML reveal for customer or internal review |
| [`exchek-video-red-flag`](skills/exchek-video-red-flag/SKILL.md) | red-flag | ~9s | High-contrast indicator alert for compliance channels |
| [`exchek-video-training`](skills/exchek-video-training/SKILL.md) | training | ~12s | Lesson-card layout for an onboarding/training library |

All five share a consistent ExChek-branded look: white background, black
display headlines (Outfit), ExChek purple `#411992` accent, the actual
ExChek logo in the brand bar, and an AI disclaimer + audit-of-record
pointer in the footer.

---

## How it fits the upstream audit chain

```
┌──────────────────────────┐      ┌──────────────────────────┐
│ exchekskills (upstream)  │      │ exchekskillsvideo         │
│                          │      │                           │
│ skill executes           │  →   │ scripts/report-to-video   │
│   ↓                      │      │   ↓                       │
│ ExChek-<Kind>-<date>.docx│  →   │ ExChek-<Kind>-<date>.mp4  │
│ ExChek-<Kind>-<date>.json│  ↗   │   (sibling MP4)           │
└──────────────────────────┘      └──────────────────────────┘
   audit-of-record                  summary visualization
```

The `.json` sibling that `exchekskills` writes for every report is
this repo's input contract. We never modify the source `.docx` or
`.json`; we only emit a new `.mp4` next to them. The video carries the
source `input_hash` in its brand bar, so any auditor can trace the
visualization back to the audit-of-record.

---

## Install

Requires **Node.js ≥ 22** and **FFmpeg**.

```bash
# macOS prerequisites
brew install ffmpeg

# Clone + install
git clone https://github.com/exchekinc/exchekskillsvideo.git
cd exchekskillsvideo
npm install                # pulls hyperframes; Puppeteer downloads Chromium on first use

# Verify
npx hyperframes doctor     # should report ffmpeg, ffprobe, chrome all green
npm test                   # smoke test, no FFmpeg invocation
```

For Claude CoWork installs (sandboxed cloud workspace where FFmpeg/
Chromium aren't available), the bridge auto-falls-back to **bundle
mode** — produces a portable folder you download and render elsewhere.
See [`skills/exchek-video-summary/references/cowork.md`](skills/exchek-video-summary/references/cowork.md).

---

## Quickstart

### Render a bundled demo

```bash
npm run render:risk-triage
# → renders/risk-triage-demo.mp4 (silent)
```

### Render any ExChekSkills report

```bash
node scripts/report-to-video.mjs \
  ~/Documents/ExChek-Reports/ExChek-RiskTriage-2026-05-04-AcmeCo.json
```

The bridge auto-selects a template from the source skill name. Override
explicitly:

```bash
node scripts/report-to-video.mjs report.json \
  --template classification \
  --output briefings/acme-classification.mp4 \
  --quality high \
  --fps 60
```

### Render with narration (requires ElevenLabs key)

The bridge stays narration-agnostic — the **caller** generates the audio,
the bridge consumes a finished file. The Claude skills handle this for
you via the ElevenLabs MCP/connector. From the shell:

```bash
# 1. Preview what will be narrated
node scripts/report-to-video.mjs report.json --audio-script-only

# 2. Generate audio (ElevenLabs REST API)
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"...","model_id":"eleven_turbo_v2_5"}' \
  --output ~/.cache/exchek/vo-<input_hash>.mp3

# 3. Render
node scripts/report-to-video.mjs report.json \
  --audio-file ~/.cache/exchek/vo-<input_hash>.mp3 \
  --output renders/narrated.mp4
```

Or use the bundled batch script for all five fixtures:

```bash
ELEVENLABS_API_KEY=sk_... bash scripts/render-all-narrated.sh
# → renders/{risk-triage,classification,red-flag,compliance-report-card,training}-narrated.mp4
```

### Other modes

| Mode | Flag | What you get |
|---|---|---|
| Dry-run | `--dry-run` | Resolved composition HTML in `.tmp/` for inspection; no render |
| Studio preview | `--preview` | Opens HyperFrames studio at `localhost:3002`; no MP4 |
| Bundle (CoWork) | `--bundle <dir>` or `--force-bundle` | Portable folder + RENDER.md instructions |
| Force render | `--force-render` | Render even if env-detect recommends bundle |

`--help` for the full surface area.

---

## How it works

```
report.json (schema 1.0.0)
   │
   ▼
scripts/lib/data-mapper.mjs    →  view-model { brand, meta, headline,
   │                                            risk, determinations,
   │                                            flags, citations,
   │                                            actions, audio? }
   ▼
scripts/lib/template-loader.mjs
   ├─ reads templates/<name>/composition.html
   ├─ inlines templates/shared/{styles.css, brand.js, logo.svg}
   ├─ {{token}} substitution (HTML-escaped)
   └─ injects window.__hfData = {...} blob
   │
   ▼
scripts/lib/hyperframes-runner.mjs
   ├─ writes resolved HTML to $TMPDIR/exchekvideo-*/index.html
   ├─ copies optional audio file alongside as vo.<ext>
   └─ spawns `npx hyperframes render` → MP4
```

Determinism: same input JSON → same MP4, byte-for-byte (modulo FFmpeg
encoder version). The source `input_hash` is preserved through every
layer and stamped into the rendered video.

Full data flow + view-model contract in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Voice (ElevenLabs)

Currently shipping. Five-second summary:

- The skill layer asks the user up-front (preflight) whether they want
  narration, and walks them through ElevenLabs setup if needed.
- Once configured, the skill calls the ElevenLabs MCP/connector or REST
  API with a derived narration script (~22 words for 9-second templates,
  ~32 for the 12-second training template). Cost: ~1¢ per video.
- The bridge muxes the resulting audio into the rendered MP4 as
  AAC stereo at 192 kbps.
- Audio is cached at `~/.cache/exchek/vo-<input_hash>.mp3`. Same source
  report → same audio, no extra ElevenLabs charges on re-render.
- CUI / classified material: refused at the skill preflight; renders
  silent in those cases.

Setup walkthrough: [`skills/exchek-video-summary/references/elevenlabs-setup.md`](skills/exchek-video-summary/references/elevenlabs-setup.md).

---

## Avatars (HeyGen) — v0.4

Talking-head avatars composited over the existing branded layout.
Detailed scope in [ROADMAP.md → v0.4](ROADMAP.md#v04--heygen-avatars-target-when-first-customer-asks).
Summary:

- Vendor: HeyGen (same auth as HyperFrames, single bill, best-in-class
  lip-sync as of 2026-Q1).
- New CLI flags: `--avatar <id>`, `--avatar-position {br|bl|tr|tl}`,
  `--avatar-size <px>`.
- Cache key: `~/.cache/exchek/avatar-<input_hash>-<voice_id>-<avatar_id>.mov`.
- Cost gate: bridge prints estimated HeyGen cost (~$0.30–$1 per minute)
  before generation; refuses to proceed without confirmation when cost
  > $1 per render.
- Audit reproducibility: manifest grows an `avatar_provenance` block
  recording the HeyGen `video_id`.
- Same CUI/classified gate as ElevenLabs.

Build effort: ~4 days total (integration + cost-gate UX + caching).
Ships when first customer requests it.

---

## CoWork (Claude's sandboxed cloud workspace)

CoWork has Node but doesn't reliably have FFmpeg or Chromium, so direct
render isn't possible there. The bridge auto-detects this and switches
to **bundle mode**:

```
renders/bundle-<basename>/
├── index.html          ← fully resolved, self-contained composition
├── manifest.json       ← render hints + provenance (input_hash, etc.)
├── source.json         ← copy of the source report for traceability
└── RENDER.md           ← step-by-step instructions for offline render
```

The user downloads the folder and runs the one-line `npx hyperframes
render` command from `RENDER.md` on a host with FFmpeg installed. The
bundle preserves `input_hash`, so the eventual MP4 is reproducible —
matters for audit re-runs.

Force the choice with `--force-bundle` or `--force-render` if the
auto-detection guesses wrong.

---

## Compliance scope

- The `.docx` from `exchekskills` is the **audit-of-record** under
  15 CFR § 762.6. The `.mp4` is a derivative summary visualization,
  not a recordkeeping substitute.
- The MP4 inherits the source report's privacy attestation tier — do
  not upload to third-party hosters without confirming the tier permits
  it (see [docs/SECURITY.md](docs/SECURITY.md)).
- CUI / classified material is gated at the skill layer. If the source
  JSON's `cui_check.cui` or `cui_check.classified` is true, narration
  is refused and the bridge can be configured to refuse render
  altogether (default behavior is render-silent + flag).
- Every video carries the AI disclaimer "AI can make mistakes — please
  double-check responses" hard-coded in the brand layer. Templates
  cannot suppress it.
- Every video shows the source report's `input_hash` in the brand bar
  for forward auditability.

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full picture. Next milestones:

- **v0.2** — Captions (mute-friendly, accessibility, SRT sidecar)
- **v0.3** — Portrait + square aspect variants for Slack / mobile / Reels
- **v0.4** — HeyGen avatars (talking-head over the motion-graphic layout)
- **v0.5** — Templates for the 7 remaining ExChekSkills (deemed-export,
  ECP, encryption, recordkeeping, audit-lookback, partner-compliance,
  encryption)
- **v0.6** — Native batch mode for training-library generation
- **v0.7** — Hosted render service (closes the CoWork bundle hand-off)
- **v0.8** — Multi-language narration

---

## Repo layout

```
exchekskillsvideo/
├── README.md ROADMAP.md CHANGELOG.md CONTRIBUTING.md LICENSE.md
├── docs/
│   ├── ARCHITECTURE.md         ← data flow, view-model contract, failure modes
│   └── SECURITY.md             ← what we send to third parties (and don't)
├── package.json marketplace.json .nvmrc .gitignore
├── scripts/
│   ├── report-to-video.mjs     ← CLI entrypoint
│   ├── render-all-narrated.sh  ← batch all 5 with ElevenLabs
│   └── lib/
│       ├── brand.mjs           ← brand tokens (single source of truth)
│       ├── data-mapper.mjs     ← schema-1.0.0 JSON → stable view-model
│       ├── template-loader.mjs ← {{tokens}} + window.__hfData + logo inline
│       ├── hyperframes-runner.mjs ← npx hyperframes wrapper
│       ├── env-detect.mjs      ← FFmpeg/Chromium/CoWork detection
│       ├── bundle.mjs          ← portable bundle for offline render
│       ├── audio-script.mjs    ← per-template narration script derivation
│       └── audio-probe.mjs     ← ffprobe duration reader
├── templates/
│   ├── shared/{styles.css, brand.js, logo.svg}
│   ├── risk-triage/composition.html
│   ├── classification/composition.html
│   ├── red-flag/composition.html
│   ├── compliance-report-card/composition.html
│   └── training/composition.html
├── skills/
│   ├── exchek-video-summary/{SKILL.md, skill.yaml, references/}
│   ├── exchek-video-risk-triage/{SKILL.md, skill.yaml}
│   ├── exchek-video-classification/{SKILL.md, skill.yaml}
│   ├── exchek-video-red-flag/{SKILL.md, skill.yaml}
│   └── exchek-video-training/{SKILL.md, skill.yaml}
├── fixtures/                   ← 4 schema-1.0.0 sample JSONs
└── tests/smoke.mjs             ← 60+ assertions, no FFmpeg required
```

---

## License

ExChek, Inc. Proprietary — see [LICENSE.md](LICENSE.md). The license
text in this repo is the same canonical text used by upstream
`exchekskills`, plus an Appendix A covering the third-party runtime
dependencies (HeyGen HyperFrames Apache-2.0, optional ElevenLabs API,
planned HeyGen Avatar API).

For licensing questions: matt@exchek.us.

---

## Security

Plain-English security model in [docs/SECURITY.md](docs/SECURITY.md).
TL;DR — same posture as upstream `exchekskills`, plus narrowly-scoped
opt-in third-party calls to ElevenLabs (when narration is requested) and,
in the future, HeyGen Avatars.

To report a vulnerability: matt@exchek.us. Do not file a public GitHub
issue.
