/** Calendar dates, independent of the server's local time zone. */
export function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid date: ${value}`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return date;
}

export function formatDate(value: string): string {
  return parseDate(value).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

export function validateDates(post: { published: string; updated?: string }, today: string) {
  parseDate(today);
  parseDate(post.published);
  if (post.updated) parseDate(post.updated);
  if (post.updated && post.updated < post.published) throw new Error("Update precedes publication");
  if (post.published > today || (post.updated && post.updated > today)) throw new Error("Future article date");
}
