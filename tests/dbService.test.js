const dbService = require("../src/services/dbService");

describe("Database & Persistence Service", () => {
  beforeAll(async () => {
    await dbService.initDb();
  });

  test("saves and retrieves an analysis record with findings", async () => {
    const analysisId = "test-analysis-101";
    const userId = "user-alice";

    const saved = await dbService.saveAnalysis({
      id: analysisId,
      userId,
      prUrl: "https://github.com/org/repo/pull/1",
      title: "Add Payment Gateway",
      source: "github",
      riskScore: 65,
      riskLevel: "HIGH",
      riskBreakdown: { severityScore: 50 },
      stats: { filesChanged: 3, linesAdded: 50, linesRemoved: 10 },
      diffText: "sample diff content",
      findings: [
        {
          id: "f-1",
          severity: "high",
          category: "security",
          title: "Insecure Key Storage",
          file: "src/pay.js",
          line: 42,
          description: "Secret hardcoded",
          why: "Key exposed to attackers",
          evidence: "const key = 'secret'",
          recommendation: "Use environment variable",
          confidence: 0.95,
        },
      ],
    });

    expect(saved.id).toBe(analysisId);
    expect(saved.user_id).toBe(userId);

    const fetched = await dbService.getAnalysisById(analysisId, userId);
    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(analysisId);
    expect(fetched.riskScore).toBe(65);
    expect(fetched.findings.length).toBe(1);
    expect(fetched.findings[0].title).toBe("Insecure Key Storage");
    expect(fetched.findings[0].evidence).toBe("const key = 'secret'");
  });

  test("enforces tenant data isolation between users", async () => {
    const analysisId = "test-analysis-alice-private";
    const userAlice = "user-alice";
    const userBob = "user-bob";

    await dbService.saveAnalysis({
      id: analysisId,
      userId: userAlice,
      title: "Confidential Internal PR",
      findings: [],
    });

    // Bob attempts to fetch Alice's analysis
    const bobAccess = await dbService.getAnalysisById(analysisId, userBob);
    expect(bobAccess).toBeNull();

    // Bob lists history -> Alice's record must not appear in Bob's history
    const bobHistory = await dbService.listAnalyses(userBob);
    const foundInBob = bobHistory.some((item) => item.id === analysisId);
    expect(foundInBob).toBe(false);

    // Alice lists history -> record appears
    const aliceHistory = await dbService.listAnalyses(userAlice);
    const foundInAlice = aliceHistory.some((item) => item.id === analysisId);
    expect(foundInAlice).toBe(true);
  });

  test("saves and retrieves generated test suites", async () => {
    const analysisId = "test-analysis-for-tests";
    await dbService.saveGeneratedTests({
      analysisId,
      language: "javascript",
      framework: "jest",
      testNames: ["test_auth_success()", "test_auth_failure()"],
      code: "describe('auth', () => {});",
    });

    const testRecords = await dbService.getTestsByAnalysisId(analysisId);
    expect(testRecords.length).toBeGreaterThan(0);
    expect(testRecords[0].language).toBe("javascript");
    expect(testRecords[0].testNames).toEqual(["test_auth_success()", "test_auth_failure()"]);
  });

  test("manages notifications lifecycle", async () => {
    const userId = "user-charlie";
    const notif = await dbService.createNotification({
      userId,
      title: "Scan Complete",
      message: "No critical vulnerabilities found.",
      type: "info",
    });

    expect(notif.is_read).toBe(false);

    let list = await dbService.listNotifications(userId);
    expect(list.some((n) => n.id === notif.id)).toBe(true);

    await dbService.markNotificationRead(notif.id, userId);
    list = await dbService.listNotifications(userId);
    const updated = list.find((n) => n.id === notif.id);
    expect(updated.isRead).toBe(true);
  });
});
