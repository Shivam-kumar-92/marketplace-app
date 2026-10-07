# Architecture Decisions & System Design

This document details the current architectural decisions, system boundaries, data flows, and structural patterns implemented in `marketplace-app`.

---

## 1. Architectural Pattern & Paradigm

- **Architecture Style**: Monolithic Full-Stack Web Application (Unified Next.js App Router). `[CONFIRMED]`
- **Paradigm**: Hybrid Server-Side Rendering (SSR), Server Components, Client Components (`'use client'`), and API Route Handlers. `[CONFIRMED]`
- **Evidence**:
  - Root configuration in [`next.config.ts`](file:///c:/Users/admin/.gemini/marketplace-app/next.config.ts) and [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json).
  - App directory routing under [`src/app`](file:///c:/Users/admin/.gemini/marketplace-app/src/app).
  - API endpoints grouped under [`src/app/api/`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api).

---

## 2. Frontend / Backend Separation

- **Boundary**: Colocated codebase within a single repository using Next.js App Router conventions. `[CONFIRMED]`
- **Frontend Layer**:
  - Layout and Pages: [`src/app/layout.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/layout.tsx), [`src/app/page.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/page.tsx).
  - Presentation Components: [`src/components/layout/Header.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/layout/Header.tsx), [`src/components/product/ProductDetail.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/product/ProductDetail.tsx).
  - Client State: [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts) utilizing Zustand with local storage persistence (`nexmart-cart-storage`).
- **Backend Layer**:
  - API Routes: Route handlers executing server-side Node.js logic:
    - [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts)
    - [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts)
  - Data Access & Integrations:
    - [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts): PrismaClient ORM singleton.
    - [`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts): Stripe payment SDK client.
- **Communication Protocol**: JSON over HTTP between client and `/api/*` endpoints; raw text stream payload consumed for webhook HMAC-SHA256 signature verification. `[CONFIRMED]`

---

## 3. Major Modules and Responsibilities

| Module | Location | Primary Responsibility | Status |
| :--- | :--- | :--- | :--- |
| **Catalog & Product Display** | [`src/components/product/ProductDetail.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/product/ProductDetail.tsx) | Displays product gallery, variant details, pricing, reviews, and specs | `CONFIRMED` |
| **Navigation & Search UI** | [`src/components/layout/Header.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/layout/Header.tsx) | Header navigation, category dropdowns, search bar, cart indicator | `CONFIRMED` |
| **Client Cart State** | [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts) | Client-side cart item collection, quantity mutation, total count/price computation, browser `localStorage` sync | `CONFIRMED` |
| **Order Ingestion & Checkout API** | [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts) | Server-side price & stock verification against DB, order creation in `PENDING` state, Stripe session generation | `CONFIRMED` |
| **Payment Webhook & Stock Settlement** | [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts) | Cryptographic signature validation, idempotency checks, atomic order status update to `PAID`, and stock decrement | `CONFIRMED` |
| **Database Access Client** | [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts) | PrismaClient singleton instance attached to `globalThis` in development to prevent connection pool exhaustion | `CONFIRMED` |
| **Stripe Client** | [`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts) | Configured Stripe client instance with API version pinning and production environment guards | `CONFIRMED` |
| **Data Schema & ORM Model** | [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) | Relational schema definitions for Users, Products, Variants, Carts, Orders, and Reviews | `CONFIRMED` |

---

## 4. End-to-End Data Flow

```
[ User Browser ]
       │
       ▼ (1. Add to Cart)
[ Zustand Store (localStorage) ]
       │
       ▼ (2. POST /api/checkout { items, userId?, addressId?, shippingAddress? })
[ Next.js API Route: /api/checkout ]
       │
       ├───► (3. Query Product & Variant stock/price) ───► [ PostgreSQL (via Prisma) ]
       │
       ├───► (4. Resolve User & Shipping Address) ────────► [ PostgreSQL (via Prisma) ]
       │
       ├───► (5. Create Order [status: PENDING]) ─────────► [ PostgreSQL (via Prisma) ]
       │
       ├───► (6. Create Checkout Session + Idempotency) ──► [ Stripe Hosted Checkout ]
       │
       ▼ (7. Return Session URL)
[ User Completes Payment on Stripe ]
       │
       ▼ (8. Asynchronous Webhook: POST /api/webhooks/stripe)
[ Next.js API Route: /api/webhooks/stripe ]
       │
       ├───► (9. Verify Signature via STRIPE_WEBHOOK_SECRET)
       │
       ├───► (10. Idempotency Check: Order.status === 'PAID'?)
       │
       ▼ (11. Atomic Transaction: prisma.$transaction)
[ PostgreSQL Database ]
       ├── Update Order.status = 'PAID'
       └── Decrement Variant.stock by purchased quantities
```

- **Step 1 — Local Cart State**: Items are staged locally in Zustand. Prices in local storage are treated strictly as display hints and never trusted for billing. `[CONFIRMED]`
- **Step 2 — Checkout Submission**: Frontend passes item identifiers (`productId`, optional `variantId`) and desired quantities. `[CONFIRMED]`
- **Step 3 — Database Ground Truth Verification**: The server fetches products and variants directly from PostgreSQL via Prisma. Any price modification from the client is ignored. Stock is verified (`variant.stock >= quantity`). If insufficient, HTTP 409 Conflict with `OUT_OF_STOCK` code is returned. `[CONFIRMED]`
- **Step 4 & 5 — Order Pre-Creation**: An `Order` record is created in the database with status `PENDING` and associated `OrderItem` rows. Guest checkouts are safely supported by resolving a guest customer and address record to maintain relational integrity. `[CONFIRMED]`
- **Step 6 & 7 — Stripe Session**: A Stripe checkout session is created with DB-verified line items and metadata linking to `order.id`. The Stripe session ID is written to the database order. `[CONFIRMED]`
- **Step 8 to 11 — Webhook Fulfillment**: Upon payment settlement, Stripe sends a signed webhook event. The handler verifies the HMAC signature, confirms idempotency, and executes a database transaction (`prisma.$transaction`) updating `Order.status = PAID` and decrementing inventory. `[CONFIRMED]`

---

## 5. API Communication Architecture

- **Protocol**: HTTP/1.1 & HTTP/2 RESTful API. `[CONFIRMED]`
- **Format**:
  - Request bodies: JSON (`application/json`) for checkout; raw text stream (`req.text()`) for webhooks. `[CONFIRMED]`
  - Response bodies: Uniform JSON objects (`{ error: string, ... }` or `{ url: string, ... }`). Plain-text string responses are explicitly forbidden to prevent client deserialization errors. `[CONFIRMED]`
- **Status Codes Used**:
  - `200 OK`: Successful checkout session creation, webhook acknowledgment. `[CONFIRMED]`
  - `400 Bad Request`: Malformed payload, invalid quantities, missing webhook signature. `[CONFIRMED]`
  - `404 Not Found`: Non-existent product or variant requested. `[CONFIRMED]`
  - `409 Conflict`: Insufficient stock available. `[CONFIRMED]`
  - `500 Internal Server Error`: Unhandled database or gateway errors, unconfigured secrets. `[CONFIRMED]`
- **Idempotency**:
  - Client can supply `idempotency-key` in headers or payload to prevent duplicate Stripe sessions. `[CONFIRMED]`
  - Webhook validates whether `order.status === 'PAID'` before executing transactions to safely handle retried Stripe webhook deliveries. `[CONFIRMED]`

---

## 6. Authentication & Authorization Architecture

- **Schema Design**: [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) includes NextAuth.js standard models (`User`, `Account`, `Session`) with support for OAuth providers and credentials authentication. `[CONFIRMED]`
- **Role-Based Access Control**: `Role` enum defined in Prisma schema (`CUSTOMER`, `ADMIN`). `[CONFIRMED]`
- **Current Runtime Status**:
  - NextAuth / Auth.js library is not yet initialized in `package.json` dependencies. `[CONFIRMED]`
  - Checkout endpoint handles both authenticated users (`userId`) and unauthenticated guest checkouts (`resolveUserAndAddress` fallback). `[CONFIRMED]`
  - Complete NextAuth runtime session validation is planned or in progress, but not currently executed on API routes. `[INFERRED]`

---

## 7. Database Architecture

- **Database Engine**: PostgreSQL. `[CONFIRMED]` (Specified via `provider = "postgresql"` in `prisma/schema.prisma`).
- **ORM / Data Access**: Prisma ORM v7 (`@prisma/client@7.10.0`, `prisma@7.10.0`). `[CONFIRMED]`
- **Relational Models**:
  - `User`: Identity, authentication credentials, role.
  - `Account` & `Session`: NextAuth-compatible OAuth accounts and active sessions.
  - `Address`: Multiple addresses per user, default shipping address tracking.
  - `Category`: Product categorization with slugs and hierarchies.
  - `Product`: Base catalog item, title, slug, description, basePrice, rating, images.
  - `Variant`: SKU, variant name, priceOffset, inventory stock count.
  - `Cart` & `CartItem`: Persistent server cart for logged-in or guest users.
  - `Order` & `OrderItem`: Order records with `OrderStatus` enum (`PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, etc.), financial snapshots, and items.
  - `Review`: Ratings and textual reviews linked to products and users.
- **Data Integrity**:
  - Foreign key constraints enforced across all relational tables.
  - Cascade deletion rules applied on child records (`CartItem`, `OrderItem`, `Variant`, `Review`, `Address`, `Account`, `Session`). `[CONFIRMED]`

---

## 8. External Services & Third-Party Integrations

1. **Stripe API**:
   - Purpose: Hosted payment processing, credit card compliance offloading, payment webhook dispatch. `[CONFIRMED]`
   - Integration Point: `stripe@^22.6.2` via [`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts).
2. **PostgreSQL Database Server**:
   - Purpose: Persistent transactional relational data store. `[CONFIRMED]`
   - Connection Configuration: Managed via environment variable `DATABASE_URL`. `[CONFIRMED]`

---

## 9. Deployment & Infrastructure Architecture

- **Target Platform**: Node.js Server or Vercel Serverless Functions. `[INFERRED]`
- **Static Artifacts**: Static image assets located in [`public/`](file:///c:/Users/admin/.gemini/marketplace-app/public). `[CONFIRMED]`
- **Configuration Management**: Twelve-Factor App methodology utilizing environment variables:
  - `DATABASE_URL`: Connection string for PostgreSQL instance. `[CONFIRMED]`
  - `STRIPE_SECRET_KEY`: Secret API key for Stripe communication. `[CONFIRMED]`
  - `STRIPE_WEBHOOK_SECRET`: Signing secret for inbound webhook verification. `[CONFIRMED]`
  - `NEXT_PUBLIC_APP_URL`: Canonical public URL for checkout redirect callbacks. `[CONFIRMED]`
- **Template Provided**: Documented in [`.env.example`](file:///c:/Users/admin/.gemini/marketplace-app/.env.example). `[CONFIRMED]`

---

## 10. Architectural Trade-offs & Rationales

1. **Client-side Zustand Cart with LocalStorage vs. Server-Synced Cart**:
   - *Chosen*: Client-side cart via Zustand with `localStorage` persistence.
   - *Rationale*: Zero server latency for cart actions; works seamlessly for anonymous visitors without pre-creating guest database records on every page view.
   - *Trade-off*: Cart does not automatically synchronize across devices until an order is initiated. `[CONFIRMED]`

2. **Hosted Stripe Checkout vs. Embedded Payment Elements**:
   - *Chosen*: Hosted Stripe Checkout (`stripe.checkout.sessions.create`).
   - *Rationale*: Drastically simplifies PCI-DSS compliance, provides out-of-the-box support for multiple payment methods, and offloads sensitive payment form state.
   - *Trade-off*: Redirects user away from the primary site during the payment step. `[CONFIRMED]`

3. **Asynchronous Webhook Stock Settlement vs. Synchronous Client-Redirect Settlement**:
   - *Chosen*: Webhook-driven settlement (`checkout.session.completed`).
   - *Rationale*: Client redirects (`/checkout/success`) are unreliable (user might close browser, lose battery/network immediately after payment). Webhooks guarantee guaranteed at-least-once delivery from Stripe servers.
   - *Trade-off*: Requires public webhook endpoint reachable by Stripe and strict idempotency handling to prevent double inventory decrements. `[CONFIRMED]`

---

## 11. Classification Summary

- **CONFIRMED**: All items directly observed in code, schema, and dependency configs.
- **INFERRED**: Target platform (Vercel/Node.js) based on Next.js default build configuration; future NextAuth runtime usage based on schema models.
- **UNKNOWN**: Production database cluster topology, production hosting provider instance specifications, monitoring/logging APM tools (e.g., Datadog, Sentry).
