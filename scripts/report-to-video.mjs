#!/usr/bin/env node
// report-to-video.mjs — bridge from an exchekskills JSON sibling to an MP4.
//
// Usage:
//   node scripts/report-to-video.mjs <report.json> [options]
//
// Options:
//   --template <name>   Override template selection (risk-triage, classification,
//                       red-flag, compliance-report-card, training).
//   --output <path>     Output file path (default: renders/<basename>.mp4).
//   --format <ext>      mp4 | webm | mov (default: mp4).
//   --fps <n>           24 | 30 | 60 (default: 30).
//   --quality <q>       draft | standard | high (default: standard).
//   --headline <text>   Override the auto-derived headline.
//   --subhead <text>    Override the auto-derived subhead.
//   --risk <level>      Force overall risk level (low|medium|high) for templates.
//   --strict            Pass --strict to hyperframes (warnings become errors).
//   --preview           Open the HyperFrames studio for the rendered HTML
//                       instead of producing an MP4.
//   --bundle <dir>      Produce a portable renderable folder instead of an
//                       MP4 (CoWork-friendly; no FFmpeg/Chromium needed).
//   --force-bundle      Force bundle mode even if local render is possible.
//   --force-render      Force render even if env-detect recommends bundle.
//   --audio-file <path> Use an existing audio file as the narration track.
//                       Caller is responsible for generating it (e.g. via the
//                       ElevenLabs MCP from the wrapping skill).
//   --audio-script-only Print the derived narration script to stdout and exit.
//                       Useful for skills that want to feed the script to a
//                       TTS step without rendering yet.
//   --no-audio          Render silent (default if --audio-file not supplied).
//   --dry-run           Write the resolved composition.html into ./.tmp/ and exit.
//   --help              Show this help.

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mapReportToView, pickTemplate } from "./lib/data-mapper.mjs";
import { loadTemplate, renderTemplate } from "./lib/template-loader.mjs";
import {
  renderComposition,
  previewComposition,
} from "./lib/hyperframes-runner.mjs";
import { detectRenderEnv } from "./lib/env-detect.mjs";
import { writeBundle } from "./lib/bundle.mjs";
import { deriveNarrationScript } from "./lib/audio-script.mjs";
import { probeAudioDuration } from "./lib/audio-probe.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

function parseArgs(argv) {
  const args = { positional: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === "--help" || tok === "-h") args.flags.help = true;
    else if (tok === "--preview") args.flags.preview = true;
    else if (tok === "--strict") args.flags.strict = true;
    else if (tok === "--dry-run") args.flags.dryRun = true;
    else if (tok === "--force-bundle") args.flags.forceBundle = true;
    else if (tok === "--force-render") args.flags.forceRender = true;
    else if (tok === "--no-audio") args.flags.noAudio = true;
    else if (tok === "--audio-script-only") args.flags.audioScriptOnly = true;
    else if (tok.startsWith("--")) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) {
        args.flags[key] = true;
      } else {
        args.flags[key] = next;
        i++;
      }
    } else {
      args.positional.push(tok);
    }
  }
  return args;
}

function help() {
  console.log(`exchek-video — render compliance video summaries from exchekskills JSON output

Usage:
  exchek-video <report.json> [options]

Options:
  --template <name>     risk-triage | classification | red-flag | compliance-report-card | training
  --output  <path>      Output file (default: renders/<basename>.mp4)
  --format  <ext>       mp4 | webm | mov          (default: mp4)
  --fps     <n>         24 | 30 | 60              (default: 30)
  --quality <q>         draft | standard | high   (default: standard)
  --headline <text>     Override headline
  --subhead  <text>     Override subhead
  --risk     <level>    low | medium | high
  --strict              Treat HyperFrames warnings as errors
  --preview             Open HyperFrames studio instead of rendering
  --bundle <dir>        Write a portable renderable folder (CoWork-friendly)
  --force-bundle        Use bundle mode even if local render is possible
  --force-render        Try to render even if env-detect recommends bundle
  --audio-file <path>   Use this audio file as narration track (caller-generated)
  --audio-script-only   Print the derived narration script and exit
  --no-audio            Render silent (default when --audio-file not given)
  --dry-run             Emit resolved composition.html to ./.tmp and exit
  -h, --help            This help

Examples:
  exchek-video ~/Documents/ExChek-Reports/ExChek-RiskTriage-2026-05-04-AcmeCo.json
  exchek-video report.json --template classification --output briefings/acme.mp4
  exchek-video report.json --preview
`);
}

async function loadReport(path) {
  const raw = await readFile(path, "utf8");
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Could not parse JSON at ${path}: ${e.message}`);
  }
  if (json.schema_version && json.schema_version !== "1.0.0") {
    console.warn(
      `[exchekvideo] warning: schema_version=${json.schema_version} (expected 1.0.0). Continuing.`,
    );
  }
  return json;
}

function deriveOutput(reportPath, override, format) {
  if (override) return override;
  const base = basename(reportPath, extname(reportPath));
  return join(REPO_ROOT, "renders", `${base}.${format}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args.flags.help || args.positional.length === 0) {
    help();
    process.exit(args.flags.help ? 0 : 1);
  }

  const reportPath = resolve(args.positional[0]);
  const report = await loadReport(reportPath);
  const templateName = pickTemplate(report, args.flags.template);
  const view = mapReportToView(report, {
    headline: args.flags.headline,
    subhead: args.flags.subhead,
    risk: args.flags.risk,
  });

  // Audio: if a caller-provided file is supplied, attach it to the view so
  // the template emits an <audio> clip; if --audio-script-only is set, we
  // emit the script and bail (caller will TTS it and re-invoke us).
  const audioScript = deriveNarrationScript(view, templateName);
  view.audio = { script: audioScript, enabled: false };

  if (args.flags.audioScriptOnly) {
    console.log(audioScript);
    return;
  }

  if (args.flags["audio-file"] && !args.flags.noAudio) {
    const audioPath = resolve(args.flags["audio-file"]);
    const duration = (await probeAudioDuration(audioPath)) ?? 9;
    view.audio = {
      script: audioScript,
      enabled: true,
      src: "vo.wav",
      duration,
      volume: 0.95,
      trackIndex: 99,
      start: 0,
    };
  }

  console.log(`[exchekvideo] report  : ${reportPath}`);
  console.log(`[exchekvideo] skill   : ${view.meta.skill}`);
  console.log(`[exchekvideo] template: ${templateName}`);
  console.log(
    `[exchekvideo] audio   : ${view.audio.enabled ? `narrated (${view.audio.duration?.toFixed(1)}s)` : "silent"}`,
  );

  const tpl = await loadTemplate(templateName);
  const html = renderTemplate(tpl, view);

  if (args.flags.dryRun) {
    const tmpDir = join(REPO_ROOT, ".tmp");
    await mkdir(tmpDir, { recursive: true });
    const out = join(tmpDir, `${templateName}-resolved.html`);
    await writeFile(out, html, "utf8");
    console.log(`[exchekvideo] dry-run wrote ${out}`);
    return;
  }

  if (args.flags.preview) {
    await previewComposition(html);
    return;
  }

  const format = args.flags.format || "mp4";
  const fps = Number(args.flags.fps) || 30;
  const quality = args.flags.quality || "standard";

  // Decide: render here, or write a portable bundle for offline rendering.
  const env = await detectRenderEnv();
  const explicitBundle = !!args.flags.bundle || !!args.flags.forceBundle;
  const bundleMode =
    !args.flags.forceRender && (explicitBundle || !env.canRender);

  if (bundleMode) {
    const base = basename(reportPath, extname(reportPath));
    const bundleDir =
      typeof args.flags.bundle === "string"
        ? args.flags.bundle
        : join(REPO_ROOT, "renders", `bundle-${base}`);
    if (!explicitBundle) {
      console.log(
        `[exchekvideo] env: ${env.reasons.join("; ")} → falling back to bundle mode.`,
      );
    }
    const out = await writeBundle({
      outDir: bundleDir,
      reportPath,
      resolvedHtml: html,
      templateName,
      view,
      renderHints: { format, fps, quality },
    });
    console.log(`[exchekvideo] bundle : ${out.dir}`);
    console.log(`[exchekvideo] render : see ${out.readmePath}`);
    if (view.docxBasename) {
      console.log(`[exchekvideo] pair-of-record: ${view.docxBasename}`);
    }
    return;
  }

  const outputPath = deriveOutput(reportPath, args.flags.output, format);
  const { outputPath: finalPath } = await renderComposition({
    html,
    outputPath,
    format,
    fps,
    quality,
    strict: !!args.flags.strict,
    audioFile: view.audio.enabled ? resolve(args.flags["audio-file"]) : null,
  });

  console.log(`[exchekvideo] rendered: ${finalPath}`);
  if (view.docxBasename) {
    console.log(`[exchekvideo] pair-of-record: ${view.docxBasename} (.docx is the audit document)`);
  }
}

main().catch((err) => {
  console.error(`[exchekvideo] error: ${err.message}`);
  process.exit(1);
});
