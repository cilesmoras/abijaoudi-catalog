/**
 * Converts a display name into a URL-safe slug. Pure and dependency-free so it
 * can run on both the server (queries, actions) and the client (optimistic UI).
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
