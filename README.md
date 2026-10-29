# Sushi Shop

**Live demo: [sushi-shop-jet.vercel.app](https://sushi-shop-jet.vercel.app/)**

A full-stack sushi ordering application: a Next.js storefront backed by a NestJS REST API and a PostgreSQL database,
deployed as a single Vercel project with two services under one domain. It is a portfolio project in active
development: the catalog, product pages and cart are fully working against the real API, while order submission is
not implemented yet (see [Project status](#project-status)).

## Features

- **Catalog from PostgreSQL** served through a REST API (NestJS + Prisma). Categories, category filtering and
  cursor-based pagination with a "Show more" button (48 products in the demo data).
- **Product pages** with details, nutrition values and related products.
- **Shopping cart** in a header drawer: quantity changes, item removal, persistence in `localStorage`. On load and
  before checkout the cart re-checks current prices and availability through the API, so stale prices or removed
  products never silently end up in the total.
- **Checkout form** built with React Hook Form and Zod: field validation, delivery (pickup / courier) and payment
  (cash / card on delivery) selection, address fields that depend on the delivery method, and a live total including
  the delivery fee. The checkout currently runs in a **demo mode**: it validates the form but does not send orders.
- **Money handled in KZT** (Kazakhstani tenge, `₸`). Amounts are stored as integers in minor units (1 ₸ = 100 tiyn)
  in PostgreSQL and in the API, and converted to tenge in a single place on the frontend, which avoids rounding errors.
- **Resilient UI**: loading skeletons, error boundary, custom 404 page, explicit states for an unreachable API,
  unavailable products and empty results.
- **Responsive layouts** for mobile, tablet and desktop, semantic HTML and accessible interactive elements (the cart
  is a native `<dialog>`).
- **Tested**: 280+ frontend unit/component tests (Vitest, React Testing Library) and 150+ backend unit and API
  end-to-end tests running against a real PostgreSQL test database.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16 (App Router, Server Components, Cache Components), React 19, TypeScript, Tailwind CSS v4, React Hook Form, Zod |
| Backend | NestJS 12, Prisma 7 (`@prisma/adapter-pg`), PostgreSQL, TypeScript (ESM) |
| Database | PostgreSQL 18 — local Docker Compose, [Neon](https://neon.com) in production |
| Testing | Vitest, React Testing Library, Supertest API e2e tests |
| Tooling | pnpm workspaces (monorepo), ESLint, oxlint, Docker Compose |
| Deployment | Vercel Services (Next.js + NestJS in one project and domain), Neon |

## Architecture

```text
apps/
  web/    Next.js storefront
  api/    NestJS REST API + Prisma schema, migrations and seed data
```

```text
Browser ──► /            ──► web (Next.js)
        └─► /api/*       ──► api (NestJS) ──► PostgreSQL (Neon)
web (server components) ──► api, through a Vercel Service Binding
```

- Server Components fetch catalog data from the API on the server; Client Components are used only where interactivity
  is needed (cart, filters, checkout form).
- The browser calls the API on the same origin (`/api`), so no CORS is needed in production. Locally the API runs on
  a separate port and CORS is limited to the configured frontend origin and `GET`/`HEAD`.
- The API is read-only for now: `GET /categories`, `GET /products` (cursor pagination), `GET /products/:slug`,
  `GET /products/:slug/related`, `GET /products/by-ids` (cart price check). Responses are validated on the frontend
  with Zod schemas.
- Business logic (cart totals, delivery fee, money conversion, API mapping) lives in plain TypeScript modules, separate
  from presentation components.
- The database schema already contains order models (with CHECK constraints for money and address rules), prepared for
  the order flow described below.

## Project status

**Implemented**

- Homepage, catalog, product pages, about page, custom 404.
- Catalog API with filtering and cursor pagination; real data from PostgreSQL.
- Cart with price/availability re-validation; checkout form with validation.
- Vercel Services deployment (Next.js + NestJS under one domain) with Neon.
- KZT money model, versioned Prisma migrations, repeatable seed scripts.

**In development**

- Server-side order creation and storage (endpoint, validation and price recalculation on the server).
- A complete checkout flow with an order result page.
- Test payment integration.

**Known limitations**

- Checkout does not submit orders: after the form validates, a notice says it works in demo mode, and the cart is kept.
- The promo-code field is shown but inactive, and "pay by card on the website" is not offered yet.
- Next.js image optimization is temporarily disabled (`images.unoptimized`), because `/_next/image` does not work under
  Vercel Services Beta yet; images are served as-is.
- Authentication and an admin area are out of scope for the MVP.

## Running locally

Requirements: Node.js 24, pnpm 12 (pinned via `packageManager`, enable with Corepack), Docker (for PostgreSQL).

```bash
pnpm install
```

Copy the env examples (no secrets are committed):

- root `.env.example` → `.env` (database, API, `WEB_ORIGINS` — the frontend origin allowed by CORS);
- `apps/web/.env.example` → `apps/web/.env.local` (`API_URL` for server requests, `NEXT_PUBLIC_API_URL` for the
  browser; the public one ends up in the client bundle, so never put secrets in it).

Start PostgreSQL, apply migrations, seed the catalog and run both apps:

```bash
pnpm db:up                          # PostgreSQL in Docker
pnpm --filter api db:deploy         # apply Prisma migrations
pnpm --filter api db:seed           # 8 base products and categories
pnpm dev                            # web on :3000, api on :3001
```

Other commands:

```bash
pnpm dev:web                        # frontend only
pnpm dev:api                        # backend only
pnpm --filter api db:seed:demo      # add 40 demo products (ids start with `demo-`) to try pagination
pnpm --filter api db:clean:demo     # remove only the demo products
```

### Checks

```bash
pnpm --filter web lint && pnpm --filter web test
pnpm --filter api lint && pnpm --filter api test
pnpm --filter api test:e2e          # needs the local PostgreSQL; uses a separate `*_test` database
pnpm --filter web build && pnpm --filter api build
```

## Data and currency

Prices in the seed data are whole tenge and are stored in minor units (`priceMinorUnits`, 4 500 ₸ = `450000`). Seed
scripts are idempotent (upserts) and never run automatically on deployment. The database safeguards (CHECK
constraints) are described in `apps/api/prisma/schema.prisma`.

## Deployment (Vercel Services)

The site is **one Vercel project with two services** (see [`vercel.json`](vercel.json)): `web` (`apps/web`, Next.js)
and `api` (`apps/api`, NestJS), sharing one public domain. Vercel Services does not strip the `/api` prefix, so on
Vercel the API serves its routes under `/api` (`API_PREFIX=/api`); locally nothing changes and it serves `/products`
on `http://localhost:3001`.

Notes from running NestJS on Vercel Services:

- `apps/api/src/main.ts` must not `await` the app bootstrap at the top level: on Vercel Services `app.listen()` never
  resolves, so a top-level `await` would stop the function from ever serving requests.
- The `api` service builds with `pnpm build` (`prisma generate` + `nest build`) and sets `outputDirectory: "."`,
  a workaround for an ESM packaging issue in Vercel Services Beta
  ([vercel/vercel#17651](https://github.com/vercel/vercel/issues/17651)).

**Environment variables** (Vercel project settings, Production and Preview)

| Variable | Value | Used by |
| --- | --- | --- |
| `DATABASE_URL` | Neon connection string with `sslmode=require` (the *pooled* host is recommended for serverless) | `api`; also needed at build time for `prisma generate` |
| `API_PREFIX` | `/api` | `api` (route prefix) and `web` (server requests) |
| `NEXT_PUBLIC_API_URL` | `/api` | `web` browser code (same origin, no CORS); baked in at build time |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | build (uses the pinned `pnpm@12.11.2`) |

`API_URL` is provided by the **Service Binding** declared in `vercel.json` (do not set it by hand). It exists only at
runtime, so product pages that cannot be pre-rendered at build time are rendered on the first request and then cached.
`WEB_ORIGINS` and `POSTGRES_*` are not needed on Vercel. Real connection strings live only in Vercel settings and in a
local `.env`; they are never committed.

**Database (Neon).** Migrations and seeds are run manually, never as part of a deployment:

```bash
DATABASE_URL=<direct, non-pooled url> pnpm --filter api db:deploy   # migrations
DATABASE_URL=<direct, non-pooled url> pnpm --filter api db:seed     # base catalog (upsert)
DATABASE_URL=<direct, non-pooled url> pnpm --filter api db:seed:demo   # optional: 40 demo products
```

**After a deploy**, check the API and then the site (replace `<domain>`):

```bash
curl https://<domain>/api/categories
curl "https://<domain>/api/products?limit=2"
```

Then open `/`, `/catalog` ("Show more"), a product page and the cart. Preview deployments use the same settings: the
browser calls `/api` on the preview's own domain and the server reaches that preview's API through the binding.

## Development workflow

Claude Code is used selectively to speed up routine implementation, refactoring and debugging work, for example
tracing the Vercel Services startup issue through build output and runtime logs.

I remain responsible for the engineering decisions and the final result: I define the task and constraints, review
generated diffs and source code, verify that changes fit the existing architecture, run tests, lint and build checks,
test the UI and behaviour manually, and iterate when needed. Project rules for the assistant live in
[`CLAUDE.md`](CLAUDE.md).

AI assistance is treated as a productivity tool rather than a substitute for understanding, review or ownership of
the codebase.
