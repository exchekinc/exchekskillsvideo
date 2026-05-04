// Derive a narration script from the view-model.
//
// Constraints:
//   - Target ~22 words for a 9-second template, ~30 for 12-second training.
//     ElevenLabs narration averages ~2.5 words/sec at conversational pace.
//   - Avoid raw codes (ECCNs, USML cats) being read character-by-character.
//     The model TTS will pronounce "6A993.a" as "six-a-niner-niner-three
//     dot a" if we don't massage it. Wrap codes with SSML phoneme guidance
//     when supported, otherwise rely on the natural pause around dashes.
//   - Lead with the determination, not the brand. The video itself shows
//     "ExChek" in the brand bar; the audio is for the substance.
//   - Never embed PII or unverified data the .docx doesn't already contain.

const TEMPLATE_BUDGETS = {
  "risk-triage": 22,
  "classification": 22,
  "red-flag": 22,
  "compliance-report-card": 22,
  "training": 32,
};

export function deriveNarrationScript(view, templateName) {
  const budget = TEMPLATE_BUDGETS[templateName] ?? 22;
  const writer = WRITERS[templateName] || WRITERS.default;
  const raw = writer(view);
  return clampWords(raw, budget);
}

const WRITERS = {
  "risk-triage": (v) => {
    const risk = v?.risk?.label || "Review";
    const dets = v?.determinations || [];
    // Skip determinations that are essentially the risk-level row again,
    // otherwise the narration repeats itself ("Risk Medium. Medium.").
    const supporting = dets.find(
      (d) =>
        !/risk/i.test(d.label || "") &&
        String(d.value || "").toLowerCase() !== String(risk).toLowerCase(),
    );
    const action = v?.actions?.[0] || dets.find((d) => /recommend/i.test(d.label))?.value || "review";
    return `Risk triage. Overall risk ${risk}.${supporting ? " " + supporting.value + "." : ""} Recommendation: ${action}.`;
  },
  "classification": (v) => {
    const dets = v?.determinations || [];
    const eccn = (dets.find((d) => /eccn|usml|class/i.test(d.label)) || dets[0])?.value || "";
    const juris = (dets.find((d) => /juris/i.test(d.label)) || {}).value || "";
    const lreq = (dets.find((d) => /license.*req/i.test(d.label)) || {}).value || "";
    return `Export classification. ${eccn ? "Code " + spokenCode(eccn) + ". " : ""}${juris ? juris + " jurisdiction. " : ""}${lreq ? "License " + lreq + "." : ""}`;
  },
  "red-flag": (v) => {
    const flags = v?.flags || [];
    const high = flags.filter((f) => f.severity === "high").length;
    const med = flags.filter((f) => f.severity === "medium").length;
    const total = flags.length;
    const headline = total === 0 ? "No indicators tripped." : `${total} indicators tripped${high ? ", " + high + " high severity" : ""}.`;
    const action = v?.actions?.[0] || "Halt and escalate.";
    return `Red flag assessment. ${headline} ${action}`;
  },
  "compliance-report-card": (v) => {
    const grade = (v?.determinations?.find((d) => /grade|overall/i.test(d.label)) || v?.determinations?.[0])?.value || "";
    const concern = v?.flags?.[0]?.label || "";
    return `Compliance report card. ${grade ? "Overall grade " + grade + ". " : ""}${concern ? "Top concern: " + concern + "." : "No major concerns."}`;
  },
  "training": (v) => {
    const head = v?.headline || "Compliance lesson.";
    const dets = v?.determinations || [];
    const k1 = dets[0]?.value || "";
    const cfr = v?.citations?.[0]?.cfr || "";
    const action = v?.actions?.[0] || "";
    return `Lesson: ${head}. Key point: ${k1}. ${cfr ? "Reference: " + cfr + ". " : ""}${action ? "Next: " + action + "." : ""}`;
  },
  default: (v) => {
    const head = v?.headline || "Compliance summary";
    const sub = v?.subhead || "";
    return `${head}. ${sub}`;
  },
};

// "6A993.a" → "6 A 9 9 3 dot a" (ish). ElevenLabs pronounces letters
// individually when separated by spaces; this gives us a more natural read
// without needing full SSML.
function spokenCode(s) {
  if (!s) return "";
  return String(s)
    .replace(/\./g, " dot ")
    .replace(/-/g, " dash ")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function clampWords(s, max) {
  const words = String(s).replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= max) return words.join(" ");
  // Cut on a sentence boundary if we can find one near the budget.
  const head = words.slice(0, max);
  const joined = head.join(" ");
  const lastPeriod = joined.lastIndexOf(".");
  if (lastPeriod > joined.length * 0.6) return joined.slice(0, lastPeriod + 1);
  return joined.replace(/[,;:]?$/, ".");
}

export const __test = { spokenCode, clampWords };
