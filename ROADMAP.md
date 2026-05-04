# Roadmap

What's shipped, what's next, what's hypothesized. Versions track the
`package.json` version; concrete milestones below are commitments,
"explorations" are speculative.

> **North star**: every ExChekSkills compliance report can produce a
> branded, narrated, audit-traceable video deliverable in under one
> minute, on any surface (Code, desktop, CoWork), with the `.docx`
> remaining the audit-of-record.

---

## Shipped

### v0.1.0. Initial scaffold _(2026-05-04)_
- Bridge: `scripts/report-to-video.mjs` consumes the schema-1.0.0 JSON
  sibling that every ExChekSkills report emits, picks a template, and
  renders an MP4 via HeyGen HyperFrames.
- Five templates: `risk-triage`, `classification`, `red-flag`,
  `compliance-report-card`, `training`.
- Five Claude skill wrappers with shared SKILL.md preflight pattern.
- Smoke test (`npm test`) covering data mapping, template loading,
  token substitution, JSON injection, GSAP timeline registration.
- Documentation: README, ARCHITECTURE, CONTRIBUTING, marketplace.json.

### v0.1.1. Brand + CoWork bundle _(2026-05-04)_
- ExChek brand color `#411992` applied across all templates.
- `scripts/lib/env-detect.mjs` detects FFmpeg/ffprobe availability and
  CoWork environment signals.
- `scripts/lib/bundle.mjs` emits a portable rendering bundle when
  the host can't render directly. Manifest preserves `input_hash` for
  reproducibility.
- `--bundle <dir>`, `--force-bundle`, `--force-render` CLI flags.
- Auto-fallback to bundle mode when render dependencies are unavailable.

### v0.1.2. Voice (ElevenLabs) + first MP4 verified _(2026-05-04)_
- `scripts/lib/audio-script.mjs` derives narration from the view-model
  with per-template word budgets and ECCN spelling-out.
- `scripts/lib/audio-probe.mjs` reads audio duration via ffprobe.
- `<!-- @hf-audio -->` template marker; templates auto-pad timeline to
  audio length when narration is supplied.
- CLI flags: `--audio-file`, `--audio-script-only`, `--no-audio`.
- ElevenLabs preflight pattern across all SKILL.md files.
- Render-blocking bug fixes: HyperFrames v0.4.x discovers compositions
  via `index.html` (not `composition.html`); `String.replace` `$$`
  escape rule was corrupting inlined `brand.js`.

### v0.1.3. Theme overhaul + verified narration _(2026-05-04)_
- Light theme matching exchek.us (white surfaces, near-black text,
  ExChek purple accent, Outfit display + Inter body fonts).
- Real ExChek logo SVG inlined via `<!-- @hf-logo -->` marker.
- All 5 templates rebuilt around the new theme.
- ElevenLabs end-to-end verified on `risk-triage` (H.264 + AAC stereo).

### v0.1.4. Polish + AI disclaimer + batch render _(2026-05-04)_
- AI disclaimer ("AI can make mistakes. please double-check responses")
  rendered in ExChek purple at the footer of every template, above the
  regulatory pointer.
- Layout fixes: bigger gauge, redundant subheads removed, grid-card
  position bug fixed (cards inside grids were `position: absolute`,
  preventing layout participation).
- `scripts/render-all-narrated.sh` batch-renders all 5 demos with
  ElevenLabs narration. Audio cached at `~/.cache/exchek/vo-<hash>.mp3`,
  free on re-run when source hash hasn't changed.
- All 5 demos verified: H.264 video + AAC stereo audio, 540-920 KB,
  9-12 seconds, ~50s wall-clock for the batch.

---

## Next milestone

### v0.2. Captions _(target: next sprint)_

**Why first**: captions outperform avatars for compliance content.
LinkedIn/Slack/email previews autoplay muted; captions make the video
useful in those contexts. Accessibility (WCAG). narrated-only video is
a non-starter for many enterprise customers. No uncanny valley.

**Scope**:
- ElevenLabs API now returns word-level timings via the `with_timestamps`
  endpoint variant. Capture the timestamps when generating narration,
  cache alongside the mp3.
- New `scripts/lib/captions.mjs` produces a per-template caption layout
  (lower-third, ~28px, animated word-by-word, brand-tinted).
- Templates gain a `<!-- @hf-captions -->` marker. Default position:
  bottom-center, above the disclosure footer.
- New CLI flag `--captions` (default on when audio is present, off when
  silent). `--captions-style {lowerthird|burnin|sub}` override.
- SRT sidecar exported alongside the MP4 for downstream platforms that
  prefer external subtitle tracks.

**Build effort**: ~2 days. ElevenLabs timing format is well-documented;
the visual rendering is straightforward GSAP.

**Done when**: every fixture renders a captioned MP4 with synced word
highlighting, plus an SRT sidecar that loads cleanly into Final Cut /
Premiere / VLC.

---

## v0.3. Portrait variants _(target: post-captions)_

For Slack DM / mobile / IG-Reels distribution. 1080×1920 (9:16) and
1080×1080 (1:1) variants of every template.

**Scope**:
- Each template grows two siblings: `composition-portrait.html`,
  `composition-square.html`. Layout reflows for the narrower canvas
  (single-column, larger type, captions take more vertical space).
- New CLI flag `--aspect {16x9|9x16|1x1}` (default 16:9).
- Bridge writes `<basename>-portrait.mp4` etc. when invoked.

**Build effort**: ~3 days mostly because every template needs design
work, not because the engine changes.

---

## v0.4. HeyGen Avatars _(target: when first customer asks)_

**Why this milestone**: the user explicitly asked about it. Some viewers
respond materially better to a talking head than to a narrated motion
graphic. For high-stakes deliverables (executive briefings, customer-
facing classification memos) a personalized avatar lifts trust.

**Vendor choice**: HeyGen (we're already on their HyperFrames stack 
shared auth, single bill, best-in-class lip-sync as of 2026-Q1).
Alternates evaluated:
- D-ID. cheaper, weaker lip-sync, would require a second vendor.
- ElevenLabs Conversational Avatars. single-vendor with our TTS, but
  quality trails HeyGen.

**Scope**:
- `scripts/lib/heygen-avatar.mjs` calls
  `POST https://api.heygen.com/v2/video/generate`, polls
  `/v1/video_status`, downloads the resulting `avatar.mov` (transparent
  alpha) into `~/.cache/exchek/avatar-<input_hash>-<voice_id>-<avatar_id>.mov`.
- Cache key includes the avatar_id and voice_id so swapping personas
  doesn't trash earlier renders.
- Templates gain a `<!-- @hf-avatar -->` marker. Default position:
  bottom-right corner, 320×320, transparent background.
- New CLI flags:
    - `--avatar <id>`. HeyGen avatar_id; pulled from the user's account
    - `--avatar-position {br|bl|tr|tl|center}`. corner placement
    - `--avatar-size <px>`. default 320
- Skill preflight gains a third detection branch (HeyGen alongside
  ElevenLabs and CoWork): if the user wants an avatar, the skill checks
  for `HEYGEN_API_KEY` env var or the HeyGen connector before any
  generation work begins.
- Determinism: avatar generation is non-deterministic at HeyGen's end
  (model variance), so the `input_hash` in the manifest grows an
  `avatar_provenance` block recording the HeyGen `video_id` for audit
  reproducibility. Same script + same avatar_id → same cached MOV.
- Cost surfacing: the bridge prints estimated HeyGen cost before
  generation kicks off (~$0.30-$1 per minute as of 2026-Q1) and refuses
  to proceed without confirmation when cost > $1 per render.

**Build effort**: ~2 days for the integration; ~1 day for the cost-gate
UX in the SKILL.md preflight; ~1 day for caching/determinism wiring.

**Done when**: a customer can ask "make an avatar version of my
classification briefing" in Claude Code or CoWork, the skill walks them
through HeyGen setup if needed, and the resulting MP4 has the avatar
talking the narration over the existing branded layout.

**Risks**:
- HeyGen pricing fluctuates; the cost gate prevents surprises.
- HeyGen API rate limits in early/free accounts; cache aggressively.
- Avatars introduce uncanny-valley risk for some viewers. keep
  motion-graphic-only as a first-class output, not a fallback.

---

## ✅ v0.5. Template library expansion (shipped in v1.1.0)

All seven new templates landed in v1.1.0 (2026-05-04):

- ✅ `encryption`. 5A992/5D992 ECCN reveal + ENC notification cards
- ✅ `deemed-export`. color-coded verdict tile + 4 supporting cards (15 CFR 734.13)
- ✅ `export-docs`. Commercial Invoice + SLI + AES three-document grid
- ✅ `ecp`. Maturity grade + 8-element coverage grid (BIS guidance)
- ✅ `audit-lookback`. Volume tile + new-hits + severity-breakdown bars
- ✅ `partner-compliance`. Partner card + flow-down checklist
- ✅ `recordkeeping`. Retention status + 5-year timeline (15 CFR 762)

Each ships with a matching `exchek-video-<name>` skill wrapper and a
realistic schema-1.0.0 fixture.

---

## v0.6. Batch library mode

Target use case: training-content team wants to generate a video per
new regulatory update / per skill execution last week / per top-N
classifications by volume. Today, that's a `for` loop in shell.
Native batch mode would:

- Accept a folder of JSON siblings or an ExChek API call returning a
  batch.
- Render in parallel up to `--workers` (currently single-render).
- Produce an `index.html` thumbnail gallery for browsing.
- Optional: stitch into a single playlist MP4 with cards between
  segments.

---

## v0.7. Remote render service

Today, CoWork users get a portable bundle they have to render elsewhere.
A managed render endpoint would close the loop:

- ExChek-hosted render service that accepts the bundle, renders on
  GPU-backed Chromium, returns the MP4 URL.
- CoWork skill calls the service directly, returns a download link in
  the conversation.
- Authentication via the user's ExChek account (no separate billing
  per render. bundled into the ExChek subscription).

Build effort is meaningful: ~1 month for a production-grade hosted
service with cost controls, queueing, and audit logging.

---

## v0.8. Multi-language

ExChek serves international shippers; non-English narration is
table-stakes for EU/APAC adoption.

- ElevenLabs supports 30+ languages; their multi-language model handles
  most automatically.
- Templates need locale-aware date formats (`generated:` line),
  number formatting (gauge percentages), and reading direction (RTL).
- Compliance citations (`15 CFR 744.6(c)`) stay in their authoritative
  English form regardless of narration locale.

---

## Explorations (not committed)

These would each take a discovery sprint before commitment:

- **Real-time render in CoWork via streaming WebRTC**. bypass the
  bundle hand-off entirely by rendering frames in CoWork's headless
  Chromium and streaming them out. Plausible if Anthropic adds GPU
  workers; not a path until then.
- **Interactive video**. embedded controls in the MP4 (chapter markers,
  click-to-deep-dive into the source `.docx`). Requires HLS or MP4 with
  custom JS overlay; loses the "video file you email someone" property.
- **Voice cloning for executive narration**. ElevenLabs supports
  cloning. Compliance-sensitive: do customers want their CCO's voice
  reading the determination? Or does that overstate AI confidence?
- **Compliance-officer livestream mode**. generate the video on every
  red-flag determination as it lands, push to a Slack channel. Useful
  for SOC-style continuous monitoring; needs the v0.7 render service.

---

## Won't-do (deliberate)

- **Replacement of the .docx as audit-of-record.** The video is
  always supplementary. 15 CFR § 762.6 is not satisfied by an MP4.
- **Video-only deliverables for CUI/classified material.** Skill
  preflight gates this; the policy is a hard refusal, not a
  configurable warning.
- **TTS without an audit trail.** Every narrated render preserves the
  source `input_hash` and the script that was read. No silent edits to
  the spoken content vs. the written report.
- **Avatar generation without explicit user opt-in per render.** No
  global "always-avatar" config. each render that uses an avatar
  requires the user (or skill confirmation) to acknowledge cost and
  vendor data flow.

---

## How to propose a roadmap change

Open a discussion in the repo, or talk to matt@exchek.us.
For external partners, the LICENSE.md restrictions still apply.
