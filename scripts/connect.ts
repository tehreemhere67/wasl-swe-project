/**
 * Standalone database connection for the Node scripts (`db:migrate`, `db:seed`).
 *
 * The Next.js app uses `src/lib/db/index.ts`. Scripts cannot import that file
 * because it is marked server-only, so this small helper opens the same
 * database with the same driver choice:
 *   - DATABASE_URL set  -> real PostgreSQL through `pg`
 *   - otherwise         -> embedded PostgreSQL (PGlite) in PGLITE_DIR
 */

import { MIGRATIONS } from "../src/lib/db/migrations.ts";

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface ScriptDb {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export async function connect(): Promise<ScriptDb> {
  const url = process.env.DATABASE_URL?.trim();

  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
    return {
      async query<T = Record<string, unknown>>(sql: string, params?: unknown[]) {
        const result = await pool.query(sql, params);
        return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
      },
      async exec(sql: string) {
        await pool.query(sql);
      },
      async close() {
        await pool.end();
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  const dataDir = process.env.PGLITE_DIR || ".data/wasl-pg";
  await mkdir(dirname(dataDir), { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  return {
    async query<T = Record<string, unknown>>(sql: string, params?: unknown[]) {
      const result = await pg.query<T>(sql, (params ?? []) as never[]);
      return {
        rows: result.rows,
        rowCount: typeof result.affectedRows === "number" ? result.affectedRows : result.rows.length,
      };
    },
    async exec(sql: string) {
      await pg.exec(sql);
    },
    async close() {
      await pg.close();
    },
  };
}

/** Applies pending migrations from `src/lib/db/migrations.ts`. */
export async function migrate(db: ScriptDb): Promise<string[]> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await db.query<{ id: string }>("SELECT id FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.id));
  const newlyApplied: string[] = [];

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await db.exec("BEGIN");
    try {
      await db.exec(migration.sql);
      await db.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
      await db.exec("COMMIT");
      newlyApplied.push(migration.id);
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
  }

  return newlyApplied;
}
