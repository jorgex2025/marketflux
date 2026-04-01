.PHONY: setup dev migrate seed build lint test typecheck phase3-deps

setup:
	cp apps/api/.env.example apps/api/.env || true
	cp apps/web/.env.local.example apps/web/.env.local || true
	pnpm install

phase3-deps:
	pnpm install
	@echo "✅  Fase 3 deps instaladas"

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
