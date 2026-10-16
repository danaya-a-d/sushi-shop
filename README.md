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
