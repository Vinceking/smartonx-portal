# Deploying Smart On X Portal to Render (free tier)

Everything below was verified locally using the exact build/start commands
Render will run: one web service serves BOTH the API and the React app
(Express now serves the Vite build with an SPA fallback — added in this
patch set), plus a free Render Postgres.

## Free-tier facts to know up front
- **Web service sleeps after ~15 min idle**; first request after that takes
  ~1 min to cold-start. Fine for a demo — just open it a couple of minutes
  before showing anyone.
- **Free Postgres expires 30 days after creation** (Render emails you first).
  Demo-phase OK. When it expires, create a new one and re-run the seed, or
  swap DATABASE_URL to Supabase — the code needs no changes either way.
- **No shell on free web services**, so the database gets seeded from YOUR
  machine (or the Replit shell) using the database's External URL. Two
  commands, shown in Step 4.

---

## Step 1 — Put the repo on GitHub
Render deploys from a Git repo. Easiest paths:
- From Replit: Tools → Git → connect GitHub → push, or
- Locally: unzip this project, then
  `git init && git add -A && git commit -m "portal" && gh repo create smartonx-portal --private --source=. --push`

## Step 2 — Deploy with the Blueprint (recommended)
This repo now contains a `render.yaml` that defines the whole stack.

1. Render Dashboard → **New → Blueprint**
2. Select the repo → Render shows: web service `smartonx-portal` + database
   `smartonx-db` → **Apply**
3. It auto-generates SESSION_SECRET, wires DATABASE_URL to the database's
   internal URL, sets NODE_ENV=production, and starts the first build
   (~3–5 min).

The first deploy will come up with an EMPTY database — the UI loads but
logins fail until Step 4.

### Manual alternative (if you skip the blueprint)
1. **New → PostgreSQL**, plan Free, name `smartonx-db` → create, wait for
   Available.
2. **New → Web Service**, connect the repo, plan Free, runtime Node:
   - Build command:
     `corepack enable && pnpm install --frozen-lockfile && PORT=10000 BASE_PATH=/ pnpm --filter @workspace/customer-portal run build && pnpm --filter @workspace/api-server run build`
   - Start command:
     `node artifacts/api-server/dist/index.mjs`
   - Health check path: `/api/healthz`
   - Environment variables:
     - `DATABASE_URL` = the database's **Internal** URL (copy from the DB page)
     - `SESSION_SECRET` = any long random string
     - `NODE_ENV` = `production`
   (Render supplies `PORT` at runtime automatically. The inline
   `PORT=10000 BASE_PATH=/` in the build command only satisfies the Vite
   config's env checks at build time.)

## Step 3 — Grab the database External URL
Database page → Connections → **External Database URL** → copy. It looks
like `postgresql://sox:...@dpg-xxxx.oregon-postgres.render.com/soxportal`.

## Step 4 — Push schema + seed (from your machine or Replit shell)
External connections require SSL; appending `?sslmode=no-verify` handles it
with the pg driver this project uses — no code changes needed:

```bash
export DATABASE_URL="<EXTERNAL_URL>?sslmode=no-verify"
pnpm install                                  # first time only
pnpm --filter @workspace/db run push-force    # create tables
pnpm --filter @workspace/db run seed          # load demo data
```

The seed prints all demo credentials when it finishes. ⚠️ It WIPES and
reloads every table by design (idempotent demo data) — never point it at a
database you care about.

## Step 5 — Verify
Open `https://smartonx-portal.onrender.com` (your actual URL is on the
service page):

1. Homepage loads (this also confirms static serving + SPA fallback)
2. `/login` → username `schen` / `DemoPass123!` → dashboard shows orders
3. Log out → log in as `drchen.wasatch@gmail.com` (same password) → same
   account — the email-alias identity demo
4. `/admin/login` → `rachelle@smartonx.com` / `AdminDemo123!`
5. Place a test order → check `/admin/integration-log` for the
   `draftOrderCreate` payload

## Redeploys
Push to the connected branch → Render auto-builds and deploys. Schema
changes: re-run Step 4 (remember it wipes data).

## When the free Postgres hits its 30-day limit
Create a new Render Postgres (or a Supabase project), update the web
service's `DATABASE_URL` env var, re-run Step 4, done. For Supabase
specifically: use the transaction pooler URL (port 6543).
