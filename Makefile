.PHONY: setup dev build lint test typecheck migrate seed docker-up docker-down

setup:
	cp .env.example .env
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
	pnpm --filter @marketflux/api exec tsx src/db/seed.ts

docker-up:
	docker compose up -d postgres redis meilisearch

docker-down:
	docker compose down
