# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LawMitran is a legal marketplace for India (lawyer discovery + lead generation + legal document marketplace) — lead-generation model, not consultation-booking: a client submits a legal requirement, it routes to verified eligible lawyers as a lead, and the lawyer contacts the client directly. There is no in-app scheduling.

The repo is an npm workspace (`backend`, `frontend`) but **only `backend` exists today**; `frontend` (Next.js, App Router) has not been scaffolded yet. The backend is a NestJS + Prisma + PostgreSQL API, currently mostly scaffolding: most feature modules (`admin`, `ai-intake`, `documents`, `lawyers`, `leads`, `subscriptions`, `users`) are empty `@Module({})` stubs. Only `auth` and `prisma` have real implementations.

## Commands

Run from the repo root unless noted.

```bash
npm run dev:backend          # nest start --watch (backend, port from .env / 3001)
npm run dev:frontend         # once frontend workspace exists
npm run build:backend
npm run build:frontend

# Infra (Postgres, Redis, MinIO, backend, frontend, nginx)
docker compose up -d

# Backend (run from backend/, or via --workspace backend)
npm run start:dev --workspace backend   # watch mode
npm run lint --workspace backend        # eslint --fix
npm run format --workspace backend      # prettier
npm run test --workspace backend        # jest unit tests
npm run test --workspace backend -- app.controller.spec    # single test file
npm run test:e2e --workspace backend    # jest-e2e against test/jest-e2e.json
npm run test:cov --workspace backend

# Prisma (run from backend/)
npx prisma migrate dev      # apply schema changes, generate client
npx prisma studio
npx prisma generate
```

Jest config lives inline in `backend/package.json` (`rootDir: src`, pattern `*.spec.ts`); e2e config is separate in `backend/test/jest-e2e.json`.

## Architecture

**Auth & guards (global, applied to every route by default):** `AppModule` registers `JwtAuthGuard` and `RolesGuard` as global `APP_GUARD`s (`backend/src/app.module.ts`). This means every endpoint requires a valid JWT and passes role checks unless explicitly opted out:
- `@Public()` (`common/decorators/public.decorator.ts`) bypasses `JwtAuthGuard` via reflected metadata.
- `@Roles(Role.ADMIN, ...)` (`common/decorators/roles.decorator.ts`) restricts to listed roles; `RolesGuard` allows through if no roles are specified.
- `@CurrentUser()` reads the authenticated user off the request (populated by `JwtStrategy`).

New controllers don't need to wire guards themselves — just mark public routes with `@Public()` and gate role-specific ones with `@Roles()`.

**Auth flow** (`modules/auth`): registration rejects self-registered `ADMIN` role. Access/refresh tokens are separate JWTs signed with different secrets (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, configurable expiry via env). Refresh tokens are persisted as SHA-256 hashes in the `RefreshToken` table (never the raw token) and are single-use — `refresh()` revokes the stored token before issuing a new pair. `logout()` revokes by re-hashing the presented refresh token.

**Prisma** (`schema.prisma`): central domain model:
- `User` (role: `CLIENT | LAWYER | ADMIN`) — `Lawyer` is an optional 1:1 extension of a `User` with role `LAWYER`.
- `Lawyer` carries both verification (`verificationStatus`: `PENDING → UNDER_REVIEW → APPROVED/REJECTED/SUSPENDED`, with bar council cert/ID upload URLs) and subscription (`subscriptionStatus`: `TRIAL → ACTIVE/EXPIRED/CANCELLED`, with `trialEndDate`) state directly on the model.
- `Verification` is the append-only review trail for a lawyer's submitted documents; `Subscription` is the billing history.
- `Lead` connects a `User` (client) to a `Lawyer`, with its own lifecycle (`NEW → CONTACTED → CLOSED`) independent of the lawyer's verification/subscription state.

**Key business rules to enforce in new code** (not yet implemented in stubs, but required when filling in `lawyers`/`leads` modules):
- Only `Lawyer`s with `verificationStatus = APPROVED` may appear in public lawyer search.
- Lead routing must exclude lawyers with `subscriptionStatus = EXPIRED` (their profile stays visible in search, but they stop receiving new leads).
- Public lawyer search/profile/document-marketplace browsing should remain unauthenticated for SEO; only lead submission and document purchase require login — use `@Public()` accordingly on those controllers.

**Storage**: file uploads (bar council certificates, ID cards, documents) go to MinIO in dev / S3 in prod via `@aws-sdk/client-s3`, configured through `S3_*` env vars (`S3_FORCE_PATH_STYLE=true` for MinIO compatibility).

**API conventions**: global prefix `/api`, Swagger UI at `/api/docs`, global `ValidationPipe({ whitelist: true, transform: true })` — DTOs must use `class-validator`/`class-transformer` decorators since unknown properties are stripped and types are coerced.
