# Rollback Strategy & Recovery Procedures

> **Scope:** Ground-truth audit of rollback mechanisms, disaster recovery, database schema rollback limitations, and un-implemented capabilities for `marketplace-app`.  
> **Status:** Verified against repository code and configuration files.

---

## 1. Current Rollback Capabilities

| Dimension | Supported | Mechanism | RTO / Recovery Time |
| :--- | :--- | :--- | :--- |
| **Application Code Rollback** | **Yes** | Git commit reversal (`git revert`) or PaaS instant rollback (Vercel Instant Rollback). | Minutes |
| **Static Assets / CDN Rollback** | **Yes** | Built into Next.js immutable chunk hashes (`.next/static/chunks/...`). | Instantaneous |
| **Database Schema Rollback** | **No (Manual Only)** | `prisma/migrations` does not exist; schema changes are applied via `prisma db push`. | Hours (Requires manual SQL) |
| **Payment / Financial Rollback** | **Partial** | Automatic compensating order deletion on checkout error; manual refund in Stripe dashboard for captured payments. | Automatic (pre-charge) / Manual (post-charge) |

---

## 2. Application Code Rollback Procedure

### Scenario A: Vercel / PaaS Hosted Deployment
1. Navigate to the **Deployments** tab in the hosting dashboard.
2. Locate the previous healthy deployment ID / commit hash.
3. Select **Instant Rollback / Promote to Production**.
4. Traffic is immediately rerouted to the previously compiled serverless bundles.

### Scenario B: Self-Hosted / VM / Container Deployment
```bash
# 1. Fetch git history
git fetch origin

# 2. Revert to the previous known stable tag or commit
git checkout <PREVIOUS_STABLE_COMMIT_OR_TAG>

# 3. Regenerate Prisma Client against current schema
npm ci

# 4. Rebuild production bundle
npm run build

# 5. Restart server process
pm2 restart nexmart # or npm run start
```

---

## 3. Database Migration Considerations & Rollback Policy

> [!NOTE]
> **Baseline Migration Initialized**  
> An initial baseline migration exists in [`prisma/migrations/20261008000000_init/migration.sql`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/migrations/20261008000000_init/migration.sql) with [`prisma/migrations/migration_lock.toml`](file:///c:/Users/admin/.gemini/marketplace-app/prisma/migrations/migration_lock.toml). Forward deployments can execute `npx prisma migrate deploy`. However, Prisma ORM does not support automated down-migrations; schema rollbacks must be rolled forward or manually reverted using corrective SQL.

### Destructive Schema Changes
* If a release introduces a non-backward-compatible change (e.g. dropping a column, renaming a field, or adding a NOT NULL constraint without a default), rolling back application code may cause previous versions to fail when reading or writing records.
* **Manual Recovery Procedure for Database Changes:**
  1. Access PostgreSQL directly via `psql` or the Neon console.
  2. Inspect the live database schema:
     ```sql
     \d "Order";
     \d "Product";
     ```
  3. Manually issue corrective `ALTER TABLE` statements to revert columns or foreign keys:
     ```sql
     -- Example: Reverting an added column
     ALTER TABLE "Order" DROP COLUMN IF EXISTS "newColumn";
     ```
  4. Ensure existing rows satisfy column constraints expected by the earlier version of the application code.

---

## 4. Configuration & Environment Rollback

If a failure was triggered by misconfigured environment variables:
1. Re-apply previously valid environment values in the hosting dashboard or `.env`:
   - Verify `STRIPE_SECRET_KEY` matches the expected Stripe environment (test vs live).
   - Ensure `STRIPE_WEBHOOK_SECRET` matches the active webhook endpoint in Stripe.
   - Confirm `DATABASE_URL` is pointing to the correct pooled Neon database.
2. Trigger an immediate redeployment or process restart (`pm2 restart nexmart`).

---

## 5. In-Flight Transaction & Payment Failure Recovery

### Pre-Charge Checkout Failures (Handled Automatically in Code)
* Handled in [`src/app/api/checkout/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/checkout/route.ts:446-455).
* If database order creation succeeds but Stripe session creation fails, the application performs an automatic **compensating rollback**:
  ```typescript
  // Compensating rollback: delete orphan pending order
  await prisma.order.delete({ where: { id: order.id } });
  ```

### Post-Charge Webhook Stock Exhaustion (Partially Handled in Code)
* Handled in [`src/app/api/webhooks/stripe/route.ts`](file:///c:/Users/admin/.gemini/marketplace-app/src/app/api/webhooks/stripe/route.ts:108-118).
* If a customer successfully pays on Stripe but concurrent purchases depleted stock before the webhook executes:
  * Order status is transitioned to `PROCESSING` (rather than failing silently).
  * Marked in logs with `requires_manual_fulfillment_or_refund: true`.
  * **Operator Action Required:** The operations team must inspect the order in the database and issue a refund via Stripe Dashboard.

---

## 6. Capabilities NOT Currently Implemented

The following enterprise rollback capabilities are **NOT IMPLEMENTED** in this codebase:

1. **Automated Database Rollback Scripts:** No reversible migration history files in `prisma/migrations`.
2. **Automated Canary Deployments:** No weighted traffic routing configured in repository files.
3. **Blue/Green Deployment Orchestration:** No dual-cluster reverse proxy or load balancer configs.
4. **Point-In-Time Database Restore (PITR) Automation:** Must be triggered manually via Neon console if configured in the cloud provider.
5. **Circuit Breakers / Chaos Testing:** No automated circuit breaker for Stripe API downtime.
