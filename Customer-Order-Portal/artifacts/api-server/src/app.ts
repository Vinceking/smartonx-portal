import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { sessionMiddleware } from "./lib/session";

// Type augmentation for req.portalSession / req.adminSession
import "./types.d.ts";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);

app.use("/api", router);

// ─── Static frontend (single-service deploys: Render, Railway, etc.) ─────────
// Serves the Vite build of the customer portal when it exists, with an SPA
// fallback so client-side routes (/portal/orders, /admin, ...) deep-link
// correctly. API routes above always win; unknown /api paths still 404.
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const staticCandidates = [
  // relative to the bundled dist/index.mjs on a deployed server
  path.resolve(moduleDir, "../../customer-portal/dist/public"),
  // relative to repo root when cwd is the workspace root
  path.resolve(process.cwd(), "artifacts/customer-portal/dist/public"),
];
const staticDir = staticCandidates.find((p) => fs.existsSync(path.join(p, "index.html")));

if (staticDir) {
  logger.info({ staticDir }, "Serving customer portal static build");
  app.use(express.static(staticDir, { index: "index.html", maxAge: "1h" }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  logger.warn("No customer portal build found — API-only mode (run the Vite build to serve the UI)");
}

export default app;
