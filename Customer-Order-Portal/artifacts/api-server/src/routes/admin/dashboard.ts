import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable, portalUsersTable, hsCompaniesTable, locationRequestsTable,
} from "@workspace/db/schema";
import { eq, gte, desc, sql } from "drizzle-orm";
import { requireAdminAuth } from "../../middlewares/requireAdminAuth";
import { hsLocationsTable } from "@workspace/db/schema";

const router = Router();
router.use(requireAdminAuth);

router.get("/", async (_req, res) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalOrgs] = await db.select({ count: sql<number>`count(*)` }).from(hsCompaniesTable);
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(portalUsersTable);
  const [ordersMonth] = await db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(total_cents),0)` })
    .from(ordersTable).where(gte(ordersTable.orderedAt, startOfMonth));
  const [pendingRequests] = await db.select({ count: sql<number>`count(*)` })
    .from(locationRequestsTable).where(eq(locationRequestsTable.status, "pending"));

  const recentOrders = await db.select({
    id: ordersTable.id,
    orderNumber: ordersTable.orderNumber,
    poNumber: ordersTable.poNumber,
    status: ordersTable.status,
    paymentStatus: ordersTable.paymentStatus,
    totalCents: ordersTable.totalCents,
    orderedAt: ordersTable.orderedAt,
    hubspotCompanyId: ordersTable.hubspotCompanyId,
    hubspotLocationId: ordersTable.hubspotLocationId,
    shopifyOrderNumber: ordersTable.shopifyOrderNumber,
    hubspotPoId: ordersTable.hubspotPoId,
  })
    .from(ordersTable)
    .orderBy(desc(ordersTable.orderedAt))
    .limit(10);

  // Enrich with org names and location nicknames
  const companyIds = [...new Set(recentOrders.map((o) => o.hubspotCompanyId))];
  const companies = companyIds.length > 0
    ? await db.select({ id: hsCompaniesTable.id, name: hsCompaniesTable.name }).from(hsCompaniesTable)
    : [];
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));

  const locIds = [...new Set(recentOrders.map((o) => o.hubspotLocationId))];
  const locations = locIds.length > 0
    ? await db.select({ id: hsLocationsTable.id, nickname: hsLocationsTable.nickname }).from(hsLocationsTable)
    : [];
  const locMap = Object.fromEntries(locations.map((l) => [l.id, l.nickname]));

  res.json({
    totalOrgs: Number(totalOrgs?.count ?? 0),
    totalPortalUsers: Number(totalUsers?.count ?? 0),
    ordersThisMonth: Number(ordersMonth?.count ?? 0),
    revenueThisMonthCents: Number(ordersMonth?.revenue ?? 0),
    pendingLocationRequests: Number(pendingRequests?.count ?? 0),
    recentOrders: recentOrders.map((o) => ({
      ...o,
      orgName: companyMap[o.hubspotCompanyId] ?? o.hubspotCompanyId,
      locationNickname: locMap[o.hubspotLocationId] ?? o.hubspotLocationId,
      itemCount: 0,
    })),
  });
});

export default router;
