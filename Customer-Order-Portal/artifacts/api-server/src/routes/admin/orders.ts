import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, orderItemsTable, portalUsersTable, hsCompaniesTable, hsLocationsTable,
} from "@workspace/db/schema";
import { eq, desc, gte, lte, and, sql, ilike } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";

const router = Router();
router.use(requireAdminAuth);

async function enrichOrders(rows: (typeof ordersTable.$inferSelect)[]) {
  const companyIds = [...new Set(rows.map((r) => r.hubspotCompanyId))];
  const locIds = [...new Set(rows.map((r) => r.hubspotLocationId))];
  const userIds = [...new Set(rows.map((r) => r.portalUserId))];

  const companies = companyIds.length > 0
    ? await db.select({ id: hsCompaniesTable.id, name: hsCompaniesTable.name }).from(hsCompaniesTable) : [];
  const locs = locIds.length > 0
    ? await db.select({ id: hsLocationsTable.id, nickname: hsLocationsTable.nickname }).from(hsLocationsTable) : [];
  const users = userIds.length > 0
    ? await db.select({ id: portalUsersTable.id, username: portalUsersTable.username }).from(portalUsersTable) : [];

  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));
  const locMap = Object.fromEntries(locs.map((l) => [l.id, l.nickname]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.username]));

  const orderIds = rows.map((r) => r.id);
  const itemCounts: Record<number, number> = {};
  if (orderIds.length > 0) {
    const counts = await db
      .select({ orderId: orderItemsTable.orderId, cnt: sql<number>`sum(${orderItemsTable.quantity})` })
      .from(orderItemsTable)
      .where(sql`${orderItemsTable.orderId} = ANY(ARRAY[${orderIds.join(",")}]::int[])`)
      .groupBy(orderItemsTable.orderId);
    counts.forEach((c) => { itemCounts[c.orderId] = Number(c.cnt); });
  }

  return rows.map((o) => ({
    ...o,
    orgName: companyMap[o.hubspotCompanyId] ?? o.hubspotCompanyId,
    locationNickname: locMap[o.hubspotLocationId] ?? o.hubspotLocationId,
    orderedByUsername: userMap[o.portalUserId] ?? "",
    itemCount: itemCounts[o.id] ?? 0,
  }));
}

// GET /api/admin/orders
router.get("/", async (req, res) => {
  const { status, orgId, from, to, page = "1", limit = "25" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (orgId) conditions.push(eq(ordersTable.hubspotCompanyId, orgId));
  if (from) conditions.push(gte(ordersTable.orderedAt, new Date(from)));
  if (to) conditions.push(lte(ordersTable.orderedAt, new Date(to)));

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(whereClause);

  const rows = await db.select().from(ordersTable)
    .where(whereClause)
    .orderBy(desc(ordersTable.orderedAt))
    .limit(limitNum).offset(offset);

  res.json({ orders: await enrichOrders(rows), total: Number(countRow?.count ?? 0), page: pageNum, limit: limitNum });
});

// GET /api/admin/orders/export (CSV)
router.get("/export", async (req, res) => {
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.orderedAt)).limit(5000);
  const enriched = await enrichOrders(rows);

  const headers = ["Order Number","PO Number","Status","Payment","Total","Org","Location","Ordered By","Date","Shopify #","HubSpot PO ID"];
  const csv = [
    headers.join(","),
    ...enriched.map((o) => [
      o.orderNumber, o.poNumber, o.status, o.paymentStatus,
      (o.totalCents / 100).toFixed(2), o.orgName, o.locationNickname,
      o.orderedByUsername, o.orderedAt.toISOString().split("T")[0],
      o.shopifyOrderNumber ?? "", o.hubspotPoId ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  res.send(csv);
});

// PATCH /api/admin/orders/:id
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id!);
  const { status } = req.body as { status?: string };
  if (!status) { res.status(400).json({ error: "Status required" }); return; }
  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
});

export default router;
