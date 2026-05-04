# exchekskillsvideo

Render audit-ready compliance **video summaries** from
[`exchekskills`](https://github.com/exchekinc/exchekskills) JSON outputs,
using [HeyGen HyperFrames](https://github.com/heygen-com/hyperframes) as the
HTML→MP4 engine.

> The `.docx` from `exchekskills` is the audit-of-record. The `.mp4`
> rendered here is a summary visualization for executives, clients,
> training, and incident channels — not a recordkeeping substitute.

---

## Why this exists

`exchekskills` already emits a structured JSON sibling next to every
`.docx` report (schema 1.0.0). That JSON has everything a downstream
visualization needs: determinations, risk flags, citations, regulatory
currency, privacy attestation, and the source-of-truth document name.

This repo is the bridge from that JSON to a branded MP4.

---

## What you get

| Skill / template               | Use case                                                      |
|--------------------------------|---------------------------------------------------------------|
| `exchek-video-summary`         | Auto-detects template from source skill, renders MP4         |
| `exchek-video-risk-triage`     | Animated risk-gauge briefing (9s)                             |
| `exchek-video-classification`  | ECCN/USML reveal with control fields (9s)                     |
| `exchek-video-red-flag`        | High-contrast indicator alert layout (9s)                     |
| `exchek-video-training`        | Lesson-card layout with citations + actions (12s)             |

Plus a CLI: `node scripts/report-to-video.mjs <report.json>`.

---

## Install

Requires **Node.js ≥22** and **FFmpeg** (`brew install ffmpeg` on macOS).
HyperFrames pulls Puppeteer's bundled Chrome on first run.

```bash
git clone https://github.com/exchekinc/exchekskillsvideo.git
cd exchekskillsvideo
npm install
npx hyperframes doctor    # verify environment
```

---

## Quickstart

Render the bundled risk-triage fixture:

```bash
npm run render:risk-triage
# → renders/risk-triage-demo.mp4
```

Render any `exchekskills` JSON:

```bash
node scripts/report-to-video.mjs ~/Documents/ExChek-Reports/ExChek-RiskTriage-2026-05-04-AcmeCo.json
```

Override template / output:

```bash
node scripts/report-to-video.mjs report.json \
  --template classification \
  --output briefings/acme-classification.mp4 \
  --quality high \
  --fps 60
```

Open the HyperFrames studio for any report (interactive editing, no MP4 yet):

```bash
node scripts/report-to-video.mjs report.json --preview
```

Render-free dry run (writes resolved composition HTML to `.tmp/`):

```bash
node scripts/report-to-video.mjs report.json --dry-run
```

Bundle for offline render (auto-selected in CoWork; force with `--force-bundle`):

```bash
node scripts/report-to-video.mjs report.json --force-bundle
# → renders/bundle-<basename>/{composition.html, manifest.json, source.json, RENDER.md}
```

---

## How it works

1. `report-to-video.mjs` reads the JSON sibling.
2. `lib/data-mapper.mjs` reshapes it into a stable `view` object that all
   templates consume (same contract regardless of source skill).
3. `lib/template-loader.mjs` loads `templates/<name>/composition.html`,
   inlines `templates/shared/styles.css` + `brand.js`, performs
   `{{token}}` substitution, and injects `window.__hfData = {...}`.
4. `lib/hyperframes-runner.mjs` writes the resolved HTML into a temp dir
   and shells out to `npx hyperframes render`.
5. Output: a deterministic MP4 (same JSON → same video, frame-for-frame).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full flow.

---

## Running in Claude CoWork

CoWork is a sandboxed cloud workspace. It has Node, but **does not reliably
have FFmpeg or Chromium**, so a direct render isn't possible there. The
bridge auto-detects this and switches to **bundle mode** — it produces a
portable folder (`composition.html`, `manifest.json`, `source.json`,
`RENDER.md`) that the user downloads and renders on any host with FFmpeg.

The bundle preserves the source report's `input_hash`, so the eventual MP4
is reproducible: same bundle → same video, byte-for-byte (modulo FFmpeg
encoder version). That property matters for audit reproducibility.

See [`skills/exchek-video-summary/references/cowork.md`](skills/exchek-video-summary/references/cowork.md)
for the full CoWork workflow.

## Compliance scope

- The `.docx` from `exchekskills` is the **audit-of-record**.
- The MP4 inherits the source report's privacy attestation tier — do not
  upload to a third-party hoster without confirming the tier permits it.
- CUI / classified material is gated at the skill layer; if the source
  JSON's `cui_check.cui` or `cui_check.classified` is true, the bridge
  refuses to render.

---

## License

ExChek, Inc. Proprietary — see [LICENSE.md](LICENSE.md). HyperFrames
itself is Apache-2.0 and consumed as a runtime dependency.

For licensing questions: matt@exchek.us
