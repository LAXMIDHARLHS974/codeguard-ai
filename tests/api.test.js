const request = require("supertest");
const app = require("../server");
const dbService = require("../src/services/dbService");

describe("CodeGuard AI — Backend API Endpoints", () => {
  beforeAll(async () => {
    await dbService.initDb();
  });

  describe("Health & Probes", () => {
    test("GET /api/health returns 200 with status metrics", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.status).toBe("healthy");
      expect(res.body.version).toBe("2.0.0");
      expect(typeof res.body.uptime).toBe("number");
    });

    test("GET /api/ready returns 200 readiness probe", async () => {
      const res = await request(app).get("/api/ready");
      expect(res.status).toBe(200);
      expect(res.body.ready).toBe(true);
    });
  });

  describe("Analysis Input Validation", () => {
    test("POST /api/analyze/pr returns 400 when prUrl is missing or invalid", async () => {
      const res = await request(app).post("/api/analyze/pr").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    test("POST /api/analyze/pr returns 400 on non-github URL", async () => {
      const res = await request(app)
        .post("/api/analyze/pr")
        .send({ prUrl: "https://gitlab.com/repo/project/pull/1" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Only github.com repository URLs are supported");
    });

    test("POST /api/analyze/diff returns 400 when diff is missing", async () => {
      const res = await request(app).post("/api/analyze/diff").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    test("POST /api/analyze/diff returns 400 when diff is empty string", async () => {
      const res = await request(app).post("/api/analyze/diff").send({ diff: "   " });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed|diff text is required/i);
    });
  });

  describe("Test Generation Validation & Analysis Persistence", () => {
    test("POST /api/tests/generate returns 400 when neither analysisId nor diff is supplied", async () => {
      const res = await request(app).post("/api/tests/generate").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("No diff available for test generation");
    });

    test("POST /api/tests/generate returns 404 when non-existent analysisId is supplied", async () => {
      const res = await request(app)
        .post("/api/tests/generate")
        .send({ analysisId: "non-existent-id-000" });
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found or you are not authorized");
    });
  });

  describe("Tenant Isolation & Analysis History API", () => {
    test("History is strictly isolated per session / user", async () => {
      const sessionA = "test-session-tenant-a";
      const sessionB = "test-session-tenant-b";

      // Seed an analysis record directly into DB for tenant A
      await dbService.saveAnalysis({
        id: "analysis-record-a",
        userId: sessionA,
        title: "PR Review for Tenant A",
        source: "github",
        riskScore: 20,
        riskLevel: "LOW",
        findings: [],
      });

      // Tenant A requests history -> should find the analysis
      const resA = await request(app)
        .get("/api/history")
        .set("X-Session-Id", sessionA);

      expect(resA.status).toBe(200);
      expect(resA.body.history.some((h) => h.id === "analysis-record-a")).toBe(true);

      // Tenant B requests history -> should NOT see Tenant A's analysis
      const resB = await request(app)
        .get("/api/history")
        .set("X-Session-Id", sessionB);

      expect(resB.status).toBe(200);
      expect(resB.body.history.some((h) => h.id === "analysis-record-a")).toBe(false);

      // Tenant B requests direct detail for Tenant A's analysis -> 404 unauthorized
      const directB = await request(app)
        .get("/api/history/analysis-record-a")
        .set("X-Session-Id", sessionB);

      expect(directB.status).toBe(404);
    });
  });

  describe("Workspace Repositories & Notifications", () => {
    test("POST & GET /api/workspace/repositories", async () => {
      const session = "test-session-repos";

      const createRes = await request(app)
        .post("/api/workspace/repositories")
        .set("X-Session-Id", session)
        .send({ owner: "octocat", name: "Hello-World", isPrivate: false });

      expect(createRes.status).toBe(201);
      expect(createRes.body.owner).toBe("octocat");
      expect(createRes.body.name).toBe("Hello-World");

      const listRes = await request(app)
        .get("/api/workspace/repositories")
        .set("X-Session-Id", session);

      expect(listRes.status).toBe(200);
      expect(listRes.body.repositories.length).toBeGreaterThan(0);
      expect(listRes.body.repositories[0].name).toBe("Hello-World");
    });

    test("GET /api/workspace/session returns current user context", async () => {
      const res = await request(app)
        .get("/api/workspace/session")
        .set("X-Session-Id", "session-guest-1");

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe("session-guest-1");
      expect(typeof res.body.isGuest).toBe("boolean");
    });
  });
});
