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

## AI-Assisted Development

Claude Code is used as part of the development workflow for selected implementation and refactoring tasks.

The workflow includes:
- providing project context and requirements;
- decomposing tasks before implementation;
- reviewing generated diffs and source code;
- running tests, lint and build checks;
- manually validating the resulting behaviour;
- iterating on implementation when necessary.

AI-generated changes are treated as code that requires the same review and verification as manually written code.

## Running Locally

Requirements:

- Node.js
- pnpm

Install dependencies:

```bash
pnpm install
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

## Status

🚧 MVP in active development.
