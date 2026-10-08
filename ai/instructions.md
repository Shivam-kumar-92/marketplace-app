# AI Agent Working Instructions

> **Project:** NexMart Marketplace (`marketplace-app`)  
> **Framework:** Next.js 16.3.6 (App Router) + React 19.2.8 + TypeScript 5  
> **Database:** PostgreSQL via Prisma ORM 7.10.0  
> **Payments:** Stripe Node SDK (`^22.6.2`)  
> **Target Audience:** Future AI Agents, Pair Programmers & Automated CI/CD Agents  
> **Status:** Active Project Directives  

---

## 1. Core Operating Principles

Future AI agents operating in this repository must strictly adhere to these fundamental principles:

1. **Verify Before Modifying:** Always inspect the actual source files and database schemas before drawing conclusions. Never assume functionality exists based solely on variable names, comments, or external framework conventions.
2. **Preserve Functionality & Architecture:** Do not refactor or re-architect working code unless explicitly requested by the user. Do not replace Vanilla CSS / Tailwind 4 with Tailwind 3 or UI component libraries (like shadcn or MUI) unless specifically ordered.
3. **Fail-Closed on Financial & Inventory Operations:** The checkout and webhook flows are strictly designed with fail-closed and compensating rollback patterns. Never introduce silent fallbacks, mock identifiers, or optimistic assumptions into payment and inventory pathways.
4. **Distinguish Verified Reality from Assumptions:** In all reports, code comments, and documentation, clearly distinguish confirmed facts (verified directly from code) from inferred behaviors or unverified hypotheses.

---

## 2. Project Architecture & Technical Constraints

### 2.1 Full-Stack Monorepo Conventions
* **Routing:** Next.js App Router under [`src/app/`](file:///c:/Users/admin/.gemini/marketplace-app/src/app). All backend endpoints reside under [`src/app/api/`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api). Do not introduce `pages/` directory routing.
* **Component Paradigm:** Server Components are the default. Client components must declare `'use client'` at the top of the file.
* **Styling:** Tailwind CSS v4 using PostCSS. The global entrypoint is [`src/app/globals.css`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/globals.css) with `@import "tailwindcss"`. Do not generate `tailwind.config.js` unless migrating the PostCSS configuration intentionally.
* **Client State:** Zustand store located in [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts) using the `persist` middleware to synchronize state to browser `localStorage` (`nexmart-cart-storage`).

### 2.2 Database & Data Access Rules
* **ORM:** Exclusively Prisma ORM 7.10.0. The schema is located in [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma).
* **Singleton Client:** Always import `prisma` from [`@/lib/prisma`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts). Never instantiate `new PrismaClient()` directly inside routes or components; doing so causes connection pool exhaustion on serverless environments.
* **Transactions:** Multi-table mutations involving orders, inventory stock, or reviews must be executed inside `prisma.$transaction(async (tx) => { ... })`.

---

## 3. Discovered Coding Conventions

1. **Path Aliasing:** Use `@/` for imports from the `src/` directory (e.g., `import { prisma } from '@/lib/prisma'`, `import { logger } from '@/lib/logger'`).
2. **API Route Signatures:** Next.js 16 Route Handlers export async functions named after the HTTP verb: `GET`, `POST`, `PUT`, `DELETE`.
3. **Response Standardization:** API endpoints return standard JSON responses with an explicit `success: boolean` flag:
   ```typescript
   // Success response
   return NextResponse.json({ success: true, ...data });

   // Error response
   return NextResponse.json(
     { success: false, error: 'Human readable message', code: 'DOMAIN_CODE' },
     { status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 502 }
   );
   ```
4. **Structured Logging:** Use the singleton `logger` from [`@/lib/logger`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/logger.ts). Do not introduce raw unformatted `console.log` calls in production code. Attach `requestId` to log contexts whenever a request object is available.
5. **Currency Handling:** Always wrap money calculations in `roundCurrency(amount)` from [`@/lib/promotions`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/promotions.ts) to prevent IEEE-754 floating-point drift.

---

## 4. High-Risk Files & Sensitive Modules

Future agents must exercise **extreme caution** when modifying the following files:

| File Path | Risk Profile | Why Caution Is Required |
| :--- | :--- | :--- |
| [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts) | **CRITICAL** | Handles live payment settlement, HMAC-SHA256 signature verification, and atomic inventory stock decrements. An unhandled exception or broken state check can cause duplicate inventory decrements or lost order fulfillment. |
| [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts) | **CRITICAL** | Contains fail-closed order persistence, coupon validation, dynamic Stripe session line item creation, and compensating rollback logic on session failure. |
| [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) | **HIGH** | Core data model. Schema changes require `npx prisma generate` and migration checks. Asymmetric foreign key cascades exist between `User`, `Address`, and `Order`. |
| [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts) | **HIGH** | Manages database proxying and global connection pooling. Any syntax error or misconfiguration breaks every database-connected route. |
| [`src/lib/auth.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/auth.ts) | **HIGH** | Manages session extraction, admin role guards (`requireAdmin`), and guest account resolution. Profile overwrites (`update: {}`) are strictly guarded against tampering. |

---

## 5. Things That Must NOT Be Changed Without User Approval

The following items are **strictly protected** and must never be altered without explicit confirmation:

1. **Existing API Route Paths & Contracts:** Do not alter the URL paths, required body schemas, or HTTP methods of existing endpoints (`/api/checkout`, `/api/webhooks/stripe`, `/api/orders`, `/api/reviews`, `/api/admin/products`, `/api/cart`).
2. **Database Schema Field Deletions or Renames:** Do not drop tables, rename columns, or remove relations in `prisma/schema.prisma` without explicit user permission and a migration strategy.
3. **Environment Variable Configuration:** Never delete, expose, or overwrite keys in `.env` or `.env.example`.
4. **Package Dependencies:** Do not add large or heavy external dependencies (e.g. Redux, Tailwind 3, Axios) when native Fetch and existing libraries (Zustand, Prisma, Stripe) suffice.
5. **Payment Mode & Currency:** Stripe checkout is pinned to INR (`currency: 'inr'`) and mode `payment`. Do not change the currency or checkout mode without explicit requirements.

---

## 6. Testing & Validation Expectations

Whenever modifications are made to this codebase, the agent **must** run the following verification steps:

1. **TypeScript Typecheck:**
   ```bash
   npx tsc --noEmit
   ```
   *Expectation:* Must exit with code `0`. Zero type errors, zero missing property errors.
2. **Git Status Cleanliness:**
   ```bash
   git status
   ```
   *Expectation:* Ensure only intended files are staged or modified. Ensure no sensitive credentials, `.env` files, or build artifacts are committed.
3. **Documentation Parity:**
   * If an API endpoint is added or modified, update [`api/endpoints.md`](file:///c:/Users/admin/.gemini/marketplace-app/api/endpoints.md), [`api/contracts.md`](file:///c:/Users/admin/.gemini/marketplace-app/api/contracts.md), and [`api/errors.md`](file:///c:/Users/admin/.gemini/marketplace-app/api/errors.md) to keep documentation in lockstep with the code.

---

## 7. Security & Abuse Prevention Guidelines

1. **Cryptographic Webhook Verification:** Never bypass `stripe.webhooks.constructEvent` in [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts). The raw request text stream must be passed directly to the Stripe SDK.
2. **Rate Limiting:** Protect all high-cost public endpoints (checkout, reviews, authentication) using the sliding-window rate limiter in [`@/lib/rateLimit`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/rateLimit.ts).
3. **IDOR & PII Protection:** Order lookup endpoints (`/api/orders/[id]`) must always verify that the requester is either the authentic owner of the order, an authorized administrator, or possesses the cryptographically generated `session_id` token from the checkout sequence.
4. **Guest Profile Immutability:** Never allow guest checkout flows to mutate or overwrite existing user profile attributes (`User.name`, `User.role`, etc.) in database upsert operations.

---

## 8. Summary Checklist for AI Agents

- [ ] Read and verified active source files before planning edits?
- [ ] Preserved Next.js 16 App Router and Prisma ORM patterns?
- [ ] Confirmed that `npx tsc --noEmit` passes with 0 errors?
- [ ] Verified that financial operations use `roundCurrency`?
- [ ] Checked that multi-step database writes are wrapped in `prisma.$transaction`?
- [ ] Ensured no existing functional features or user preferences were deleted?

---

## 9. Living Documentation Maintenance Protocol

Whenever future AI agents or developers modify the codebase:
1. **New Architectural Decisions:** If a new library, pattern, or integration is added, append a new `DEC-xxx` entry to [`ai/decisions.md`](./decisions.md) detailing the decision, implementation, and trade-offs.
2. **Issue Resolution:** If an issue documented in [`ai/known-issues.md`](./known-issues.md) (e.g. `ISS-001`, `ISS-002`, `ISS-003`) is resolved, update its status from `Open` to `RESOLVED` and record the remediation details.
3. **API Modifications:** If API endpoints or request/response payloads are modified, update [`api/endpoints.md`](../api/endpoints.md), [`api/contracts.md`](../api/contracts.md), and [`api/errors.md`](../api/errors.md).
4. **Current State Synchronization:** If major features or structural changes occur, update [`ai/current-state.md`](./current-state.md) to keep the project snapshot current.
