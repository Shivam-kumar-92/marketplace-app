# API Endpoints Reference

> **Project:** NexMart Marketplace  
> **Framework:** Next.js 16.3.6 (App Router)  
> **Runtime:** Node.js (V8) / Next.js Server Components & Route Handlers  
> **Database:** PostgreSQL via Prisma ORM 7.10.0  
> **Payment Service:** Stripe Node SDK (`stripe@^22.6.2`)  
> **Base URL:** `/api` (Unversioned)  
> **Updated:** October 2026 (Production Hardened & Expanded Surface)  

---

## 1. Overview & Architecture

The NexMart API is built entirely using Next.js App Router Route Handlers located under `src/app/api/`. Route resolution, request parsing, and response dispatch are handled natively by the Next.js Web API layer (`NextRequest` / `NextResponse`).

```
Client (Browser / Stripe Webhook / Admin)
  │
  ▼
Next.js App Router (/api/*)
  │
  ├─► POST /api/checkout ────────► Prisma ORM / Promotions Engine ──► Stripe SDK (Checkout Session)
  ├─► POST /api/webhooks/stripe ──► HMAC Verification ──────────────► Prisma $transaction (Stock & Order)
  ├─► GET  /api/orders/[id] ─────► Prisma ORM (Verified Order Status & Items)
  ├─► GET  /api/orders ──────────► Prisma ORM (Customer / Admin Order History with Pagination)
  ├─► GET  /api/reviews ─────────► Prisma ORM (Product Reviews & Ratings)
  ├─► POST /api/reviews ─────────► Prisma $transaction (Atomic Review & Product Rating Update)
  ├─► GET  /api/admin/products ──► Prisma ORM (Inventory Stock Levels & Sales Analytics)
  └─► POST /api/admin/products ──► Prisma ORM (Product & Variant Catalog Management)
```

### Route Inventory Summary

| Method | Path | Access | Version | Purpose | Source File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/checkout` | Public / Hybrid | Unversioned | Validates cart, enforces server coupons & shipping fees, creates persistent DB order, and creates Stripe Checkout Session (Fail-Closed) | [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts) |
| `POST` | `/api/webhooks/stripe` | External / Webhook (HMAC) | Unversioned | Handles Stripe webhook events (`completed`, `expired`), decrements inventory with race-guards, updates order state | [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts) |
| `GET` | `/api/orders/[id]` | Public / Authenticated | Unversioned | Retrieves verified order details, items, shipping address, and payment status for checkout confirmation | [`src/app/api/orders/[id]/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/orders/[id]/route.ts) |
| `GET` | `/api/orders` | Customer / Admin | Unversioned | Returns paginated customer order history filtered by user session, email, or order status | [`src/app/api/orders/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/orders/route.ts) |
| `GET` | `/api/reviews` | Public | Unversioned | Lists paginated reviews and ratings for a given product | [`src/app/api/reviews/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/reviews/route.ts) |
| `POST` | `/api/reviews` | Customer | Unversioned | Submits or updates a verified customer review, atomically re-aggregating product rating | [`src/app/api/reviews/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/reviews/route.ts) |
| `GET` | `/api/cart` | Public / Customer | Unversioned | Retrieves persistent server-side cart for logged-in user | [`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts) |
| `POST` | `/api/cart` | Public / Customer | Unversioned | Synchronizes client localStorage items with PostgreSQL database cart | [`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts) |
| `GET` | `/api/admin/products` | Admin Only | Unversioned | Retrieves inventory overview with low-stock warnings, sales counts, and variant details | [`src/app/api/admin/products/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/admin/products/route.ts) |
| `POST` | `/api/admin/products` | Admin Only | Unversioned | Creates or updates product catalog records and variant inventory | [`src/app/api/admin/products/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/admin/products/route.ts) |

---

## 2. Endpoint: `POST /api/checkout`

### 2.1 Metadata
- **HTTP Method:** `POST`
- **Path:** `/api/checkout`
- **Purpose:** Initiates checkout sequence. Validates cart items, verifies prices against server catalog, enforces server-side coupon discounts and shipping fees, persists a `PENDING` order in PostgreSQL (failing closed if DB insertion fails), and generates a Stripe Checkout Session with dynamic discount metadata.
- **Source File:** [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts)

### 2.2 Request Specification
- **Headers:** `Content-Type: application/json`, `idempotency-key` (optional), `x-user-id` (optional).
- **Body:**
```typescript
interface CheckoutRequestBody {
  items: Array<{
    productId?: string;
    variantId?: string;
    id?: string;
    quantity: number;
    product?: { id?: string };
  }>;
  userId?: string;
  customerEmail?: string;
  customerName?: string;
  addressId?: string;
  shippingAddress?: {
    fullName?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    email?: string;
  };
  couponCode?: string; // e.g. "NEXMART500", "WELCOME10", "FREESHIP"
  idempotencyKey?: string;
}
```

### 2.3 Response Specification
- **`200 OK`:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "orderId": "clxyz123...",
  "sessionId": "cs_test_...",
  "financials": {
    "subtotal": 5999,
    "discountAmount": 500,
    "shippingAmount": 0,
    "totalAmount": 5499,
    "appliedCoupon": "NEXMART500"
  }
}
```
- **`400 Bad Request`:**
  - `code: 'INVALID_COUPON'`: Coupon does not exist or order does not meet minimum order threshold.
  - Invalid item quantities or missing product IDs.
- **`409 Conflict`:** `code: 'OUT_OF_STOCK'` with `availableStock` and `requestedQuantity`.
- **`500 Internal Server Error`:** `code: 'ORDER_PERSIST_FAILED'` (Fails closed if PostgreSQL cannot persist the order).

---

## 3. Endpoint: `POST /api/webhooks/stripe`

### 3.1 Metadata
- **HTTP Method:** `POST`
- **Path:** `/api/webhooks/stripe`
- **Purpose:** Cryptographically verifies Stripe webhook HMAC signatures, updates `Order.status = 'PAID'`, and executes atomic inventory decrements inside a concurrency-guarded transaction.
- **Source File:** [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts)

---

## 4. Endpoint: `GET /api/orders/[id]`

### 4.1 Metadata
- **HTTP Method:** `GET`
- **Path:** `/api/orders/:id`
- **Purpose:** Enables client checkout success page and customer portals to verify real order payment status directly against PostgreSQL.
- **Source File:** [`src/app/api/orders/[id]/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/orders/[id]/route.ts)
- **Response (`200 OK`):**
```json
{
  "success": true,
  "order": {
    "id": "clxyz123...",
    "status": "PAID",
    "totalAmount": 5499,
    "shippingAmount": 0,
    "customer": { "name": "Jane Doe", "email": "jane@example.com" },
    "shippingAddress": { "street": "42 Market St", "city": "Bengaluru", "state": "KA", "zipCode": "560001", "country": "IN" },
    "items": [
      {
        "id": "clitem1...",
        "productId": "prod_1",
        "variantId": "var_1",
        "productTitle": "Sony WH-1000XM5",
        "variantName": "Silver",
        "price": 29999,
        "quantity": 1,
        "subtotal": 29999
      }
    ]
  }
}
```

---

## 5. Endpoint: `GET /api/orders`

### 5.1 Metadata
- **HTTP Method:** `GET`
- **Path:** `/api/orders`
- **Query Parameters:** `page` (default 1), `limit` (default 10, max 50), `status` (`PENDING`, `PAID`, `CANCELLED`), `email` (for guest order lookup).
- **Purpose:** Retrieves paginated order history for customer account pages and administrative dashboards.
- **Source File:** [`src/app/api/orders/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/orders/route.ts)

---

## 6. Endpoints: Product Reviews (`/api/reviews`)

### 6.1 `GET /api/reviews`
- **Query Parameters:** `productId` (required), `page` (default 1), `limit` (default 10).
- **Response:** Paginated list of reviews with rating, comment, and verified author name.

### 6.2 `POST /api/reviews`
- **Body:** `{ "productId": string, "rating": number, "comment"?: string, "userName"?: string, "userEmail"?: string }`
- **Action:** Inserts or updates review and atomically recalculates `Product.rating` and `Product.numReviews`.
- **Source File:** [`src/app/api/reviews/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/reviews/route.ts)

---

## 7. Endpoints: Admin Catalog & Inventory (`/api/admin/products`)

### 7.1 `GET /api/admin/products`
- **Access:** Admin Only (`role: 'ADMIN'` or `x-admin-key` header).
- **Query Parameters:** `page`, `limit`.
- **Returns:** Full inventory telemetry, `totalStock`, `isLowStock` indicator (< 5 units), sales volume count, and variant breakdowns.

### 7.2 `POST /api/admin/products`
- **Access:** Admin Only.
- **Body:** Product title, slug, description, basePrice, categoryId, images, brand, and array of variants with stock allocations.
- **Action:** Creates or updates catalog entity in PostgreSQL.
- **Source File:** [`src/app/api/admin/products/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/admin/products/route.ts)

---

## 8. Endpoints: Cart Synchronization (`/api/cart`)

### 8.1 `GET /api/cart`
- **Access:** Public / Customer (reads authenticated user cart from PostgreSQL, or returns guest flag).
- **Returns:** `{ success: true, items: Array<{ id, productId, variantId, quantity, title, price, images, variantName }> }`.
- **Source File:** [`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts)

### 8.2 `POST /api/cart`
- **Access:** Public / Customer.
- **Body:** `{ items: Array<{ productId: string, variantId?: string, quantity: number }> }`.
- **Action:** Upserts persistent `Cart` and `CartItem` rows in PostgreSQL inside a database transaction, enabling multi-device cart synchronization and recovery.
- **Source File:** [`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts)
