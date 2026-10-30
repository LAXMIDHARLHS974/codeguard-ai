const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const config = require("../config/env");

async function runPostgresMigrations(connectionString) {
  const pool = new Pool({
    connectionString: connectionString || config.DATABASE_URL,
    ssl: config.isProduction ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    try {
      console.log("[DB Migrator] Running PostgreSQL schema migrations...");
      const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
      await client.query("BEGIN");
      await client.query(schemaSql);
      await client.query("COMMIT");
      console.log("[DB Migrator] PostgreSQL schema is up to date.");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[DB Migrator] Migration failed:", err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(`[DB Migrator] Could not connect to PostgreSQL: ${err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

module.exports = { runPostgresMigrations };
