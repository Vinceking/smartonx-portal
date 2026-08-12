import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, orderItemsTable, productsTable, portalUsersTable,
  hsLocationsTable, userLocationAccessTable, hsCompaniesTable,
} from "@workspace/db/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { requirePortalAuth } from "../../middlewares/requirePortalAuth";

const router = Router();
router.use(requirePortalAuth);

// GET /api/portal/orders
router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const { status, locationId, from, to, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(ordersTable.hubspotCompanyId, session.hubspotCompanyId)];
  if (session.roleKey !== "org_admin") {
    const access = await db
      .select({ hubspotLocationId: userLocationAccessTable.hubspotLocationId })
      .from(userLocationAccessTable)
      .where(eq(userLocationAccessTable.portalUserId, session.userId));
    const locIds = access.map((a) => a.hubspotLocationId);
    if (locIds.length === 0) {
      res.json({ orders: [], total: 0, page: pageNum, limit: limitNum });
      return;
    }
    conditions.push(inArray(ordersTable.hubspotLocationId, locIds));
  }
  if (status) conditions.push(eq(ordersTable.status, status));
  if (locationId) conditions.push(eq(ordersTable.hubspotLocationId, locationId));
  if (from) conditions.push(gte(ordersTable.orderedAt, new Date(from)));
  if (to) conditions.push(lte(ordersTable.orderedAt, new Date(to)));

  const whereClause = and(...conditions);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ordersTable)
    .where(whereClause);
  const total = Number(countRow?.count ?? 0);

  const rows = await db
    .select()
    .from(ordersTable)
    .where(whereClause)
    .orderBy(desc(ordersTable.orderedAt))
    .limit(limitNum)
    .offset(offset);

  // Enrich with location nicknames
  const locIds2 = [...new Set(rows.map((r) => r.hubspotLocationId))];
  const locs = locIds2.length > 0
    ? await db.select({ id: hsLocationsTable.id, nickname: hsLocationsTable.nickname })
        .from(hsLocationsTable).where(inArray(hsLocationsTable.id, locIds2))
    : [];
  const locMap = Object.fromEntries(locs.map((l) => [l.id, l.nickname]));

  // Enrich with item counts
  const orderIds = rows.map((r) => r.id);
  const itemCounts: Record<number, number> = {};
  if (orderIds.length > 0) {
    const counts = await db
      .select({
        orderId: orderItemsTable.orderId,
        cnt: sql<number>`sum(${orderItemsTable.quantity})`,
      })
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, orderIds))
      .groupBy(orderItemsTable.orderId);
    counts.forEach((c) => { itemCounts[c.orderId] = Number(c.cnt); });
  }

  const [company] = await db.select({ name: hsCompaniesTable.name }).from(hsCompaniesTable).where(eq(hsCompaniesTable.id, session.hubspotCompanyId));

  // Resolve the ACTUAL placing user for each order (not the current viewer).
  const placerIds = [...new Set(rows.map((r) => r.portalUserId))];
  const placers = placerIds.length > 0
    ? await db.select({ id: portalUsersTable.id, username: portalUsersTable.username })
        .from(portalUsersTable).where(inArray(portalUsersTable.id, placerIds))
    : [];
  const placerMap = Object.fromEntries(placers.map((p) => [p.id, p.username]));

  const data = rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    poNumber: o.poNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalCents: o.totalCents,
    orderedAt: o.orderedAt,
    locationNickname: locMap[o.hubspotLocationId] ?? o.hubspotLocationId,
    orderedByUsername: placerMap[o.portalUserId] ?? "",
    orgName: company?.name ?? "",
    itemCount: itemCounts[o.id] ?? 0,
    shopifyOrderNumber: o.shopifyOrderNumber,
    hubspotPoId: o.hubspotPoId,
    hubspotPoStatus: o.hubspotPoStatus,
  }));

  res.json({ orders: data, total, page: pageNum, limit: limitNum });
});

// GET /api/portal/orders/:id
router.get("/:id", async (req, res) => {
  const session = req.portalSession!;
  const orderId = parseInt(req.params.id!);
  if (isNaN(orderId)) { res.status(400).json({ error: "Invalid order ID" }); return; }

  const [order] = await db.select().from(ordersTable).where(and(
    eq(ordersTable.id, orderId),
    eq(ordersTable.hubspotCompanyId, session.hubspotCompanyId),
  ));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  // Verify location access for non-org-admins
  if (session.roleKey !== "org_admin") {
    const [access] = await db
      .select()
      .from(userLocationAccessTable)
      .where(and(
        eq(userLocationAccessTable.portalUserId, session.userId),
        eq(userLocationAccessTable.hubspotLocationId, order.hubspotLocationId),
      ));
    if (!access) { res.status(403).json({ error: "Access denied" }); return; }
  }

  const items = await db
    .select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  const [placedByUser] = await db.select({ username: portalUsersTable.username }).from(portalUsersTable).where(eq(portalUsersTable.id, order.portalUserId));
  const [loc] = await db.select({ nickname: hsLocationsTable.nickname }).from(hsLocationsTable).where(eq(hsLocationsTable.id, order.hubspotLocationId));
  const [company] = await db.select({ name: hsCompaniesTable.name }).from(hsCompaniesTable).where(eq(hsCompaniesTable.id, order.hubspotCompanyId));

  res.json({
    ...order,
    locationNickname: loc?.nickname ?? order.hubspotLocationId,
    orderedByUsername: placedByUser?.username ?? "",
    orgName: company?.name ?? "",
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    items,
  });
});

export default router;
