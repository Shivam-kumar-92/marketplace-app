# Technology Decisions & Dependency Stack

This document records the verifiable technology choices, active libraries, build tools, runtimes, and engineering trade-offs currently utilized in `marketplace-app`.

---

## 1. Core Languages & Runtime

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TypeScript** | `^5` (devDependencies) | Primary language for type safety and compiler verification | Configured in [`tsconfig.json`](file:///c:/Users/admin/.gemini/marketplace-app/tsconfig.json); strict mode enabled; all files (`.ts`, `.tsx`) written in TS. | `CONFIRMED` |
| **Node.js** | `>=20` (`@types/node: ^20`) | JavaScript server-side runtime environment | Target for Next.js App Router API endpoints, Prisma ORM queries, and build scripts. | `CONFIRMED` |

---

## 2. Web Framework & Frontend Architecture

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js** | `16.3.6` | Full-stack application framework (App Router) | Handles SSR, client routing, layout structure ([`src/app/layout.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/layout.tsx)), API routes ([`src/app/api/`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api)), font optimization. | `CONFIRMED` |
| **React** | `19.2.8` | Component and UI rendering library | Component rendering, hooks (`useState`, `useEffect`), JSX processing in [`src/components/`](file:///c:/Users/admin/.gemini/marketplace-app/src/components). | `CONFIRMED` |
| **React DOM** | `19.2.8` | DOM rendering integration for React 19 | Standard web DOM adapter required by Next.js and React. | `CONFIRMED` |

---

## 3. Styling & User Interface

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tailwind CSS** | `^4` (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`) | Utility-first styling system | Configured in [`postcss.config.mjs`](file:///c:/Users/admin/.gemini/marketplace-app/postcss.config.mjs) and imported via `@import "tailwindcss"` in [`src/app/globals.css`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/globals.css). Used across all components. | `CONFIRMED` |
| **Lucide React** | `^1.48.0` | UI Iconography | Icon package imported in [`Header.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/layout/Header.tsx) (`Search`, `ShoppingCart`, `Menu`, `MapPin`, `User`, `Package`) and [`ProductDetail.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/components/product/ProductDetail.tsx) (`Star`, `Shield`, `Truck`, `RotateCcw`). | `CONFIRMED` |
| **Geist Fonts** | Built into `next/font/google` | Typography system | Loaded in [`src/app/layout.tsx`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/layout.tsx) with CSS variables `--font-geist-sans` and `--font-geist-mono`. | `CONFIRMED` |

---

## 4. State Management

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Zustand** | `^5.0.15` | Lightweight client state management | Implemented in [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts) using `persist` middleware to sync cart state to `localStorage` under `nexmart-cart-storage`. | `CONFIRMED` |

---

## 5. Database, ORM & Data Layer

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Prisma Client** | `^7.10.0` | Auto-generated type-safe query builder | Data access for `Product`, `Variant`, `Order`, `OrderItem`, `User`, `Address`. Initialized as a singleton in [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts). | `CONFIRMED` |
| **Prisma CLI** | `^7.10.0` (devDependencies) | Schema management, migration, client generator | Generates client via `postinstall: "prisma generate"`. Schema declared in [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma). | `CONFIRMED` |
| **PostgreSQL** | Relational Database Engine | Primary transactional relational storage | Configured as datasource provider in `prisma/schema.prisma` (`provider = "postgresql"`). Connected via `DATABASE_URL`. | `CONFIRMED` |

---

## 6. Payments & Third-Party Gateways

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Stripe Node SDK** | `^22.6.2` | Payment processing gateway | Initialized in [`src/lib/stripe.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/stripe.ts). Creates checkout sessions in [`/api/checkout`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts); validates signatures in [`/api/webhooks/stripe`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts). | `CONFIRMED` |

---

## 7. Authentication & Authorization

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NextAuth.js Schema Models** | Model specification in PSL | Identity & session data structure | Models `User`, `Account`, `Session` declared in [`prisma/schema.prisma`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/schema.prisma). | `CONFIRMED` |
| **NextAuth Runtime** | Not yet installed in `package.json` | Active session middleware & provider | Schema exists; active runtime library is not yet imported into route handlers. | `INFERRED (Pending Integration)` |

---

## 8. Storage & Media

| Technology | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- |
| **Image URLs (String array)** | Cloud storage URLs for product media | Declared as `images String[]` on `Product` in `prisma/schema.prisma`. Consumed by `ProductDetail.tsx` and Stripe session metadata. | `CONFIRMED` |
| **Browser LocalStorage** | Client cart item persistence | Configured via Zustand `persist` middleware in [`src/store/useCartStore.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/store/useCartStore.ts). | `CONFIRMED` |

---

## 9. Build, Linting & Quality Assurance

| Technology | Verified Version | Purpose | Actual Usage in Code | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ESLint** | `^9` | Static analysis & code style enforcement | Configured in [`eslint.config.mjs`](file:///c:/Users/admin/.gemini/marketplace-app/eslint.config.mjs) using `eslint-config-next@16.3.6` with core Web Vitals and TypeScript rule sets. | `CONFIRMED` |
| **PostCSS** | Bundled | CSS processing tool | Loads `@tailwindcss/postcss` in [`postcss.config.mjs`](file:///c:/Users/admin/.gemini/marketplace-app/postcss.config.mjs). | `CONFIRMED` |
| **TypeScript Compiler (`tsc`)** | `^5` | Type-checking and build validation | Validated with `npx tsc --noEmit` with zero type errors. | `CONFIRMED` |
| **Automated Testing (Jest / Vitest / Playwright)** | Not installed | Unit, integration, or E2E automated tests | No testing libraries or test runner configuration exist in `package.json`. | `UNKNOWN / NOT PRESENT` |

---

## 10. Technology Trade-offs

1. **Next.js 16 + React 19 Bleeding-Edge Stack**:
   - *Advantage*: High-performance React 19 primitives, modern server action capabilities, latest Next.js App Router optimizations.
   - *Trade-off*: Occasional peer-dependency strictness with older npm packages; requires up-to-date type definitions (`@types/react@^19`). `[CONFIRMED]`

2. **Tailwind CSS v4 Engine**:
   - *Advantage*: Zero-config modern CSS architecture using native `@theme inline` and CSS variables, eliminating legacy `tailwind.config.js`.
   - *Trade-off*: Differs from Tailwind v3 configuration conventions; requires PostCSS v4 adapter (`@tailwindcss/postcss`). `[CONFIRMED]`

3. **Prisma ORM v7 vs. Pure SQL Queries**:
   - *Advantage*: Type-safe query autocompletion, schema-driven migrations, declarative relations, built-in transaction management (`prisma.$transaction`).
   - *Trade-off*: Requires separate generation step (`prisma generate`) post-install; engine binaries required in deployment environments. `[CONFIRMED]`

4. **Zustand vs. Redux Toolkit**:
   - *Advantage*: Near-zero boilerplate, hook-based consumption, built-in persistence without heavy reducer graphs.
   - *Trade-off*: Does not enforce opinionated slice structures out of the box; developer discipline needed as store complexity expands. `[CONFIRMED]`
