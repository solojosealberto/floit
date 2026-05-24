import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import sqlite3 from "sqlite3";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

function usage() {
  console.log(
    [
      "Usage:",
      "  node ./scripts/seed-ownership.mjs --email owner@example.com --venue oxide-chacao [--status active|revoked] [--db /abs/path/to/partner.sqlite]",
      "",
      "Defaults:",
      "  status=active",
      "  db=$PARTNER_SQLITE_PATH or services/partner/data/partner.sqlite",
    ].join("\n"),
  );
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = String(args.email ?? "").trim().toLowerCase();
  const venue = String(args.venue ?? "").trim();
  const status = String(args.status ?? "active").trim();
  const dbPath =
    String(args.db ?? process.env.PARTNER_SQLITE_PATH ?? "").trim() ||
    join(process.cwd(), "data", "partner.sqlite");

  if (!email || !venue) {
    usage();
    process.exitCode = 1;
    return;
  }
  if (status !== "active" && status !== "revoked") {
    console.error(`Invalid status "${status}". Use active|revoked.`);
    process.exitCode = 1;
    return;
  }
  if (!existsSync(dbPath)) {
    console.error(`SQLite DB not found at: ${dbPath}`);
    process.exitCode = 1;
    return;
  }

  const db = new sqlite3.Database(dbPath);
  try {
    await run(db, "BEGIN TRANSACTION");
    const existing = await get(
      db,
      "SELECT id, status FROM partner_venue_ownerships WHERE partnerEmail = ? AND venueSlug = ? LIMIT 1",
      [email, venue],
    );

    if (existing?.id) {
      await run(
        db,
        "UPDATE partner_venue_ownerships SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [status, existing.id],
      );
      console.log(
        JSON.stringify(
          { action: "updated", id: existing.id, partnerEmail: email, venueSlug: venue, status },
          null,
          2,
        ),
      );
    } else {
      const id = randomUUID();
      await run(
        db,
        "INSERT INTO partner_venue_ownerships (id, partnerEmail, venueSlug, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [id, email, venue, status],
      );
      console.log(
        JSON.stringify(
          { action: "created", id, partnerEmail: email, venueSlug: venue, status },
          null,
          2,
        ),
      );
    }
    await run(db, "COMMIT");
  } catch (error) {
    await run(db, "ROLLBACK").catch(() => {});
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

await main();
