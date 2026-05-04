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

  console.log(`[exchekvideo] report  : ${reportPath}`);
  console.log(`[exchekvideo] skill   : ${view.meta.skill}`);
  console.log(`[exchekvideo] template: ${templateName}`);

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
  const outputPath = deriveOutput(reportPath, args.flags.output, format);

  const { outputPath: finalPath } = await renderComposition({
    html,
    outputPath,
    format,
    fps: Number(args.flags.fps) || 30,
    quality: args.flags.quality || "standard",
    strict: !!args.flags.strict,
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
