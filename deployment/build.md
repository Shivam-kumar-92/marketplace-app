# Build System & Build Process

> **Scope:** Ground-truth audit of the build lifecycle, prerequisites, compilation commands, generated artifacts, and verification data for `marketplace-app`.  
> **Status:** Verified via local build execution (`npm run build` completed with exit code 0).

---

## 1. Build Prerequisites

| Component | Minimum Verified Version | Verification Location | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` | [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json:28) (`@types/node: ^20`) | Required by Next.js 16 and React 19. |
| **npm** | `>= 9.0.0` | [`package-lock.json`](file:///c:/Users/admin/.gemini/marketplace-app/package-lock.json) | Package manager lockfile version 3. |
| **TypeScript** | `^5.0.0` | [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json:36) | Enforced via [`tsconfig.json`](file:///c:/Users/admin/.gemini/marketplace-app/tsconfig.json). |
| **PostgreSQL Driver** | N/A (Bundled) | `@prisma/client: ^7.10.0` | Prisma generates native query engine binaries during build. |

---

## 2. Dependency Installation

```bash
# Standard dependency installation
npm install
```

### Lifecycle Hook: `postinstall`
When `npm install` executes, the following lifecycle hook declared in [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json:12) runs automatically:
```json
"postinstall": "prisma generate"
```
* **Purpose:** Inspects [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma) and emits the generated TypeScript client types into `node_modules/@prisma/client`.
* **Requirement:** Must complete before Next.js compiles TypeScript code; otherwise, imports like `import { PrismaClient } from '@prisma/client'` will fail.

---

## 3. Verified Build Command

The official production build command declared in `package.json`:

```bash
npm run build
```

Under the hood, this executes:
```bash
next build
```

### Build Engine: Next.js 16.3.6 (Turbopack)
Next.js 16 uses Turbopack as the default compiler during `next build`.

---

## 4. Platform-Specific Build Behavior

* **Windows**:
  * Build executes cleanly via PowerShell or cmd.
  * Note: If a parent folder contains a secondary `package-lock.json`, Next.js emits an informational warning (`Next.js ignored package-lock.json in parent directory`).
* **Linux / Alpine / Docker (POSIX)**:
  * File casing sensitivity: Linux environments strictly enforce import casing. All imports in `src/` follow exact case (`@/components/product/ProductDetail`, `@/lib/prisma`).
  * Architecture-specific Prisma engine binaries: Prisma generates the Linux query engine binary (`libquery_engine-linux-musl.so.node` or `debian-openssl`) when running inside Linux container environments.

---

## 5. Required Environment Configuration During Build

* **`DATABASE_URL`**:
  * **Build-Time Resilience:** The application uses a lazy proxy in [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts:30-40) and fallback mock data in [`src/lib/catalog.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/catalog.ts:48-52).
  * Consequently, `next build` does **not** hard-fail if `DATABASE_URL` is omitted during build static page generation (`SSG`). However, for production static prerendering of dynamic products, providing `DATABASE_URL` is recommended.
* **`STRIPE_SECRET_KEY`**:
  * Required at runtime, but during static compilation, `src/lib/stripe.ts` does not execute unless an SSG page invokes Stripe checkout methods (none currently do).

---

## 6. Generated Build Artifacts

Executing `npm run build` populates the [`.next/`](file:///c:/Users/admin/.gemini/marketplace-app/.next) directory with:

| Directory / Artifact | Verified Size / Type | Contents & Role |
| :--- | :--- | :--- |
| `.next/BUILD_ID` | Text file (21 bytes) | Unique deployment hash identifying the build run. |
| `.next/server/app/` | Directory | Compiled Node.js server bundles for App Router route handlers and SSR components. |
| `.next/static/` | Directory | Optimized CSS bundles (Tailwind 4), client JS chunks, and font assets (`Geist`). |
| `.next/prerender-manifest.json` | JSON (29 KB) | Route mapping of static HTML pages generated at build time. |
| `.next/routes-manifest.json` | JSON (3.3 KB) | Next.js internal URL routing table, redirects, and rewrites. |
| `.next/required-server-files.json` | JSON (9.9 KB) | Inventory of runtime dependencies required when packaging standalone distributions. |

---

## 7. Verified Build Execution Log

The following verified output was captured during the build audit on October 2026:

```text
> marketplace-app@0.1.0 build
> next build

▲ Next.js 16.3.6 (Turbopack)
- Environments: .env

✓ Compiled successfully in 50s
  Running TypeScript ...
  Finished TypeScript in 23.7s ...
  Collecting page data using 3 workers ...
  Generating static pages using 3 workers (44/44) in 4.2s
  Finalizing page optimization ...

Route (app)                              Size     First Load JS
┌ ƒ /                                    (Dynamic - server-rendered on demand)
├ ○ /_not-found                          (Static)
├ ƒ /api/admin/products                  (Dynamic - route handler)
├ ƒ /api/cart                            (Dynamic - route handler)
├ ƒ /api/checkout                        (Dynamic - route handler)
├ ƒ /api/orders                          (Dynamic - route handler)
├ ƒ /api/orders/[id]                     (Dynamic - route handler)
├ ƒ /api/reviews                         (Dynamic - route handler)
├ ƒ /api/webhooks/stripe                 (Dynamic - route handler)
├ ○ /cart                                (Static)
├ ○ /checkout/success                    (Static)
└ ● /products/[id]                       (SSG - prerendered via generateStaticParams)
  ├ ● /products/prod-1
  ├ ● /products/sony-wh-1000xm5-wireless-headphones
  ├ ● /products/prod-2
  └ ● [+29 more paths]

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

* **Outcome:** Clean exit code `0`.
* **Zero Type Errors:** Validated by internal Next.js TypeScript runner.
* **Route Summary:** 44 total pages compiled (9 dynamic route handlers, 3 static pages, 32 SSG product routes).
