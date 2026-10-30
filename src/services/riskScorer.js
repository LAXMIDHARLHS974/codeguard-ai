/**
 * CodeGuard AI — Multidimensional Risk Intelligence Engine
 * Computes an explainable risk score (0-100) based on severity, exploitability,
 * confidence weighting, duplicate dampening, and code churn blast radius.
 */

const SEVERITY_BASE = {
  critical: 35,
  high: 20,
  medium: 8,
  low: 2,
};

const CATEGORY_MULTIPLIERS = {
  security: 1.25, // Security issues have highest exploitability & impact
  bugs: 1.1,      // Logic errors and crashes have high operational impact
  quality: 0.8,   // Code quality and maintainability
  testing: 0.7,   // Missing tests
};

function computeExplainableRiskScore(findings = [], stats = {}) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return {
      score: 0,
      level: "LOW",
      breakdown: {
        severityScore: 0,
        exploitabilityFactor: 1.0,
        churnPenalty: 0,
        confidenceWeighted: true,
        findingCounts: { critical: 0, high: 0, medium: 0, low: 0 },
        primaryDrivers: [],
        explanation: "No security or quality defects detected in the analyzed changes.",
        disclaimer: "The risk score reflects automated static heuristic analysis and does not guarantee complete application security.",
      },
    };
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  const categoryCounts = {};
  let totalWeightedSeverity = 0;
  const drivers = [];

  // Group findings to calculate dampening
  const seenTypes = new Map();

  for (const f of findings) {
    const sev = (f.severity || "medium").toLowerCase();
    const cat = (f.category || "quality").toLowerCase();
    const conf = Math.max(0.1, Math.min(1.0, Number(f.confidence) || 0.9));

    if (counts[sev] !== undefined) {
      counts[sev]++;
    } else {
      counts.medium++;
    }

    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const baseWeight = SEVERITY_BASE[sev] || SEVERITY_BASE.medium;
    const catMult = CATEGORY_MULTIPLIERS[cat] || 1.0;

    // Duplicate dampening: repeated issues of same category+severity have diminishing impact
    const dedupKey = `${sev}:${cat}`;
    const occ = (seenTypes.get(dedupKey) || 0) + 1;
    seenTypes.set(dedupKey, occ);
    const dampeningFactor = 1 / Math.sqrt(occ);

    // Confidence weighting: scales between 50% and 100% of base weight
    const confFactor = 0.5 + 0.5 * conf;

    const findingScore = baseWeight * catMult * confFactor * dampeningFactor;
    totalWeightedSeverity += findingScore;

    if (sev === "critical" || sev === "high") {
      drivers.push(`[${sev.toUpperCase()}] ${f.title || "Vulnerability"} in ${f.file || "source"}`);
    }
  }

  // Code churn blast radius (churn penalty capped at 12 points)
  const linesAdded = Number(stats.linesAdded) || 0;
  const linesRemoved = Number(stats.linesRemoved) || 0;
  const filesChanged = Number(stats.filesChanged) || 1;
  const totalChurn = linesAdded + linesRemoved;

  let churnPenalty = 0;
  if (totalChurn > 1000 || filesChanged > 20) {
    churnPenalty = 10;
  } else if (totalChurn > 400 || filesChanged > 8) {
    churnPenalty = 6;
  } else if (totalChurn > 150) {
    churnPenalty = 3;
  }

  // Final score clamping
  const rawScore = totalWeightedSeverity + churnPenalty;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Risk Level Classification
  let level = "LOW";
  if (finalScore >= 75 || counts.critical > 0) {
    level = "CRITICAL";
  } else if (finalScore >= 50 || counts.high >= 2) {
    level = "HIGH";
  } else if (finalScore >= 25) {
    level = "MEDIUM";
  }

  // Explanation narrative
  let explanation = "";
  if (counts.critical > 0) {
    explanation = `High-risk code change: ${counts.critical} critical issue${counts.critical > 1 ? "s" : ""} requiring immediate remediation before merge.`;
  } else if (counts.high > 0) {
    explanation = `Elevated risk: ${counts.high} high-severity issue${counts.high > 1 ? "s" : ""} identified. Detailed peer review is strongly recommended.`;
  } else if (counts.medium > 0) {
    explanation = `Moderate risk: ${counts.medium} medium-severity finding${counts.medium > 1 ? "s" : ""} detected.`;
  } else {
    explanation = "Low risk: minor or no code defects detected.";
  }

  return {
    score: finalScore,
    level,
    breakdown: {
      severityScore: Math.round(totalWeightedSeverity),
      exploitabilityFactor: categoryCounts.security ? 1.25 : 1.0,
      churnPenalty,
      confidenceWeighted: true,
      findingCounts: counts,
      primaryDrivers: drivers.slice(0, 5),
      explanation,
      disclaimer: "The risk score reflects automated static heuristic analysis and does not guarantee complete application security.",
    },
  };
}

module.exports = {
  computeExplainableRiskScore,
  SEVERITY_BASE,
  CATEGORY_MULTIPLIERS,
};
