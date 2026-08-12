# Fixes applied by Claude (audited + live-tested) — Aug 12, 2026

All changes verified against a real Postgres 16 instance: full `pnpm run
typecheck` passes, seed runs twice cleanly, and every flow below was
exercised over HTTP against the running server.

## Showstoppers fixed
1. **Login contract** — server now reads `usernameOrEmail` (tolerates legacy
   `username`). Before: every login returned 400. (routes/auth.ts)
2. **Email-alias login implemented** — any address in hs_contact_emails
   resolves to the owning portal account. VERIFIED: `schen` and
   `drchen.wasatch@gmail.com` both log into the same account.
3. **Password reset** — `eq(usedAt, null)` (never true in SQL) → `isNull()`.
4. **Order-list SQL** — both hand-built `ANY(ARRAY[...])` constructs replaced
   with `inArray()`; the item-count query previously threw at runtime.
5. **Dashboard purchaser filter** — raw `?` placeholders (invalid SQL)
   replaced with `inArray()`; removed the `@ts-expect-error` that hid it.
6. **Order numbers** — random 4-digit suffix (collision → 500) replaced with
   date + 6 hex chars (16.7M/day space).

## Security fixes
7. **Tenant isolation on order create** — location AND billing profile must
   belong to the session's company for ALL roles (was: billing never checked;
   location unchecked for org_admins). VERIFIED: cross-tenant billing → 403.
8. **Server-side quantity validation** — integer 1–99 enforced; PO capped at
   40 chars. VERIFIED: quantity -5 → 400.
9. **Session cookie slimmed** — the entire CRM cache (locations/billing/
   contacts) was serialized into the cookie (~4KB browser cap = login
   failures for DSOs; stale role/active for 8h). Cookie now carries identity
   only; `requirePortalAuth` re-verifies user/role/isActive from the DB on
   every request, so deactivation is immediate.
10. **Location grants scoped** — team POST/PATCH validate every granted
    location id belongs to the org.
11. **Self-deactivation guard** — org admins can no longer deactivate
    themselves.
12. **Billing-profile delete guard** — friendly "in use by N locations" 400
    instead of a raw FK 500.
13. **CRM Refresh no longer logs you out** — the endpoint was clearing the
    session cookie as its "cache bust".

## Correctness / demo fixes
14. **Order list returns `{orders: ...}`** matching the OpenAPI contract
    (server returned `{data: ...}` → every order table rendered empty).
15. **"Ordered By" shows the actual placer**, not the current viewer.
16. **Quick Reorder is real** — 4 most-ordered products from the user's
    visible order history (was `products.slice(0, 4)`).
17. **Duplicate broken hook call removed** from the portal orders page;
    `keepPreviousData` migrated to React Query v5 `placeholderData`; generated
    hook option types loosened to `Partial<UseQueryOptions>` to match the
    codegen's runtime behavior.
18. **Integration payloads are real API shapes** — Shopify logs an exact
    `draftOrderCreate` input (lineItems, shipping+billing addresses,
    customAttributes carrying po_number + all 3 HubSpot ids, tags,
    paymentTerms NET on terms orders, AP email as invoice recipient);
    HubSpot logs CRM v3 `{properties, associations[]}` with placeholder
    associationTypeId 0 for phase 2. VERIFIED in integration_log.
19. **Typecheck now passes** — it never did (pre-existing errors, incl. the
    hidden dashboard SQL bug and `req.params` typing in two files).

## Seed v2 (lib/db/src/seed.ts)
- **Idempotent** (verified: two consecutive runs).
- Dr. **Sarah** Chen with TWO emails (the flagship alias demo).
- Regional scoping is real: rnorth = Lehi+Ogden of Summit's 5 locations;
  pdiaz = 2 of BrightPath's 3; csanders = 2 of Frontier's 4; jbeck = Ogden
  only (verified via order-visibility test). ryoung = 2 locations.
- Summit + BrightPath each have a **second (card) billing profile**.
- `card_at_checkout` / `net_terms` values only (never "card").
- 25 orders dated within the **last 120 days of run time** (dashboards show
  live numbers), status mix 3 submitted / 4 processing / 6 shipped /
  11 delivered / 1 cancelled; Shopify numbers use the SX- prefix.
- 1 pending location request (jbeck, "Summit Ogden North") + notification
  email to rachelle@smartonx.com in email_log; 4 extra CRM-only contacts.
- Totals: 10 orgs / 21 locations / 12 billing profiles / 20 users /
  24 contacts / 25 emails / 14 products / 25 orders.

## Live smoke tests (all passed)
- Login by username, by primary email, by gmail alias → same account
- Wrong password → generic 401
- quantity -5 → 400 | cross-tenant billing profile → 403
- Purchaser ordering to non-permitted location → 403
- Valid net-terms order → 201, correct totals (2×$249 + $15 ship = $513),
  SX- Shopify number, confirmation email logged
- Order list: `{orders,...}` contract shape, correct Ordered By,
  jbeck's visibility limited to Summit Ogden

## Still open (hand to Replit as F3, or back to Claude)
- Homepage rebuild (smartonx nav + Shop dropdown + top-right Log In pill +
  product-line grid) — untouched frontend.
- Regional admins still cannot create purchasers (mutations are
  org_admin-only) — needs the constrained-powers implementation.
- Onboarding wizard: wrap in a transaction + duplicate-email 409 pre-check.
- Places: return empty on no match (currently shows 3 unrelated addresses)
  + real Google Places branch behind GOOGLE_PLACES_API_KEY.
- PO suggestion endpoint, "DEMO — not a real charge" banner, inline
  create-contact in Add User.

## Run
```
DATABASE_URL=postgres://...  SESSION_SECRET=<random>  PORT=5000
pnpm install
pnpm --filter @workspace/db run push-force
pnpm --filter @workspace/db run seed
pnpm --filter @workspace/api-server run dev
```
Supabase note: use the transaction pooler (port 6543) and pass
`prepare: false` to the postgres driver when you move the DB there.
