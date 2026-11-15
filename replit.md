# Kids Learning

A parent-facing mobile MVP for creating an account and saving child profiles. AI learning features are deferred.

## Run & Operate

- Run the mobile and API services through their managed workflows: `artifacts/kids-learning: expo` and `artifacts/api-server: API Server`.
- `pnpm --filter @workspace/kids-learning run typecheck` — mobile TypeScript check
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Expo SDK 58, React Native 0.88, TypeScript
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Parent authentication: Replit-managed Clerk with custom Expo screens
- Build: Metro for mobile, esbuild for API

## Where things live

- `docs/design.md` — requirements, user-approved decisions, and unapproved proposals
- `artifacts/kids-learning/` — Expo mobile app
- `artifacts/api-server/src/routes/children.ts` — private profile API
- `lib/db/src/schema/children.ts` — profile storage
- `lib/api-spec/openapi.yaml` — API contracts; regenerate clients after changes

## Architecture decisions

- Keep this MVP limited to parent accounts and child profiles. Do not implement AI, planning, assessments, lessons, rewards, or progress until requested.
- Preserve parent privacy: derive profile ownership from verified authentication, never client-submitted owner identifiers.
- Collect age buckets, not exact birthdays; do not add children's photos or other personal fields without the user's direction.

## Product

- Parent email/password sign-up with email-code verification, or Google sign-in.
- Child profiles contain nickname, age bucket (3–5, 6–8, 9–12), default language, and country of residence.
- User-approved visual direction: simple and calm.

## User preferences

- Work only step by step. The user makes all design decisions.
- Maintain requirements, approved decisions, suggestions, and open questions in `docs/design.md` as the discussion progresses.
- Do not treat assistant suggestions as approved decisions or start development without the user's direction.

## Gotchas

- Keep the `create-launch login` step when modifying the mobile dev command.
- Clerk's development keys and development-mode notices are expected.
- Mobile API calls use Clerk bearer tokens through the shared generated client's token getter; clear cached private data when the signed-in parent changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
