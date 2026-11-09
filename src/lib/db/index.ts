import "server-only";

import { MIGRATIONS } from "./migrations";

export type Row = Record<string, unknown>;

export interface QueryResult<T = Row> {
  rows: T[];
  rowCount: number;
}

/**
 * The small surface the application needs from a database. Both drivers
 * implement it, so no module above this file knows which one is in use.
 */
export interface DbClient {
  query<T = Row>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
}

export interface Db extends DbClient {
  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Anything that stores our data. Kept intentionally small. */
export interface StoredFile {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: Uint8Array;
}

// ---------------------------------------------------------------------------
// Embedded PostgreSQL (PGlite) - used when DATABASE_URL is empty.
// This is a real PostgreSQL 16 engine compiled to WebAssembly, so the schema
// and every query below are the same ones used against a PostgreSQL server.
// ---------------------------------------------------------------------------
async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdir } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  const dataDir = process.env.PGLITE_DIR || ".data/wasl-pg";
  // PGlite creates the final directory but not its parents.
  await mkdir(dirname(dataDir), { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const client: DbClient = {
    async query<T = Row>(sql: string, params?: unknown[]) {
      const res = await pg.query<T>(sql, (params ?? []) as never[]);
      return {
        rows: res.rows,
        rowCount: typeof res.affectedRows === "number" ? res.affectedRows : res.rows.length,
      };
    },
    async exec(sql: string) {
      await pg.exec(sql);
    },
  };

  return {
    ...client,
    async transaction<T>(fn: (tx: DbClient) => Promise<T>) {
      return pg.transaction(async (tx) => fn({
        async query<U = Row>(sql: string, params?: unknown[]) {
          const res = await tx.query<U>(sql, (params ?? []) as never[]);
          return {
            rows: res.rows,
            rowCount: typeof res.affectedRows === "number" ? res.affectedRows : res.rows.length,
          };
        },
        async exec(sql: string) {
          await tx.exec(sql);
        },
      }));
    },
    async close() {
      await pg.close();
    },
  };
}

// ---------------------------------------------------------------------------
// PostgreSQL server - used when DATABASE_URL is set (staging/production).
// ---------------------------------------------------------------------------
async function createPostgres(url: string): Promise<Db> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX || 10),
    ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  const client: DbClient = {
    async query<T = Row>(sql: string, params?: unknown[]) {
      const res = await pool.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    },
    async exec(sql: string) {
      await pool.query(sql);
    },
  };

  return {
    ...client,
    async transaction<T>(fn: (tx: DbClient) => Promise<T>) {
      const conn = await pool.connect();
      try {
        await conn.query("BEGIN");
        const result = await fn({
          async query<U = Row>(sql: string, params?: unknown[]) {
            const res = await conn.query(sql, params);
            return { rows: res.rows as U[], rowCount: res.rowCount ?? 0 };
          },
          async exec(sql: string) {
            await conn.query(sql);
          },
        });
        await conn.query("COMMIT");
        return result;
      } catch (error) {
        await conn.query("ROLLBACK");
        throw error;
      } finally {
        conn.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------
type GlobalWithDb = typeof globalThis & { __waslDb?: Promise<Db> };

async function applyMigrations(db: Db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  const { rows } = await db.query<{ id: string }>("SELECT id FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.id));
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    await db.transaction(async (tx) => {
      await tx.exec(migration.sql);
      await tx.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
    });
  }
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL?.trim();
  const db = url ? await createPostgres(url) : await createPglite();
  await applyMigrations(db);
  return db;
}

export function getDb(): Promise<Db> {
  const globalRef = globalThis as GlobalWithDb;
  if (!globalRef.__waslDb) {
    globalRef.__waslDb = createDb().catch((error) => {
      // Do not cache a failed initialisation - the next request retries.
      globalRef.__waslDb = undefined;
      throw error;
    });
  }
  return globalRef.__waslDb;
}

/** Convenience helper used by most modules. */
export async function query<T = Row>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
  const db = await getDb();
  return db.query<T>(sql, params);
}

/** Convenience helper for multi-statement statements without parameters. */
export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  await db.exec(sql);
}

export async function transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.transaction(fn);
}

/** Environment label used to decide whether development helpers are available. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
