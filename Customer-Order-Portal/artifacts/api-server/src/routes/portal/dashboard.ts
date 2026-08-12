import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, orderItemsTable, productsTable, userLocationAccessTable,
  hsLocationsTable,
} from "@workspace/db/schema";
import { eq, and, desc, gte, sql, inArray } from "drizzle-orm";
import { requirePortalAuth } from "../../middlewares/requirePortalAuth";

const router = Router();
router.use(requirePortalAuth);

router.get("/", async (req, res) => {
  const session = req.portalSession!;
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  let ordersBase = db.select({
    id: ordersTable.id,
    orderNumber: ordersTable.orderNumber,
    poNumber: ordersTable.poNumber,
    status: ordersTable.status,
    paymentStatus: ordersTable.paymentStatus,
    totalCents: ordersTable.totalCents,
    orderedAt: ordersTable.orderedAt,
    hubspotLocationId: ordersTable.hubspotLocationId,
    shopifyOrderNumber: ordersTable.shopifyOrderNumber,
    hubspotPoId: ordersTable.hubspotPoId,
    hubspotPoStatus: ordersTable.hubspotPoStatus,
  }).from(ordersTable).$dynamic();

  ordersBase = ordersBase.where(eq(ordersTable.hubspotCompanyId, session.hubspotCompanyId));

  if (session.roleKey !== "org_admin") {
    const access = await db
      .select({ hubspotLocationId: userLocationAccessTable.hubspotLocationId })
      .from(userLocationAccessTable)
      .where(eq(userLocationAccessTable.portalUserId, session.userId));
    const locIds = access.map((a) => a.hubspotLocationId);
    if (locIds.length === 0) {
      res.json({ ordersThisYear: 0, lastOrderDate: null, defaultLocationNickname: null, recentOrders: [], quickReorderProducts: [] });
      return;
    }
    ordersBase = ordersBase.where(and(
      eq(ordersTable.hubspotCompanyId, session.hubspotCompanyId),
      inArray(ordersTable.hubspotLocationId, locIds),
    ));
  }

  const allOrders = await ordersBase.orderBy(desc(ordersTable.orderedAt));

  const ordersThisYear = allOrders.filter((o) => new Date(o.orderedAt) >= startOfYear).length;
  const lastOrderDate = allOrders[0]?.orderedAt ?? null;
  const recentOrders = allOrders.slice(0, 5);

  // Default location
  const [defaultLoc] = await db
    .select({ nickname: hsLocationsTable.nickname })
    .from(hsLocationsTable)
    .where(and(
      eq(hsLocationsTable.companyId, session.hubspotCompanyId),
      eq(hsLocationsTable.isDefault, true),
    ));

  // Quick reorder: the 4 MOST-ORDERED products across the orders this user can see.
  let quickReorderProducts: (typeof productsTable.$inferSelect)[] = [];
  const visibleOrderIds = allOrders.map((o) => o.id);
  if (visibleOrderIds.length > 0) {
    const topProducts = await db
      .select({
        productId: orderItemsTable.productId,
        totalQty: sql<number>`sum(${orderItemsTable.quantity})`,
      })
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, visibleOrderIds))
      .groupBy(orderItemsTable.productId)
      .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
      .limit(4);
    const topIds = topProducts.map((t) => t.productId);
    if (topIds.length > 0) {
      const prods = await db.select().from(productsTable)
        .where(and(eq(productsTable.active, true), inArray(productsTable.id, topIds)));
      const orderIndex = new Map(topIds.map((id, idx) => [id, idx]));
      quickReorderProducts = prods.sort((a, b) => (orderIndex.get(a.id) ?? 9) - (orderIndex.get(b.id) ?? 9));
    }
  }

  // Enrich recentOrders with location nicknames
  const locIds2 = [...new Set(recentOrders.map((o) => o.hubspotLocationId))];
  const locs = locIds2.length > 0
    ? await db.select({ id: hsLocationsTable.id, nickname: hsLocationsTable.nickname })
        .from(hsLocationsTable).where(inArray(hsLocationsTable.id, locIds2))
    : [];
  const locMap = Object.fromEntries(locs.map((l) => [l.id, l.nickname]));

  res.json({
    ordersThisYear,
    lastOrderDate,
    defaultLocationNickname: defaultLoc?.nickname ?? null,
    recentOrders: recentOrders.map((o) => ({
      ...o,
      locationNickname: locMap[o.hubspotLocationId] ?? o.hubspotLocationId,
      itemCount: 0,
    })),
    quickReorderProducts,
  });
});

export default router;
