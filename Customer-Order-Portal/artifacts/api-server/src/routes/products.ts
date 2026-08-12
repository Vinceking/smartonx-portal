import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

// GET /api/products
router.get("/", async (_req, res) => {
  const products = await db.select().from(productsTable).where(eq(productsTable.active, true));
  res.json(products);
});

export default router;
