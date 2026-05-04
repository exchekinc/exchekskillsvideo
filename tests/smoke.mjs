// Smoke test: validate the data mapper and template loader against every
// fixture, and confirm `--dry-run` produces a parseable resolved HTML for
// every template. Does NOT invoke FFmpeg/Puppeteer (no actual render).

import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mapReportToView, pickTemplate } from "../scripts/lib/data-mapper.mjs";
import { loadTemplate, renderTemplate } from "../scripts/lib/template-loader.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = resolve(__dirname, "..");

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error(`  ✗ ${msg}`);
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

async function main() {
  const fixturesDir = join(REPO, "fixtures");
  const files = (await readdir(fixturesDir)).filter((f) => f.endsWith(".json"));
  if (files.length === 0) throw new Error("no fixtures found");

  const tmpDir = join(REPO, ".tmp");
  await mkdir(tmpDir, { recursive: true });

  for (const file of files) {
    console.log(`\n[fixture] ${file}`);
    const report = JSON.parse(await readFile(join(fixturesDir, file), "utf8"));
    const tpl = pickTemplate(report);
    assert(typeof tpl === "string" && tpl.length > 0, `pickTemplate -> ${tpl}`);

    const view = mapReportToView(report);
    assert(view.brand && view.brand.name === "ExChek", "brand block populated");
    assert(view.meta && view.meta.skill === report.skill.name, "meta.skill matches source");
    assert(typeof view.headline === "string" && view.headline.length > 0, "headline derived");
    assert(Array.isArray(view.determinations), "determinations array");
    assert(Array.isArray(view.flags), "flags array");
    assert(Array.isArray(view.citations), "citations array");

    const loaded = await loadTemplate(tpl);
    assert(loaded.html.includes("data-composition-id"), `template ${tpl} has composition root`);
    assert(loaded.css.length > 100, "shared CSS inlined");

    const html = renderTemplate(loaded, view);
    assert(html.includes("__hfData"), "data blob injected");
    assert(html.includes("window.__timelines"), "GSAP timeline registered");
    assert(!html.includes("{{"), `no unsubstituted tokens (${tpl})`);

    const out = join(tmpDir, `smoke-${file.replace(".json", ".html")}`);
    await writeFile(out, html, "utf8");
    console.log(`  → ${out}`);
  }

  console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
