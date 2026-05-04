// Probe an audio file for its duration in seconds. Uses ffprobe (already a
// HyperFrames prerequisite, so we don't add a dep). Returns null on failure
// so callers can fall back to the timeline's own duration.

import { spawn } from "node:child_process";

export function probeAudioDuration(filePath) {
  return new Promise((resolvePromise) => {
    const child = spawn(
      "ffprobe",
      [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("close", (code) => {
      if (code !== 0) return resolvePromise(null);
      const seconds = parseFloat(out.trim());
      resolvePromise(Number.isFinite(seconds) ? seconds : null);
    });
    child.on("error", () => resolvePromise(null));
  });
}
