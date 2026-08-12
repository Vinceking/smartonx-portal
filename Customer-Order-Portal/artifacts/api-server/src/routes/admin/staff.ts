import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@workspace/db";
import { adminUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";

const router = Router();
router.use(requireAdminAuth);

// GET /api/admin/staff
router.get("/", async (_req, res) => {
  const staff = await db.select({
    id: adminUsersTable.id,
    name: adminUsersTable.name,
    email: adminUsersTable.email,
    isActive: adminUsersTable.isActive,
    lastLoginAt: adminUsersTable.lastLoginAt,
  }).from(adminUsersTable);
  res.json(staff);
});

// POST /api/admin/staff
router.post("/", async (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) { res.status(400).json({ error: "Name and email required" }); return; }
  const tempPassword = `Admin${crypto.randomBytes(4).toString("hex")}!`;
  const hash = await bcrypt.hash(tempPassword, 12);
  const [staff] = await db.insert(adminUsersTable).values({
    name, email: email.toLowerCase().trim(), passwordHash: hash, isActive: true,
  }).returning({ id: adminUsersTable.id, name: adminUsersTable.name, email: adminUsersTable.email, isActive: adminUsersTable.isActive, lastLoginAt: adminUsersTable.lastLoginAt });
  res.status(201).json({ ...staff, tempPassword });
});

// PATCH /api/admin/staff/:id
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const { name, isActive } = req.body as { name?: string; isActive?: boolean };
  const updates: Partial<typeof adminUsersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (isActive !== undefined) updates.isActive = isActive;
  const [staff] = await db.update(adminUsersTable).set(updates).where(eq(adminUsersTable.id, id)).returning({
    id: adminUsersTable.id, name: adminUsersTable.name, email: adminUsersTable.email,
    isActive: adminUsersTable.isActive, lastLoginAt: adminUsersTable.lastLoginAt,
  });
  if (!staff) { res.status(404).json({ error: "Staff not found" }); return; }
  res.json(staff);
});

// POST /api/admin/staff/:id/reset-password
router.post("/:id/reset-password", async (req, res) => {
  const id = parseInt(req.params.id!);
  const tempPassword = `Admin${crypto.randomBytes(4).toString("hex")}!`;
  const hash = await bcrypt.hash(tempPassword, 12);
  await db.update(adminUsersTable).set({ passwordHash: hash }).where(eq(adminUsersTable.id, id));
  res.json({ tempPassword });
});

export default router;
