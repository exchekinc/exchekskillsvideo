# Template auto-selection mapping

The bridge picks a template from the source report's `skill.name` field
when `--template` is not explicitly passed.

| Source skill (`skill.name`)        | Template chosen          |
|-----------------------------------|--------------------------|
| `exchek-risk-triage`              | `risk-triage`            |
| `exchek-classify`                 | `classification`         |
| `exchek-license`                  | `classification`         |
| `exchek-jurisdiction`             | `classification`         |
| `exchek-red-flag-assessment`      | `red-flag`               |
| `exchek-csl`                      | `red-flag`               |
| `exchek-country-risk`             | `red-flag`               |
| `exchek-compliance-report`        | `compliance-report-card` |
| _anything else_                   | `risk-triage` (fallback) |

The mapping lives in `scripts/lib/data-mapper.mjs` (`SKILL_TO_TEMPLATE`).
Adding a new template means: drop a `templates/<name>/composition.html`,
add a row to that map, and (optionally) ship a wrapper SKILL.md.
