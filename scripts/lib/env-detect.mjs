// Detect whether the current environment can perform a HyperFrames render.
//
// HyperFrames needs:
//   1. FFmpeg on PATH (mp4/webm/mov muxing).
//   2. A Chromium that Puppeteer can launch (network'd auto-download or
//      a system Chrome that Puppeteer accepts via PUPPETEER_EXECUTABLE_PATH).
//   3. Permission to spawn child processes and listen on a localhost port
//      during the deterministic seek.
//
// CoWork (Claude's sandboxed cloud workspace) typically has Node available
// but not FFmpeg, and may restrict child-process or network behavior. The
// bridge falls back to bundle mode in those environments — it produces a
// portable folder the user can download and render on a host that does
// have the binaries.

import { spawn } from "node:child_process";

let cached = null;

export async function detectRenderEnv() {
  if (cached) return cached;

  const checks = await Promise.all([
    which("ffmpeg"),
    which("ffprobe"),
    detectCoWork(),
  ]);
  const [ffmpeg, ffprobe, isCoWork] = checks;

  const canRender = !!ffmpeg && !!ffprobe && !isCoWork;
  cached = {
    canRender,
    isCoWork,
    ffmpegPath: ffmpeg,
    ffprobePath: ffprobe,
    reasons: [
      ffmpeg ? null : "ffmpeg not found on PATH",
      ffprobe ? null : "ffprobe not found on PATH",
      isCoWork ? "running inside Claude CoWork sandbox" : null,
    ].filter(Boolean),
    recommendation: canRender ? "render" : "bundle",
  };
  return cached;
}

function which(bin) {
  return new Promise((resolvePromise) => {
    const isWin = process.platform === "win32";
    const cmd = isWin ? "where" : "which";
    const child = spawn(cmd, [bin], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("close", (code) => {
      if (code === 0) {
        const path = out.split(/\r?\n/)[0].trim();
        resolvePromise(path || null);
      } else {
        resolvePromise(null);
      }
    });
    child.on("error", () => resolvePromise(null));
  });
}

async function detectCoWork() {
  // CoWork sets a few env signals; we err on the side of "treat as cowork"
  // when any of these are present.
  const env = process.env;
  const signals = [
    "CLAUDE_COWORK",
    "CLAUDE_CODE_COWORK",
    "ANTHROPIC_COWORK",
    "COWORK_SESSION_ID",
  ];
  if (signals.some((k) => env[k])) return true;
  // Container-y signals that often coincide with managed sandboxes where
  // FFmpeg/Chromium are unavailable. These are heuristic, not authoritative.
  if (env.CLAUDE_PROJECT_DIR && !env.HOME?.startsWith("/Users/") && !env.HOME?.startsWith("/home/")) {
    return true;
  }
  return false;
}
