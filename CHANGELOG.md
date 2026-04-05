# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Marketplace vendor onboarding flow
- Product search with Meilisearch faceted filtering
- Real-time chat between buyers and sellers
- Dispute resolution system
- Automated payout scheduling

## [0.1.0] - 2026-04-05

Initial release with core marketplace functionality.

### Added - Phase A: Foundation
- Monorepo structure with Turborepo and pnpm
- NestJS API with TypeScript strict mode
- Next.js 15 frontend with SSR
- PostgreSQL 16 with Drizzle ORM
- Redis 7 for caching and session storage
- Meilisearch v1.13 for product search
- Docker Compose for local development
- Shared packages (types, validators, eslint-config, typescript-config, monitoring)
- Makefile for common development commands
- TypeScript strict mode with 0 errors

### Added - Phase B: Core Features
- Better Auth authentication with session management
- Product CRUD with image upload (Cloudflare R2)
- Category management with hierarchical structure
- Shopping cart functionality
- Order management with status flow
- Stripe payment integration with webhooks
- Inventory management with stock reservation
- Vendor/seller profiles and onboarding
- Product reviews and ratings system
- Full-text product search with Meilisearch
- Wishlist functionality
- Coupon/discount code system

### Added - Phase C: Advanced Features
- BullMQ job queue for async processing
- Email notification system
- Shipping rate calculation and label generation
- Return/refund request workflow
- Dispute management system
- Seller payout processing
- Commission tracking and configuration
- Multi-role access control (customer, seller, admin)
- Audit logging for sensitive operations
- Analytics and reporting dashboard
- Real-time buyer-seller chat
- Banner management for promotions
- Marketplace configuration endpoints
- Health check endpoints for all services
- Rate limiting with Redis
- Sentry error monitoring integration
- Vitest unit and integration tests
- Playwright E2E tests
- CI/CD pipeline with GitHub Actions
- Fly.io deployment configuration for API
- Vercel deployment configuration for Web
- Docker production compose file

### Fixed
- TypeScript strict mode errors (52 → 0)
- Removed all `any` type usage
- NestJS global prefix alignment with health check endpoint
- Docker build optimization with multi-stage builds
- Stripe webhook signature verification
- Drizzle migration for shipments.seller_id column

### Security
- Better Auth session management with CSRF protection
- Stripe webhook signature verification
- Rate limiting on all API endpoints
- S3 signed URLs for secure file access
- Environment variable validation at startup

---

[Unreleased]: https://github.com/marketflux/marketflux/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/marketflux/marketflux/releases/tag/v0.1.0
