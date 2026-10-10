import { mkdirSync } from "node:fs";
import { join } from "node:path";

type Param = string | number;
type Statement = {
  run(...params: Param[]): { changes: number | bigint };
  get(...params: Param[]): unknown;
  all(...params: Param[]): unknown[];
};
type Database = { exec(sql: string): void; prepare(sql: string): Statement };

// Load at runtime: Turbopack must not resolve bun:sqlite on Node.
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
let cleanedDay = "";
const SITE = ""; // Page paths always start with /, so this is a separate scope.

function transaction<T>(connection: Database, action: () => T): T {
  connection.exec("BEGIN IMMEDIATE");
  try {
    const result = action();
    connection.exec("COMMIT");
    return result;
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
}

function database(): Database {
  if (db) return db;
  const dir = join(process.cwd(), "databases");
  mkdirSync(dir, { recursive: true });
  const connection = open(join(dir, "views.sqlite"));
  connection.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL");
  transaction(connection, () => {
    connection.exec(`
      CREATE TABLE IF NOT EXISTS views (
        path TEXT NOT NULL, viewer TEXT NOT NULL, day TEXT NOT NULL,
        PRIMARY KEY (path, viewer, day)
      );
      CREATE TABLE IF NOT EXISTS view_visitors (
        scope TEXT NOT NULL, viewer TEXT NOT NULL, PRIMARY KEY (scope, viewer)
      );
      CREATE TABLE IF NOT EXISTS view_daily_visitors (
        scope TEXT NOT NULL, day TEXT NOT NULL, viewer TEXT NOT NULL,
        PRIMARY KEY (scope, day, viewer)
      );
      CREATE INDEX IF NOT EXISTS view_daily_visitors_day ON view_daily_visitors(day);
      CREATE TABLE IF NOT EXISTS view_totals (
        scope TEXT PRIMARY KEY, unique_viewers INTEGER NOT NULL DEFAULT 0,
        page_loads INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS view_daily (
        scope TEXT NOT NULL, day TEXT NOT NULL,
        unique_viewers INTEGER NOT NULL DEFAULT 0, page_loads INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (scope, day)
      );
      CREATE TABLE IF NOT EXISTS view_sessions (
        id TEXT PRIMARY KEY, viewer TEXT NOT NULL, started_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL, entry_path TEXT NOT NULL,
        referrer TEXT, source TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS view_sessions_last_seen ON view_sessions(last_seen_at);
      CREATE TABLE IF NOT EXISTS view_events (
        id TEXT PRIMARY KEY, path TEXT NOT NULL, viewer TEXT NOT NULL,
        session TEXT NOT NULL, occurred_at TEXT NOT NULL, day TEXT NOT NULL,
        referrer TEXT, source TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS view_events_time ON view_events(occurred_at);
      CREATE INDEX IF NOT EXISTS view_events_path_time ON view_events(path, occurred_at);
      CREATE INDEX IF NOT EXISTS view_events_viewer_time ON view_events(viewer, occurred_at);
      CREATE INDEX IF NOT EXISTS view_events_session_time ON view_events(session, occurred_at);
      CREATE TABLE IF NOT EXISTS view_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    const migrated = connection.prepare("SELECT value FROM view_metadata WHERE key = 'history_version'").get();
    if (!migrated) {
      // Legacy rows represent daily uniques, not page loads. Keep their counts
      // without inventing timestamps, sessions, or repeat loads.
      connection.exec(`
        INSERT OR IGNORE INTO view_visitors SELECT path, viewer FROM views;
        INSERT OR IGNORE INTO view_visitors SELECT '', viewer FROM views;
        INSERT OR IGNORE INTO view_daily_visitors SELECT path, day, viewer FROM views;
        INSERT OR IGNORE INTO view_daily_visitors SELECT '', day, viewer FROM views;
        INSERT INTO view_totals(scope, unique_viewers)
          SELECT scope, COUNT(*) FROM view_visitors GROUP BY scope;
        INSERT INTO view_daily(scope, day, unique_viewers)
          SELECT scope, day, COUNT(*) FROM view_daily_visitors GROUP BY scope, day;
      `);
      connection.prepare("INSERT INTO view_metadata(key, value) VALUES ('page_loads_since', ?)").run(new Date().toISOString());
      connection.exec("INSERT INTO view_metadata VALUES ('history_version', '2')");
    }
  });
  // Only publish the connection after initialization succeeds.
  db = connection;
  return db;
}

function today(date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

export function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function prune(connection: Database, now: Date): void {
  const day = today(now);
  if (cleanedDay === day) return;
  const configured = Number(process.env.VIEW_EVENT_RETENTION_DAYS ?? 90);
  const days = Number.isInteger(configured) && configured > 0 ? configured : 90;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  connection.prepare("DELETE FROM view_events WHERE occurred_at < ?").run(cutoff.toISOString());
  connection.prepare(`DELETE FROM view_sessions WHERE last_seen_at < ?
    AND NOT EXISTS (SELECT 1 FROM view_events WHERE session = view_sessions.id)`)
    .run(cutoff.toISOString());
  connection.prepare("DELETE FROM view_daily_visitors WHERE day < ?").run(today(cutoff));
}

export type Visit = {
  id: string;
  session: string;
  referrer: string | null;
  source: "direct" | "internal" | "external" | "unknown";
};

export function recordView(path: string, viewer: string, visit: Visit): void {
  const connection = database();
  const now = new Date();
  const timestamp = now.toISOString();
  const day = today(now);
  const page = normalizePath(path);
  transaction(connection, () => {
    prune(connection, now);
    const inserted = connection.prepare(`INSERT OR IGNORE INTO view_events
      (id, path, viewer, session, occurred_at, day, referrer, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(visit.id, page, viewer, visit.session, timestamp, day, visit.referrer ?? "", visit.source);
    // Retrying the same tracking request must not inflate page-load totals.
    if (!Number(inserted.changes)) return;
    connection.prepare(`INSERT INTO view_sessions
      (id, viewer, started_at, last_seen_at, entry_path, referrer, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at`)
      .run(visit.session, viewer, timestamp, timestamp, page, visit.referrer ?? "", visit.source);
    for (const scope of [page, SITE]) {
      const newViewer = Number(connection.prepare("INSERT OR IGNORE INTO view_visitors VALUES (?, ?)").run(scope, viewer).changes);
      const newDailyViewer = Number(connection.prepare("INSERT OR IGNORE INTO view_daily_visitors VALUES (?, ?, ?)").run(scope, day, viewer).changes);
      connection.prepare(`INSERT INTO view_totals VALUES (?, ?, 1)
        ON CONFLICT(scope) DO UPDATE SET
          unique_viewers = unique_viewers + excluded.unique_viewers,
          page_loads = page_loads + 1`).run(scope, newViewer);
      connection.prepare(`INSERT INTO view_daily VALUES (?, ?, ?, 1)
        ON CONFLICT(scope, day) DO UPDATE SET
          unique_viewers = unique_viewers + excluded.unique_viewers,
          page_loads = page_loads + 1`).run(scope, day, newDailyViewer);
    }
  });
  cleanedDay = day;
}

type Counts = { today: number; total: number };
export type ViewStats = {
  page: Counts;
  site: Counts;
  pageLoads: { page: Counts; site: Counts; since: string };
};

export function viewStats(path: string): ViewStats {
  const connection = database();
  const day = today();
  type Row = { scope: string; today: number; total: number; loads_today: number; loads_total: number };
  const pathScope = normalizePath(path);
  // One statement gives page and site the same SQLite read snapshot.
  const rows = connection.prepare(`SELECT s.scope,
    COALESCE(t.unique_viewers, 0) AS total, COALESCE(d.unique_viewers, 0) AS today,
    COALESCE(t.page_loads, 0) AS loads_total, COALESCE(d.page_loads, 0) AS loads_today
    FROM (SELECT ? AS scope UNION ALL SELECT '') s
    LEFT JOIN view_totals t ON t.scope = s.scope
    LEFT JOIN view_daily d ON d.scope = s.scope AND d.day = ?`).all(pathScope, day) as Row[];
  const page = rows.find((row) => row.scope === pathScope)!;
  const site = rows.find((row) => row.scope === SITE)!;
  const metadata = connection.prepare("SELECT value FROM view_metadata WHERE key = 'page_loads_since'").get() as { value: string };
  return {
    page: { today: Number(page.today), total: Number(page.total) },
    site: { today: Number(site.today), total: Number(site.total) },
    pageLoads: {
      page: { today: Number(page.loads_today), total: Number(page.loads_total) },
      site: { today: Number(site.loads_today), total: Number(site.loads_total) },
      since: metadata.value,
    },
  };
}
