// Maps an exchekskills JSON sibling (schema_version 1.0.0) onto the variables
// a HyperFrames composition expects. Every template gets the same `view` shape
// regardless of the source skill, so templates can be authored against a stable
// contract.

import { BRAND } from "./brand.mjs";

const SKILL_TO_TEMPLATE = {
  "exchek-risk-triage": "risk-triage",
  "exchek-classify": "classification",
  "exchek-red-flag-assessment": "red-flag",
  "exchek-compliance-report": "compliance-report-card",
  "exchek-csl": "red-flag",
  "exchek-license": "classification",
  "exchek-jurisdiction": "classification",
  "exchek-country-risk": "red-flag",
};

export function pickTemplate(report, override) {
  if (override) return override;
  const name = report?.skill?.name;
  if (name && SKILL_TO_TEMPLATE[name]) return SKILL_TO_TEMPLATE[name];
  // Fall back to risk-triage as the most generic executive-summary layout.
  return "risk-triage";
}

function pluck(obj, path, fallback) {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj) ?? fallback;
}

function topDeterminations(report, n = 4) {
  const dets = Array.isArray(report?.determinations) ? report.determinations : [];
  return dets.slice(0, n).map((d) => ({
    label: d.field || d.label || d.kind || "Determination",
    value: d.value || d.result || d.code || "—",
    confidence: d.confidence ?? null,
    citation: d.citation || (Array.isArray(d.citations) ? d.citations[0] : null) || null,
  }));
}

function topFlags(report, n = 5) {
  const flags = Array.isArray(report?.risk_flags) ? report.risk_flags : [];
  return flags.slice(0, n).map((f) => ({
    severity: (f.severity || f.level || "info").toString().toLowerCase(),
    label: f.label || f.title || f.code || "Flag",
    detail: f.detail || f.note || f.description || "",
  }));
}

function topCitations(report, n = 4) {
  const cites = Array.isArray(report?.citations) ? report.citations : [];
  return cites.slice(0, n).map((c) => ({
    cfr: c.cfr || c.part || c.section || "",
    url: c.url || c.href || "",
    pulled_at: c.pulled_at || pluck(report, "regulatory_currency.ecfr_pulled_at", null),
  }));
}

function topActions(report, n = 4) {
  const acts = Array.isArray(report?.next_actions) ? report.next_actions : [];
  return acts.slice(0, n).map((a) => (typeof a === "string" ? a : a.action || a.title || ""));
}

function shortHash(report) {
  return pluck(report, "generated.input_hash", null);
}

export function mapReportToView(report, opts = {}) {
  const skillName = pluck(report, "skill.name", "exchek-skill");
  const platform = pluck(report, "generated.platform", "Claude");
  const model = pluck(report, "generated.model", "Claude");
  const generatedAt = pluck(report, "generated.at", new Date().toISOString());
  const cfrParts = pluck(report, "regulatory_currency.cfr_parts", []) || [];
  const ecfrPulled = pluck(report, "regulatory_currency.ecfr_pulled_at", null);
  const dets = topDeterminations(report);
  const flags = topFlags(report);
  const cites = topCitations(report);
  const acts = topActions(report);

  // Best-effort overall risk level for templates that show a single gauge.
  const riskFromDet = dets.find((d) => /risk/i.test(d.label || ""))?.value;
  const overallRisk = (
    opts.risk ||
    riskFromDet ||
    pluck(report, "determinations.0.value", null) ||
    "review"
  )
    .toString()
    .toLowerCase();

  return {
    brand: {
      name: BRAND.name,
      productLine: BRAND.productLine,
      disclosure: BRAND.disclosureLine(),
      colors: BRAND.colors,
      riskColor: BRAND.riskColor(overallRisk),
    },
    meta: {
      skill: skillName,
      platform,
      model,
      generatedAt,
      generatedAtPretty: prettyDate(generatedAt),
      inputHash: shortHash(report),
      schemaVersion: pluck(report, "schema_version", "1.0.0"),
      cfrParts,
      ecfrPulledAt: ecfrPulled,
      ecfrPulledAtPretty: prettyDate(ecfrPulled),
    },
    headline: opts.headline || deriveHeadline(report, dets, overallRisk),
    subhead: opts.subhead || deriveSubhead(report, dets),
    risk: {
      level: overallRisk,
      label: titleCase(overallRisk),
      color: BRAND.riskColor(overallRisk),
    },
    determinations: dets,
    flags,
    citations: cites,
    actions: acts,
    privacy: {
      tier: pluck(report, "privacy_attestation.tier", "standard"),
      attestedBy: pluck(report, "privacy_attestation.attested_by", null),
      cui: pluck(report, "cui_check.cui", false),
      classified: pluck(report, "cui_check.classified", false),
    },
    docxBasename: pluck(report, "report.docx_basename", null),
  };
}

function prettyDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toUTCString().replace(" GMT", " UTC");
  } catch {
    return iso;
  }
}

function titleCase(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function deriveHeadline(report, dets, risk) {
  const skill = pluck(report, "skill.name", "");
  if (skill === "exchek-risk-triage") return `Risk Triage — ${titleCase(risk)}`;
  if (skill === "exchek-classify") {
    const eccn = dets.find((d) => /eccn/i.test(d.label));
    return eccn ? `Classification — ${eccn.value}` : "Export Classification";
  }
  if (skill === "exchek-red-flag-assessment") return "Red-Flag Assessment";
  if (skill === "exchek-compliance-report") return "Compliance Report Card";
  return titleCase(skill.replace(/^exchek-/, "").replace(/-/g, " "));
}

function deriveSubhead(report, dets) {
  if (dets.length === 0) return "Executive summary";
  const top = dets[0];
  return `${top.label}: ${top.value}`;
}
