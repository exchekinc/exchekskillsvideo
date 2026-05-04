# Changelog

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
