// Loads an HTML template from /templates/<name>/composition.html and performs
// JSON variable injection. HyperFrames itself has no CLI vars flag, so the
// bridge writes a fully resolved composition into a temp dir before render.
//
// Injection contract:
//   1. Templates may use `{{path.to.value}}` token substitution for plain text.
//   2. Templates may use `<!-- @hf-data -->` as a marker; the loader replaces
//      it with `<script>window.__hfData = {...JSON...};</script>`.
//   3. The shared CSS/brand bundle is inlined so the rendered HTML is a
//      single self-contained file (no relative-path footguns under puppeteer).

import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = resolve(__dirname, "..", "..", "templates");

const TOKEN = /{{\s*([a-zA-Z0-9_.[\]]+)\s*}}/g;
const HF_DATA_MARKER = "<!-- @hf-data -->";
const HF_STYLES_MARKER = "<!-- @hf-styles -->";

function getByPath(obj, path) {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function loadTemplate(name) {
  const compositionPath = join(TEMPLATES_DIR, name, "composition.html");
  const sharedCssPath = join(TEMPLATES_DIR, "shared", "styles.css");
  const sharedJsPath = join(TEMPLATES_DIR, "shared", "brand.js");
  const [html, css, js] = await Promise.all([
    readFile(compositionPath, "utf8"),
    readFile(sharedCssPath, "utf8").catch(() => ""),
    readFile(sharedJsPath, "utf8").catch(() => ""),
  ]);
  return { html, css, js, compositionPath };
}

export function renderTemplate({ html, css, js }, view) {
  // 1. Inline shared assets.
  let out = html;
  if (out.includes(HF_STYLES_MARKER)) {
    const block = `<style>${css}</style>\n<script>${js}</script>`;
    out = out.replace(HF_STYLES_MARKER, block);
  }
  // 2. Token substitution (plain text values, HTML-escaped).
  out = out.replace(TOKEN, (_, path) => {
    const v = getByPath(view, path);
    if (v == null) return "";
    return escapeHtml(v);
  });
  // 3. Inject the full data blob for templates that build content dynamically.
  if (out.includes(HF_DATA_MARKER)) {
    const json = JSON.stringify(view).replace(/</g, "\\u003c");
    out = out.replace(
      HF_DATA_MARKER,
      `<script>window.__hfData = ${json};</script>`,
    );
  }
  return out;
}

export const __test = { getByPath, escapeHtml };
