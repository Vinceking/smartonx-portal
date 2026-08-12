import { Router } from "express";
import { db } from "@workspace/db";
import { integrationLogTable, emailLogTable, ordersTable, hsCompaniesTable } from "@workspace/db/schema";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";

const router = Router();
router.use(requireAdminAuth);

// GET /api/admin/integration-log
router.get("/integration", async (req, res) => {
  const { system, operation, page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const conditions: ReturnType<typeof eq>[] = [];
  if (system) conditions.push(eq(integrationLogTable.system, system));
  if (operation) conditions.push(eq(integrationLogTable.operation, operation));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(integrationLogTable).where(whereClause);
  const rows = await db.select().from(integrationLogTable)
    .where(whereClause)
    .orderBy(desc(integrationLogTable.createdAt))
    .limit(limitNum).offset(offset);

  // Enrich with order numbers
  const orderIds = rows.filter((r) => r.orderId).map((r) => r.orderId!);
  const orderMap: Record<number, { orderNumber: string; hubspotCompanyId: string }> = {};
  if (orderIds.length > 0) {
    const orders = await db.select({ id: ordersTable.id, orderNumber: ordersTable.orderNumber, hubspotCompanyId: ordersTable.hubspotCompanyId })
      .from(ordersTable).where(sql`${ordersTable.id} = ANY(ARRAY[${orderIds.join(",")}]::int[])`);
    orders.forEach((o) => { orderMap[o.id] = o; });
  }
  const companyIds = [...new Set(Object.values(orderMap).map((o) => o.hubspotCompanyId))];
  const companies = companyIds.length > 0
    ? await db.select({ id: hsCompaniesTable.id, name: hsCompaniesTable.name }).from(hsCompaniesTable) : [];
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));

  res.json({
    data: rows.map((r) => ({
      ...r,
      orderNumber: r.orderId ? orderMap[r.orderId]?.orderNumber : null,
      orgName: r.orderId ? companyMap[orderMap[r.orderId]?.hubspotCompanyId ?? ""] : null,
    })),
    total: Number(countRow?.count ?? 0),
    page: pageNum,
    limit: limitNum,
  });
});

// GET /api/admin/email-log
router.get("/email", async (req, res) => {
  const { category, page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(200, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const whereClause = category ? eq(emailLogTable.category, category) : undefined;
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(emailLogTable).where(whereClause);
  const rows = await db.select().from(emailLogTable)
    .where(whereClause)
    .orderBy(desc(emailLogTable.createdAt))
    .limit(limitNum).offset(offset);

  res.json({ data: rows, total: Number(countRow?.count ?? 0), page: pageNum, limit: limitNum });
});

export default router;
