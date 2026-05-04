# Contributing

Internal contributors only. This repo inherits the proprietary license of
`exchekskills`. External pull requests will be redirected to the licensing
contact (matt@exchek.us).

## Hard rules

These rules are enforced by the smoke test (`npm test`). PRs that violate
them will fail CI and cannot be merged.

### No em dashes (`[em]`, U+2014). Anywhere.

This repository contains zero em dashes. They are a giveaway of
AI-generated text and they look stilted in compliance copy and short-form
video. The smoke test scans every committed file (including rendered HTML)
and fails if any em dash is found.

Replacements:

| Em dash usage           | Use instead                          |
|-------------------------|--------------------------------------|
| Sentence break: `X [em] Y` | `X. Y` (period + new sentence)       |
| Aside: `X [em] aside [em] Y`  | `X (aside) Y` or `X, aside, Y`       |
| Label: `X [em] Y`          | `X: Y` (colon)                       |
| List separator (rare)   | `A, B, and C`                        |

This applies to: source files, fixtures, templates, narration scripts,
SKILL.md content, README/ROADMAP/CHANGELOG, comments. The only places em
dashes are tolerated are upstream `exchekskills` JSON outputs and direct
quotations of regulatory text (citations may quote CFR / FR language
verbatim). Neither case applies to anything in this repo.

### No en dashes (`-`, U+2013) either.

Same reasoning as em dashes; same enforcement.

### Other style rules

- Bridge code (`scripts/lib/*.mjs`): plain ESM, no transpilation, no
  dependencies beyond Node stdlib.
- Templates: vanilla HTML + GSAP CDN. No build step.
- Brand tokens live in two places (kept in sync deliberately):
  `scripts/lib/brand.mjs` and `templates/shared/styles.css`.

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
4. `npm test` must pass with zero failures (including the em-dash check).
5. `npm run render:risk-triage` (or your fixture). Eyeball the MP4.
6. PR with the rendered MP4 attached so reviewers can see motion.

## What not to do

- Do not modify the source `.docx` or `.json` from `exchekskills`. This
  repo is read-only with respect to those.
- Do not add brand assets that haven't been signed off by ExChek.
- Do not ship templates that animate `width`/`height`/`top`/`left` on
  `<video>` elements. Chrome stops decoding (HyperFrames known issue).
- Do not introduce non-deterministic content (`Date.now()`, unseeded RNG,
  network fetches at render time). The video must be reproducible from
  input JSON alone.
- Do not use em dashes. (Repeated for emphasis. The smoke test will fail
  your build.)
