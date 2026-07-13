# Multi-Tenant Academic Lab Website Platform

A single, reusable Next.js codebase that any academic research lab can deploy
as their own instance to run a professional lab website — Home, Research,
People, Publications, News, Funding, Gallery, Contact — with a simple admin
panel for non-technical Admins and Editors to manage content. Every tenant
("lab") runs its own deployment of the same codebase, but all deployments
share one PostgreSQL database, with every row scoped by `tenant_id`.

## Architecture

- **Clean Architecture + Repository Pattern.** `src/domain` (entities, value
  objects, repository interfaces) has zero framework imports.
  `src/application` (use cases) orchestrates domain + repositories.
  `src/infrastructure` (Postgres repositories, Auth.js config, S3 storage)
  implements the interfaces. `src/app` (Next.js App Router) is the only layer
  that "knows" it's a web app — every route/server action calls a use case,
  never the database directly.
- **Tenant resolution via `TENANT_ID` env var**, not subdomain/DNS. Every
  deployment reads its own tenant id at boot and every repository query is
  scoped to it, in addition to Postgres Row-Level Security as defense in
  depth (see `src/infrastructure/db/migrations/*row-level-security*`).
- **One shared Postgres database, one shared S3-compatible bucket** across
  every tenant deployment, with objects keyed under `<tenant_id>/...`.

See the implementation instructions this project was built from for the full
rationale (data model, RBAC table, review workflow, testing strategy).

## Environment variables

Copy `.env.example` to `.env` and fill in every value — `src/lib/env.ts`
validates all of these at boot with Zod and fails fast if any are missing.

| Variable | Description |
|---|---|
| `TENANT_ID` | This deployment's tenant UUID (printed by `npm run provision-tenant`) |
| `DATABASE_URL` | Shared Postgres connection string. **Must be a non-superuser role** in production — a superuser connection silently bypasses Row-Level Security |
| `NEXTAUTH_SECRET` | Random secret for Auth.js session encryption (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | This deployment's public URL |
| `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | S3-compatible object storage credentials (AWS S3, Cloudflare R2, or MinIO for self-hosting) |
| `STORAGE_FORCE_PATH_STYLE` | `true` for MinIO/most self-hosted S3-compatible servers, `false` for AWS S3 |
| `STORAGE_PUBLIC_BASE_URL` | Public base URL uploaded files are served from |

## Local development

Prerequisites: Node 20+, a Postgres 16 instance, and an S3-compatible storage
endpoint (MinIO works well locally).

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, storage credentials, etc.
npm run migrate:up          # applies every migration in src/infrastructure/db/migrations
npm run provision-tenant    # creates a tenant + first Admin; paste the printed
                             # TENANT_ID into .env, then visit /setup to finish
npm run dev
```

For a quick working instance without going through the wizard by hand, use
the demo seed script instead of `provision-tenant` — it provisions a tenant,
completes `/setup` programmatically, and adds a few pieces of demo content:

```bash
npm run seed-demo-tenant     # prints TENANT_ID=<uuid> — paste into .env
```

## Testing

```bash
npm run test:unit          # domain + application + lib, mocked repositories
npm run test:coverage      # same, with coverage (85% threshold, see vitest.config.ts)
npm run test:integration   # real Postgres — see below
npm run test:e2e           # Playwright against a real running instance
npm run test:all           # all three, in order
```

Integration tests need a disposable Postgres instance (never point them at a
shared dev/prod database):

```bash
cp .env.test.example .env.test   # point DATABASE_URL at a throwaway database
npm run migrate:up               # against that same DATABASE_URL
npm run test:integration
```

E2E tests need a fully running instance (built app + Postgres + S3-compatible
storage) and a seeded tenant to log into:

```bash
npm run migrate:up
npm run seed-demo-tenant          # writes .e2e-seed.json, which the suite reads
npm run test:e2e                  # builds and starts the app itself (playwright.config.ts)
```

`.github/workflows/ci.yml` runs all of this on every push/PR: lint + typecheck,
unit tests with coverage, integration tests against a Postgres service
container, and E2E tests against Postgres + a real MinIO container.

## Provisioning a new tenant

Manual provisioning only in this version (no self-serve signup). The platform
operator runs:

```bash
npm run provision-tenant -- --lab-name="Tang Polymer Lab" --slug=tangpolymer \
  --university="State University" --admin-email=pi@tangpolymer.edu --admin-name="Dr. Tang"
```

(Omit any flag to be prompted for it interactively.) This creates the tenant
row, a default `site_settings` row, and the first Admin account with a
random temporary password — printed once, never stored in plaintext. Paste
the printed `.env` block into the new deployment's environment, deploy it,
and have the Admin log in and reset their password; they'll land on `/setup`
to confirm branding before the site goes live to the public.

## Deploying an update to an existing tenant

Every tenant deployment runs the same codebase. To ship a fix or feature to
all of them:

1. Merge the change to `main` (see the PR workflow below).
2. Each tenant's deployment pulls the new `main` (or a tagged release) and
   redeploys — `git pull && npm ci && npm run build && npm run start`, or the
   equivalent for your hosting platform (redeploy from the connected Git
   branch on Render/Railway/Fly, rebuild the Docker image, etc.).
3. Run `npm run migrate:up` against the shared `DATABASE_URL` **once**,
   centrally — not per deployment — since every tenant shares one database.
   Do this before or as part of rolling out a release that depends on the
   new schema.

Never hand-edit the schema in production; every change goes through a
migration in `src/infrastructure/db/migrations/`.

## Exporting a tenant's data

For a lab leaving the platform, or as a backup:

```bash
npm run export-tenant -- --slug=tangpolymer
# or: npm run export-tenant -- --tenant-id=<uuid>
```

Produces `exports/<slug>-export-<timestamp>.tar.gz` containing `data.json`
(every row across every tenant-scoped table) and `files/` (every object
under that tenant's storage prefix, mirroring the same `<tenant_id>/...`
key structure).

## Query performance

`scripts/seed-load-test.ts` seeds a realistically sized dataset (thousands of
publications/news/posts, plus enough filler tenants to make the shared
users/members tables realistically large), and
`scripts/explain-query-plans.ts` runs `EXPLAIN ANALYZE` against every
hot-path query and fails if any of them falls back to a sequential scan:

```bash
npm run seed-load-test                      # prints TENANT_ID=<uuid>
TENANT_ID=<uuid> npm run explain-query-plans
```

## Contributing: the PR workflow

All development happens on feature branches off `main` (or in this project's
case, `development`), opened as a PR, merged only after CI is green:

```bash
git checkout -b feat/short-description
# ... make changes, commit ...
git push -u origin feat/short-description
gh pr create --title "Short description" --base main
gh pr checks --watch     # block on CI — a red check is a hard stop, fix and re-push
gh pr merge --squash --auto
```

Branch protection on `main` requires the `ci` status check to pass and
requires PRs (no direct pushes). Never bypass a failing required check with
`--admin`/force-merge flags.

## Project structure

```
/src
  /domain            entities, value objects, repository interfaces — no framework imports
  /application       use cases (RBAC check → validate → repository call)
  /infrastructure    Postgres repositories, Auth.js config, S3 storage, DB client
  /app               Next.js App Router: (public) site, (admin) panel, API routes
  /lib               cross-cutting: tenant context, session, RBAC, env validation
  /components        presentational UI, no direct DB access
/scripts             provision-tenant, seed-demo-tenant, seed-load-test,
                     explain-query-plans, export-tenant
/tests/fixtures      shared mock-data factories used by unit/integration tests
/tests/integration   Postgres-backed repository/isolation tests
/e2e                 Playwright end-to-end specs
```

## Open decisions (see the implementation instructions, Section 17)

- Editor content ownership for published content: an Editor may edit but not
  delete their own already-published content — configurable via a single
  flag in `src/lib/rbac.ts` (`EDITOR_CAN_DELETE_OWN_PUBLISHED_CONTENT`).
- Authentication is credentials-only for now; `src/infrastructure/auth/authOptions.ts`
  isolates all provider config so magic-link or university SSO can be added
  later without touching the rest of the app.
- Storage is one shared bucket with tenant-prefixed keys, not a bucket per
  tenant.
