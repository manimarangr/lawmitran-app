# Contributing to LawMitran

Thanks for helping build LawMitran. This guide covers setup, workflow, and conventions. For product
context read [CLAUDE.md](./CLAUDE.md); for current state see [STATUS.md](./STATUS.md) and
[ROADMAP.md](./ROADMAP.md).

---

## Prerequisites

- Node.js (LTS) and npm
- Docker + Docker Compose (for Postgres, Redis, MinIO)

## Local setup

```bash
git clone <repo> && cd Project_new
npm install                      # installs both workspaces

# Infra (postgres, redis, minio, backend, frontend, nginx)
docker compose up -d

# Backend (from backend/)
cp .env.example .env             # fill in secrets — see below
npx prisma migrate dev           # apply schema + generate client
npx prisma generate
npm run prisma:seed
npm run start:dev --workspace backend   # http://localhost:3001/api  · docs at /api/docs

# Frontend (from repo root)
# set frontend/.env.local → NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev:frontend             # http://localhost:3000
```

Required env (backend): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `S3_*` (MinIO in
dev), Razorpay + OTP provider keys. See `.env.example`.

## Workspace layout

```
backend/    NestJS + Prisma API  (implemented)
frontend/   Next.js 16 App Router (implemented)
docs/       design docs, diagrams, status
sample-ui/  static HTML mockups — the visual reference
```

---

## Branching & commits

- Branch off `main`: `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(leads): route to eligible
  lawyers`, `fix(auth): revoke refresh token on logout`, `docs: add architecture diagrams`.
- Keep commits focused; write a clear body when the change isn't obvious.

## Pull requests

1. Rebase on the latest `main`.
2. Run lint, format, and tests before pushing (see below).
3. Describe **what** changed and **why**; link the relevant doc / roadmap item.
4. Update docs when behavior changes (esp. [26-frontend-implementation.md](./docs/26-frontend-implementation.md)
   and [STATUS.md](./STATUS.md)).
5. Include screenshots for UI changes (see [docs/screenshots.md](./docs/screenshots.md)).

## Checks

```bash
npm run lint   --workspace backend     # eslint --fix
npm run format --workspace backend     # prettier
npm run test   --workspace backend     # jest unit
npm run test:e2e --workspace backend   # e2e
npm run build  --workspace frontend    # authoritative parse/type check for the frontend
```

CI is not yet wired (see roadmap Phase 2) — run these locally until it is.

---

## Code conventions

**Backend (NestJS).** Every route is guarded by default (`JwtAuthGuard` + `RolesGuard`). Mark public
routes with `@Public()` and gate role-specific ones with `@Roles(Role.ADMIN, …)`; read the caller with
`@CurrentUser()`. DTOs **must** use `class-validator` / `class-transformer` decorators — the global
`ValidationPipe({ whitelist: true, transform: true })` strips unknown properties and coerces types.
Global prefix is `/api`; Swagger lives at `/api/docs`.

**Business rules to preserve** (enforce in new code):

- Only lawyers with `verificationStatus = APPROVED` appear in public search.
- Lead routing excludes lawyers with `subscriptionStatus = EXPIRED` (profile stays visible, but they
  stop receiving new leads).
- Public search / profile / document browsing stays **unauthenticated** for SEO; only lead submission
  and document purchase require login.
- Contact reveal is subscription-gated **server-side** (never trust the client).

**Prisma.** Change `schema.prisma`, then `npx prisma migrate dev` (creates a migration + regenerates
the client). Never hand-edit generated client code.

**Frontend (Next.js).** Use the `authFetch` + react-query pattern in `lib/api/`; forms use
`react-hook-form + zod`. Keep route groups intact (`(auth)`, `(public)`, `(dashboard)`, `(admin)`).
Prefer server components; mark client components with `'use client'` only when needed.

## Reporting issues

Open an issue with steps to reproduce, expected vs. actual, and environment. For security-sensitive
reports, contact the maintainers privately rather than filing a public issue.

---

**Related:** [CLAUDE.md](./CLAUDE.md) · [STATUS.md](./STATUS.md) · [ROADMAP.md](./ROADMAP.md) ·
[docs/architecture-diagrams.md](./docs/architecture-diagrams.md)
