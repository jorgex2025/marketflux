# MarketFlux API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All endpoints prefixed with `/api` require authentication unless marked as **Public**.

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/products` - List products (paginated, filterable)
- `GET /api/products/:slug` - Get product by slug
- `POST /api/auth/*` - All auth routes (sign-in, sign-up, session, etc.)
- `GET /api/stores` - List active stores
- `GET /api/stores/:slug` - Get store by slug
- `GET /api/categories` - Category tree
- `GET /api/categories/:slug` - Get category by slug
- `GET /api/reviews/product/:productId` - List reviews for a product
- `GET /api/banners` - List active banners
- `GET /api/shipping/methods` - List shipping methods
- `GET /api/shipping/track/:trackingNumber` - Track a shipment
- `GET /api/reputation/:sellerId` - Get seller reputation
- `GET /api/commissions/effective/:storeId` - Get effective commission rate
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/coupons/validate` - Validate a coupon code
- `GET /api/coupons/flash-sales/active` - List active flash sales
- `GET /api/search/products` - Search products
- `GET /health` - Health check (no prefix)
- `GET /metrics` - Prometheus metrics

### Authenticated Endpoints

- `GET /api/orders` - List user orders (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth)
- `POST /api/orders` - Create order (requires auth)
- `PATCH /api/orders/:id/cancel` - Cancel order (requires auth)
- `GET /api/orders/:id/items/:itemId/review-eligible` - Check review eligibility (requires auth)
- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart/items` - Add item to cart (requires auth)
- `PATCH /api/cart/items/:id` - Update cart item (requires auth)
- `DELETE /api/cart/items/:id` - Remove cart item (requires auth)
- `POST /api/cart/coupon` - Apply coupon to cart (requires auth)
- `DELETE /api/cart/coupon` - Remove coupon from cart (requires auth)
- `GET /api/wishlist` - List wishlist items (requires auth)
- `POST /api/wishlist/items/:productId` - Add to wishlist (requires auth)
- `DELETE /api/wishlist/items/:productId` - Remove from wishlist (requires auth)
- `GET /api/notifications` - List user notifications (requires auth)
- `GET /api/notifications/unread` - List unread notifications (requires auth)
- `PATCH /api/notifications/:id/read` - Mark notification as read (requires auth)
- `PATCH /api/notifications/read-all` - Mark all notifications as read (requires auth)
- `GET /api/chat/conversations` - List user conversations (requires auth)
- `POST /api/chat/conversations` - Create conversation (requires auth)
- `GET /api/chat/conversations/:id/messages` - Get conversation messages (requires auth)
- `POST /api/payments/checkout-session` - Create Stripe checkout session (requires auth)
- `GET /api/returns/my` - List my returns (requires auth)
- `GET /api/disputes/my` - List my disputes (requires auth)

---

## Endpoints by Module

### Auth

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/health` | Health check | **Public** | - |
| `ALL` | `/api/auth/*` | All auth operations (sign-in, sign-up, session, etc.) via Better Auth | **Public** | - |

### Products

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/products` | List products (paginated, filterable) | **Public** | - |
| `GET` | `/api/products/:slug` | Get product by slug | **Public** | - |
| `POST` | `/api/products` | Create product | Required | seller, admin |
| `PATCH` | `/api/products/:id` | Update product | Required | seller, admin |
| `DELETE` | `/api/products/:id` | Delete product | Required | seller, admin |
| `POST` | `/api/products/bulk-import` | Bulk import products (rate limited: 5/min) | Required | seller, admin |
| `GET` | `/api/products/bulk-import/:jobId` | Get bulk import job status | Required | seller, admin |

### Orders

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/api/orders` | Create order | Required | - |
| `GET` | `/api/orders` | List user orders (paginated) | Required | - |
| `GET` | `/api/orders/:id` | Get order details | Required | - |
| `PATCH` | `/api/orders/:id/cancel` | Cancel order | Required | - |
| `GET` | `/api/orders/:id/items/:itemId/review-eligible` | Check if order item is eligible for review | Required | - |

### Vendors/Stores

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/stores` | List active stores | **Public** | - |
| `GET` | `/api/stores/:slug` | Get store by slug | **Public** | - |
| `GET` | `/api/stores/admin/all` | List all stores (including inactive) | Required | admin |
| `PATCH` | `/api/stores/:id/status` | Update store status | Required | admin |
| `DELETE` | `/api/stores/:id` | Delete store | Required | admin |
| `PATCH` | `/api/stores/:id` | Update own store | Required | - |
| `PATCH` | `/api/stores/:id/onboarding` | Complete store onboarding | Required | - |

### Cart

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/cart` | Get user cart | Required | - |
| `POST` | `/api/cart/items` | Add item to cart | Required | - |
| `PATCH` | `/api/cart/items/:id` | Update cart item quantity | Required | - |
| `DELETE` | `/api/cart/items/:id` | Remove item from cart | Required | - |
| `POST` | `/api/cart/coupon` | Apply coupon to cart | Required | - |
| `DELETE` | `/api/cart/coupon` | Remove coupon from cart | Required | - |

### Payments

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/api/payments/checkout-session` | Create Stripe checkout session (rate limited: 10/min) | Required | - |
| `POST` | `/api/payments/webhook` | Stripe webhook handler | **Public** | - |

### Categories

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/categories` | Get category tree | **Public** | - |
| `GET` | `/api/categories/:slug` | Get category by slug | **Public** | - |
| `POST` | `/api/categories` | Create category | Required | admin |
| `PATCH` | `/api/categories/:id` | Update category | Required | admin |
| `DELETE` | `/api/categories/:id` | Delete category | Required | admin |

### Reviews

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/reviews/product/:productId` | List reviews for a product | **Public** | - |
| `POST` | `/api/reviews` | Create review | Required | buyer, seller, admin |
| `PATCH` | `/api/reviews/:id` | Update own review | Required | - |
| `DELETE` | `/api/reviews/:id` | Delete review | Required | admin |
| `POST` | `/api/reviews/:id/reply` | Reply to review | Required | seller, admin |
| `POST` | `/api/reviews/:id/helpful` | Mark review as helpful | Required | - |
| `GET` | `/api/reviews/pending` | List pending reviews for moderation | Required | admin |
| `PATCH` | `/api/reviews/:id/moderate` | Moderate a review | Required | admin |

### Shipping

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/shipping/zones` | List shipping zones | Required | admin |
| `POST` | `/api/shipping/zones` | Create shipping zone | Required | admin |
| `PATCH` | `/api/shipping/zones/:id` | Update shipping zone | Required | admin |
| `GET` | `/api/shipping/methods` | List shipping methods | **Public** | - |
| `POST` | `/api/shipping/methods` | Create shipping method | Required | admin |
| `PATCH` | `/api/shipping/methods/:id` | Update shipping method | Required | admin |
| `GET` | `/api/shipping/shipments` | List shipments | Required | seller, admin |
| `POST` | `/api/shipping/shipments` | Create shipment | Required | seller, admin |
| `PATCH` | `/api/shipping/shipments/:id` | Update shipment | Required | seller, admin |
| `GET` | `/api/shipping/track/:trackingNumber` | Track shipment by tracking number | **Public** | - |

### Returns

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/api/returns` | Create return request | Required | buyer |
| `GET` | `/api/returns/my` | List my returns | Required | - |
| `GET` | `/api/returns` | List all returns | Required | seller, admin |
| `GET` | `/api/returns/:id` | Get return details | Required | - |
| `PATCH` | `/api/returns/:id/approve` | Approve return | Required | seller, admin |
| `PATCH` | `/api/returns/:id/reject` | Reject return | Required | seller, admin |
| `POST` | `/api/returns/:id/refund` | Process refund for return | Required | admin |

### Disputes

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/api/disputes` | Create dispute | Required | buyer |
| `GET` | `/api/disputes/my` | List my disputes | Required | - |
| `GET` | `/api/disputes` | List all disputes | Required | admin |
| `GET` | `/api/disputes/:id` | Get dispute details | Required | - |
| `PATCH` | `/api/disputes/:id` | Resolve dispute | Required | admin |

### Chat

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/api/chat/conversations` | Create or reuse conversation | Required | - |
| `GET` | `/api/chat/conversations` | List user conversations | Required | - |
| `GET` | `/api/chat/conversations/:id/messages` | Get conversation messages | Required | - |

### Notifications

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/notifications` | List user notifications (last 50) | Required | - |
| `GET` | `/api/notifications/unread` | List unread notifications | Required | - |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read | Required | - |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read | Required | - |

### Coupons

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/coupons` | List coupons | Required | admin, seller |
| `GET` | `/api/coupons/:id` | Get coupon by ID | Required | admin, seller |
| `POST` | `/api/coupons` | Create coupon | Required | admin, seller |
| `PATCH` | `/api/coupons/:id` | Update coupon | Required | admin, seller |
| `DELETE` | `/api/coupons/:id` | Delete coupon | Required | admin, seller |
| `POST` | `/api/coupons/validate` | Validate coupon code | **Public** | - |
| `GET` | `/api/coupons/flash-sales/active` | List active flash sales | **Public** | - |

### Banners

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/banners` | List active banners | **Public** | - |
| `POST` | `/api/banners` | Create banner | Required | admin |
| `PATCH` | `/api/banners/:id` | Update banner | Required | admin |
| `DELETE` | `/api/banners/:id` | Delete banner | Required | admin |

### Wishlists

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/wishlist` | List wishlist items | Required | - |
| `POST` | `/api/wishlist/items/:productId` | Add item to wishlist | Required | - |
| `DELETE` | `/api/wishlist/items/:productId` | Remove item from wishlist | Required | - |

### Commissions

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/commissions` | List commissions | Required | admin |
| `GET` | `/api/commissions/:id` | Get commission by ID | Required | admin |
| `POST` | `/api/commissions` | Create commission | Required | admin |
| `PATCH` | `/api/commissions/:id` | Update commission | Required | admin |
| `DELETE` | `/api/commissions/:id` | Delete commission | Required | admin |
| `GET` | `/api/commissions/effective/:storeId` | Get effective commission rate for a store | **Public** | - |

### Payouts

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/payouts` | List payouts | Required | seller, admin |
| `GET` | `/api/payouts/:id` | Get payout by ID | Required | seller, admin |
| `GET` | `/api/payouts/pending-balance` | Calculate pending balance for store | Required | seller |
| `POST` | `/api/payouts/process` | Process payout for store | Required | admin |
| `GET` | `/api/payouts/admin/summary` | Get admin payout summary | Required | admin |

### Reports

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/reports` | List reports | Required | admin |
| `GET` | `/api/reports/:id` | Get report by ID | Required | admin |
| `DELETE` | `/api/reports/:id` | Delete report | Required | admin |

### Analytics

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/analytics/seller/:storeId/summary` | Seller summary | Required | seller, admin, superadmin |
| `GET` | `/api/analytics/seller/:storeId/top-products` | Seller top products | Required | seller, admin, superadmin |
| `GET` | `/api/analytics/seller/:storeId/revenue-by-day` | Seller revenue by day | Required | seller, admin, superadmin |
| `GET` | `/api/analytics/admin/summary` | Admin platform summary | Required | admin, superadmin |
| `GET` | `/api/analytics/admin/top-stores` | Admin top stores | Required | admin, superadmin |
| `GET` | `/api/analytics/admin/gmv-by-day` | Admin GMV by day | Required | admin, superadmin |
| `GET` | `/api/analytics/admin/order-status` | Admin order status breakdown | Required | admin, superadmin |

### Storage

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `POST` | `/api/storage/upload` | Upload file | Required | - |
| `DELETE` | `/api/storage/:key` | Delete file by key | Required | - |
| `GET` | `/api/storage/files/:key` | Serve file by key | Required | - |

### Config

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/config` | Get all config | Required | admin, superadmin |
| `GET` | `/api/config/:key` | Get config value by key | Required | admin, superadmin |
| `PATCH` | `/api/config/:key` | Update config value | Required | superadmin |
| `PATCH` | `/api/config` | Bulk update config | Required | superadmin |

### Audit

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/audit` | List audit logs (paginated, filterable) | Required | admin, superadmin |

### Search

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/search/products` | Search products | **Public** | - |
| `POST` | `/api/search/reindex` | Trigger search reindex | Required | - |

### Inventory

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/inventory/:productId` | Get product stock | Required | seller, admin |
| `PATCH` | `/api/inventory/:productId` | Update product stock | Required | seller, admin |
| `PATCH` | `/api/inventory/:productId/variants/:vid` | Update variant stock | Required | seller, admin |
| `GET` | `/api/inventory/alerts` | Get stock alerts | Required | seller, admin |
| `POST` | `/api/inventory/alerts` | Create stock alert | Required | seller, admin |
| `DELETE` | `/api/inventory/alerts/:id` | Delete stock alert | Required | seller, admin |

### Reputation

| Method | Path | Description | Auth | Roles |
|--------|------|-------------|------|-------|
| `GET` | `/api/reputation/:sellerId` | Get seller reputation | **Public** | - |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## Rate Limits

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 300 requests/minute
- Admin endpoints: 1000 requests/minute

### Specific Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /api/products/bulk-import` | 5 requests/minute |
| `POST /api/payments/checkout-session` | 10 requests/minute |
