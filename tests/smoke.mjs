// Smoke test: validate the data mapper and template loader against every
// fixture, and confirm `--dry-run` produces a parseable resolved HTML for
// every template. Does NOT invoke FFmpeg/Puppeteer (no actual render).

import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mapReportToView, pickTemplate } from "../scripts/lib/data-mapper.mjs";
import { loadTemplate, renderTemplate } from "../scripts/lib/template-loader.mjs";
import { writeBundle } from "../scripts/lib/bundle.mjs";
import { detectRenderEnv } from "../scripts/lib/env-detect.mjs";
import { deriveNarrationScript, __test as audioTest } from "../scripts/lib/audio-script.mjs";

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
    // Regression guard: $$ in the inlined brand.js must survive the
    // String.replace() escape rules. If this fails, the runtime collapses
    // `$$` to `$` and ExChekVideo's $$ alias becomes a duplicate $ key.
    assert(html.includes("$$: $$"), "brand.js $$ shorthand preserved");
    assert(html.includes("@hf-audio") === false, "audio marker stripped from output");
    assert(!html.includes("<audio "), "no audio clip in silent render");

    // Narrated render variant.
    const audioView = { ...view, audio: { enabled: true, src: "vo.wav", duration: 10, volume: 0.95, trackIndex: 99, start: 0 } };
    const audioHtml = renderTemplate(loaded, audioView);
    assert(audioHtml.includes('<audio id="vo"'), "audio clip injected when enabled");
    assert(audioHtml.includes('src="vo.wav"'), "audio clip references vo.wav");

    // Narration script derivation.
    const script = deriveNarrationScript(view, tpl);
    assert(typeof script === "string" && script.length > 10, `narration script derived (${script.length} chars)`);
    const wordCount = script.split(/\s+/).length;
    assert(wordCount <= 36, `narration within budget (${wordCount} words)`);

    const out = join(tmpDir, `smoke-${file.replace(".json", ".html")}`);
    await writeFile(out, html, "utf8");
    console.log(`  → ${out}`);

    // Bundle mode round-trip.
    const bundleDir = join(tmpDir, `bundle-${file.replace(".json", "")}`);
    const bundle = await writeBundle({
      outDir: bundleDir,
      reportPath: join(fixturesDir, file),
      resolvedHtml: html,
      templateName: tpl,
      view,
      renderHints: { format: "mp4", fps: 30, quality: "standard" },
    });
    const manifest = JSON.parse(await readFile(bundle.manifestPath, "utf8"));
    assert(manifest.bundle_version === "1.0.0", "bundle manifest written");
    assert(manifest.template === tpl, "bundle manifest template matches");
    assert(manifest.input_hash === view.meta.inputHash, "bundle preserves input hash");
    const readme = await readFile(bundle.readmePath, "utf8");
    assert(readme.includes("npx --yes hyperframes render"), "RENDER.md instructions present");
  }

  // Env detection smoke — must return a structured object regardless of host.
  const env = await detectRenderEnv();
  assert(typeof env.canRender === "boolean", `env-detect canRender (=${env.canRender})`);
  assert(["render", "bundle"].includes(env.recommendation), `env-detect recommends ${env.recommendation}`);

  // Audio script edge cases.
  console.log(`\n[audio-script]`);
  assert(audioTest.spokenCode("6A993.a") === "6 A 993 dot a", "spokenCode pads ECCN");
  assert(audioTest.clampWords("a b c d e f", 3).split(" ").length === 3, "clampWords budget");

  console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
