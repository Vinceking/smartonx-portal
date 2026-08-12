import { Router, type IRouter } from "express";
import crypto from "crypto";
import { pool, runSeed, SCHEMA_STATEMENTS } from "@workspace/db";

/**
 * One-URL database bootstrap for terminal-free deploys (Render free tier has
 * no shell). Visiting  GET /api/setup?token=<SETUP_TOKEN>  will:
 *   1. Create all tables if they don't exist yet (embedded drizzle schema)
 *   2. Run the demo seed (wipes + reloads all demo data)
 *
 * Guarded by the SETUP_TOKEN env var:
 *   - env var unset  -> endpoint responds 404 (feature disabled)
 *   - token mismatch -> 403
 * Re-running is safe and simply resets the demo data.
 */
const router: IRouter = Router();

function tokenMatches(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

router.get("/", async (req, res) => {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const provided = typeof req.query.token === "string" ? req.query.token : undefined;
  if (!tokenMatches(provided, expected)) {
    res.status(403).json({ error: "Invalid or missing token" });
    return;
  }

  const startedAt = Date.now();
  try {
    // 1. Schema: create tables only if they don't exist yet.
    const check = await pool.query(
      "SELECT to_regclass('public.portal_users') AS t",
    );
    const hasSchema = check.rows[0]?.t !== null;
    if (!hasSchema) {
      for (const statement of SCHEMA_STATEMENTS) {
        await pool.query(statement);
      }
    }

    // 2. Seed (idempotent: wipes and reloads all demo data).
    await runSeed({ rounds: 10 });

    const counts: Record<string, number> = {};
    for (const table of ["hs_companies", "hs_locations", "portal_users", "products", "orders"]) {
      const r = await pool.query(`SELECT count(*)::int AS c FROM ${table}`);
      counts[table] = r.rows[0]?.c ?? 0;
    }

    res.json({
      ok: true,
      schemaCreated: !hasSchema,
      seeded: true,
      counts,
      tookMs: Date.now() - startedAt,
      note: "Demo data loaded. Portal login: schen / DemoPass123! (or drchen.wasatch@gmail.com). Admin: rachelle@smartonx.com / AdminDemo123!. Re-visiting this URL resets the demo data.",
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Setup failed",
    });
  }
});

export default router;
