# Running in Claude CoWork

CoWork is a sandboxed cloud workspace. The bridge **invocation** runs there
fine (Node ≥22 is available), but the **render step** depends on FFmpeg and
Puppeteer's Chromium. neither of which is reliably available in CoWork.

The bridge handles this automatically. When it detects a CoWork-like
environment (or when FFmpeg is missing), it falls back to **bundle mode**:
instead of producing an MP4, it produces a portable folder you can download
and render anywhere.

## What the bundle contains

```
bundle-<basename>/
├── composition.html   ← fully resolved, self-contained HyperFrames composition
├── manifest.json      ← render hints + provenance (template, input hash, …)
├── source.json        ← verbatim copy of the input report for traceability
└── RENDER.md          ← step-by-step instructions for offline render
```

## Workflow in CoWork

1. Run the skill normally; the user's source `.json` is somewhere in their
   ExChek output folder (default `~/Documents/ExChek-Reports`).
2. The bridge detects CoWork and writes a bundle folder under `renders/`.
3. Tell the user: "I prepared a render bundle at `<path>`. Download the
   folder and run the command in `RENDER.md` on a machine with FFmpeg
   installed."
4. Optional: zip the bundle (CoWork can `tar czf bundle.tar.gz <dir>`) so
   they get one file to download.

## Forcing modes

If the auto-detection guesses wrong, override:

```bash
# Force bundle mode (e.g., to inspect output before rendering anywhere)
node scripts/report-to-video.mjs <report.json> --force-bundle

# Force render mode (e.g., user has FFmpeg but env-detect missed it)
node scripts/report-to-video.mjs <report.json> --force-render
```

## Determinism note

Because the bundle preserves the source `input_hash` from the original
exchekskills report, the MP4 produced from it is **reproducible**. re-render
the same bundle on any host and you should get a byte-identical file
(modulo FFmpeg encoder version). This matters for audits: a video that
shipped to a customer can be reproduced from its bundle for evidence.

## What CoWork *cannot* do

- **Cannot render in-CoWork** without external infrastructure. If you need
  CoWork to deliver a finished MP4, the path is to invoke a render service
  from CoWork (HTTP POST the bundle, retrieve the MP4). not implemented
  in v0.1.
- **Cannot use `--preview`**. that opens an interactive HyperFrames studio
  that needs a browser pointing at localhost. CoWork has no display.
