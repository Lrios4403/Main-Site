// Run with: bun scripts/check-views.ts
// All writes go to a disposable directory, never the site's database.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recordView, viewStats } from "../lib/views";

const { Database } = process.getBuiltinModule("bun:sqlite") as {
  Database: new (path: string) => {
    exec(sql: string): void;
    query(sql: string): {
      get(): Record<string, string | number>;
      all(): Record<string, string | number>[];
    };
    close(): void;
  };
};

const fixture = mkdtempSync(join(tmpdir(), "views-check-"));
process.chdir(fixture);
mkdirSync("databases");
const db = new Database(join(fixture, "databases", "views.sqlite"));
db.exec(`
  CREATE TABLE views(path TEXT, viewer TEXT, day TEXT, PRIMARY KEY(path, viewer, day));
  INSERT INTO views VALUES ('/legacy', 'alice', '2020-01-01');
  INSERT INTO views VALUES ('/legacy', 'alice', '2020-01-02');
  INSERT INTO views VALUES ('/other', 'bob', '2020-01-02');
`);
const initial = viewStats("/legacy/");
assert.equal(initial.page.total, 1);
assert.equal(initial.site.total, 2);
assert.equal(initial.pageLoads.site.total, 0);
assert.equal(db.query("SELECT COUNT(*) AS n FROM views").get().n, 3);
db.exec(`
  INSERT INTO view_sessions VALUES ('expired', 'old', '2020-01-01T00:00:00.000Z',
    '2020-01-01T00:00:00.000Z', '/expired', '', 'direct');
  INSERT INTO view_events VALUES ('expired', '/expired', 'old', 'expired',
    '2020-01-01T00:00:00.000Z', '2020-01-01', '', 'direct');
`);

const visit = { id: "request-1", session: "session-1", referrer: "https://example.com/story", source: "external" as const };
recordView("/legacy/", "alice", visit);
recordView("/legacy", "alice", visit); // Same request ID: no second load.
recordView("/legacy", "alice", { ...visit, id: "request-2" });
recordView("/other", "alice", { ...visit, id: "request-3" });
recordView("/legacy", "charlie", { ...visit, id: "request-4", session: "session-2" });
const stats = viewStats("/legacy");
assert.deepEqual(stats.page, { today: 2, total: 2 });
assert.deepEqual(stats.site, { today: 2, total: 3 });
assert.deepEqual(stats.pageLoads.page, { today: 3, total: 3 });
assert.deepEqual(stats.pageLoads.site, { today: 4, total: 4 });
assert.equal(db.query("SELECT COUNT(*) AS n FROM view_events").get().n, 4);
assert.equal(db.query("SELECT COUNT(*) AS n FROM view_sessions").get().n, 2);
const session = db.query("SELECT * FROM view_sessions WHERE id = 'session-1'").get();
assert.equal(session.entry_path, "/legacy");
assert.equal(session.referrer, visit.referrer);
assert.equal(session.source, "external");
assert.ok(String(session.started_at) <= String(session.last_seen_at));
assert.match(String(db.query("SELECT occurred_at FROM view_events LIMIT 1").get().occurred_at), /^\d{4}-\d{2}-\d{2}T/);
assert.equal(db.query("SELECT COUNT(*) AS n FROM view_daily_visitors WHERE day = '2020-01-01'").get().n, 0);
assert.equal(db.query("SELECT unique_viewers FROM view_daily WHERE scope = '/legacy' AND day = '2020-01-01'").get().unique_viewers, 1);
assert.equal(viewStats("/never-visited").page.total, 0);
for (const sql of [
  "SELECT unique_viewers FROM view_totals WHERE scope = '/legacy'",
  "SELECT unique_viewers FROM view_daily WHERE scope = '/legacy' AND day = '2020-01-01'",
]) {
  const plan = db.query("EXPLAIN QUERY PLAN " + sql).all();
  assert.ok(plan.some((row) => String(row.detail).includes("SEARCH")), "Counter summaries must use index lookups");
}
const beforeFailure = viewStats("/legacy");
db.exec("CREATE TRIGGER fail_write BEFORE INSERT ON view_sessions BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");
assert.throws(() => recordView("/legacy", "new-viewer", { ...visit, id: "failed-write" }));
assert.deepEqual(viewStats("/legacy"), beforeFailure);
assert.equal(db.query("SELECT COUNT(*) AS n FROM view_events WHERE id = 'failed-write'").get().n, 0);
db.exec("DROP TRIGGER fail_write");
console.log("Passed: legacy migration, repeat loads, retry deduplication, page/site uniques, session attribution, timestamps, retention, retained summaries, and rollback.");
console.log("Disposable database:", fixture);
db.close();
