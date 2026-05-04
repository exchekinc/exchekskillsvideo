# Architecture

## Goal

Bridge `exchekskills` (text+docx compliance reports) to `hyperframes`
(HTML→MP4 video) without disturbing the upstream skill or its audit
guarantees.

## Boundaries

```
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│  exchekskills        │      │  exchekskillsvideo    │      │  hyperframes         │
│  (proprietary)       │      │  (this repo)          │      │  (Apache-2.0)        │
│                      │      │                       │      │                      │
│  Skill executes →    │  →   │  data-mapper          │  →   │  Puppeteer + FFmpeg  │
│  .md report          │      │  template-loader      │      │  Deterministic seek  │
│  + .json sibling     │      │  hyperframes-runner   │      │  H.264 encode        │
└──────────────────────┘      └──────────────────────┘      └──────────────────────┘
       audit-of-record                summary                     visualization
```

`exchekskillsvideo` is **read-only** with respect to upstream outputs. It
never modifies, supplements, or replaces the `.docx` or `.json`.

## Data contract

Source: schema 1.0.0 JSON sibling from `exchekskills`. Required fields
this repo reads:

| JSON path                              | Used for                                  |
|----------------------------------------|-------------------------------------------|
| `skill.name`                           | Template auto-selection                   |
| `generated.{at, model, platform}`      | Brand bar metadata                        |
| `generated.input_hash`                 | Reproducibility hash shown on screen      |
| `regulatory_currency.ecfr_pulled_at`   | "Pulled at" footer                        |
| `regulatory_currency.cfr_parts`        | Citation block (fallback)                 |
| `determinations[]`                     | Headline, subhead, top cards              |
| `risk_flags[]`                         | Indicator list / red-flag grid            |
| `citations[]`                          | Citation block (primary)                  |
| `next_actions[]`                       | Training template's action list           |
| `cui_check.{cui,classified}`           | Render gate                               |
| `privacy_attestation.tier`             | Inherited as the video's tier             |
| `report.docx_basename`                 | Pair-of-record reminder in CLI output     |

All other fields are passed through but ignored by current templates.
Adding a new template = consume more fields without breaking existing
ones (templates own their field selection).

## Template contract

A composition HTML file under `templates/<name>/composition.html` must:

1. Have a single root `<div data-composition-id="<name>" data-start="0"
   data-width="1920" data-height="1080" class="stage">`.
2. Include `<!-- @hf-styles -->` once (shared CSS+JS get inlined here).
3. Include `<!-- @hf-data -->` once (the JSON view object gets injected
   here as `window.__hfData`).
4. Register a paused GSAP timeline at
   `window.__timelines["<composition-id>"]`.
5. Pad the timeline (`tl.set({}, {}, durationSeconds)`) so HyperFrames
   knows the total length.
6. Use `{{path.to.value}}` tokens for plain-text substitution from the
   `view` object built by `data-mapper.mjs`.

Every visible non-`<video>` clip needs `class="clip"` plus
`data-start`, `data-duration`, `data-track-index` per HyperFrames'
[HTML schema](https://github.com/heygen-com/hyperframes/blob/main/docs/reference/html-schema.mdx).

## Determinism

HyperFrames' deterministic seek model is preserved end-to-end:

- The bridge does **no** runtime randomness — view object is a pure
  function of input JSON + CLI overrides.
- Templates avoid `Date.now()` / `Math.random()` at runtime.
- Same input JSON → same MP4, frame-for-frame. Verifiable via
  `generated.input_hash` displayed in the video.

## Failure modes

| Failure                            | Surface                                           |
|------------------------------------|---------------------------------------------------|
| `hyperframes` not on PATH          | `npm run doctor` (passes through to `npx hf …`)   |
| FFmpeg missing                     | HyperFrames render exits non-zero, stderr shown   |
| Template auto-select wrong         | `--template` override; mapping in `data-mapper`   |
| Token unresolved                   | Caught by `tests/smoke.mjs` (no `{{` in output)   |
| CUI / classified                   | Upstream skill gate; bridge inherits via flag     |
| Render time too slow               | `--quality draft` for previews; `--workers auto`  |

## Extending

Add a new template (e.g. `deemed-export`):

1. `mkdir templates/deemed-export`
2. Copy `templates/risk-triage/composition.html` as a starting point.
3. Change `data-composition-id` and `window.__timelines[...]` to the new
   name. Customize markup.
4. Add a row to `SKILL_TO_TEMPLATE` in `scripts/lib/data-mapper.mjs`.
5. Add a fixture under `fixtures/` and re-run `npm test`.
6. Optionally ship a wrapper SKILL.md under
   `skills/exchek-video-deemed-export/`.

That's the entire surface — no framework lock-in beyond HyperFrames'
HTML schema.
