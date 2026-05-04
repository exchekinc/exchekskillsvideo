# Changelog

## [1.0.0] — 2026-05-04 — **ExChek Engine (Video)**

First production release. Claude-plugin-ready, marketplace-installable,
license + security ported from upstream `exchekskills`.

### Plugin readiness
- `.claude-plugin/plugin.json` v1 manifest. Declares the five video
  skills, ExChek metadata (author, repo, homepage), keywords for
  discovery, and a full `userConfig` block:
    - `default_render_dir` (default `~/Documents/ExChek-Reports`)
    - `elevenlabs_voice_id` (default Sarah)
    - `elevenlabs_api_key` (sensitive, optional)
    - `default_quality` (draft | standard | high)
    - `default_fps` (24 | 30 | 60)
    - `narration_default` (ask | always | never)
    - `cui_render_mode` (refuse | silent)
- `marketplace.json` updated to the upstream v1 schema for marketplace
  discovery alongside `exchekskills`.
- `package.json` bumped to 1.0.0.

### License + security parity
- `LICENSE.md` is now the verbatim canonical 115-line ExChek
  Proprietary License from `exchekinc/exchekskills`, plus an Appendix A
  documenting the additional runtime dependencies this repo
  introduces (HyperFrames Apache-2.0, optional ElevenLabs TTS,
  planned HeyGen Avatars).
- `docs/SECURITY.md` mirrors upstream's plain-English security model at
  the same path, adapted for the video surface area: net-new outbound
  calls table, `--audio-script-only` as the user-facing way to preview
  exactly what text would be sent to ElevenLabs, CUI gate behavior,
  cache-directory documentation, render-time considerations, and the
  bridge-vs-skill key-handling separation.

### Shipping in v1.0.0
- Five video templates, all rendering at 1920×1080 H.264:
    - `risk-triage` — animated risk gauge + determinations + flag cards
    - `classification` — large ECCN/USML reveal + 4 control fields
    - `red-flag` — high-contrast indicator alert grid (BIS Supp. 3)
    - `compliance-report-card` — grade tile + score progress bars
    - `training` — lesson-card layout with citations + actions
- Five Claude skill wrappers, all with the shared SKILL.md preflight
  pattern (CUI gate inherited from upstream + ElevenLabs narration
  preflight that resolves credentials before any render).
- ExChek brand: light theme matching exchek.us, real ExChek logo SVG
  inlined into every composition, ExChek purple `#411992` accent,
  Outfit/Inter/JetBrains-Mono typography, AI disclaimer hard-coded in
  the brand layer.
- ElevenLabs narration verified end-to-end. Audio cached at
  `~/.cache/exchek/vo-<input_hash>.mp3` so re-renders of the same
  source are free.
- CoWork-friendly: bundle mode auto-engages when FFmpeg/Chromium are
  unavailable, producing a portable folder + RENDER.md the user can
  download and render anywhere.
- Bridge CLI: `report-to-video.mjs` with `--template`, `--output`,
  `--format`, `--fps`, `--quality`, `--headline`, `--subhead`,
  `--risk`, `--strict`, `--preview`, `--bundle <dir>`,
  `--force-bundle`, `--force-render`, `--audio-file`,
  `--audio-script-only`, `--no-audio`, `--dry-run`.
- Batch script: `scripts/render-all-narrated.sh` renders all five demos
  with ElevenLabs in ~50s wall-clock.
- Smoke test: 90+ assertions covering data mapping, template loading,
  token substitution (with `$$` escape regression guard), JSON
  injection, GSAP timeline registration, audio injection, bundle
  round-trip, and env-detect contract.
- Documentation: README, ROADMAP, ARCHITECTURE, CONTRIBUTING, SECURITY,
  five SKILL.md files, ElevenLabs setup walkthrough, CoWork workflow,
  template-mapping reference.

### Roadmap (post-v1)
See [ROADMAP.md](ROADMAP.md). Headline items:
- v0.2 — Captions (mute-friendly + accessibility + SRT sidecar)
- v0.3 — Portrait + square aspects for Slack / mobile / Reels
- **v0.4 — HeyGen Avatars** (talking-head over the motion-graphic layout)
- v0.5 — Templates for the 7 remaining ExChekSkills
- v0.6 — Native batch mode for training-library generation
- v0.7 — Hosted render service (closes the CoWork bundle hand-off)
- v0.8 — Multi-language narration

---

## [0.1.3] — 2026-05-04

### Changed (theme overhaul to match exchek.us)
- Inverted color theme: white/light surfaces, near-black text, ExChek
  purple #411992 as accent. Eyebrow text in purple uppercase tracking
  (mirrors the website's "EXPORT COMPLIANCE FOR SMB MANUFACTURERS"
  treatment).
- Typography: `Outfit` for display headings, `Inter` for body,
  `JetBrains Mono` for hashes/CFR codes — all in HyperFrames'
  deterministic font map.
- New brand-mark: actual ExChek logo SVG inlined into every composition
  via the new `<!-- @hf-logo -->` marker, paired with "ExChek" wordmark
  + product line label (e.g. "Risk Triage").
- All 5 templates rebuilt around the new theme: brand bar, eyebrow,
  headline (single-line, 80px Outfit), subhead, content cards with
  subtle border + shadow.

### Added (voice — verified end-to-end)
- ElevenLabs narration rendered into the MP4. POST to
  `api.elevenlabs.io/v1/text-to-speech/<voice>` with the
  `eleven_turbo_v2_5` model, mp3 saved to
  `~/.cache/exchek/vo-<input_hash>.mp3`, passed to bridge via
  `--audio-file`. Bridge derives audio extension from the file so
  mp3/wav/ogg all work.

### Verified
- `renders/risk-triage-light.mp4` — silent, new theme, 600 KB / 9.0s
- `renders/risk-triage-narrated.mp4` — narrated, 869 KB / 10.5s,
  H.264 video + AAC stereo 48kHz audio
- `renders/classification-light.mp4` — 558 KB / 9.0s
- `renders/red-flag-light.mp4` — 422 KB / 9.0s

## [0.1.2] — 2026-05-04

### Added
- **ElevenLabs narration support.** New `scripts/lib/audio-script.mjs`
  derives a per-template narration script from the view-model with word
  budgeting and ECCN code spelling-out. New `scripts/lib/audio-probe.mjs`
  uses ffprobe to read audio durations.
- New CLI flags: `--audio-file <path>`, `--audio-script-only`, `--no-audio`.
  The skill layer is responsible for TTS generation (via the ElevenLabs
  MCP/connector or REST); the bridge consumes a finished audio file.
- Templates: `<!-- @hf-audio -->` marker handled by template-loader, all
  five compositions extended with audio-aware timeline padding (audio
  duration drives composition length when narration is enabled).
- New reference doc `skills/exchek-video-summary/references/elevenlabs-setup.md`
  walks through Claude.ai web/CoWork connector setup and Claude Code
  CLI API-key/MCP setup.
- New SKILL.md "Step 0.5 — Narration preflight" pattern across all five
  video skills. Skills must resolve narration credentials **before**
  rendering — UX requirement so users never get partway through a render
  and find out they need to install something.

### Fixed
- **Render-blocking:** HyperFrames v0.4.x discovers compositions via
  `index.html`, not `composition.html`. Updated runner and bundle.
- **Render-blocking:** `String.prototype.replace` treats `$$` as an
  escape, which was silently corrupting the inlined `brand.js`
  (`window.ExChekVideo.$$` collapsed to a duplicate `$` key, breaking
  all DOM helpers). Switched all marker substitutions to callback form.
  Smoke test now regression-guards `$$: $$` in every rendered output.
- Risk-triage layout: tightened spacing, clamped detail lines to 2 with
  text-overflow ellipsis, capped flags display to 2, shrunk gauge to
  290×290 to prevent collisions with the regulatory-currency card and
  disclosure footer.

### Verified
- First production render: 1920×1080, 9 seconds, H.264 MP4, 858 KB at
  standard quality, ~9 seconds wall-clock on M4 with 6 workers. Brand
  color (#411992) lands correctly across the brand mark, list markers,
  and ambient gradient. Output: `renders/risk-triage-demo.mp4`.

## [0.1.1] — 2026-05-04

### Changed
- Brand color set to ExChek purple **#411992** across `brand.mjs` and
  `templates/shared/styles.css`. A lighter tint `#7C4FE0` companions on
  dark surfaces where pure brand has insufficient contrast (small text,
  fine strokes, gradient end-stops).

### Added
- `scripts/lib/env-detect.mjs` — detects FFmpeg/ffprobe on PATH and
  CoWork environment signals.
- `scripts/lib/bundle.mjs` — writes a portable rendering bundle
  (composition + manifest + source + RENDER.md) for offline render.
- `--bundle <dir>`, `--force-bundle`, `--force-render` flags on the CLI.
- Auto-fallback to bundle mode when render dependencies are unavailable
  (typical CoWork sandbox path).
- `skills/exchek-video-summary/references/cowork.md` — CoWork workflow.
- 18 new smoke-test assertions covering bundle round-trip and
  env-detect contract.

## [0.1.0] — 2026-05-04

Initial scaffold.

### Added
- `scripts/report-to-video.mjs` — bridge CLI from `exchekskills` JSON
  sibling (schema 1.0.0) to MP4 via HyperFrames.
- `scripts/lib/{brand,data-mapper,template-loader,hyperframes-runner}.mjs`
  — reusable bridge layer.
- Five templates: `risk-triage`, `classification`, `red-flag`,
  `compliance-report-card`, `training`.
- Five Claude skill wrappers: `exchek-video-{summary,risk-triage,
  classification,red-flag,training}`.
- Four fixtures covering all auto-mapped skill names.
- Smoke test (`npm test`) — 48 assertions, 0 deps beyond Node stdlib.
- Documentation: README, ARCHITECTURE, CONTRIBUTING, template-mapping
  reference, marketplace.json.

### Notes
- `.docx` from `exchekskills` remains the audit-of-record. MP4 is a
  summary visualization only.
- Determinism preserved: same input JSON → same MP4, frame-for-frame.
