// Produce a portable rendering bundle:
//
//   bundle-<basename>/
//     composition.html  . the fully resolved, self-contained composition
//     manifest.json     . render settings + provenance
//     source.json       . verbatim copy of the input report for traceability
//     RENDER.md         . instructions for rendering offline
//
// This is the path a CoWork user takes when their sandbox can't run
// FFmpeg/Chromium. They download the folder and run `npx hyperframes
// render` against it on any host that can.

import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { join, basename, extname, resolve } from "node:path";

export async function writeBundle({
  outDir,
  reportPath,
  resolvedHtml,
  templateName,
  view,
  renderHints = {},
}) {
  const dir = resolve(outDir);
  await mkdir(dir, { recursive: true });

  // HyperFrames discovers compositions by index.html.
  const compositionPath = join(dir, "index.html");
  const manifestPath = join(dir, "manifest.json");
  const sourcePath = join(dir, "source.json");
  const readmePath = join(dir, "RENDER.md");

  await writeFile(compositionPath, resolvedHtml, "utf8");
  await copyFile(reportPath, sourcePath);

  const manifest = {
    bundle_version: "1.0.0",
    created_at: new Date().toISOString(),
    template: templateName,
    source_report: basename(reportPath),
    skill: view?.meta?.skill ?? null,
    input_hash: view?.meta?.inputHash ?? null,
    schema_version: view?.meta?.schemaVersion ?? null,
    docx_basename: view?.docxBasename ?? null,
    render_hints: {
      format: renderHints.format ?? "mp4",
      fps: renderHints.fps ?? 30,
      quality: renderHints.quality ?? "standard",
    },
    notes: [
      "This bundle was prepared on a host that could not render directly.",
      "The .docx beside the source report remains the audit-of-record.",
      "Render this bundle deterministically with HyperFrames; same input_hash should produce the same MP4 byte-for-byte (modulo encoder version).",
    ],
  };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  const readme = renderInstructions(manifest);
  await writeFile(readmePath, readme, "utf8");

  return { dir, compositionPath, manifestPath, sourcePath, readmePath };
}

function renderInstructions(manifest) {
  return `# Render this bundle

This folder is a portable HyperFrames composition prepared by
\`exchekskillsvideo\` on a host that could not render directly (typically
Claude CoWork, or a workstation without FFmpeg/Chromium).

## Render on any host with FFmpeg + Node ≥22

\`\`\`bash
# 1. cd into this folder
cd "$(dirname "$0")"

# 2. Render. HyperFrames will pull Puppeteer's bundled Chromium on first run.
npx --yes hyperframes render . \\
  -o ./output.${manifest.render_hints.format} \\
  -f ${manifest.render_hints.fps} \\
  -q ${manifest.render_hints.quality} \\
  --format ${manifest.render_hints.format}
\`\`\`

## Provenance

- **Template:** \`${manifest.template}\`
- **Source skill:** \`${manifest.skill ?? ""}\`
- **Source report:** \`${manifest.source_report}\`
- **Input hash:** \`${manifest.input_hash ?? ""}\`
- **Schema version:** \`${manifest.schema_version ?? ""}\`
- **Docx of record:** \`${manifest.docx_basename ?? ""}\`
- **Bundle created:** \`${manifest.created_at}\`

## Determinism check

If you render this bundle on two different hosts, the resulting MP4
should be byte-identical (modulo FFmpeg encoder version differences).
This matters for compliance audits. the bundle, plus its
\`input_hash\`, lets you reproduce the exact video you originally
shipped.

## Audit-of-record reminder

The MP4 you produce from this bundle is a **summary visualization**.
The audit-of-record per 15 CFR § 762.6 is the \`.docx\` that lives next
to the source JSON in your ExChek output folder, not this video.
`;
}
