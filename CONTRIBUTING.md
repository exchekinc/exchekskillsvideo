# Contributing

Internal contributors only — this repo inherits the proprietary license of
`exchekskills`. External pull requests will be redirected to the licensing
contact (matt@exchek.us).

## Local setup

```bash
nvm use            # honors .nvmrc (Node 22)
npm install
brew install ffmpeg
npx hyperframes doctor
```

## Workflow

1. Branch from `main`.
2. Add or modify a template under `templates/<name>/composition.html`.
3. Add a fixture under `fixtures/` that exercises any new field paths.
4. `npm test` — must pass with zero failures.
5. `npm run render:risk-triage` (or your fixture) — eyeball the MP4.
6. PR with the rendered MP4 attached so reviewers can see motion.

## Style

- Bridge code (`scripts/lib/*.mjs`): plain ESM, no transpilation, no
  dependencies beyond Node stdlib.
- Templates: vanilla HTML + GSAP CDN. No build step.
- Brand tokens live in **two** places (kept in sync deliberately):
  `scripts/lib/brand.mjs` for the bridge layer,
  `templates/shared/styles.css` (CSS custom properties) for templates.

## Adding a template

See [docs/ARCHITECTURE.md → Extending](docs/ARCHITECTURE.md#extending).

## What not to do

- **Do not** modify the source `.docx` or `.json` from `exchekskills`.
  This repo is read-only with respect to those.
- **Do not** add brand assets that haven't been signed off by ExChek.
- **Do not** ship templates that animate `width`/`height`/`top`/`left`
  on `<video>` elements — Chrome stops decoding (HyperFrames known issue).
- **Do not** introduce non-deterministic content
  (`Date.now()`, unseeded RNG, network fetches at render time).
  The video must be reproducible from input JSON alone.
