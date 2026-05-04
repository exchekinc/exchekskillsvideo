# Changelog

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
