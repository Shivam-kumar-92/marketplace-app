# API Error Reference & Fault Audit

> **Project:** NexMart Marketplace  
> **Framework:** Next.js 16.3.6 (App Router)  
> **Database:** PostgreSQL via Prisma ORM 7.10.0  
> **Third-Party Services:** Stripe Payments  
> **Status:** Hardened, Standardized & Failure-Resilient  

---

## 1. Standardized Error Response Envelope

All API endpoints now follow a standardized, predictable error contract:

```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

---

## 2. Comprehensive Inventory of Implemented Errors

| Status | Error Code | Message | Trigger Condition | Affected Endpoint(s) | Client Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `400` | Uncoded | `"Invalid JSON request body"` | Request body is not valid JSON | All `POST` endpoints | Check serialization |
| `400` | Uncoded | `"Cart is empty or items array is missing"` | Empty cart passed to checkout | `POST /api/checkout` | Prompt user to add items |
| `400` | `INVALID_COUPON` | `"Coupon requires minimum order amount of..."` | Coupon code invalid or below threshold | `POST /api/checkout` | Display promo code error toast |
| `401` | Uncoded | `"Authentication required. Please log in to view your order history."` | Unauthenticated request for order history | `GET /api/orders` | Redirect to login |
| `401` | Uncoded | `"Authentication or verification token (session_id or email) is required..."` | Guest querying order without matching token | `GET /api/orders/[id]` | Require login or link with session ID |
| `403` | Uncoded | `"Forbidden. You do not have access to this order."` | User attempting to view another user's order | `GET /api/orders/[id]` | Display access denied message |
| `403` | Uncoded | `"Admin privileges required"` | Non-admin caller attempting admin endpoint | `/api/admin/*` | Restrict to authorized admins |
| `404` | Uncoded | `"Product not found with ID: {id}"` | Product does not exist in catalog | `POST /api/checkout`, `/api/reviews` | Clear stale item from cart |
| `404` | Uncoded | `"Order not found with ID: {id}"` | Requested order ID not in PostgreSQL | `GET /api/orders/[id]` | Display order not found badge |
| `409` | `OUT_OF_STOCK` | `"Insufficient stock for ... Available: X, Requested: Y"` | Cart quantity exceeds available variant/product stock | `POST /api/checkout` | Highlight out-of-stock line item and clamp to available stock |
| `409` | `DUPLICATE_ENTRY` | `"A product or variant already exists with the same slug/SKU"` | Prisma `P2002` duplicate unique slug or SKU | `POST /api/admin/products` | Enter unique product slug or variant SKU |
| `429` | `RATE_LIMIT_EXCEEDED` | `"Too many requests. Please wait X seconds before trying again."` | Rate limit threshold exceeded on checkout or review endpoint | `POST /api/checkout`, `POST /api/reviews` | Wait for `Retry-After` duration before retrying |
| `500` | `ORDER_PERSIST_FAILED` | `"Order could not be saved to database..."` | PostgreSQL write fails during checkout | `POST /api/checkout` | **Fail-Closed:** Aborts Stripe session to prevent unfulfillable billing |
| `502` | `PAYMENT_SESSION_FAILED` | `"Payment provider session could not be established. Order rolled back."` | Stripe session creation fails or times out | `POST /api/checkout` | **Compensation Rollback:** Order record deleted; safe to retry |
| `500` | Uncoded | `"Webhook secret is not configured on server"` | `STRIPE_WEBHOOK_SECRET` missing | `POST /api/webhooks/stripe` | Configure environment variable |
| `500` | Uncoded | `"Failed to process webhook event"` | Exception in Stripe event handler | `POST /api/webhooks/stripe` | Stripe automatically retries |
