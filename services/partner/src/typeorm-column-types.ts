/**
 * Postgres (Neon/Railway) requires timestamptz; SQLite local fallback uses datetime.
 * TypeORM rejects `datetime` on PostgreSQL and `timestamptz` on SQLite.
 */
export const TIMESTAMP_COLUMN_TYPE = process.env.DATABASE_URL?.trim()
  ? ("timestamptz" as const)
  : ("datetime" as const);
