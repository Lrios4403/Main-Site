import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Unique-visitor counts per page and per day, stored in databases/views.sqlite.
//
// Uses bun:sqlite when the server runs on Bun (`bun --bun next ...`) and falls
// back to node:sqlite on Node (plain `next dev`). process.getBuiltinModule
// loads either one at runtime, so the bundler never has to resolve `bun:`.

type Statement = {
  run(...params: string[]): unknown;
  get(...params: string[]): unknown;
};

type Database = {
  exec(sql: string): void;
  prepare(sql: string): Statement;
};

function open(path: string): Database {
  if (process.versions.bun) {
    const { Database } = process.getBuiltinModule("bun:sqlite") as {
      Database: new (path: string, options: { create: boolean }) => Database;
    };
    return new Database(path, { create: true });
  }
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite") as {
    DatabaseSync: new (path: string) => Database;
  };
  return new DatabaseSync(path);
}

let db: Database | undefined;

// Route handlers are bundled separately, so each one gets its own connection.
// They all share the file; busy_timeout covers concurrent writers.
function database(): Database {
  if (db) return db;
  const dir = join(process.cwd(), "databases");
  mkdirSync(dir, { recursive: true });
  db = open(join(dir, "views.sqlite"));
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS views (
      path TEXT NOT NULL,
      viewer TEXT NOT NULL,
      day TEXT NOT NULL,
      PRIMARY KEY (path, viewer, day)
    )
  `);
  return db;
}

// The server's local date as YYYY-MM-DD
function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

// "/contact/" and "/contact" count as the same page
export function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

// Records one view per viewer, per page, per day
export function recordView(path: string, viewer: string): void {
  database()
    .prepare("INSERT OR IGNORE INTO views (path, viewer, day) VALUES (?, ?, ?)")
    .run(normalizePath(path), viewer, today());
}

export type ViewStats = {
  page: { today: number; total: number };
  site: { today: number; total: number };
};

function count(sql: string, ...params: string[]): number {
  const row = database().prepare(sql).get(...params) as { n: number | bigint };
  return Number(row.n);
}

export function viewStats(path: string): ViewStats {
  const page = normalizePath(path);
  const day = today();
  return {
    page: {
      today: count("SELECT COUNT(*) AS n FROM views WHERE path = ? AND day = ?", page, day),
      total: count("SELECT COUNT(DISTINCT viewer) AS n FROM views WHERE path = ?", page),
    },
    site: {
      today: count("SELECT COUNT(DISTINCT viewer) AS n FROM views WHERE day = ?", day),
      total: count("SELECT COUNT(DISTINCT viewer) AS n FROM views"),
    },
  };
}
