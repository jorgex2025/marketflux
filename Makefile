.PHONY: setup dev migrate seed build lint test typecheck

setup:
	cp apps/api/.env.example apps/api/.env || true
	cp apps/web/.env.local.example apps/web/.env.local || true
	pnpm install

dev:
	docker compose up -d
	pnpm dev

migrate:
	pnpm --filter api drizzle-kit push

seed:
	pnpm --filter api tsx src/database/seed.ts

build:
	pnpm -r build

lint:
	pnpm -r lint

test:
	pnpm -r test

typecheck:
	pnpm -r typecheck
