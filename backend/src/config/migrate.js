import pool from "./db.js";

async function migrate() {
  console.log("[migrate] Starting migrations...");

  // Run each table as a separate query so a single connection drop
  // doesn't silently skip the remaining tables (Neon free tier auto-suspends).
  const tables = [
    {
      name: "users",
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email         VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at    TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: "executions",
      sql: `
        CREATE TABLE IF NOT EXISTS executions (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID REFERENCES users(id),
          language    VARCHAR(30) NOT NULL,
          code        TEXT NOT NULL,
          status      VARCHAR(20) DEFAULT 'QUEUED',
          output      TEXT,
          error       TEXT,
          duration_ms INTEGER,
          created_at  TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: "refresh_tokens",
      sql: `
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
          token_hash  VARCHAR(64) UNIQUE NOT NULL,
          expires_at  TIMESTAMPTZ NOT NULL,
          revoked_at  TIMESTAMPTZ,
          created_at  TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: "password_reset_tokens",
      sql: `
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
          token_hash  VARCHAR(64) UNIQUE NOT NULL,
          expires_at  TIMESTAMPTZ NOT NULL,
          used_at     TIMESTAMPTZ,
          created_at  TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
  ];

  for (const table of tables) {
    try {
      await pool.query(table.sql);
      console.log(`[migrate] ✓ ${table.name}`);
    } catch (err) {
      console.error(`[migrate] ✗ ${table.name}: ${err.message}`);
      throw err;
    }
  }

  console.log("[migrate] All tables ready.");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] Migration failed:", err.message);
    process.exit(1);
  });