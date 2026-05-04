# Changelog

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
