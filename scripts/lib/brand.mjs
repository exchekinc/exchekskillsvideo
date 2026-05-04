// Brand tokens for ExChek video output.
// These are the only "brand" values the bridge layer enforces; templates may
// override visually but should consume these tokens by default for consistency.

export const BRAND = {
  name: "ExChek",
  productLine: "ExChekSkills Video",
  colors: {
    bg: "#0B1020",
    bgGradientEnd: "#131B36",
    surface: "#161E3A",
    surfaceMuted: "#1F2950",
    text: "#F5F7FF",
    textMuted: "#A8B0D6",
    // ExChek brand purple is the canonical accent. A lighter tint is used
    // wherever pure brand has too little contrast on the dark navy stage
    // (small text, fine strokes, gradient end-stops).
    accent: "#411992",
    accentTint: "#7C4FE0",
    accentGlow: "#A584FF",
    accentSecondary: "#7C4FE0",
    success: "#3DD68C",
    warn: "#F6B73C",
    danger: "#FF5C7A",
    grid: "rgba(255,255,255,0.06)",
  },
  fonts: {
    sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
  },
  riskColor(level) {
    const k = String(level || "").toLowerCase();
    if (k === "high" || k === "critical") return this.colors.danger;
    if (k === "medium" || k === "moderate") return this.colors.warn;
    if (k === "low") return this.colors.success;
    return this.colors.textMuted;
  },
  disclosureLine() {
    return "Generated with ExChek Skills Video Engine. Learn more at exchek.us";
  },
  // Required by Anthropic's responsible-AI guidance and a useful signal for
  // viewers who may not realize the content is auto-generated. Rendered
  // separately from the audit-of-record line so the regulatory pointer
  // doesn't get diluted.
  aiDisclaimer() {
    return "AI can make mistakes — please double-check responses.";
  },
};
