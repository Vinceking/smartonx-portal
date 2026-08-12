# Deploying Smart On X Portal to Render — 100% browser, zero terminal

This build includes a one-URL database bootstrap: after deploying, you visit
`/api/setup?token=...` in your browser and it creates all tables and loads
the demo data (verified: empty database -> fully seeded in ~2 seconds).
Re-visiting that URL later resets the demo data — handy before demos.

## Part 1 — Get the code onto GitHub (browser only)

1. Unzip `Customer-Order-Portal-RENDER-READY.zip` on your computer
   (double-click). You get a folder `Customer-Order-Portal`.
2. On github.com: click the **+** (top right) -> **New repository**
   - Name: `smartonx-portal`  |  Visibility: **Private**
   - CHECK **"Add a README file"** (required so the web editor can open)
   - Click **Create repository**
3. On the new repo's page, press the **period key ( . )** on your keyboard —
   or edit the address bar from `github.com` to `github.dev`. VS Code opens
   in your browser.
4. Open the unzipped folder on your computer, **select everything INSIDE it**
   (Ctrl+A / Cmd+A), and **drag it into the file list panel** on the left
   side of the browser editor. Wait for the upload to finish.
   - Windows: you're done. Mac: press Cmd+Shift+. in Finder first so hidden
     files (.npmrc, .gitignore) are included in the select-all — .npmrc is
     required for the build.
5. Click the **Source Control icon** on the far left (the branch symbol with
   a number badge). Type a message like `initial upload`, then click
   **Commit & Push** (the checkmark). Wait for the badge to clear.
6. Sanity check: back on github.com, the repo's front page should show
   `render.yaml`, `package.json`, `pnpm-lock.yaml`, `artifacts/`, `lib/` at
   the TOP level (not nested inside another folder).

Plan B if github.dev misbehaves: install **GitHub Desktop** (app, no
terminal) -> File -> Add local repository -> point at the folder -> Publish.

## Part 2 — Deploy on Render (all clicks)

1. Render Dashboard -> **New** -> **Blueprint**
2. Connect your GitHub account when prompted; grant access to
   `smartonx-portal`; select the repo.
3. Render reads `render.yaml` and lists what it will create:
   web service `smartonx-portal` + database `smartonx-db`. Click **Apply**.
4. Wait ~5 minutes. The web service's **Logs** tab shows the build; it ends
   with "Server listening". Your URL appears at the top of the service page
   (something like `https://smartonx-portal.onrender.com`).

## Part 3 — Create tables + demo data (one URL visit)

1. In Render: open the **smartonx-portal** web service -> **Environment**
   tab -> find **SETUP_TOKEN** -> click the eye icon to reveal -> copy it.
2. In a new browser tab, visit:
   `https://YOUR-APP.onrender.com/api/setup?token=PASTE_TOKEN_HERE`
3. You'll get a JSON page: `"ok": true`, `"schemaCreated": true`, counts for
   companies/locations/users/orders, and the demo credentials.

## Part 4 — Verify

- `https://YOUR-APP.onrender.com/login` -> `schen` / `DemoPass123!`
- Log out, log in as `drchen.wasatch@gmail.com` (same password) -> same
  account = the email-alias identity demo, live in production
- `/admin/login` -> `rachelle@smartonx.com` / `AdminDemo123!`
- Place an order as schen, then Admin -> Integration Log -> inspect the
  `draftOrderCreate` payload

## Ongoing

- **Demo reset:** visit the setup URL again — wipes and reloads all demo data.
- **Cold starts:** free services sleep after ~15 idle minutes; first hit
  takes ~1 min. Open the site a couple minutes before any demo.
- **Free Postgres expires after 30 days** (Render emails you). Create a new
  one (or Supabase), update DATABASE_URL in the service's Environment tab,
  visit the setup URL once. No code changes.
- **Code updates:** edit via github.dev (press `.` on the repo) or upload
  replacement files via GitHub's "Add file -> Upload files"; every push
  auto-deploys.
- **Before going live with real customers:** delete the SETUP_TOKEN env var
  (the endpoint then returns 404) and re-deploy.
