.PHONY: setup dev build lint test typecheck migrate seed docker-up docker-down

setup:
	cp apps/api/.env.example apps/api/.env
	cp apps/web/.env.local.example apps/web/.env.local
	pnpm install

dev: docker-up
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

test:
	pnpm test

typecheck:
	pnpm type-check

migrate:
	pnpm --filter @marketflux/api exec drizzle-kit push

seed:
	pnpm --filter @marketflux/api exec tsx src/database/seed.ts

docker-up:
	docker compose up -d postgres redis meilisearch

docker-down:
	docker compose down
