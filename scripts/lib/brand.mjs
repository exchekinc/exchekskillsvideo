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
    accent: "#5B8DEF",
    accentSecondary: "#9B6CF2",
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
    return "Generated with ExChekSkills + Claude. Video is a summary only — see the .docx for the audit-of-record.";
  },
};
