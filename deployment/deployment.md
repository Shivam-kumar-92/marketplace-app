# Deployment Architecture & Deployment Runbook

> **Scope:** Ground-truth audit of the deployment models, external services, step-by-step procedures, health verification checks, and known deployment failure modes for `marketplace-app`.  
> **Status:** Verified against repository code and configuration files.

---

## 1. Actual Deployment Architecture

`marketplace-app` is a unified full-stack monorepo application. The repository currently supports two primary deployment topologies:

```
[ Customer Web Browser ]
         │
         ▼ (HTTPS: Port 443)
┌────────────────────────────────────────────────────────┐
│ Next.js App Router (Node.js 20+ Runtime / Vercel Edge) │
│                                                        │
│  ├── React 19 Frontend (SSR & Static HTML)             │
│  └── Next.js Route Handlers (/api/*)                   │
└────────┬───────────────────────────────┬───────────────┘
         │                               │
         │ (Pooled TLS SQL connection)   │ (REST HTTPS API / Webhooks)
         ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│ Neon Serverless Postgres│     │  Stripe Payments Engine │
│  (Database & Relations) │     │  (Checkout & Webhooks)  │
└─────────────────────────┘     └─────────────────────────┘
```

1. **Option A: Traditional Node.js Server Deployment** (Virtual Machine, Docker, Render, Railway, AWS ECS):
   - Long-running Node.js process started with `npm run start` (`next start`).
   - Serves traffic on default port `3000` (or `PORT` environment variable).
   - Keeps single `PrismaClient` connection pool active.
2. **Option B: Serverless PaaS Deployment** (Vercel):
   - Frontend assets served via CDN Edge.
   - Dynamic API route handlers (`/api/checkout`, `/api/webhooks/stripe`, etc.) executed as isolated serverless functions.
   - Requires pooled database connection strings (Neon `-pooler`).

---

## 2. Deployment Prerequisites

Before deploying the application to any environment:
1. **Target Node.js Engine:** Node.js `>= 20.0.0` installed on host or container image.
2. **PostgreSQL Database Instance:** Accessible via pooled connection URI with credentials.
3. **Stripe Account:**
   - Standard or test mode API keys (`sk_test_...` or `sk_live_...`).
   - Webhook endpoint configured pointing to `https://<DOMAIN>/api/webhooks/stripe`.
   - Signing secret (`whsec_...`) obtained from the Stripe dashboard.
4. **Public Domain / HTTPS:** Stripe webhooks strictly require a public HTTPS URL (cannot deliver to `localhost` without Stripe CLI tunneling).

---

## 3. Exact Verified Deployment Procedures

### Procedure 1: Node.js Host Deployment (Production Server / VM)

```bash
# 1. Clone repository
git clone https://github.com/Shivam-kumar-92/marketplace-app.git
cd marketplace-app

# 2. Provision environment configuration
cp .env.example .env
# Edit .env with production credentials:
# DATABASE_URL="postgresql://user:pass@pooler-host/db?sslmode=require&connection_limit=10"
# STRIPE_SECRET_KEY="sk_live_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."
# NEXT_PUBLIC_APP_URL="https://yourdomain.com"
# ADMIN_SECRET_KEY="your-strong-random-admin-secret"

# 3. Install production dependencies (runs prisma generate automatically)
npm ci

# 4. Synchronize database schema (SEE SECTION 6 FOR DATABASE CONSIDERATIONS)
npx prisma db push

# 5. Build optimized production bundle
npm run build

# 6. Start production server
npm run start
# Alternatively run behind process supervisor: pm2 start npm --name "nexmart" -- start
```

### Procedure 2: Vercel PaaS Deployment (Recommended by Next.js)

1. Connect the GitHub repository `Shivam-kumar-92/marketplace-app` to Vercel.
2. In **Project Settings -> Environment Variables**, configure:
   - `DATABASE_URL`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `ADMIN_SECRET_KEY`
3. Set **Build Command**: `npm run build`
4. Set **Install Command**: `npm install` (or `npm ci`)
5. Deploy.

### Procedure 3: Docker & Docker Compose Deployment (Self-Hosted / Containerized)

The repository provides a multi-stage [`Dockerfile`](file:///c:/Users/admin/.gemini/marketplace-app/Dockerfile) and [`docker-compose.yml`](file:///c:/Users/admin/.gemini/marketplace-app/docker-compose.yml):

```bash
# 1. Configure production environment variables in .env
# 2. Build and launch application and PostgreSQL database containers
docker compose up -d --build

# 3. Apply baseline database migration inside the running app container
docker compose exec app npx prisma migrate deploy

# 4. View real-time container logs
docker compose logs -f app
```

---

## 4. Health & Verification Steps

After deployment completes, perform the following verification sequence:

### A. Core Storefront Availability
* **Request:** `GET https://<DOMAIN>/`
* **Expectation:** HTTP `200 OK`. Renders hero banner, categories, and product catalog.
* **Verification Command:**
  ```bash
  curl -I https://<DOMAIN>/
  ```

### B. Static Asset Serving
* **Request:** `GET https://<DOMAIN>/cart`
* **Expectation:** HTTP `200 OK`. Renders shopping cart layout.

### C. Database Connectivity Verification
* **Request:** `GET https://<DOMAIN>/api/reviews?productId=prod-1`
* **Expectation:** HTTP `200 OK` returning JSON `{ "reviews": [], "pagination": { ... } }`.
* **If Database is Down:** Returns HTTP `500` with JSON `{ "error": "Database error fetching reviews", "code": "INTERNAL_SERVER_ERROR" }`.

### D. Stripe Checkout API Pre-flight
* **Request:** `POST https://<DOMAIN>/api/checkout` with empty payload `{}`.
* **Expectation:** HTTP `400 Bad Request` with structured JSON:
  ```json
  { "error": "Cart is empty or items array is missing", "code": "INVALID_CART" }
  ```
  *(Confirms API handler is responsive and routing correctly).*

### E. Stripe Webhook Health Check
* **Request:** `POST https://<DOMAIN>/api/webhooks/stripe` with no signature header.
* **Expectation:** HTTP `400 Bad Request` with text `Missing stripe-signature header`.
* **Stripe Dashboard Test:** Send a test `checkout.session.completed` event from the Stripe Dashboard Webhooks interface and verify an HTTP `200` return code.

---

## 5. Common Deployment Failure Modes

The following specific failure modes are monitored and guarded in the codebase:

| Failure Mode | Root Cause in Codebase | Impact | Status / Mitigation |
| :--- | :--- | :--- | :--- |
| **Missing `DATABASE_URL`** | `src/lib/prisma.ts` throws error on query access. | API endpoints crash with 500 when attempting to query or place orders. | Provide valid connection string in hosting environment variables. |
| **Missing `STRIPE_SECRET_KEY`** | `src/lib/stripe.ts` throws error during server initialization in production. | Server crashes on boot or checkout route failures. | Ensure key is populated in production PaaS settings. |
| **Incorrect `STRIPE_WEBHOOK_SECRET`** | Signature verification failure in `src/app/api/webhooks/stripe/route.ts:25`. | Returns HTTP `400`. Orders stay in `PENDING` status; inventory is never decremented. | Copy exact secret from Stripe Webhook dashboard after registering the endpoint. |
| **Missing `NEXT_PUBLIC_APP_URL`** | Dynamic fallback via `req.headers` in `src/app/api/checkout/route.ts:400`. | Previously caused localhost redirect; now automatically falls back to request `origin`/`host` header. | `RESOLVED`: Works out of the box; explicit `NEXT_PUBLIC_APP_URL` recommended. |
| **Omitted `ADMIN_SECRET_KEY`** | Default fallback disabled in production mode in `src/lib/auth.ts:67`. | Previously allowed dev key; now strictly rejects master key access if not explicitly configured in production. | `RESOLVED`: Dev fallback disabled in production. |
| **Missing Prisma Migrations** | Initial baseline migration created in `prisma/migrations/20261008000000_init/`. | Standard `prisma migrate deploy` previously failed; now supported with versioned SQL. | `RESOLVED`: Baseline migration and lock file created. |
| **In-Memory Rate Limiter Drift** | `src/lib/rateLimit.ts` stores sliding window state in local Node.js process memory. | In multi-instance or serverless deployments, rate limiting is partitioned per container/lambda. | Operational trade-off; for cross-region clustering, configure distributed Redis store. |
