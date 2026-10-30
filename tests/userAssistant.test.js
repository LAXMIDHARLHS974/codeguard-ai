const request = require("supertest");
const app = require("../server");

describe("User Profile, Assistant & Dashboard Stats API", () => {
  it("GET /api/user/profile should return current user profile with masked defaults", async () => {
    const res = await request(app).get("/api/user/profile");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("role");
  });

  it("PUT /api/user/profile should update user profile", async () => {
    const res = await request(app)
      .put("/api/user/profile")
      .send({
        name: "Laxmidhar Security",
        role: "Principal SecOps Architect",
        company: "CodeGuard AI Enterprise",
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Laxmidhar Security");
    expect(res.body.role).toBe("Principal SecOps Architect");
  });

  it("GET /api/user/sessions should list active sessions", async () => {
    const res = await request(app).get("/api/user/sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });

  it("GET /api/history/stats should return real aggregated dashboard statistics", async () => {
    const res = await request(app).get("/api/history/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalScans");
    expect(res.body).toHaveProperty("securityOverview");
    expect(res.body).toHaveProperty("riskTrend");
    expect(Array.isArray(res.body.riskTrend)).toBe(true);
    expect(Array.isArray(res.body.aiInsights)).toBe(true);
  });

  it("POST /api/assistant/chat should respond with defensive advice", async () => {
    const res = await request(app)
      .post("/api/assistant/chat")
      .send({
        message: "How do I prevent SQL injection in Node.js?",
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });
});
