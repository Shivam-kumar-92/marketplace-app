# API Contracts & Resolution Audit

> **Project:** NexMart Marketplace  
> **Backend Framework:** Next.js 16.3.6 (App Router)  
> **Client Framework:** Next.js Client Components (React 19) + Zustand Store  
> **Database:** PostgreSQL via Prisma ORM 7.10.0  
> **Payment Service:** Stripe Checkout API  
> **Status:** Hardened, Concurrency-Guarded & Integrity-Verified  

---

## 1. Resolution of Deep Data Integrity & Consistency Findings

| Audit ID | Vulnerability | Remediation Implemented | Status |
| :--- | :--- | :--- | :--- |
| **DCI-001** | Double Inventory Decrement Race (TOCTOU in Stripe Webhook) | Implemented conditional atomic update: `tx.order.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'PAID' } })`. If `count === 0`, concurrent execution returns immediately without decrementing stock a second time. | **RESOLVED** |
| **DCI-002** | Physical Overselling via Unreserved Checkout Inventory | If stock is depleted between checkout and webhook settlement (`updateResult.count === 0`), order is flagged as `status: 'PROCESSING'` with alert log for fulfillment review/refund instead of silent overselling. | **RESOLVED** |
| **DCI-003** | Orphaned `PENDING` Orders on External Stripe API Failure | Wrapped `stripe.checkout.sessions.create` in a dedicated try/catch with automated database rollback (`prisma.order.delete`), returning `HTTP 502` (`PAYMENT_SESSION_FAILED`). | **RESOLVED** |
| **DCI-004** | Insecure Direct Object Reference (IDOR) & Unauthenticated PII Exposure | `GET /api/orders/[id]` now requires either authenticated user ownership, admin privileges, or a verified `session_id` query parameter matching the order's Stripe session. `GET /api/orders` now requires authentication, removing unauthenticated email query scraping. | **RESOLVED** |
| **DCI-005** | Unauthenticated Customer Profile Mutation (Name Tampering) | In `resolveCustomerAccount` ([`src/lib/auth.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/auth.ts)), updated `prisma.user.upsert` with `update: {}` so guest checkouts cannot overwrite existing registered user names. | **RESOLVED** |
| **DCI-006** | Financial Rounding Drift from IEEE-754 Floating-Point Arithmetic | Implemented `roundCurrency(amount)` with `Number.EPSILON` precision in [`src/lib/promotions.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/promotions.ts) and applied to all prices, line items, subtotals, and totals in [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts). | **RESOLVED** |
| **DCI-007** | Lost Updates in Review Counter & Aggregate Rating | Moved review lookup and product rating recalculation inside `prisma.$transaction` boundary with atomic recalculation. | **RESOLVED** |
| **DCI-009** | Silent Dropping of Variant Inventory Updates in Admin API | Updated `POST /api/admin/products` to execute atomic variant upserts (`tx.variant.upsert`) inside a transaction when updating existing products. | **RESOLVED** |
| **DCI-010** | Unhandled Database Unique Constraint Errors in Admin API | Added specific error interception for Prisma code `P2002` (unique slug / SKU conflict), returning `HTTP 409` (`DUPLICATE_ENTRY`). | **RESOLVED** |

---

## 2. Updated Request & Response Contracts

### 2.1 `POST /api/checkout`
- **Request Body Contract:**
  - `items`: `Array<{ productId?: string; variantId?: string; id?: string; quantity: number }>` (**Required**)
  - `couponCode`: `string` (**Optional**) — e.g. `"NEXMART500"`, `"WELCOME10"`, `"FREESHIP"`.
  - `customerEmail`: `string` (**Optional**) — Customer contact email for receipts.
  - `customerName`: `string` (**Optional**) — Customer name.
  - `shippingAddress`: `Object` (**Optional**) — Delivery address fields.
  - `idempotencyKey`: `string` (**Optional**) — Deduplication key.
- **Success Contract (`200 OK`):**
  - `success`: `true`
  - `url`: `string` (Hosted Stripe URL)
  - `orderId`: `string` (PostgreSQL `Order.id`)
  - `sessionId`: `string` (Stripe Session ID)
  - `financials`: `{ subtotal: number, discountAmount: number, shippingAmount: number, totalAmount: number, appliedCoupon: string | null }`

### 2.2 `GET /api/orders/[id]`
- **Authorization Contract:**
  - Authenticated Users: Allowed if `currentUser.id === order.userId` or `currentUser.role === 'ADMIN'`.
  - Guest Visitors: Allowed only if providing `?session_id=...` matching `order.stripeSessionId` or `?email=...` matching `order.user.email`.
- **Response Contract (`200 OK`):**
  - `success`: `true`
  - `order`: `{ id, status, totalAmount, shippingAmount, customer, shippingAddress, items }`

### 2.3 `GET /api/orders`
- **Authorization Contract:** Requires authenticated session (`HTTP 401` if unauthenticated). Non-admins are scoped strictly to their own orders (`where.userId = currentUser.id`).
- **Response Contract (`200 OK`):**
  - `success`: `true`
  - `pagination`: `{ page, limit, total, totalPages }`
  - `orders`: `Array<{ id, status, totalAmount, createdAt, itemCount, items }>`
