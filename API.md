# API Documentation

Base URL: `/api`

All endpoints return JSON responses. Authentication is handled via Better Auth sessions.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## Authentication

All endpoints requiring authentication expect a valid session cookie set by Better Auth.

| Header | Description |
|--------|-------------|
| `Cookie` | Session cookie (`better-auth.session_token`) |
| `Content-Type` | `application/json` |

### Role-Based Access

| Role | Description |
|------|-------------|
| `customer` | Can browse, purchase, review |
| `seller` | Can manage products, orders, inventory |
| `admin` | Full access to all resources |

---

## Endpoints

### Health

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/health` | Service health check | No |
| `GET` | `/api/health/db` | Database connectivity | No |
| `GET` | `/api/health/redis` | Redis connectivity | No |

### Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login with email/password | No |
| `POST` | `/api/auth/logout` | Logout current session | Yes |
| `GET` | `/api/auth/session` | Get current session | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset | No |
| `POST` | `/api/auth/reset-password` | Reset password with token | No |

### Products

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/products` | List products (paginated) | No |
| `GET` | `/api/products/:id` | Get product by ID | No |
| `POST` | `/api/products` | Create product | Yes (seller) |
| `PATCH` | `/api/products/:id` | Update product | Yes (seller, owner) |
| `DELETE` | `/api/products/:id` | Delete product | Yes (seller, owner) |
| `POST` | `/api/products/:id/images` | Upload product images | Yes (seller, owner) |

**Query Parameters** (GET `/api/products`):
- `page` (number): Page number, default 1
- `limit` (number): Items per page, default 20, max 100
- `category` (string): Filter by category slug
- `seller` (string): Filter by seller ID
- `sort` (string): Sort field (`price`, `createdAt`, `rating`)
- `order` (string): Sort direction (`asc`, `desc`)
- `q` (string): Search query (uses Meilisearch)

### Categories

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/categories` | List all categories | No |
| `GET` | `/api/categories/:id` | Get category with tree | No |
| `POST` | `/api/categories` | Create category | Yes (admin) |
| `PATCH` | `/api/categories/:id` | Update category | Yes (admin) |
| `DELETE` | `/api/categories/:id` | Delete category | Yes (admin) |

### Cart

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/cart` | Get current cart | Yes |
| `POST` | `/api/cart/items` | Add item to cart | Yes |
| `PATCH` | `/api/cart/items/:id` | Update cart item quantity | Yes |
| `DELETE` | `/api/cart/items/:id` | Remove item from cart | Yes |
| `DELETE` | `/api/cart` | Clear cart | Yes |

### Orders

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/orders` | List user orders | Yes |
| `GET` | `/api/orders/:id` | Get order details | Yes |
| `POST` | `/api/orders` | Create order from cart | Yes |
| `PATCH` | `/api/orders/:id/status` | Update order status | Yes (seller/admin) |
| `POST` | `/api/orders/:id/cancel` | Cancel order | Yes (customer) |

**Order Status Flow**: `pending` → `confirmed` → `processing` → `shipped` → `delivered`

### Payments

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/payments/create-intent` | Create Stripe payment intent | Yes |
| `POST` | `/api/payments/webhook` | Stripe webhook handler | No (signature verified) |
| `GET` | `/api/payments/:orderId` | Get payment status | Yes |
| `POST` | `/api/payments/:id/refund` | Process refund | Yes (admin) |

### Inventory

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/inventory` | List inventory items | Yes (seller) |
| `GET` | `/api/inventory/:productId` | Get product inventory | Yes (seller) |
| `PATCH` | `/api/inventory/:productId` | Update stock quantity | Yes (seller) |
| `POST` | `/api/inventory/:productId/reserve` | Reserve stock for order | Yes |
| `POST` | `/api/inventory/:productId/release` | Release reserved stock | Yes |

### Shipping

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/shipping/rates` | Calculate shipping rates | Yes |
| `POST` | `/api/shipping/:orderId/label` | Generate shipping label | Yes (seller) |
| `GET` | `/api/shipping/:orderId/tracking` | Get tracking info | Yes |
| `PATCH` | `/api/shipping/:orderId/tracking` | Update tracking number | Yes (seller) |

### Vendors

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/vendors` | List vendors | No |
| `GET` | `/api/vendors/:id` | Get vendor profile | No |
| `GET` | `/api/vendors/:id/products` | Get vendor products | No |
| `PATCH` | `/api/vendors/:id` | Update vendor profile | Yes (owner) |
| `POST` | `/api/vendors/apply` | Apply to become seller | Yes |

### Reviews

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/reviews` | List reviews (paginated) | No |
| `GET` | `/api/reviews/product/:productId` | Get product reviews | No |
| `POST` | `/api/reviews` | Create review | Yes (verified buyer) |
| `PATCH` | `/api/reviews/:id` | Update review | Yes (owner) |
| `DELETE` | `/api/reviews/:id` | Delete review | Yes (owner/admin) |

### Returns

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/returns` | List returns | Yes |
| `POST` | `/api/returns` | Create return request | Yes |
| `GET` | `/api/returns/:id` | Get return details | Yes |
| `PATCH` | `/api/returns/:id/status` | Update return status | Yes (seller/admin) |

### Disputes

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/disputes` | List disputes | Yes (admin) |
| `POST` | `/api/disputes` | Open dispute | Yes |
| `GET` | `/api/disputes/:id` | Get dispute details | Yes |
| `PATCH` | `/api/disputes/:id/resolve` | Resolve dispute | Yes (admin) |

### Notifications

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/notifications` | List user notifications | Yes |
| `PATCH` | `/api/notifications/:id/read` | Mark as read | Yes |
| `PATCH` | `/api/notifications/read-all` | Mark all as read | Yes |
| `DELETE` | `/api/notifications/:id` | Delete notification | Yes |

### Search

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/search` | Search products (Meilisearch) | No |
| `GET` | `/api/search/suggestions` | Get search suggestions | No |

**Query Parameters** (GET `/api/search`):
- `q` (string, required): Search query
- `category` (string): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `seller` (string): Filter by seller
- `sort` (string): `_geo`, `price`, `createdAt`, `_ranking`

### Payouts

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/payouts` | List seller payouts | Yes (seller) |
| `POST` | `/api/payouts/request` | Request payout | Yes (seller) |
| `GET` | `/api/payouts/:id` | Get payout details | Yes |

### Commissions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/commissions` | List commissions | Yes (admin) |
| `GET` | `/api/commissions/settings` | Get commission settings | Yes (admin) |
| `PATCH` | `/api/commissions/settings` | Update commission settings | Yes (admin) |

### Coupons

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/coupons` | List coupons | Yes (admin/seller) |
| `POST` | `/api/coupons` | Create coupon | Yes (admin/seller) |
| `PATCH` | `/api/coupons/:id` | Update coupon | Yes (admin/seller) |
| `DELETE` | `/api/coupons/:id` | Delete coupon | Yes (admin/seller) |
| `POST` | `/api/coupons/validate` | Validate coupon code | Yes |

### Wishlists

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/wishlists` | Get user wishlist | Yes |
| `POST` | `/api/wishlists/items` | Add item to wishlist | Yes |
| `DELETE` | `/api/wishlists/items/:productId` | Remove item from wishlist | Yes |

### Reports

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/reports/sales` | Sales report | Yes (seller/admin) |
| `GET` | `/api/reports/revenue` | Revenue report | Yes (admin) |
| `GET` | `/api/reports/products` | Product performance | Yes (seller/admin) |
| `GET` | `/api/reports/customers` | Customer analytics | Yes (admin) |

### Analytics

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/analytics/dashboard` | Dashboard metrics | Yes (admin) |
| `GET` | `/api/analytics/sellers` | Seller performance | Yes (admin) |

### Chat

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/chat/conversations` | List conversations | Yes |
| `POST` | `/api/chat/conversations` | Start conversation | Yes |
| `GET` | `/api/chat/conversations/:id/messages` | Get messages | Yes |
| `POST` | `/api/chat/conversations/:id/messages` | Send message | Yes |

### Storage

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/storage/upload` | Upload file to R2 | Yes |
| `DELETE` | `/api/storage/:key` | Delete file | Yes |
| `GET` | `/api/storage/:key/signed-url` | Get signed URL | Yes |

### Audit

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/audit/logs` | List audit logs | Yes (admin) |
| `GET` | `/api/audit/logs/:id` | Get audit log entry | Yes (admin) |

### Marketplace Config

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/marketplace-config` | Get marketplace settings | No |
| `PATCH` | `/api/marketplace-config` | Update settings | Yes (admin) |

### Banners

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/banners` | List active banners | No |
| `POST` | `/api/banners` | Create banner | Yes (admin) |
| `PATCH` | `/api/banners/:id` | Update banner | Yes (admin) |
| `DELETE` | `/api/banners/:id` | Delete banner | Yes (admin) |

---

## Rate Limiting

Rate limiting is enforced per IP address using Redis:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth endpoints | 10 requests | 1 minute |
| Search | 60 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Upload | 20 requests | 1 minute |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

When rate limited, the API returns `429 Too Many Requests`.

## Pagination

All list endpoints support cursor-based pagination:

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
