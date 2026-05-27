/** Postgres: timestamptz; SQLite local fallback: datetime. */
export const TIMESTAMP_COLUMN_TYPE = process.env.DATABASE_URL?.trim()
  ? ("timestamptz" as const)
  : ("datetime" as const);
