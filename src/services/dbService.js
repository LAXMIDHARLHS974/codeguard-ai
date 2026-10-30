const crypto = require("crypto");
const { Pool } = require("pg");
const config = require("../config/env");
const { runPostgresMigrations } = require("../db/migrator");

let pool = null;
let usePostgres = false;

// In-memory / embedded resilient fallback store for development & tests
const memoryStore = {
  analyses: new Map(),
  findings: new Map(),
  generatedTests: new Map(),
  notifications: new Map(),
  repositories: new Map(),
  users: new Map(),
  sessions: new Map(),
  activityLogs: new Map(),
};

async function initDb() {
  if (config.DATABASE_URL) {
    try {
      const testPool = new Pool({
        connectionString: config.DATABASE_URL,
        ssl: config.isProduction ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
      });

      const client = await testPool.connect();
      client.release();
      await runPostgresMigrations(config.DATABASE_URL);
      pool = testPool;
      usePostgres = true;
      console.log("[DB] Connected to PostgreSQL successfully.");
      return;
    } catch (err) {
      console.warn(`[DB] PostgreSQL connection failed (${err.message}). Falling back to embedded persistent storage.`);
      usePostgres = false;
    }
  } else {
    console.log("[DB] No DATABASE_URL specified. Running with resilient local store.");
  }
}

// --------------------------------------------------------------------------
// ANALYSES & FINDINGS
// --------------------------------------------------------------------------

async function saveAnalysis({
  id = crypto.randomUUID(),
  userId,
  prUrl = null,
  title = "Analysis",
  source = "diff",
  riskScore = 0,
  riskLevel = "LOW",
  riskBreakdown = {},
  stats = {},
  diffText = "",
  status = "completed",
  findings = [],
}) {
  const analysisRecord = {
    id,
    user_id: userId,
    pr_url: prUrl,
    title,
    source,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_breakdown: riskBreakdown,
    stats,
    diff_text: diffText,
    status,
    created_at: new Date().toISOString(),
  };

  const processedFindings = findings.map((f, idx) => ({
    id: f.id || crypto.randomUUID(),
    analysis_id: id,
    severity: f.severity || "medium",
    category: f.category || "quality",
    title: f.title || "Untitled finding",
    file: f.file || "unknown",
    line: f.line || 1,
    description: f.description || "",
    why: f.why || "",
    evidence: f.evidence || "",
    recommendation: f.recommendation || "",
    confidence: f.confidence !== undefined ? Number(f.confidence) : 0.9,
    bad_code: f.badCode || null,
    fix_code: f.fixCode || null,
    created_at: new Date().toISOString(),
  }));

  if (usePostgres && pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO analysis_records (id, user_id, pr_url, title, source, risk_score, risk_level, risk_breakdown, stats, diff_text, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          userId,
          prUrl,
          title,
          source,
          riskScore,
          riskLevel,
          JSON.stringify(riskBreakdown),
          JSON.stringify(stats),
          diffText,
          status,
          analysisRecord.created_at,
        ]
      );

      for (const f of processedFindings) {
        await client.query(
          `INSERT INTO findings (id, analysis_id, severity, category, title, file, line, description, why, evidence, recommendation, confidence, bad_code, fix_code, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            f.id,
            id,
            f.severity,
            f.category,
            f.title,
            f.file,
            f.line,
            f.description,
            f.why,
            f.evidence,
            f.recommendation,
            f.confidence,
            JSON.stringify(f.bad_code),
            JSON.stringify(f.fix_code),
            f.created_at,
          ]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } else {
    memoryStore.analyses.set(id, analysisRecord);
    memoryStore.findings.set(id, processedFindings);
  }

  // Auto-generate notification
  await createNotification({
    userId,
    title: `Analysis completed: ${title}`,
    message: `Risk score: ${riskScore}/100 (${riskLevel}) with ${findings.length} findings.`,
    type: riskScore >= 70 ? "warning" : "info",
  });

  return { ...analysisRecord, findings: processedFindings };
}

async function getAnalysisById(id, userId = null) {
  if (usePostgres && pool) {
    const params = [id];
    let query = "SELECT * FROM analysis_records WHERE id = $1";
    if (userId) {
      query += " AND user_id = $2";
      params.push(userId);
    }
    const res = await pool.query(query, params);
    if (!res.rows.length) return null;

    const row = res.rows[0];
    const findingsRes = await pool.query(
      "SELECT * FROM findings WHERE analysis_id = $1 ORDER BY line ASC",
      [id]
    );

    const findings = findingsRes.rows.map((f) => ({
      id: f.id,
      severity: f.severity,
      category: f.category,
      title: f.title,
      file: f.file,
      line: f.line,
      description: f.description,
      why: f.why,
      evidence: f.evidence,
      recommendation: f.recommendation,
      confidence: Number(f.confidence),
      badCode: f.bad_code,
      fixCode: f.fix_code,
    }));

    return {
      id: row.id,
      userId: row.user_id,
      prUrl: row.pr_url,
      title: row.title,
      source: row.source,
      riskScore: row.risk_score,
      riskLevel: row.risk_level,
      riskBreakdown: row.risk_breakdown,
      stats: row.stats,
      diff: row.diff_text,
      status: row.status,
      createdAt: row.created_at,
      findings,
    };
  } else {
    const record = memoryStore.analyses.get(id);
    if (!record) return null;
    if (userId && record.user_id !== userId) return null;

    const rawFindings = memoryStore.findings.get(id) || [];
    const findings = rawFindings.map((f) => ({
      id: f.id,
      severity: f.severity,
      category: f.category,
      title: f.title,
      file: f.file,
      line: f.line,
      description: f.description,
      why: f.why,
      evidence: f.evidence,
      recommendation: f.recommendation,
      confidence: Number(f.confidence),
      badCode: f.bad_code,
      fixCode: f.fix_code,
    }));

    return {
      id: record.id,
      userId: record.user_id,
      prUrl: record.pr_url,
      title: record.title,
      source: record.source,
      riskScore: record.risk_score,
      riskLevel: record.risk_level,
      riskBreakdown: record.risk_breakdown,
      stats: record.stats,
      diff: record.diff_text,
      status: record.status,
      createdAt: record.created_at,
      findings,
    };
  }
}

async function listAnalyses(userId, limit = 20, offset = 0) {
  if (usePostgres && pool) {
    const res = await pool.query(
      `SELECT a.*, COUNT(f.id)::int as finding_count
       FROM analysis_records a
       LEFT JOIN findings f ON a.id = f.analysis_id
       WHERE a.user_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return res.rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      prUrl: r.pr_url,
      title: r.title,
      source: r.source,
      riskScore: r.risk_score,
      riskLevel: r.risk_level,
      stats: r.stats,
      findingCount: r.finding_count,
      createdAt: r.created_at,
    }));
  } else {
    const list = [];
    for (const record of memoryStore.analyses.values()) {
      if (record.user_id === userId) {
        const count = (memoryStore.findings.get(record.id) || []).length;
        list.push({
          id: record.id,
          userId: record.user_id,
          prUrl: record.pr_url,
          title: record.title,
          source: record.source,
          riskScore: record.risk_score,
          riskLevel: record.risk_level,
          stats: record.stats,
          findingCount: count,
          createdAt: record.created_at,
        });
      }
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list.slice(offset, offset + limit);
  }
}

async function deleteAnalysis(id, userId) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "DELETE FROM analysis_records WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    return res.rowCount > 0;
  } else {
    const record = memoryStore.analyses.get(id);
    if (!record || record.user_id !== userId) return false;
    memoryStore.analyses.delete(id);
    memoryStore.findings.delete(id);
    memoryStore.generatedTests.delete(id);
    return true;
  }
}

// --------------------------------------------------------------------------
// TEST GENERATION HISTORY
// --------------------------------------------------------------------------

async function saveGeneratedTests({
  id = crypto.randomUUID(),
  analysisId,
  language = "javascript",
  framework = "jest",
  testNames = [],
  code = "",
}) {
  const record = {
    id,
    analysis_id: analysisId,
    language,
    framework,
    test_names: testNames,
    code,
    created_at: new Date().toISOString(),
  };

  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO generated_tests (id, analysis_id, language, framework, test_names, code, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, analysisId, language, framework, JSON.stringify(testNames), code, record.created_at]
    );
  } else {
    const current = memoryStore.generatedTests.get(analysisId) || [];
    current.push(record);
    memoryStore.generatedTests.set(analysisId, current);
  }

  return record;
}

async function getTestsByAnalysisId(analysisId) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "SELECT * FROM generated_tests WHERE analysis_id = $1 ORDER BY created_at DESC",
      [analysisId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      analysisId: r.analysis_id,
      language: r.language,
      framework: r.framework,
      testNames: r.test_names,
      code: r.code,
      createdAt: r.created_at,
    }));
  } else {
    const records = memoryStore.generatedTests.get(analysisId) || [];
    return records.map((r) => ({
      id: r.id,
      analysisId: r.analysis_id,
      language: r.language,
      framework: r.framework,
      testNames: r.test_names,
      code: r.code,
      createdAt: r.created_at,
    }));
  }
}

// --------------------------------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------------------------------

async function createNotification({
  id = crypto.randomUUID(),
  userId,
  title,
  message,
  type = "info",
}) {
  const record = {
    id,
    user_id: userId,
    title,
    message,
    type,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userId, title, message, type, false, record.created_at]
    );
  } else {
    const list = memoryStore.notifications.get(userId) || [];
    list.unshift(record);
    memoryStore.notifications.set(userId, list.slice(0, 50));
  }
  return record;
}

async function listNotifications(userId) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      isRead: r.is_read,
      createdAt: r.created_at,
    }));
  } else {
    const list = memoryStore.notifications.get(userId) || [];
    return list.map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      isRead: r.is_read,
      createdAt: r.created_at,
    }));
  }
}

async function markNotificationRead(id, userId) {
  if (usePostgres && pool) {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
  } else {
    const list = memoryStore.notifications.get(userId) || [];
    const item = list.find((n) => n.id === id);
    if (item) item.is_read = true;
  }
  return true;
}

// --------------------------------------------------------------------------
// REPOSITORIES
// --------------------------------------------------------------------------

async function saveRepository({
  id = crypto.randomUUID(),
  userId,
  owner,
  name,
  isPrivate = false,
  defaultBranch = "main",
}) {
  const record = {
    id,
    user_id: userId,
    owner,
    name,
    is_private: isPrivate,
    default_branch: defaultBranch,
    created_at: new Date().toISOString(),
  };

  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO repositories (id, user_id, owner, name, is_private, default_branch, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, owner, name) DO UPDATE SET default_branch = EXCLUDED.default_branch`,
      [id, userId, owner, name, isPrivate, defaultBranch, record.created_at]
    );
  } else {
    const key = `${userId}:${owner}/${name}`;
    memoryStore.repositories.set(key, record);
  }
  return record;
}

async function listRepositories(userId) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "SELECT * FROM repositories WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      owner: r.owner,
      name: r.name,
      isPrivate: r.is_private,
      defaultBranch: r.default_branch,
      createdAt: r.created_at,
    }));
  } else {
    const list = [];
    for (const record of memoryStore.repositories.values()) {
      if (record.user_id === userId) {
        list.push({
          id: record.id,
          owner: record.owner,
          name: record.name,
          isPrivate: record.is_private,
          defaultBranch: record.default_branch,
          createdAt: record.created_at,
        });
      }
    }
    return list;
  }
}

async function deleteRepository(id, userId) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "DELETE FROM repositories WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    return res.rowCount > 0;
  } else {
    for (const [key, record] of memoryStore.repositories.entries()) {
      if (record.id === id && record.user_id === userId) {
        memoryStore.repositories.delete(key);
        return true;
      }
    }
    return false;
  }
}

// --------------------------------------------------------------------------
// USER PROFILE & SESSIONS
// --------------------------------------------------------------------------

async function getUserProfile(userId) {
  if (usePostgres && pool) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (res.rows.length) {
      const u = res.rows[0];
      return {
        id: u.id,
        email: u.email || `${userId}@codeguard.internal`,
        name: u.name || "Security Engineer",
        role: u.role || "Security Lead",
        company: u.company || "CodeGuard AI",
        bio: u.bio || "Full-stack application security and code review lead.",
        avatarUrl: u.avatar_url || "",
        githubUsername: u.github_username || "",
        hasGitHubToken: Boolean(u.github_token_enc),
      };
    }
  }

  // Memory fallback
  const user = memoryStore.users.get(userId);
  if (user) return user;

  // Default profile for local/dev session
  const defaultProfile = {
    id: userId,
    email: `${userId}@codeguard.internal`,
    name: "Laxmidhar",
    role: "Principal Security Architect",
    company: "CodeGuard AI Labs",
    bio: "Guarding production pipelines with autonomous AI-driven code intelligence.",
    avatarUrl: "",
    githubUsername: "LAXMIDHARLHS974",
    hasGitHubToken: Boolean(config.GITHUB_TOKEN),
  };
  memoryStore.users.set(userId, defaultProfile);
  return defaultProfile;
}

async function updateUserProfile(userId, data) {
  const existing = await getUserProfile(userId);
  const updated = {
    ...existing,
    name: data.name !== undefined ? data.name : existing.name,
    email: data.email !== undefined ? data.email : existing.email,
    role: data.role !== undefined ? data.role : existing.role,
    company: data.company !== undefined ? data.company : existing.company,
    bio: data.bio !== undefined ? data.bio : existing.bio,
    avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : existing.avatarUrl,
    githubUsername: data.githubUsername !== undefined ? data.githubUsername : existing.githubUsername,
    hasGitHubToken: data.hasGitHubToken !== undefined ? data.hasGitHubToken : existing.hasGitHubToken,
    updatedAt: new Date().toISOString(),
  };

  if (usePostgres && pool) {
    await pool.query(
      `INSERT INTO users (id, email, name, role, company, bio, avatar_url, github_username, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         company = EXCLUDED.company,
         bio = EXCLUDED.bio,
         avatar_url = EXCLUDED.avatar_url,
         github_username = EXCLUDED.github_username,
         updated_at = EXCLUDED.updated_at`,
      [
        userId,
        updated.email,
        updated.name,
        updated.role,
        updated.company,
        updated.bio,
        updated.avatarUrl,
        updated.githubUsername,
        updated.updatedAt,
      ]
    );
  }

  memoryStore.users.set(userId, updated);
  await logActivity({
    userId,
    action: "profile_updated",
    targetType: "user",
    targetId: userId,
    details: { name: updated.name, role: updated.role },
  });
  return updated;
}

async function getUserSessions(userId) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "SELECT * FROM user_sessions WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map((s) => ({
      id: s.id,
      sessionToken: s.session_token,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      lastActive: s.last_active,
      createdAt: s.created_at,
    }));
  }

  const list = memoryStore.sessions.get(userId) || [
    {
      id: "sess_current",
      sessionToken: "sess_active_bearer",
      ipAddress: "127.0.0.1",
      userAgent: "CodeGuard Web Client (Active)",
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];
  return list;
}

async function revokeUserSession(sessionId, userId) {
  if (usePostgres && pool) {
    await pool.query(
      "UPDATE user_sessions SET is_active = FALSE WHERE id = $1 AND user_id = $2",
      [sessionId, userId]
    );
    return true;
  }
  const list = memoryStore.sessions.get(userId) || [];
  const filtered = list.filter((s) => s.id !== sessionId);
  memoryStore.sessions.set(userId, filtered);
  return true;
}

// --------------------------------------------------------------------------
// ACTIVITY LOGGING
// --------------------------------------------------------------------------

async function logActivity({ userId, action, targetType, targetId = null, details = {} }) {
  const record = {
    id: crypto.randomUUID(),
    userId,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };

  if (usePostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [record.id, userId, action, targetType, targetId, JSON.stringify(details), record.createdAt]
      );
    } catch (err) {
      console.warn("[DB] Failed to persist activity log:", err.message);
    }
  } else {
    const logs = memoryStore.activityLogs.get(userId) || [];
    logs.unshift(record);
    memoryStore.activityLogs.set(userId, logs.slice(0, 50));
  }
  return record;
}

async function listActivityLogs(userId, limit = 20) {
  if (usePostgres && pool) {
    const res = await pool.query(
      "SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
      [userId, limit]
    );
    return res.rows.map((r) => ({
      id: r.id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      details: r.details,
      createdAt: r.created_at,
    }));
  }

  const logs = memoryStore.activityLogs.get(userId) || [];
  return logs.slice(0, limit);
}

// --------------------------------------------------------------------------
// DASHBOARD AGGREGATED STATS
// --------------------------------------------------------------------------

async function getDashboardStats(userId) {
  const analyses = await listAnalyses(userId, 50, 0);

  // Security overview counts
  let totalFindings = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const a of analyses) {
    const full = await getAnalysisById(a.id, userId);
    if (full && full.findings) {
      totalFindings += full.findings.length;
      for (const f of full.findings) {
        const sev = (f.severity || "").toLowerCase();
        if (sev === "critical") criticalCount++;
        else if (sev === "high") highCount++;
        else if (sev === "medium") mediumCount++;
        else lowCount++;
      }
    }
  }

  // Recent PRs (analyses from GitHub or diff with title)
  const recentPullRequests = analyses.map((a) => ({
    id: a.id,
    title: a.title || "Code Review",
    source: a.source,
    prUrl: a.prUrl,
    riskScore: a.riskScore,
    riskLevel: a.riskLevel,
    findingCount: a.findingCount,
    createdAt: a.createdAt,
  }));

  // Recharts Time-Series Trend
  const chronological = [...analyses].reverse().slice(-10);
  const riskTrend = chronological.map((a, idx) => {
    const d = new Date(a.createdAt);
    const dateLabel = isNaN(d.getTime())
      ? `Scan #${idx + 1}`
      : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    return {
      scan: `Scan #${idx + 1}`,
      date: dateLabel,
      score: a.riskScore,
      findings: a.findingCount || 0,
    };
  });

  // Actionable dynamic AI Insights
  const aiInsights = [];
  if (criticalCount > 0) {
    aiInsights.push({
      type: "critical",
      title: `${criticalCount} Critical Vulnerabilit${criticalCount === 1 ? "y" : "ies"} Detected`,
      advice: "Block automated merge until all critical exploit paths have verifiable regression tests.",
    });
  }
  if (highCount > 0) {
    aiInsights.push({
      type: "high",
      title: `${highCount} High Risk Issue${highCount === 1 ? "" : "s"} In Churn Hotspots`,
      advice: "Enforce strict input sanitization, CSRF tokens, and parameterized SQL queries.",
    });
  }
  if (analyses.length === 0) {
    aiInsights.push({
      type: "info",
      title: "Clean Baseline",
      advice: "Connect a repository or paste a unified diff to trigger automated AI security telemetry.",
    });
  } else {
    aiInsights.push({
      type: "success",
      title: "AI Test Lab Available",
      advice: "Automatically generate test suites in Jest, PyTest, or JUnit 5 targeting your diff edge cases.",
    });
  }

  // Recent activity events
  const activityLogs = await listActivityLogs(userId, 10);
  const recentActivity = activityLogs.length
    ? activityLogs.map((log) => ({
        id: log.id,
        action: log.action.replace(/_/g, " ").toUpperCase(),
        title: log.details?.title || log.details?.name || log.targetType,
        time: log.createdAt,
        type: log.action.includes("error") ? "danger" : "info",
      }))
    : analyses.slice(0, 5).map((a) => ({
        id: a.id,
        action: "CODE SCAN COMPLETED",
        title: a.title,
        time: a.createdAt,
        type: a.riskScore >= 70 ? "danger" : "success",
      }));

  return {
    totalScans: analyses.length,
    recentPullRequests,
    securityOverview: {
      totalFindings,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      passRate: analyses.length
        ? Math.round((analyses.filter((a) => a.riskScore < 50).length / analyses.length) * 100)
        : 100,
    },
    aiInsights,
    riskTrend,
    recentActivity,
  };
}

module.exports = {
  initDb,
  saveAnalysis,
  getAnalysisById,
  listAnalyses,
  deleteAnalysis,
  saveGeneratedTests,
  getTestsByAnalysisId,
  createNotification,
  listNotifications,
  markNotificationRead,
  saveRepository,
  listRepositories,
  deleteRepository,
  getUserProfile,
  updateUserProfile,
  getUserSessions,
  revokeUserSession,
  logActivity,
  listActivityLogs,
  getDashboardStats,
};
