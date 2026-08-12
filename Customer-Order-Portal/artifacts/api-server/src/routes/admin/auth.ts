import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { setAdminSession, clearAdminSession } from "../../lib/session";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";

const router = Router();

// POST /api/admin/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const [admin] = await db.select().from(adminUsersTable)
    .where(eq(adminUsersTable.email, email.toLowerCase().trim()));
  if (!admin || !admin.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  await db.update(adminUsersTable).set({ lastLoginAt: new Date() }).where(eq(adminUsersTable.id, admin.id));
  setAdminSession(res, { adminId: admin.id, name: admin.name, email: admin.email });
  res.json({ adminId: admin.id, name: admin.name, email: admin.email });
});

// POST /api/admin/auth/logout
router.post("/logout", (_req, res) => {
  clearAdminSession(res);
  res.json({ ok: true });
});

// GET /api/admin/auth/me
router.get("/me", requireAdminAuth, (req, res) => {
  res.json(req.adminSession);
});

export default router;
