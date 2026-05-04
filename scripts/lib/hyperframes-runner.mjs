// Thin wrapper around `npx hyperframes` so the bridge can stay declarative
// about format/quality and surface render errors with useful context.

import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, copyFile } from "node:fs/promises";
import { dirname, join, resolve, basename } from "node:path";
import { tmpdir } from "node:os";

export async function renderComposition({
  html,
  outputPath,
  format = "mp4",
  fps = 30,
  quality = "standard",
  workers = "auto",
  strict = false,
  quiet = false,
  audioFile = null,
  extraArgs = [],
} = {}) {
  if (!html) throw new Error("renderComposition: html is required");
  if (!outputPath) throw new Error("renderComposition: outputPath is required");

  const workDir = await mkdtempSafe("exchekvideo-");
  const compositionPath = join(workDir, "index.html");
  await writeFile(compositionPath, html, "utf8");
  if (audioFile) {
    // Preserve the source extension so <audio src="vo.mp3"> matches the
    // file we wrote and Chromium decodes the right format.
    const ext = audioFile.match(/\.[a-z0-9]+$/i)?.[0] || ".wav";
    const audioBasename = `vo${ext.toLowerCase()}`;
    await copyFile(audioFile, join(workDir, audioBasename));
  }
  await mkdir(dirname(resolve(outputPath)), { recursive: true });

  const args = [
    "hyperframes",
    "render",
    workDir,
    "-o",
    resolve(outputPath),
    "-f",
    String(fps),
    "-q",
    quality,
    "--format",
    format,
    "-w",
    String(workers),
  ];
  if (strict) args.push("--strict");
  if (quiet) args.push("--quiet");
  args.push(...extraArgs);

  const code = await runNpx(args, { cwd: workDir });

  if (code === 0) {
    if (!process.env.EXCHEKVIDEO_KEEP_TMP) await rm(workDir, { recursive: true, force: true });
    return { outputPath: resolve(outputPath), workDir };
  }
  // Leave temp dir intact on failure so the caller can inspect the source.
  throw new Error(
    `hyperframes render exited with code ${code}. Inspect ${workDir}/composition.html`,
  );
}

export async function previewComposition(html, { port = 3002, audioFile = null, audioBasename = "vo.wav" } = {}) {
  const workDir = await mkdtempSafe("exchekvideo-preview-");
  const compositionPath = join(workDir, "index.html");
  await writeFile(compositionPath, html, "utf8");
  if (audioFile) {
    await copyFile(audioFile, join(workDir, audioBasename));
  }
  console.log(`[exchekvideo] preview ready in ${workDir}`);
  console.log(`[exchekvideo] open http://localhost:${port} once the studio is up`);
  // hyperframes preview is interactive; foreground it.
  await runNpx(["hyperframes", "preview", "--port", String(port)], { cwd: workDir });
  return { workDir };
}

async function mkdtempSafe(prefix) {
  const { mkdtemp } = await import("node:fs/promises");
  return mkdtemp(join(tmpdir(), prefix));
}

function runNpx(args, opts) {
  return new Promise((resolvePromise) => {
    const child = spawn("npx", ["--yes", ...args], {
      stdio: "inherit",
      ...opts,
    });
    child.on("close", (code) => resolvePromise(code ?? 1));
    child.on("error", (err) => {
      console.error(`[exchekvideo] failed to spawn npx:`, err.message);
      resolvePromise(1);
    });
  });
}
