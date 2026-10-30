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
};
