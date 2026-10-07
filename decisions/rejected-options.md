# Rejected, Replaced & Avoided Architectural Options

This document records the technology choices, architectural approaches, and patterns that were **actively rejected, replaced, abandoned, or explicitly avoided** within `marketplace-app`. Every entry is grounded strictly in concrete repository evidence.

---

## 1. Client-Controlled Pricing & Client-Supplied Totals

- **Option**: Trusting line item unit prices and total amounts submitted in the client request body during checkout.
- **Decision**: `REPLACED / ABANDONED`
- **Evidence**:
  - The previous version of [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts) directly read untrusted pricing from the client payload:
    ```typescript
    unit_amount: Math.round(item.product.basePrice * 100)
    ```
  - Replaced in commit [`b04b5b5`](https://github.com/Shivam-kumar-92/marketplace-app/commit/b04b5b53ba7a2c78436c25d877ae3b0755bea795) with direct database ground-truth validation (`prisma.product.findUnique`).
- **Reason**: Critical financial vulnerability allowing client-side price tampering (e.g., modifying `basePrice` in browser DevTools or via curl to purchase items for ₹0 or ₹1).
- **Current Alternative**: Server-authoritative price lookup via Prisma ORM querying `product.basePrice + (variant?.priceOffset || 0)`, completely ignoring client-submitted amounts.
- **Impact**: Eliminates transaction fraud, guarantees accounting integrity, and prevents negative or manipulated revenues.

---

## 2. Plain-Text HTTP Error Responses in API Route Handlers

- **Option**: Returning plain-text string responses for client or server errors (e.g., `new NextResponse("Items are required", { status: 400 })`, `new NextResponse("Internal Error", { status: 500 })`).
- **Decision**: `REPLACED / AVOIDED`
- **Evidence**:
  - Legacy `src/app/api/checkout/route.ts` returned plain strings:
    ```typescript
    if (!items || items.length === 0) {
      return new NextResponse("Items are required", { status: 400 });
    }
    // ...
    return new NextResponse("Internal Error", { status: 500 });
    ```
  - Replaced in current implementation with:
    ```typescript
    return NextResponse.json({ error: "Cart is empty or items array is missing" }, { status: 400 });
    ```
- **Reason**: Client applications invoking `const data = await res.json()` crash with unhandled JSON parsing exceptions (`SyntaxError: Unexpected token 'I', "Internal E"... is not valid JSON`) whenever an error returns plain text instead of JSON.
- **Current Alternative**: Uniform structured JSON responses across all HTTP status codes (`400`, `404`, `409`, `500`) containing structured error messages and error codes (`code: "OUT_OF_STOCK"`).
- **Impact**: Frontend error boundaries can reliably inspect `response.json()` and present user-friendly error banners without browser runtime crashes.

---

## 3. Prisma Platform 8 CLI (`prisma@8.0.0-rc.17`) & `prisma skills sync`

- **Option**: Utilizing the experimental Prisma 8 Release Candidate CLI (`prisma@8.0.0-rc.17`) alongside `prisma skills sync` and `prisma.config.ts`.
- **Decision**: `REPLACED / ABANDONED`
- **Evidence**:
  - [`package.json`](file:///c:/Users/admin/.gemini/marketplace-app/package.json) originally declared:
    ```json
    "postinstall": "prisma skills sync || exit 0",
    "devDependencies": {
      "prisma": "^8.0.0-rc.17"
    }
    ```
  - Executing `prisma generate` failed with:
    ```
    CLI.UNKNOWN_COMMAND: No command registered for generate
    ```
    because Prisma Platform 8 deprecated standard ORM client generation in favor of the new platform data contract model (`prisma contract emit`). Furthermore, `prisma.config.ts` failed syntax parsing during build runs.
  - Replaced in `package.json` with `"prisma": "^7.10.0"` and `"postinstall": "prisma generate"`.
- **Reason**: Complete incompatibility between the Prisma 8 Platform CLI and `@prisma/client@7.10.0`, breaking `@prisma/client` code generation and TypeScript compilation.
- **Current Alternative**: Aligned Prisma CLI version (`^7.10.0`) matching `@prisma/client` (`^7.10.0`) with standard `prisma generate` post-install automation.
- **Impact**: Restored deterministic Prisma Client generation and zero TypeScript errors during `npx tsc --noEmit`.

---

## 4. In-Schema Connection URL (`url = env("DATABASE_URL")` in `schema.prisma`)

- **Option**: Declaring connection strings directly inside `prisma/schema.prisma` via `url = env("DATABASE_URL")`.
- **Decision**: `REJECTED / REMOVED`
- **Evidence**:
  - `prisma/schema.prisma` originally had `url = env("DATABASE_URL")` inside the `datasource db` block.
  - When compiling under Prisma 7, the generator rejected this syntax:
    ```
    Error code: P1012
    error: The datasource property `url` is no longer supported in schema files.
    Move connection URLs for Migrate to prisma.config.ts and pass either adapter
    for a direct database connection or accelerateUrl for Accelerate to the PrismaClient constructor.
    ```
  - Removed line 7 from `prisma/schema.prisma`.
- **Reason**: Prisma 7 disallows hardcoded database connection properties inside declarative PSL schema contracts, decoupling schema structure from runtime connection parameters.
- **Current Alternative**: Clean datasource specification in `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"
  }
  ```
- **Impact**: Fully compliant with Prisma 7 syntax; eliminates schema validation compilation failures.

---

## 5. Ad-Hoc `new PrismaClient()` Instantiations in Route Handlers

- **Option**: Instantiating `new PrismaClient()` directly inside individual route handlers or server files.
- **Decision**: `AVOIDED / REPLACED`
- **Evidence**:
  - Centralized singleton created in [`src/lib/prisma.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/lib/prisma.ts) utilizing `globalThis.prismaGlobal`:
    ```typescript
    const prismaClientSingleton = () => new PrismaClient();
    declare global {
      var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
    }
    export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
    if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
    ```
- **Reason**: In Next.js development mode, Fast Refresh / Hot Module Replacement (HMR) reloads module scopes on every file edit. Instantiating `new PrismaClient()` on each evaluation opens duplicate connection pools, rapidly triggering PostgreSQL connection exhaustion (`remaining connection slots are reserved for non-replication superuser connections`).
- **Current Alternative**: Global singleton pattern ensuring a single long-lived PrismaClient instance across hot-reloads.
- **Impact**: Stable database connections with zero connection leaks during local development.

---

## 6. Unchecked Inventory Checkout (Stock Overselling)

- **Option**: Fulfilling customer checkouts without checking available physical or warehouse variant stock.
- **Decision**: `ABANDONED / REPLACED`
- **Evidence**:
  - The initial checkout route permitted purchasing any quantity of products regardless of `Variant.stock`.
  - Replaced in `src/app/api/checkout/route.ts` with explicit stock verification:
    ```typescript
    if (variant.stock < quantity) {
      return NextResponse.json({
        error: `Insufficient stock for "${product.title} (${variant.name})". Available: ${variant.stock}, Requested: ${quantity}`,
        code: 'OUT_OF_STOCK',
        availableStock: variant.stock,
        requestedQuantity: quantity,
      }, { status: 409 });
    }
    ```
  - Replaced in `src/app/api/webhooks/stripe/route.ts` with atomic transaction decrement:
    ```typescript
    await tx.variant.update({
      where: { id: item.variantId },
      data: { stock: { decrement: item.quantity } },
    });
    ```
- **Reason**: High risk of overselling out-of-stock inventory, resulting in unfulfillable customer orders, chargebacks, and poor user trust.
- **Current Alternative**: Two-stage inventory management: pre-flight stock verification before Stripe session generation, followed by atomic post-payment inventory deduction via `prisma.$transaction`.
- **Impact**: Eliminates overselling and synchronizes real-time inventory counts with confirmed purchases.
