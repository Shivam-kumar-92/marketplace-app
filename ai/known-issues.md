# Known Issues, Risks & Technical Debt

> **Project:** NexMart Marketplace (`marketplace-app`)  
> **Status:** Read-Only Forensic Audit Log  
> **Rule:** Documented for awareness and remediation planning. No code has been altered during this documentation task.  

---

## 1. Summary of Known Issues

| Issue ID | Severity | Category | Affected Area | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ISS-001** | `MEDIUM` | Technical Debt | [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) | Floating-point `Float` types used for currency values in database | Open |
| **ISS-002** | `MEDIUM` | Reliability / Concurrency | [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts) | Lack of soft inventory reservation leases during checkout funnel | Open |
| **ISS-003** | `MEDIUM` | Database Integrity | [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) | Asymmetric foreign key cascades preventing user account deletion | Open |
| **ISS-004** | `LOW` | Scalability | [`src/lib/rateLimit.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/rateLimit.ts) | In-memory rate limiter does not share state across serverless instances | Open |
| **ISS-005** | `LOW` | Quality Assurance | [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json) | Absence of automated unit, integration, and E2E test suites | Open |
| **ISS-006** | `LOW` | Technical Debt | [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) | Dead schema models (`Account`, `Session`) without NextAuth package dependency | Open |
| **ISS-007** | `LOW` | Caching | [`src/lib/catalog.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/catalog.ts) | Category cache does not revalidate on admin product mutations | Open |
| **ISS-008** | `INFORMATIONAL`| Integration Debt | [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts) | Currency hardcoded to INR (`inr`) without multi-currency support | Open |

---

## 2. Detailed Issue Records

---

### ISS-001: Floating-Point `Float` Types for Monetary Database Columns
* **Issue:** Monetary fields (`basePrice`, `priceOffset`, `totalAmount`, `shippingAmount`, `OrderItem.price`) are typed as `Float` in the Prisma schema rather than `Decimal` or integer cents.
* **Severity:** `MEDIUM`
* **Evidence:** [`prisma/schema.prisma:106, 135, 184, 186, 217`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma#L106).
* **Affected Area:** Database persistence layer & Prisma schema.
* **Current Behavior:** Values are persisted as PostgreSQL `DOUBLE PRECISION` (64-bit IEEE-754 binary floating-point). Application-level `roundCurrency` with `Number.EPSILON` guards runtime calculations, but the underlying database column allows binary floating-point representation.
* **Expected Behavior:** Financial ledgers should store exact fixed-point decimals (`Decimal(12, 2)`) or integer minor units (paise/cents).
* **Possible Impact:** Cumulative multi-line rounding discrepancies in large-scale financial reporting and reconciliation audits.
* **Status:** Open (Active Technical Debt).
* **Recommended Next Fix:** Execute a database migration converting monetary columns in `prisma/schema.prisma` from `Float` to `Decimal @db.Decimal(12, 2)`.

---

### ISS-002: Lack of Soft Inventory Reservation Leases During Checkout Funnel
* **Issue:** Inventory stock is verified optimistically at the moment of checkout session creation, but the physical deduction occurs only upon payment settlement in the Stripe webhook.
* **Severity:** `MEDIUM`
* **Evidence:** [`src/app/api/checkout/route.ts:203-248`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts#L203-L248) and [`src/app/api/webhooks/stripe/route.ts:90-135`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts#L90-L135).
* **Affected Area:** Checkout and webhook inventory flow.
* **Current Behavior:** If multiple buyers initiate checkout for the final unit of a scarce product simultaneously, both can receive valid Stripe checkout URLs. The first to pay claims the stock; the second payment completes on Stripe and is flagged as `status: 'PROCESSING'` with an `[OVERSOLD_ALERT]` for manual review/refund.
* **Expected Behavior:** High-concurrency flash sales should temporarily hold stock for 15 minutes (matching Stripe session expiration) and release the hold if the session expires.
* **Possible Impact:** Customers may successfully pay for items that have just sold out seconds earlier during flash sales, requiring merchant customer support intervention and refunds.
* **Status:** Open (Operational Risk under high concurrency).
* **Recommended Next Fix:** Add a `reservedStock` counter on `Variant` and adjust it upon session creation and session expiration (`checkout.session.expired` webhook).

---

### ISS-003: Asymmetric Foreign Key Cascades Preventing User Account Deletion
* **Issue:** Deleting a `User` record who has placed orders triggers a database foreign key constraint violation.
* **Severity:** `MEDIUM`
* **Evidence:** [`prisma/schema.prisma:82, 190, 191`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma#L82).
* **Affected Area:** User deletion and relational cascading.
* **Current Behavior:** `User` has `onDelete: Cascade` to `Address`. However, `Order` references `Address` via `shippingAddress Address @relation(fields: [addressId], references: [id])` with default `Restrict`. Attempting to delete a user causes PostgreSQL to cascade delete the address, which is blocked by the order relation with error `23503`.
* **Expected Behavior:** Account deletion should either succeed via soft-delete (`deletedAt DateTime?`), or preserve historical delivery address snapshots directly on the `Order` record.
* **Possible Impact:** Administrators or automated GDPR compliance jobs fail when attempting to delete customer records.
* **Status:** Open (Database Integrity Constraint).
* **Recommended Next Fix:** Snapshot delivery address details directly into the `Order` table (as embedded JSON or discrete fields) and set `onDelete: SetNull` or soft-delete on `User`.

---

### ISS-004: In-Memory Rate Limiter Does Not Share State Across Serverless Instances
* **Issue:** The sliding-window rate limiter stores timestamps in a Node.js process-level `Map` object.
* **Severity:** `LOW`
* **Evidence:** [`src/lib/rateLimit.ts:5`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/rateLimit.ts#L5): `const rateLimitMap = new Map<string, RateLimitRecord>()`.
* **Affected Area:** API abuse prevention (`/api/checkout`, `/api/reviews`).
* **Current Behavior:** Rate limits are enforced strictly within each active Node.js server process. On distributed multi-instance serverless deployments (e.g. Vercel Edge / AWS Lambda), requests distributed across different container instances have independent rate counters.
* **Expected Behavior:** Global rate limiting across all serverless regions and instances.
* **Possible Impact:** A coordinated bot network distributing requests across different serverless instances can exceed the intended 10 requests/minute global ceiling.
* **Status:** Open (Architectural Limitation of in-memory caching).
* **Recommended Next Fix:** Integrate Upstash Redis (`@upstash/ratelimit`) when Redis credentials are provided, using the in-memory limiter as a graceful fallback.

---

### ISS-005: Absence of Automated Test Suites in Project Configuration
* **Issue:** No testing frameworks (Vitest, Jest, Playwright, or Cypress) are configured in `package.json`.
* **Severity:** `LOW`
* **Evidence:** [`package.json:scripts`](file:///c:/Users/admin/.gemini/marketplace-app/package.json#L5): Only `dev`, `build`, `start`, `lint`, `seed`, and `postinstall` exist.
* **Affected Area:** Continuous Integration and automated regression testing.
* **Current Behavior:** Code verification relies entirely on TypeScript static typechecking (`npx tsc --noEmit`) and manual browser testing.
* **Expected Behavior:** Automated unit test suite verifying promo code rules, discount thresholds, rate limiting, and webhook state transitions.
* **Possible Impact:** Future developers or AI agents could inadvertently introduce logic regressions without automated test suite detection.
* **Status:** Open (Quality Assurance Gap).
* **Recommended Next Fix:** Install and configure `vitest` with unit test specifications for `src/lib/promotions.ts`, `src/lib/rateLimit.ts`, and `src/lib/auth.ts`.

---

### ISS-006: Dead Schema Models Without NextAuth Package Dependency
* **Issue:** `Account` and `Session` models exist in `prisma/schema.prisma`, but NextAuth is not installed in `package.json`.
* **Severity:** `LOW`
* **Evidence:** [`prisma/schema.prisma:40-69`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma#L40-L69) and [`package.json:dependencies`](file:///c:/Users/admin/.gemini/marketplace-app/package.json#L16).
* **Affected Area:** Database schema and authentication packages.
* **Current Behavior:** `Account` and `Session` tables are created in PostgreSQL by migrations, but no authentication library writes or reads from them (the app currently uses custom session token checks in `src/lib/auth.ts`).
* **Expected Behavior:** Either install and configure NextAuth (`next-auth`) to utilize the tables, or remove unused models.
* **Possible Impact:** Unused tables consume database catalog resources and create slight schema drift.
* **Status:** Open (Technical Debt).
* **Recommended Next Fix:** Decide whether to configure NextAuth / Auth.js or clean up unused schema models.

---

### ISS-007: Stale Category Cache on Admin Mutations
* **Issue:** Admin product creation does not invalidate the `getCachedCategories` cache tag.
* **Severity:** `LOW`
* **Evidence:** [`src/lib/catalog.ts:59`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/catalog.ts#L59) and [`src/app/api/admin/products/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/admin/products/route.ts).
* **Affected Area:** Category product counts on the storefront navigation.
* **Current Behavior:** When an admin creates or reassigns a product, the storefront navigation category counts rely on `unstable_cache` with a 300-second TTL, taking up to 5 minutes to reflect the new counts.
* **Expected Behavior:** Admin mutations should trigger instant cache invalidation via `revalidateTag`.
* **Possible Impact:** Temporary 5-minute visual delay in product count badges.
* **Status:** Open (Minor UX Latency).
* **Recommended Next Fix:** Tag the category cache with `['catalog-categories']` and invoke `revalidateTag('catalog-categories')` inside `POST /api/admin/products`.

---

### ISS-008: Currency Hardcoded to INR
* **Issue:** Line items in Stripe sessions hardcode `currency: 'inr'`.
* **Severity:** `INFORMATIONAL`
* **Evidence:** [`src/app/api/checkout/route.ts:323, 341`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts#L323).
* **Affected Area:** Stripe checkout currency configuration.
* **Current Behavior:** All transactions are denominated in Indian Rupees (₹).
* **Expected Behavior:** Expected for an Indian domestic marketplace; multi-currency international sales would require dynamic currency resolution.
* **Possible Impact:** International buyers must pay in INR; non-INR payments require Stripe multi-currency conversion.
* **Status:** Documented Architecture Constraint.
* **Recommended Next Fix:** Parameterize currency when expanding to international payment rails.
