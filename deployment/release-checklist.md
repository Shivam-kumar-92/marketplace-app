# Production Release Checklist

> **Scope:** Operational pre-release verification protocol for deploying changes to `marketplace-app`.  
> **Target Audience:** Release Engineers, Operators, and Developers.

---

## Phase 1: Code & Build Verification (Local / CI)

- [ ] **Typecheck Verification**: Execute `npm test` (`tsc --noEmit`). Must exit with code `0` and zero errors.
- [ ] **Linting Verification**: Execute `npm run lint`. Ensure no unhandled ESLint errors or invalid React hooks.
- [ ] **Prisma Client Generation**: Execute `npx prisma generate` to confirm client generator synchronizes cleanly with `prisma/schema.prisma`.
- [ ] **Production Build Compilation**: Execute `npm run build`. Confirm all 44 routes compile with Turbopack and static page prerendering completes without unhandled exceptions.
- [ ] **Git Working Tree**: Confirm working branch is cleanly committed and tagged (`git status`).

---

## Phase 2: Environment Configuration & Secrets

- [ ] **`DATABASE_URL`**:
  - [ ] Confirmed pointing to target environment database (Staging vs Production).
  - [ ] Verified connection string includes `-pooler` host suffix (for Neon) and `&connection_limit=10`.
- [ ] **`STRIPE_SECRET_KEY`**:
  - [ ] Verified non-empty.
  - [ ] Validated key prefix (`sk_test_...` for staging, `sk_live_...` for live production).
- [ ] **`STRIPE_WEBHOOK_SECRET`**:
  - [ ] Verified non-empty.
  - [ ] Confirmed signing secret matches the specific endpoint registered in the Stripe dashboard for this environment.
- [ ] **`NEXT_PUBLIC_APP_URL`**:
  - [ ] Set to canonical public production domain (e.g. `https://nexmart.com`).
  - [ ] Verified that it does **NOT** equal `http://localhost:3000` (which breaks customer Stripe checkout return redirects).
- [ ] **`ADMIN_SECRET_KEY`**:
  - [ ] Set to a secure, randomly generated secret string.
  - [ ] Verified that it is **NOT** using the default `'marketplace_admin_secret_dev'` string.

---

## Phase 3: Database & Migration Verification

- [ ] **Schema Backward-Compatibility**:
  - [ ] Check if new fields are optional (`?`) or have `@default(...)` values.
  - [ ] Confirm no existing columns are dropped or renamed in a single release without a deprecation window.
- [ ] **Schema Synchronization**:
  - [ ] Run `npx prisma db push` against the staging/target database.
  - [ ] Confirm no data loss warnings are emitted by Prisma.
- [ ] **Catalog Data / Seed Verification**:
  - [ ] If deploying a fresh database, run `npm run seed` (`npx tsx prisma/seed.ts`).
  - [ ] Confirm categories, products, and default admin user are populated.

---

## Phase 4: API & Frontend Compatibility

- [ ] **API Contract Adherence**:
  - [ ] Confirm `/api/checkout` payload structure matches `useCartStore.ts` checkout initiation format.
  - [ ] Confirm error responses continue to return structured JSON envelopes `{ error: string, code: string }`.
- [ ] **Zustand Store Versioning**:
  - [ ] Check if `nexmart-cart-storage` schema in `localStorage` changed. If changed, verify cart migration or fallback logic.

---

## Phase 5: Deployment Execution

- [ ] **Deployment Triggered**: Push release commit to production branch or initiate PaaS deployment.
- [ ] **Build Log Audit**: Verify build completes on hosting provider without memory exhaustion or timeouts.
- [ ] **Container / Process Health**: Verify server starts cleanly (`next start` listening on target port).

---

## Phase 6: Post-Deployment Smoke Testing & Health Checks

- [ ] **Homepage Health**: Visit `GET /`. Verify page loads, hero displays, and product grid renders.
- [ ] **Product Page (SSG & Dynamic)**: Visit `/products/prod-1`. Verify variants, pricing, and images display properly.
- [ ] **Shopping Cart Flow**:
  - [ ] Add product to cart.
  - [ ] Open `/cart`.
  - [ ] Apply test promo code `NEXMART500`. Confirm discount recalculates properly.
- [ ] **Checkout Initialization**:
  - [ ] Click Proceed to Checkout.
  - [ ] Confirm redirection to hosted Stripe Checkout session (`checkout.stripe.com`).
  - [ ] Verify Stripe URL and line items match order summary.
- [ ] **Stripe Webhook Delivery**:
  - [ ] From Stripe Dashboard, send test `checkout.session.completed` event to `https://<DOMAIN>/api/webhooks/stripe`.
  - [ ] Verify HTTP `200 OK` response in Stripe event logs.
- [ ] **Admin Inventory Telemetry**:
  - [ ] Query `GET /api/admin/products` with `x-admin-key: <ADMIN_SECRET_KEY>`.
  - [ ] Verify HTTP `200 OK` returning inventory items.

---

## Phase 7: Observability & Rollback Readiness

- [ ] **Log Monitoring**: Inspect cloud log stream. Verify structured JSON logs are emitting without unexpected `INTERNAL_SERVER_ERROR` or Prisma connection errors.
- [ ] **Rollback Target Verified**: Document prior commit hash / prior deployment ID in release notes so immediate rollback can be executed if post-release alerts fire.
