# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LawMitran is a legal marketplace for India (lawyer discovery + lead generation + legal document marketplace) — lead-generation model, not consultation-booking: a client submits a legal requirement, it routes to verified eligible lawyers as a lead, and the lawyer contacts the client directly. There is no in-app scheduling.

The repo is an npm workspace with two apps:

- `backend` — NestJS + Prisma + PostgreSQL API. Implemented modules: `auth`, `users`, `lawyers`, `leads`, `subscriptions`, `ratings`, `seo`, `prisma`. Still empty `@Module({})` stubs: `admin`, `ai-intake`, `documents`.
- `frontend` — Next.js (App Router, React 19, Tailwind 4, TanStack Query, react-hook-form + zod, Zustand). Pages exist for all modules (public search/profile/SEO landings, auth, client & lawyer dashboards, onboarding, plans, settings, notifications, admin console) and are styled to the brand design system ported from `sample-ui/`.

`sample-ui/` holds static HTML design prototypes (see `sample-ui/README.md`) — they are the design reference for frontend work, not shipped code.

 ## Development Principles

- Always design for scalability.
- Prefer generic, reusable database models over profession-specific tables.
- Keep the platform modular so new professional types can be added without architectural changes.
- Prioritize SEO in every feature by generating clean URLs, metadata, structured data, and internal linking.
- Design APIs to serve both the web application and future React Native mobile app.
- Build AI features using structured workflows (questionnaire → JSON → template engine) instead of relying solely on free-form LLM output.
- Keep UI modern, minimal, professional, and trustworthy, avoiding clutter and unnecessary complexity.

## Commands

Run from the repo root unless noted.

```bash
npm run dev:backend          # nest start --watch (backend, port from .env / 3001)
npm run dev:frontend         # next dev (frontend, port 3000)
npm run build:backend
npm run build:frontend

# Frontend (run from frontend/, or via --workspace frontend)
npm run lint --workspace frontend       # eslint
npx tsc --noEmit                        # typecheck (from frontend/)

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

## Frontend architecture

**Route groups** (`frontend/app/`): `(public)` — SEO-facing search (`/lawyers` map+list), profile (`/lawyer/[slug]`), city×practice landings (`/lawyers/[city]/[area]`); `(auth)` — login/signup/verify-otp/forgot/reset with a shared split-panel layout; `(dashboard)` — client & lawyer dashboards, `/onboarding`, plan, settings, notifications (client-side JWT gate in the layout); `(admin)` — approvals/users/plans/offers/moderation behind the navy sidebar layout.

**Design system**: brand tokens live in `app/globals.css` (`@theme` → `bg-navy`, `text-gold`, `bg-bg-soft`, `border-line`, etc.) with Inter loaded in the root layout; `.hero-gradient` is the shared navy gradient. Icons come from `components/ui/Icon.tsx` (inline SVG set, `<Icon name="star" />`, aria-hidden by default) — **do not add icon font/library dependencies**. Shared chrome: `components/site/` (`SiteHeader`, `SiteFooter`, `DashboardNav`, `AdminPageHeader`). The visual reference is `sample-ui/*.html`; match it when building new pages.

**Data layer**: typed fetchers in `lib/api/*` (`authFetch` attaches the bearer token from `localStorage` and redirects to `/login` on 401); TanStack Query for server state; Zustand (`stores/lawyerSearchStore.ts`) for search filter/map state; forms use react-hook-form + zod resolvers.

**Conventions**: layouts own the single `<main id="main">` landmark (pages render `<div>` roots — no nested mains); keep the accessibility patterns (labelled inputs, `role="alert"`/`"status"` on errors/loaders, `aria-current` nav, dialog semantics on modals); public pages stay server components with `generateMetadata` + JSON-LD for SEO.
