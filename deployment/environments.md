# Environment Configurations & Infrastructure Profiles

> **Scope:** Ground-truth audit of environments, configuration variables, runtime profiles, and secrets handling for `marketplace-app`.  
> **Status:** Verified against source code and repository structure.

---

## 1. Environment Topology

The repository exhibits evidence for three standard operational tiers. However, only **Development** is fully configured locally, while **Staging** and **Production** require external PaaS provisioning.

| Environment | Purpose | Current Repo Evidence | Status |
| :--- | :--- | :--- | :--- |
| **Development (`development`)** | Local development, component testing, and active iteration. | `.env`, `.env.example`, `npm run dev`, `globalThis.prismaGlobal` caching in `src/lib/prisma.ts`. | `VERIFIED` |
| **Staging (`staging`)** | Pre-production testing with Stripe test credentials and staging DB. | No dedicated `.env.staging` or staging CI/CD pipeline present in repo. | `NEEDS CONFIRMATION / UNCONFIGURED` |
| **Production (`production`)** | Live customer-facing storefront, live payments, and production Neon DB. | Production guards in `src/lib/stripe.ts`, structured JSON logging in `src/lib/logger.ts`. | `VERIFIED IN CODE / INFRASTRUCTURE UNKNOWN` |

---

## 2. Environment Variables Specification

Every environment variable evaluated by the application source code has been verified below.

| Variable Name | Required | Default / Fallback | Evaluated In | Verified Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes (Runtime)** | `null` (throws on DB access) | [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma:7)<br>[`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts:14) | PostgreSQL connection string. In `.env.example`, configured for Neon pooled connection: `postgresql://...-pooler...aws.neon.tech/neondb?sslmode=require&connection_limit=10`. |
| `STRIPE_SECRET_KEY` | **Yes (Production)** | `'sk_test_placeholder'` (Dev only) | [`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts:3-7) | Secret API key for authenticating with Stripe (`sk_test_...` or `sk_live_...`). In production (`NODE_ENV === 'production'`), startup throws if missing. |
| `STRIPE_WEBHOOK_SECRET` | **Yes (Runtime)** | `undefined` | [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts:18) | Cryptographic signature secret (`whsec_...`) used by Stripe SDK to verify `stripe-signature` header on incoming webhooks. |
| `NEXT_PUBLIC_APP_URL` | **Recommended** | `'http://localhost:3000'` | [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts:400) | Public base URL used to construct Stripe Checkout `success_url` (`/checkout/success?session_id=...`) and `cancel_url` (`/cart`). |
| `ADMIN_SECRET_KEY` | **Recommended** | `'marketplace_admin_secret_dev'` | [`src/lib/auth.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/auth.ts:67) | Secret token accepted via `x-admin-key` header to authenticate admin requests to `/api/admin/products`. |
| `NODE_ENV` | **System** | `'development'` | [`src/lib/logger.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/logger.ts:17)<br>[`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts:3)<br>[`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts:18) | Runtime environment selector toggled by Node.js / Next.js (`development`, `production`, `test`). |

---

## 3. Environment Behavioral Differences

The codebase executes conditional logic based on `NODE_ENV`:

### A. Database Connection Management (`src/lib/prisma.ts`)
* **Development**: Attaches the `PrismaClient` instance to `globalThis.prismaGlobal` to survive Next.js Fast Refresh hot-reloading without exhausting database connection pools.
* **Production**: Bypasses `globalThis` assignment; relies on container or serverless runtime lifecycle.

### B. Stripe Initialization Safeguards (`src/lib/stripe.ts`)
* **Development**: Tolerates missing `STRIPE_SECRET_KEY` by falling back to `'sk_test_placeholder'`.
* **Production**: Strictly halts initialization with an explicit runtime exception:  
  `"Missing required STRIPE_SECRET_KEY in production environment."`

### C. Application Logging Output (`src/lib/logger.ts`)
* **Development**: Pretty-prints formatted log messages to `console.log` / `console.error` for human readability.
* **Production**: Outputs single-line structured JSON logs with ISO timestamps, log level, message, and metadata for ingestion by cloud log collectors.

### D. Admin Authentication Fallback (`src/lib/auth.ts`)
* **Development**: Accepts `'marketplace_admin_secret_dev'` when `ADMIN_SECRET_KEY` is omitted.
* **Production**: Hardened — strictly disables fallback in production (`NODE_ENV === 'production'`). If `ADMIN_SECRET_KEY` is not provided in production, header-based master key authentication is rejected.

---

## 4. Secrets Handling & Security Boundaries

* **Repository Protection**:
  * `.env` is listed in [`.gitignore`](file:///c:/Users/admin/.gemini/marketplace-app/.gitignore:26) (`.env*`).
  * `.env.example` is committed as a sanitised configuration template containing dummy keys.
* **Current Secrets Storage**:
  * Local secrets reside in plain text within `.env`.
  * **No external secrets manager** (e.g., AWS Secrets Manager, HashiCorp Vault, Doppler, Infisical) is integrated into the codebase.
  * In staging and production, secrets must be injected via PaaS environment configuration (e.g., Vercel Project Settings, AWS ECS Task Definition, Docker secret mounts).

---

## 5. Required External Services & Dependencies

1. **PostgreSQL Database**:
   - Provider verified: Neon Serverless PostgreSQL (indicated in `.env.example` connection string).
   - Connection Pooling: Requires connection pooler endpoint (e.g., `-pooler` hostname suffix) and `&connection_limit=10` query parameter to prevent pool exhaustion on serverless lambdas.
2. **Stripe Payments Platform**:
   - Requires active Stripe account with API keys (`sk_...`).
   - Requires configured Webhook Endpoint in Stripe Dashboard pointing to `<APP_URL>/api/webhooks/stripe` listening for `checkout.session.completed`.

---

## 6. What Is Verified vs Unknown

| Aspect | Status | Details |
| :--- | :--- | :--- |
| Active env variable names & usages | `VERIFIED` | 5 application variables + `NODE_ENV` extracted directly from source code. |
| Fallback behaviors | `VERIFIED` | Confirmed in `auth.ts`, `stripe.ts`, `prisma.ts`, `checkout/route.ts`. |
| Hosting provider configuration | `UNKNOWN` | No `vercel.json`, `netlify.toml`, or cloud templates committed. |
| Production database host | `UNKNOWN` | Must be provisioned by the operator using `DATABASE_URL`. |
| Production secrets management | `UNKNOWN` | No automated secret injection script or vault client in repository. |
