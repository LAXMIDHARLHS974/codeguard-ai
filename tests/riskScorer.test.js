const { computeExplainableRiskScore } = require("../src/services/riskScorer");

describe("Risk Intelligence Engine", () => {
  test("returns score 0 and LOW tier when there are no findings", () => {
    const res = computeExplainableRiskScore([], { linesAdded: 5, linesRemoved: 2 });
    expect(res.score).toBe(0);
    expect(res.level).toBe("LOW");
    expect(res.breakdown.findingCounts.critical).toBe(0);
    expect(res.breakdown.explanation).toContain("No security or quality defects detected");
  });

  test("critical security finding produces CRITICAL risk tier", () => {
    const findings = [
      {
        severity: "critical",
        category: "security",
        title: "SQL Injection in User Auth",
        file: "src/auth.js",
        line: 25,
        confidence: 0.95,
      },
    ];

    const res = computeExplainableRiskScore(findings, { linesAdded: 20, linesRemoved: 5 });
    expect(res.score).toBeGreaterThanOrEqual(35);
    expect(res.level).toBe("CRITICAL");
    expect(res.breakdown.findingCounts.critical).toBe(1);
    expect(res.breakdown.exploitabilityFactor).toBe(1.25);
    expect(res.breakdown.primaryDrivers.length).toBeGreaterThan(0);
  });

  test("applies duplicate dampening so repeated medium issues do not over-penalize", () => {
    const singleMedium = [
      {
        severity: "medium",
        category: "quality",
        title: "Variable naming",
        file: "src/app.js",
        line: 1,
        confidence: 0.8,
      },
    ];

    const tenMediums = Array(10).fill({
      severity: "medium",
      category: "quality",
      title: "Variable naming",
      file: "src/app.js",
      line: 1,
      confidence: 0.8,
    });

    const resSingle = computeExplainableRiskScore(singleMedium);
    const resTen = computeExplainableRiskScore(tenMediums);

    // 10 repeated issues should be dampened, not 10x the single score
    expect(resTen.score).toBeLessThan(resSingle.score * 10);
    expect(resTen.score).toBeLessThanOrEqual(50);
  });

  test("factors code churn into blast radius penalty", () => {
    const findings = [
      {
        severity: "low",
        category: "quality",
        title: "Missing comment",
        file: "src/app.js",
        line: 10,
        confidence: 0.9,
      },
    ];

    const smallDiffRes = computeExplainableRiskScore(findings, {
      linesAdded: 10,
      linesRemoved: 5,
      filesChanged: 1,
    });

    const hugeDiffRes = computeExplainableRiskScore(findings, {
      linesAdded: 800,
      linesRemoved: 600,
      filesChanged: 25,
    });

    expect(hugeDiffRes.score).toBeGreaterThan(smallDiffRes.score);
    expect(hugeDiffRes.breakdown.churnPenalty).toBe(10);
  });
});
