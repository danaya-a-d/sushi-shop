# Sushi Shop — Claude Code Instructions

## Project overview

This is a portfolio-oriented full-stack sushi ordering application.

The goal is to build a realistic, maintainable MVP while keeping the scope manageable.

## Technology stack

- Monorepo: pnpm workspaces
- Frontend: Next.js 16, React, TypeScript, App Router, Tailwind CSS
- Backend: NestJS 12, TypeScript
- Database: PostgreSQL (planned)
- Package manager: pnpm

## Repository structure

- `apps/web` — frontend
- `apps/api` — backend
- `packages` — shared packages, only when needed

## Frontend routes

- `/` — homepage
- `/catalog` — product catalog
- `/products/[slug]` — individual product page
- `/cart` — shopping cart
- `/checkout` — checkout
- `/order/result` — order result

Do not introduce additional pages without discussing them first.

## Architecture guidelines

- Follow Next.js App Router conventions.
- Prefer Server Components by default.
- Use Client Components only when client-side interactivity is required.
- Use strict TypeScript typing.
- Avoid `any` unless explicitly justified.
- Keep components small, reusable and focused.
- Avoid unnecessary abstractions, dependencies and premature optimization.
- Keep business logic separate from presentation components.
- Use semantic HTML and accessible interactive elements.
- Support responsive layouts.
- Respect existing ESLint and TypeScript configurations.

## Development workflow

- Inspect relevant files before making changes.
- Explain significant architectural decisions.
- Prefer small, focused changes.
- Do not modify unrelated files.
- Do not install new dependencies without approval.
- Do not change package manager versions or project configuration without approval.
- Do not run destructive commands.
- Do not create Git commits unless explicitly requested.
- Run relevant checks after implementing changes.
- Report modified files, checks performed and remaining limitations.

## Frontend implementation

The UI will be implemented using an existing design reference.

- Preserve the visual direction of the reference.
- Do not invent a new design system without approval.
- Extract reusable components where appropriate.
- Use mock product data until the backend integration stage.
- Keep mock data separate from UI components.
- Do not implement checkout, payment or backend integrations during the initial UI phase.
- Treat missing design screens as opportunities to extend the established visual language consistently.

## Scope control

The MVP includes:

1. Homepage
2. Catalog
3. Product detail
4. Shopping cart
5. Checkout
6. Order result

Later phases will include PostgreSQL integration, order processing and test payment functionality.

## Communication

- Communicate with the developer in Russian.
- Keep code identifiers and technical naming conventions in English.
- Ask for clarification when requirements are ambiguous.
- Present a brief implementation plan before substantial changes.
- Wait for approval before implementing large changes.