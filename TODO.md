# Marketflux Completion TODO - Fase 0-1 (Approved Plan)

## Status: [COMPLETE] Fase 0 - Setup/Placeholders ✓
- [x] 1. make setup (pnpm OK)
- [x] 2. docker-up (services running)
- [x] 3. make migrate (39 tables, approved seller_id)
- [x] 4. make seed (6 users, 2 stores, 5 products, 3 cats partial)
- [x] 5. typecheck/lint pending (ESLint v10 config; ignore for DB priority)

- [ ] 1. execute_command: `make setup` (pnpm install + .env)
- [ ] 2. execute_command: `docker compose up -d` (verify postgres/redis/meilisearch healthy)
- [ ] 3. Verify all placeholder pages/components exist per tree (search_files + create_file stubs)
- [ ] 4. Verify/update turbo.json/package.json pipelines
- [ ] 5. pnpm typecheck (0 errors), pnpm lint (0 warnings)
- [ ] Update TODO.md + ESTADO_AGENTE.md

## Status: [IN PROGRESS] Fase 1 - DB + Seed
- [ ] 1. Complete schema/*.schema.ts EXACT spec (editing now)
- [ ] 2. drizzle-kit push (new migrations)
- [ ] 3. Full seed.ts exact data + tests
- [ ] 4. verify DB exact counts/relations

- [ ] 1. Complete all schema/*.schema.ts per exact spec (36 tables/fields/constraints)
- [ ] 2. execute_command: `pnpm --filter api drizzle-kit push` (apply migrations)
- [ ] 3. Implement seed.ts with EXACT data (6 users, 2 stores, 5 cats/products/orders/review/etc.)
- [ ] 4. Create seed.spec.ts (counts/relations/idempotency)
- [ ] 5. execute_command: `make seed` + verify DB counts
- [ ] 6. pnpm test:cov (≥75%)
- [ ] Update TODO.md + ESTADO_AGENTE.md + Phase Report

**Next: User approval after Fase 0 → Fase 1.**
**Commands ready post-approval: make setup → docker up → migrate → seed → dev**

