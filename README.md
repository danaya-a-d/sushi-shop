# Sushi Shop

A portfolio-oriented full-stack sushi ordering application built with Next.js, React, TypeScript and NestJS.

The project is currently in active development. The frontend MVP is being implemented first, followed by backend integration, PostgreSQL persistence, order processing and test payments.

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- App Router
- Tailwind CSS
- React Hook Form
- Zod
- Vitest
- React Testing Library

### Backend
- NestJS 12
- TypeScript
- PostgreSQL — planned for the next development stage

### Tooling
- pnpm workspaces
- ESLint
- Git

## Implemented

- Homepage
- Product catalog
- Product detail pages
- About page
- Shopping cart with quantity management
- Cart drawer integrated into the header
- Checkout page
- Checkout form validation with React Hook Form and Zod
- Custom 404 page
- Responsive layouts
- Reusable UI components
- Unit/component tests

## In Progress

The next development stages include:

- NestJS API implementation
- PostgreSQL integration
- Product catalog data from the backend
- Order creation and server-side validation
- Order result flow
- Test payment integration
- Deployment

## Architecture

The repository is organized as a pnpm workspace monorepo:

```text
apps/
  web/    Next.js frontend
  api/    NestJS backend
```

The frontend follows Next.js App Router conventions and uses Server Components by default, with Client Components introduced only where client-side interactivity is required.

Business logic is kept separate from presentation components, with an emphasis on strict TypeScript typing, reusable components and maintainable code.

## Development Workflow

Claude Code is used selectively to speed up routine implementation and refactoring work.

I remain responsible for the engineering decisions and final result: I define the task and constraints, review generated diffs and source code, verify that changes fit the existing architecture, run tests/lint/build checks, test the UI and behaviour manually, and iterate when needed.

AI assistance is treated as a productivity tool rather than a substitute for understanding, review or ownership of the codebase.

## Running Locally

Requirements:

- Node.js
- pnpm

Install dependencies:

```bash
pnpm install
```

The frontend takes all catalog data from the NestJS API, so the backend and PostgreSQL must be running
(`pnpm db:up`, then `pnpm dev`). Before the first run copy the env examples:

- root `.env.example` → `.env` (database, API, `WEB_ORIGINS` — the frontend origin allowed by CORS);
- `apps/web/.env.example` → `apps/web/.env.local` (`API_URL` for server requests, `NEXT_PUBLIC_API_URL` for
  the browser cart; the public one ends up in the client bundle, so never put secrets in it).

**Currency.** The shop currency is Kazakhstani tenge (KZT, `₸`). The database and the API store money as integers
in minor units (1 ₸ = 100 tiyn) in `*MinorUnits` fields; the web app converts to tenge in one place
(`apps/web/lib/money.ts`). Seed prices are whole tenge.

The catalog is paginated (cursor-based, 12 items per page). To check pagination and the "Show more" button on a
realistic catalog, add 40 demo products (ids and slugs start with `demo-`; the base seed is not changed and the
command is idempotent), and remove them when they are no longer needed:

```bash
pnpm --filter api db:seed:demo    # 8 base + 40 demo = 48 products
pnpm --filter api db:clean:demo   # deletes only `demo-*` products
```

Run frontend and backend in development mode:

```bash
pnpm dev
```

Run the frontend only:

```bash
pnpm dev:web
```

Run the backend only:

```bash
pnpm dev:api
```

## Deployment (Vercel Services)

The site is deployed as **one Vercel project with two services** (see [`vercel.json`](vercel.json)): `web`
(`apps/web`, Next.js) and `api` (`apps/api`, NestJS). They share one public domain: `/api/*` goes to the API,
everything else to the frontend. Vercel Services does **not** strip the `/api` prefix, so on Vercel the API
serves its routes under `/api` (`/api/products`, `/api/categories`, …). Locally nothing changes: the API still
serves `/products` on `http://localhost:3001`.

**Project settings (Vercel dashboard)**

1. *Add New → Project*, import the repository, keep **Root Directory** empty (the repo root) and choose the
   **Services** framework preset (the services come from `vercel.json`).
2. Pin the package manager: add the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1`. The repo pins
   `pnpm@12.11.2` in the root `package.json` (`packageManager`), and Vercel picks it up through Corepack.
3. Node.js version: 24.x (*Settings → Build and Deployment*), as in local development.

**Environment variables** (*Settings → Environment Variables*, Production and Preview)

| Variable | Value | Used by |
| --- | --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (host contains `-pooler`), with `?sslmode=require` | `api` (runtime and build: `prisma generate` reads it from `prisma.config.ts`) |
| `API_PREFIX` | `/api` | `api` (global route prefix) and `web` (server requests) |
| `NEXT_PUBLIC_API_URL` | `/api` | `web` browser code (same origin, no CORS). Baked at build time |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | build |

Provided by **Service Bindings** (declared in `vercel.json`, do **not** set them by hand): `API_URL` — the internal
URL of the `api` service for the `web` service. It exists only at runtime, never during `next build`, so product
pages that cannot be pre-rendered at build time are rendered on the first request and then cached.

Not needed on Vercel: `WEB_ORIGINS` (frontend and API share an origin, CORS stays off), `POSTGRES_*` (Docker only).
Never commit real connection strings; they live only in Vercel project settings and in your local `.env`.

**Neon.** Use the *pooled* connection string for `DATABASE_URL` (serverless functions open many short-lived
connections). Run migrations from your machine against the *direct* (non-pooled) string, never as part of the
deploy: `DATABASE_URL=<direct url> pnpm --filter api db:deploy`. The deploy never runs migrations or seed.

**Updating an existing database to KZT** (local or Neon): apply the migration, then immediately re-run the base seed
so product prices are rewritten in tenge (the migration only renames columns and does not convert stored numbers; it
stops if orders in another currency exist). Demo products are optional:

```bash
pnpm --filter api db:deploy       # migrations
pnpm --filter api db:seed         # base prices (upsert)
pnpm --filter api db:seed:demo    # optional, re-run to update demo prices
```

**After the first deploy** (replace `<domain>` with the deployment URL):

```bash
curl https://<domain>/api/categories          # JSON array of categories (API + database)
curl "https://<domain>/api/products?limit=2"  # { "items": [...], "nextCursor": ... }
```

Then open `/`, `/catalog` (check "Show more"), a product page and the cart in the browser. Preview deployments
use the same settings: the browser calls `/api` on the preview's own domain and the server reaches that same
preview's API through the binding.

**Local development is unchanged:** `pnpm db:up`, `pnpm dev`, the existing `.env` / `apps/web/.env.local`
(`API_URL=http://localhost:3001`, `NEXT_PUBLIC_API_URL=http://localhost:3001`, no `API_PREFIX`).

## Status

🚧 MVP in active development.
