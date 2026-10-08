# Current System State & Architectural Snapshot

> **Project:** NexMart Marketplace (`marketplace-app`)  
> **Status:** Active / Production-Hardened  
> **Snapshot Date:** October 2026  
> **Scope:** Ground-truth audit of implemented features, active files, configurations, flows, and operational boundaries.  

---

## 1. Project Purpose

NexMart is a full-stack e-commerce marketplace built for high-performance retail. It supports curated product browsing across 8 major categories (flagship electronics, audio gear, apparel, home automation), multi-variant product configurations, responsive cart workflows, promotional coupon validations, fail-closed payment processing via Stripe Checkout, atomic concurrency-safe inventory stock decrements, product reviews, and administrative inventory controls.

---

## 2. Technology Stack

| Layer | Component | Version / Specification | Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `16.3.6` (App Router) | Unified SSR, Server Components, API Route Handlers | `CONFIRMED` |
| **UI Library** | React | `19.2.8` | Client and Server Components (`useState`, `useEffect`, JSX) | `CONFIRMED` |
| **Language** | TypeScript | `^5` (Strict Mode) | Full type-safety across client components and backend APIs | `CONFIRMED` |
| **Styling** | Tailwind CSS | `^4` (PostCSS) | Utility-first styles configured in `globals.css` | `CONFIRMED` |
| **Icons** | Lucide React | `^1.48.0` | SVG icons for shopping cart, search, badges, and controls | `CONFIRMED` |
| **Database** | PostgreSQL / Neon | Serverless PostgreSQL | Relational storage for products, orders, users, reviews | `CONFIRMED` |
| **ORM** | Prisma | `^7.10.0` | Type-safe schema, query generation, and migrations | `CONFIRMED` |
| **Payments** | Stripe Node SDK | `^22.6.2` | Hosted checkout sessions and webhook HMAC event handling | `CONFIRMED` |
| **State** | Zustand | `^5.0.15` | Client-side persistent cart with `localStorage` fallback | `CONFIRMED` |
| **Runtime** | Node.js | `>=20` | Node.js V8 execution engine | `CONFIRMED` |

---

## 3. Directory Structure

```text
marketplace-app/
├── api/                           # API documentation directory
│   ├── contracts.md               # Client-server data contracts & audit log
│   ├── endpoints.md               # Detailed reference for all 10 API routes
│   └── errors.md                  # Comprehensive error inventory & envelopes
├── decisions/                     # Architectural decision records
│   ├── architecture.md            # System design & paradigm notes
│   ├── rejected-options.md        # Evaluated and rejected alternatives
│   └── technology.md              # Technology stack evaluations
├── prisma/                        # Database schema & migrations
│   ├── schema.prisma              # Relational models & database indexes
│   └── seed.ts                    # Enterprise seed script for demo catalog
├── public/                        # Static assets (favicons, SVGs)
├── src/
│   ├── app/                       # Next.js App Router entry points
│   │   ├── api/                   # Backend API Route Handlers
│   │   │   ├── admin/products/    # GET / POST administrative inventory management
│   │   │   ├── cart/              # GET / POST cross-device cart synchronization
│   │   │   ├── checkout/          # POST checkout initiation & Stripe session
│   │   │   ├── orders/            # GET customer order history
│   │   │   │   └── [id]/          # GET token-verified order details & status
│   │   │   ├── reviews/           # GET / POST product ratings & reviews
│   │   │   └── webhooks/stripe/   # POST cryptographic Stripe event receiver
│   │   ├── cart/                  # Shopping cart page (`src/app/cart/page.tsx`)
│   │   ├── checkout/success/      # Order confirmation page (`success/page.tsx`)
│   │   ├── products/[id]/         # Product details page (`[id]/page.tsx`)
│   │   ├── globals.css            # Tailwind 4 entrypoint
│   │   ├── layout.tsx             # Root layout with Geist font loading
│   │   └── page.tsx               # Storefront homepage with hero & catalog
│   ├── components/                # Presentation & UI components
│   │   ├── layout/                # Navigation Header & Footer
│   │   └── product/               # ProductCard & ProductDetail components
│   ├── lib/                       # Core shared business libraries
│   │   ├── auth.ts                # Session resolution, RBAC, and user reconciliation
│   │   ├── catalog.ts             # Data access layer with edge caching
│   │   ├── logger.ts              # Structured JSON logger with distributed tracing
│   │   ├── mockData.ts            # Fallback catalog data & type definitions
│   │   ├── prisma.ts              # Singleton PrismaClient connection proxy
│   │   ├── promotions.ts          # Server-side coupon & shipping fee engine
│   │   ├── rateLimit.ts           # Sliding-window rate limiter
│   │   └── stripe.ts              # Configured Stripe SDK singleton
│   └── store/
│       └── useCartStore.ts        # Zustand store with localStorage & server sync
├── .env.example                   # Template for environment variables
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js build options
├── package.json                   # Project dependencies and npm scripts
├── postcss.config.mjs             # PostCSS Tailwind 4 configuration
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 4. Major Components & Subsystems

### 4.1 Storefront & Catalog Display
* **Homepage ([`src/app/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/page.tsx)):** Renders category badges, featured products, search filters, and marketing banners.
* **Product Detail ([`src/components/product/ProductDetail.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/product/ProductDetail.tsx)):** Handles image gallery switching, variant selector buttons (e.g. storage/color options), dynamic price recalculation, and stock badge indicators.
* **Catalog Data Access Layer ([`src/lib/catalog.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/catalog.ts)):** Queries live PostgreSQL using composite indexes (`[categoryId, basePrice]`, `[isFeatured, createdAt]`) and wraps category lookups in Next.js `unstable_cache` with a 300-second revalidation TTL.

### 4.2 Shopping Cart & Client State
* **Zustand Store ([`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts)):** Manages items, quantities, and subtotal computations. Persisted to `window.localStorage` under `nexmart-cart-storage`.
* **Cart Page ([`src/app/cart/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/cart/page.tsx)):** Displays line items, quantity steppers, promo code entry (`NEXMART500`), free shipping progress bar, and triggers checkout redirection.
* **Cart Server Sync ([`src/app/api/cart/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/cart/route.ts)):** Bridges client cart items to PostgreSQL `Cart` and `CartItem` tables for authenticated users.

### 4.3 Checkout & Payment Pipeline
* **Checkout Handler ([`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts)):**
  1. Checks sliding-window rate limit (max 10 checkouts/minute per IP).
  2. Validates items and verifies unit prices against database catalog.
  3. Validates promo codes and shipping fees server-side (`calculateOrderFinancials`).
  4. Persists a `PENDING` order record in PostgreSQL.
  5. Creates a Stripe Checkout Session with dynamic discount coupons.
  6. Executes compensating rollback (deleting pending order) if Stripe session creation fails.
* **Stripe Webhook Handler ([`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts)):**
  1. Cryptographically validates HMAC-SHA256 signature against `STRIPE_WEBHOOK_SECRET`.
  2. Executes an atomic conditional order transition (`UPDATE ... WHERE status = 'PENDING'`).
  3. Decrements inventory with atomic race guards (`stock: { gte: quantity }`).
  4. Detects depleted stock and flags orders as `status: 'PROCESSING'` for review/refund.
* **Success Page ([`src/app/checkout/success/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/checkout/success/page.tsx)):** Polls `GET /api/orders/[id]?session_id=...` to verify live payment status before clearing the cart.

---

## 5. Database Structure & Relational Schema

The PostgreSQL database is defined in [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma):

```
┌───────────┐         ┌───────────┐         ┌───────────┐
│   User    │───1:N──►│  Address  │───1:N──►│   Order   │
└─────┬─────┘         └───────────┘         └─────┬─────┘
      │                                           │
     1:N                                         1:N
      │                                           │
      ▼                                           ▼
┌───────────┐         ┌───────────┐         ┌───────────┐
│  Review   │         │  Product  │◄──1:N───│ OrderItem │
└───────────┘         └─────┬─────┘         └───────────┘
                            │
                           1:N
                            │
                            ▼
                      ┌───────────┐
                      │  Variant  │
                      └───────────┘
```

### Models Overview
1. **`User`:** Identity records (`id`, `name`, `email`, `role: CUSTOMER | ADMIN`). Indexed on role and creation date.
2. **`Address`:** Delivery addresses linked to users (`userId`, `street`, `city`, `state`, `zipCode`, `country`).
3. **`Category`:** Catalog classifications (`name`, `slug`, `description`, `image`).
4. **`Product`:** Catalog items (`title`, `slug`, `basePrice`, `images`, `rating`, `numReviews`, `isFeatured`).
5. **`Variant`:** Specific SKU variations (`sku`, `name`, `priceOffset`, `stock`).
6. **`Cart` & `CartItem`:** Server-side shopping cart persistence for authenticated users.
7. **`Order`:** Purchases (`userId`, `addressId`, `status: PENDING | PAID | ...`, `totalAmount`, `shippingAmount`, `stripeSessionId`).
8. **`OrderItem`:** Snapshots of items, prices, and quantities at purchase time.
9. **`Review`:** Product reviews (`rating 1-5`, `comment`), unique on `[userId, productId]`.

---

## 6. Implemented API Surface

| Endpoint | Method | Access Control | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/checkout` | `POST` | Public (Rate Limited) | Initiates Stripe session with fail-closed order persistence |
| `/api/webhooks/stripe` | `POST` | External (HMAC-SHA256) | Confirms payments and atomically decrements inventory |
| `/api/orders/[id]` | `GET` | Token-Verified / Authenticated | Retrieves order status and items (guarded against IDOR) |
| `/api/orders` | `GET` | Authenticated | Lists customer order history with pagination |
| `/api/reviews` | `GET` | Public | Paginated review listings for a product |
| `/api/reviews` | `POST` | Customer (Rate Limited) | Submits review and recalculates average rating |
| `/api/admin/products` | `GET` | Admin Only | Full inventory telemetry with low-stock warnings |
| `/api/admin/products` | `POST` | Admin Only | Creates or updates products and variants |
| `/api/cart` | `GET` | Authenticated / Public | Retrieves persistent database cart |
| `/api/cart` | `POST` | Authenticated / Public | Synchronizes client cart items into PostgreSQL |

---

## 7. Environment & Configuration Variables

| Variable Name | Required | Example / Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URI (e.g. Neon connection string with `?connection_limit=10`) |
| `STRIPE_SECRET_KEY` | **Yes** | Secret API key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Webhook signing secret (`whsec_...`) |
| `NEXT_PUBLIC_APP_URL` | No | Base application URL for Stripe return redirects (default: `http://localhost:3000`) |
| `ADMIN_SECRET_KEY` | No | Master administrative key for CI/CD or admin header bypass (`x-admin-key`) |

---

## 8. Build, Run & Verification Process

```bash
# 1. Install dependencies
npm install

# 2. Seed database with demo catalog & admin account
npm run seed

# 3. Start local development server
npm run dev

# 4. Verify static TypeScript types
npx tsc --noEmit

# 5. Production build check
npm run build
```

---

## 9. Current Operational Status & Known Boundaries

* **TypeScript Compilation:** Validated — passes with **0 errors**.
* **Payment Security:** Tested — HMAC webhook verification, rate limiting, and fail-closed rollbacks are operational.
* **Database State:** Prisma schema reflects complete relational model; connection pooling configured for Neon serverless PostgreSQL.
* **Limitations (Documented in `ai/known-issues.md`):**
  * Monetary fields use `Float` rather than `Decimal`.
  * Flash-sale inventory reservation relies on post-payment check rather than a 15-minute lease hold.
  * In-memory rate limiting is process-bound (requires Redis for multi-region clustering).
