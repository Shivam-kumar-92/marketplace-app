# Technical Decisions & Architectural Log

> **Project:** NexMart Marketplace (`marketplace-app`)  
> **Purpose:** Chronological and thematic record of verified engineering decisions, implementation details, trade-offs, and historical context.  
> **Source Verification:** Every entry is tied to verifiable code evidence in the repository.  

---

## 1. Foundation & Framework Decisions

### DEC-001: Next.js 16 App Router as Unified Full-Stack Architecture
* **Decision:** Adopted Next.js 16.3.6 with App Router, React 19.2.8, and TypeScript 5 as a monolithic full-stack application.
* **Why It Appears to Have Been Made:** Unifies client-side interactive shopping components, server-side data fetching, and backend API route handlers under a single runtime without requiring a separate Express/Nest backend repository.
* **Current Implementation:** All routes, layouts, and API handlers live under [`src/app/`](file:///c:/Users/admin/.gemini/marketplace-app/src/app).
* **Files Affected:** [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json), [`next.config.ts`](file:///c:/Users/admin/.gemini/marketplace-app/next.config.ts), [`src/app/layout.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/layout.tsx), [`src/app/api/`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api).
* **Known Trade-offs:** Node.js runtime cold starts on serverless environments; tight coupling between frontend and backend deployments.
* **Evidence:** `package.json: dependencies.next: "16.3.6"`, `dependencies.react: "19.2.8"`.
* **Reasoning Status:** `VERIFIED` from codebase structure and framework configuration.

---

### DEC-002: PostgreSQL via Prisma ORM 7 with CUID Primary Keys
* **Decision:** Adopted Prisma ORM with PostgreSQL as the relational database engine, utilizing collision-resistant CUIDs (`@default(cuid())`) for primary keys.
* **Why It Appears to Have Been Made:** Provides compile-time type safety across database operations, automated migrations, clean relationship handling, and URL-safe non-sequential IDs that prevent ID enumeration attacks.
* **Current Implementation:** Schema declared in [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma); singleton connection client initialized in [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts).
* **Files Affected:** [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma), [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts).
* **Known Trade-offs:** CUIDs consume more storage bytes than auto-increment integers; Prisma engine binary adds deployment bundle weight.
* **Evidence:** `prisma/schema.prisma: datasource db { provider = "postgresql" }`, `id String @id @default(cuid())`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-003: Tailwind CSS v4 PostCSS Integration
* **Decision:** Configured Tailwind CSS v4 using `@tailwindcss/postcss` and native `@import "tailwindcss"` in `globals.css` instead of legacy Tailwind v3 JavaScript config files.
* **Why It Appears to Have Been Made:** Tailwind v4 features improved build speeds via the Oxide engine and eliminates redundant configuration overhead in modern Next.js setups.
* **Current Implementation:** [`postcss.config.mjs`](file:///c:/Users/admin/.gemini/marketplace-app/postcss.config.mjs) loads `@tailwindcss/postcss`; [`src/app/globals.css`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/globals.css) imports the framework directly.
* **Files Affected:** [`postcss.config.mjs`](file:///c:/Users/admin/.gemini/marketplace-app/postcss.config.mjs), [`src/app/globals.css`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/globals.css).
* **Known Trade-offs:** Tailwind v4 features breaking syntax changes from v3 plugins; custom utility extension patterns differ.
* **Evidence:** `postcss.config.mjs: plugins: { "@tailwindcss/postcss": {} }`, `globals.css: @import "tailwindcss"`.
* **Reasoning Status:** `VERIFIED`.

---

## 2. Payment & Checkout Decisions

### DEC-004: Hosted Stripe Checkout Sessions Over Embedded Payment Elements
* **Decision:** Utilized Stripe Hosted Checkout (`stripe.checkout.sessions.create`) instead of embedding custom card input fields or Stripe Elements directly into the DOM.
* **Why It Appears to Have Been Made:** Minimizes PCI-DSS compliance scope (SAQ A compliance), natively supports multi-device payment methods (Apple Pay, Google Pay, 3D Secure), and offloads cardholder data security directly to Stripe.
* **Current Implementation:** [`POST /api/checkout`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts#L400-L425) creates the session and redirects the browser to `session.url`.
* **Files Affected:** [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts), [`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts), [`src/app/cart/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/cart/page.tsx).
* **Known Trade-offs:** User experiences a page redirect away from the merchant domain and must be redirected back upon completion.
* **Evidence:** `src/app/api/checkout/route.ts: stripe.checkout.sessions.create({ mode: 'payment', ... })`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-005: Fail-Closed Order Persistence Architecture
* **Decision:** Prohibited generating simulated order IDs or proceeding to Stripe payments if the PostgreSQL database insertion fails.
* **Why It Appears to Have Been Made:** Prevents charging customers for orders that cannot be fulfilled or tracked in the backend database.
* **Current Implementation:** [`src/app/api/checkout/route.ts:285-318`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts#L285-L318) halts execution with `HTTP 500` (`ORDER_PERSIST_FAILED`) if `prisma.order.create` throws an error.
* **Files Affected:** [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts).
* **Known Trade-offs:** If PostgreSQL experiences a temporary connection drop, checkout attempts fail immediately rather than queuing asynchronously.
* **Evidence:** Code catch block returns `{ code: 'ORDER_PERSIST_FAILED', status: 500 }` and does not proceed to Stripe SDK.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-006: Compensating Rollback Transaction on Stripe Session Failure
* **Decision:** If `stripe.checkout.sessions.create` fails or times out after an order has been created in PostgreSQL, the system executes an automated compensating delete/cancellation on the database order.
* **Why It Appears to Have Been Made:** Prevents accumulating orphaned `PENDING` orders with `stripeSessionId = null` that can never receive webhook events.
* **Current Implementation:** [`src/app/api/checkout/route.ts:422-445`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts#L422-L445) executes `prisma.order.delete` in the catch block and responds with `HTTP 502` (`PAYMENT_SESSION_FAILED`).
* **Files Affected:** [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts).
* **Known Trade-offs:** Requires an additional database write on failure paths.
* **Evidence:** Code inspection of `catch (stripeErr)` in `src/app/api/checkout/route.ts`.
* **Reasoning Status:** `VERIFIED`.

---

## 3. Concurrency, Data Integrity & Security Decisions

### DEC-007: Conditional Atomic Order Transitions & Inventory Race Guards
* **Decision:** Enforced that order status updates in the Stripe webhook execute conditionally (`where: { id: order.id, status: 'PENDING' }`) inside `prisma.$transaction`, coupled with atomic `stock: { gte: quantity }` decrements.
* **Why It Appears to Have Been Made:** Prevents double inventory deductions caused by concurrent Stripe webhook retries (TOCTOU race condition).
* **Current Implementation:** [`src/app/api/webhooks/stripe/route.ts:70-135`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts#L70-L135).
* **Files Affected:** [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts).
* **Known Trade-offs:** Requires transactional isolation overhead on webhook handling.
* **Evidence:** `tx.order.updateMany({ where: { id: order.id, status: 'PENDING' } })`, `tx.variant.updateMany({ where: { stock: { gte: item.quantity } } })`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-008: Server-Side Promotion Validation & Dynamic Stripe Line Items
* **Decision:** Enforced all discount calculations (`NEXMART500`, `WELCOME10`, `FREESHIP`) and shipping thresholds strictly on the server side ([`src/lib/promotions.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/promotions.ts)), generating dynamic one-time Stripe discount coupons and shipping line items.
* **Why It Appears to Have Been Made:** Ensures the customer is charged the exact discounted amount verified by the server rather than relying on unvalidated client UI calculations.
* **Current Implementation:** [`src/lib/promotions.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/promotions.ts) and [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts).
* **Files Affected:** [`src/lib/promotions.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/promotions.ts), [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts), [`src/app/cart/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/cart/page.tsx).
* **Known Trade-offs:** Requires an extra API call to `stripe.coupons.create` for percentage/fixed discounts during session creation.
* **Evidence:** `src/lib/promotions.ts: ACTIVE_COUPONS`, `src/app/api/checkout/route.ts: stripe.coupons.create`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-009: In-Memory Sliding-Window Rate Limiting
* **Decision:** Implemented an in-memory sliding-window rate limiter ([`src/lib/rateLimit.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/rateLimit.ts)) guarding `POST /api/checkout` and `POST /api/reviews`.
* **Why It Appears to Have Been Made:** Protects the checkout endpoint against automated card-testing scripts and protects the review endpoint against automated spam without requiring an external paid Redis subscription.
* **Current Implementation:** Sliding window with timestamp filtering and automatic 5-minute background sweep.
* **Files Affected:** [`src/lib/rateLimit.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/rateLimit.ts), [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts), [`src/app/api/reviews/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/reviews/route.ts).
* **Known Trade-offs:** In multi-instance serverless deployments without shared memory, limits apply per instance rather than globally across clusters.
* **Evidence:** `src/lib/rateLimit.ts: checkRateLimit`, `src/app/api/checkout/route.ts: checkRateLimit('checkout_' + clientIp, ...)`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-010: Token-Verified IDOR Protection for Guest Orders
* **Decision:** Required that unauthenticated guest requests to `GET /api/orders/[id]` provide a matching `session_id` query parameter, while authenticated users must own the order or possess the `ADMIN` role.
* **Why It Appears to Have Been Made:** Closes Insecure Direct Object Reference (IDOR) vulnerabilities that allowed public enumeration of customer names, delivery addresses, and purchase histories.
* **Current Implementation:** [`src/app/api/orders/[id]/route.ts:58-86`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/orders/%5Bid%5D/route.ts#L58-L86).
* **Files Affected:** [`src/app/api/orders/[id]/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/orders/%5Bid%5D/route.ts), [`src/app/checkout/success/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/checkout/success/page.tsx).
* **Known Trade-offs:** The client checkout success page must preserve and forward the `session_id` query parameter when verifying order status.
* **Evidence:** Code verification in `src/app/api/orders/[id]/route.ts`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-011: Structured Zero-Dependency Logging with Distributed Correlation
* **Decision:** Built a zero-dependency structured logger ([`src/lib/logger.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/logger.ts)) that extracts or generates a correlation ID (`requestId`) and formats output as JSON in production.
* **Why It Appears to Have Been Made:** Enables machine ingestion into log management platforms (Datadog, CloudWatch, Axiom) and allows tracing individual transactions across Next.js and Stripe metadata without adding heavy logging dependencies.
* **Current Implementation:** [`src/lib/logger.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/logger.ts).
* **Files Affected:** [`src/lib/logger.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/logger.ts), [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts).
* **Known Trade-offs:** Does not include advanced features like log streaming to external sockets out of the box.
* **Evidence:** `src/lib/logger.ts: class Logger`, `getRequestId`.
* **Reasoning Status:** `VERIFIED`.

---

### DEC-012: Hybrid Client-Local / Server Database Cart Architecture
* **Decision:** Implemented a two-tier cart model: instant client persistence via Zustand `localStorage` for guests, coupled with a server synchronization API ([`GET/POST /api/cart`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts)) and store methods (`syncWithServer`, `loadServerCart`) for authenticated users.
* **Why It Appears to Have Been Made:** Combines instantaneous, zero-latency cart operations for anonymous shoppers with cross-device persistence for registered customers.
* **Current Implementation:** [`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts), [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts).
* **Files Affected:** [`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts), [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts), [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma).
* **Known Trade-offs:** Requires an explicit synchronization trigger when a user logs in to merge local items with server items.
* **Evidence:** `src/app/api/cart/route.ts`, `src/store/useCartStore.ts: syncWithServer, loadServerCart`.
* **Reasoning Status:** `VERIFIED`.
