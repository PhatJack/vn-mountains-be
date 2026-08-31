# AGENTS.md

NestJS 12 + TypeScript backend, managed with **pnpm** (see `pnpm-lock.yaml`). Uses Drizzle ORM, Vitest, and oxlint. ESLint/Jest are not used.

## Commands

```bash
pnpm start:dev        # dev server (watch)
pnpm build            # nest build
pnpm test             # vitest run (unit, *.spec.ts)
pnpm test:e2e         # vitest run --config ./vitest.config.e2e.ts (*.e2e-spec.ts)
pnpm lint             # oxlint src/ test/  (NOT eslint)
pnpm format           # prettier --write
pnpm db:generate      # drizzle-kit generate (creates migration in drizzle/)
pnpm db:migrate       # drizzle-kit migrate
pnpm db:push          # drizzle-kit push (schema sync)
```

Run `lint` and `test` after changes.

## Critical gotchas

- **ESM + `module: nodenext`** (`package.json` has `"type": "module"`): relative imports **must include the `.js` extension**, e.g. `import { DatabaseModule } from './db/database.module.js'`. Omitting it breaks the build/typecheck.
- **Lint is oxlint**, not ESLint — run `pnpm lint`, do not add eslint config, use `oxlint.json`.
- **Tests are Vitest**, not Jest — no jest config; test files are `*.spec.ts` / `*.e2e-spec.ts`. `vitest/globals` types are enabled, so `describe/it/expect` are global.
- **No path aliases configured** in `tsconfig.json` (`paths` absent) — use relative imports.

## Drizzle / database

- Schema: `src/db/schema.ts` — config in `drizzle.config.ts` points here (`dialect: postgresql`).
- Migrations: generated SQL in `drizzle/` (e.g. `drizzle/0000_*.sql`). Change schema then run `pnpm db:generate`.
- Tables: `mountains`, `mountain_images` (`uuid` PKs, `created_at/updated_at` as `bigint` mode `number`, `created_by/updated_by` defaulting to `admin`).
- DB access via `databaseProvider` (injection token `DATABASE`) in `src/db/database.provider.ts`; `DatabaseModule` is `@Global()`.
- Env: only `DATABASE_URL` in `.env.example`. Never commit real `.env*`.

## Repo conventions

- **Commit messages**: Conventional Commits, imperative mood, lowercase type+subject, no trailing period, header ≤150 chars — see `.github/commit-instructions.md`.
- **Reference skills** in `.agents/skills/` for architecture/patterns: `nestjs-best-practices` (NestJS design, DI, DTOs) and `drizzle-orm-expert` (schema/relations/migrations).
- README is a stock NestJS starter — not a source of project-specific truth.
