# Fiswarm

A full‑stack TypeScript application with a React client, Node.js server, and shared utilities.

## Project Overview

Fiswarm is a full‑stack TypeScript application with:

- **Client**: React (Vite, Tailwind CSS, wouter, Radix UI, Recharts)
- **Server**: Node.js (Express, tRPC, Drizzle ORM, MySQL)
- **Shared**: Common constants, types, utilities

## Build / Lint / Test Commands

- `pnpm install` – install dependencies (pnpm v10.4.1)
- `pnpm run dev` – start dev server with hot‑reload
- `pnpm run build` – build client (Vite) and server (esbuild)
- `pnpm run start` – run production build
- `pnpm run check` – TypeScript type checking (`tsc --noEmit`)
- `pnpm run format` – format code with Prettier
- `pnpm run test` – run all tests via `vitest run`
- `pnpm run db:push` – generate and apply Drizzle migrations

**Running a single test**:

```bash
npx vitest run server/path/to/file.test.ts   # by file
npx vitest run -t "test name"                # by name
```

## Code Style Guidelines

### General

- **TypeScript**: Strict mode enabled (`tsconfig.json`).
- **Formatting**: Prettier with config in `.prettierrc` (semi, double quotes, 2‑space indent, trailing commas ES5).
- **No linter**: Relies on TypeScript compiler and Prettier.

### Imports

- Use path aliases:
  - `@/` → `client/src/`
  - `@shared/` → `shared/`
- Prefer named exports over default exports.
- Group imports: external packages first, then internal aliases, then relative.

### Naming

- **Components/Types**: PascalCase (`UserCard`, `TransactionProps`).
- **Functions/Variables**: camelCase (`getUser`, `isAuthenticated`).
- **Constants**: UPPER_SNAKE_CASE (`API_TIMEOUT`).
- **Files**:
  - Components: `PascalCase.tsx`
  - Utilities: `camelCase.ts`
  - Tests: `*.test.ts` or `*.spec.ts`

### Types & Validation

- Use Zod for runtime validation (especially for tRPC input/output).
- Prefer interfaces for object shapes; type aliases for unions/intersections.
- Export types when they are used across modules.

### Error Handling

- Use try‑catch for async operations; log errors with context.
- For tRPC procedures, throw `TRPCError` with appropriate code (`BAD_REQUEST`, `UNAUTHORIZED`, etc.).
- Never expose internal error messages to the client; return safe defaults.

### React Patterns

- Functional components with hooks.
- Use `React.memo` only when necessary.
- Prefer `useCallback`/`useMemo` for performance‑critical code.
- State management: React Query (server state), Context (UI state).

### Server Patterns

- tRPC routers defined in `server/routers.ts`.
- Database access via Drizzle ORM (`server/db.ts`).
- Business logic separated into helper functions.
- Use environment variables for secrets (`.env` files are ignored by Git).

### Testing

- Tests are colocated with the code they test (e.g., `server/akunfish.test.ts`).
- Use Vitest with `describe`/`it`/`expect`.
- Mock external dependencies (DB, LLM) with `vi.mock`.
- Keep tests focused; one assertion per behavior.

### Documentation

- No inline comments unless explaining complex algorithms.
- Use JSDoc for public APIs and exported functions.

## Project Structure

The project is organized into three main directories:

- `client/src/`: React frontend with components, pages, hooks, and contexts.
- `server/`: Node.js backend with tRPC routers, Drizzle ORM, and tests (colocated as `*.test.ts`).
- `shared/`: Common constants and utilities used across client and server.

## Important Notes

- **Package Manager**: pnpm (v10.4.1). Do not use npm/yarn.
- **Environment**: Copy `.env.example` to `.env` for local development.
- **Patches**: Some dependencies are patched via `patches/` (see `pnpm.patchedDependencies`).
- **UI Components**: Follow the design system (dark theme, teal primary, no gradients/emoji).

## When Making Changes

1. **Run type check** after modifying TypeScript files.
2. **Format code** before committing (`pnpm run format`).
3. **Add/update tests** for new functionality.
4. **Keep the database schema in sync** by running `pnpm run db:push` after schema changes.
5. **Verify the app starts** (`pnpm run dev`) and **builds** (`pnpm run build`).
