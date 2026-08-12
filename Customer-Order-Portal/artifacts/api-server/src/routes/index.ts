import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import crmRouter from "./crm";
import placesRouter from "./places";
import createOrderRouter from "./orders";
import portalDashboardRouter from "./portal/dashboard";
import portalOrdersRouter from "./portal/orders";
import portalAccountRouter from "./portal/account";
import portalLocationsRouter from "./portal/locations";
import portalLocationRequestsRouter from "./portal/location-requests";
import portalManageTeamRouter from "./portal/manage/team";
import portalManageContactsRouter from "./portal/manage/contacts";
import portalManageLocationsRouter from "./portal/manage/locations";
import portalManageLocationRequestsRouter from "./portal/manage/location-requests";
import portalManageBillingRouter from "./portal/manage/billing";
import adminAuthRouter from "./admin/auth";
import adminDashboardRouter from "./admin/dashboard";
import adminOrgsRouter from "./admin/organizations";
import adminOnboardRouter from "./admin/onboard";
import adminOrdersRouter from "./admin/orders";
import adminLocationRequestsRouter from "./admin/location-requests";
import adminLogsRouter from "./admin/logs";
import adminIdentityRouter from "./admin/identity";
import adminStaffRouter from "./admin/staff";

const router: IRouter = Router();

// Health
router.use(healthRouter);

// Auth (portal)
router.use("/auth", authRouter);

// Products
router.use("/products", productsRouter);

// CRM (data reads + cache refresh, requires portal auth)
router.use("/crm", crmRouter);

// Places autocomplete
router.use("/places", placesRouter);

// Portal: order creation (POST /) + order reads (GET /, GET /:id)
router.use("/portal/orders", createOrderRouter);
router.use("/portal/orders", portalOrdersRouter);

// Portal: dashboard
router.use("/portal/dashboard", portalDashboardRouter);

// Portal: account + alias emails
router.use("/portal/account", portalAccountRouter);

// Portal: locations list
router.use("/portal/locations", portalLocationsRouter);

// Portal: location requests (create + list)
router.use("/portal/location-requests", portalLocationRequestsRouter);

// Portal: manage — team
router.use("/portal/manage/team", portalManageTeamRouter);

// Portal: manage — contacts
router.use("/portal/manage/contacts", portalManageContactsRouter);

// Portal: manage — locations (org_admin)
router.use("/portal/manage/locations", portalManageLocationsRouter);

// Portal: manage — location requests (org_admin review)
router.use("/portal/manage/location-requests", portalManageLocationRequestsRouter);

// Portal: manage — billing profiles
router.use("/portal/manage/billing", portalManageBillingRouter);

// Admin auth
router.use("/admin/auth", adminAuthRouter);

// Admin dashboard
router.use("/admin/dashboard", adminDashboardRouter);

// Admin organizations (list + detail + sub-resources)
router.use("/admin/organizations", adminOrgsRouter);

// Admin onboarding wizard
router.use("/admin/onboard", adminOnboardRouter);

// Admin orders
router.use("/admin/orders", adminOrdersRouter);

// Admin location requests
router.use("/admin/location-requests", adminLocationRequestsRouter);

// Admin logs
router.use("/admin/integration-log", (req, _res, next) => {
  req.url = `/integration${req.url === "/" ? "" : req.url}`;
  next();
}, adminLogsRouter);
router.use("/admin/email-log", (req, _res, next) => {
  req.url = `/email${req.url === "/" ? "" : req.url}`;
  next();
}, adminLogsRouter);

// Admin identity resolver
router.use("/admin/identity", adminIdentityRouter);

// Admin staff management
router.use("/admin/staff", adminStaffRouter);

export default router;
