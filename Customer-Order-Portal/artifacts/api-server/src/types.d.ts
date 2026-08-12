import type { PortalSession, AdminSession } from "./lib/session";

declare global {
  namespace Express {
    interface Request {
      portalSession?: PortalSession;
      adminSession?: AdminSession;
    }
  }
}
