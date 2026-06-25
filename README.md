# LawMitran

LawMitran is a legal marketplace for India: lawyer discovery, lead generation, and a legal document marketplace. It is a **lead-generation** platform, not a consultation-booking one — a client submits a legal requirement, it routes to verified, eligible lawyers as a lead, and the lawyer contacts the client directly. There is no in-app scheduling.

## Repo layout

This is an npm workspace with two packages:

- `backend` — NestJS + Prisma + PostgreSQL API. Implemented.
- `frontend` — Next.js (App Router). Not scaffolded yet.

## Stack

- **Backend**: NestJS, Prisma, PostgreSQL
- **Cache/queues**: Redis
- **File storage**: MinIO (dev) / AWS S3 (prod) via `@aws-sdk/client-s3`
- **Payments**: Razorpay
- **Auth**: JWT (access + refresh), Passport
- **Infra**: Docker Compose (Postgres, Redis, MinIO, backend, frontend, nginx)

## Backend modules

- `auth` — register/login, JWT access + refresh tokens, email/mobile OTP verification, reCAPTCHA
- `lawyers` — profile creation/update, admin review/approval, public search
- `leads` — lead submission and status lifecycle (`NEW → CONTACTED → CLOSED`)
- `subscriptions` — trial/plan activation, Razorpay payment verification
- `ratings` — lawyer ratings
- `users`, `documents`, `admin`, `ai-intake` — scaffolded, not yet implemented

Cross-cutting (`src/common`): storage (S3/MinIO), mail, SMS, WhatsApp, payments (Razorpay), e-sign, e-stamp, reCAPTCHA, rate limiting, request sanitization, security headers.

## Key business rules

- Only lawyers with `verificationStatus = APPROVED` appear in public search.
- Lead routing excludes lawyers with `subscriptionStatus = EXPIRED` (their profile stays visible, but they stop receiving new leads).
- Public lawyer search/profile/document browsing is unauthenticated for SEO; only lead submission and document purchase require login.

## Getting started

```bash
# install dependencies
npm install

# copy env template and fill in secrets
cp .env.example .env

# start infra (Postgres, Redis, MinIO, nginx)
docker compose up -d postgres redis minio

# apply database schema
npx prisma migrate dev --schema backend/prisma/schema.prisma

# run the backend in watch mode
npm run dev:backend
```

The API is served under `/api`, with Swagger docs at `/api/docs`.

## Common commands

Run from the repo root unless noted.

```bash
npm run dev:backend          # nest start --watch (port from .env, default 3001)
npm run build:backend

# Backend (run from backend/, or via --workspace backend)
npm run start:dev --workspace backend
npm run lint --workspace backend
npm run format --workspace backend
npm run test --workspace backend
npm run test --workspace backend -- app.controller.spec   # single test file
npm run test:e2e --workspace backend
npm run test:cov --workspace backend

# Prisma (run from backend/)
npx prisma migrate dev
npx prisma studio
npx prisma generate

# Full stack via Docker
docker compose up -d
```

## Environment variables

See `.env.example` for the full list (database, Redis, S3/MinIO, JWT secrets, rate limiting, reCAPTCHA, Razorpay, frontend API base URL).

## More details

See `CLAUDE.md` for architecture notes (auth guards, Prisma domain model, storage conventions) aimed at AI coding assistants working in this repo.
