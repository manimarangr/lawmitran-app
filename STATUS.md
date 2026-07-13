# Project Status

Snapshot of what's implemented **today**. Forward-looking plan: [ROADMAP.md](./ROADMAP.md).

_Last updated: 2026-07-07_

---

## At a glance

| Area | Status |
|---|---|
| Backend auth + guards | ✅ Implemented |
| Prisma schema | ✅ Implemented |
| Users / settings / reports | ✅ Implemented |
| Lawyers (search / profile / verify) | ✅ Implemented |
| SEO (sitemap / landing / slugs) | ✅ Implemented |
| Leads module | 🟡 Partial (routing + reveal wired; some lifecycle to finish) |
| Subscriptions | 🟡 Partial (Razorpay checkout + plans wired) |
| Admin console | ✅ Implemented (approvals, users, plans, moderation) |
| Documents marketplace | 🔴 Stub |
| AI intake | 🔴 Stub |
| Frontend app | ✅ Full product surface wired to API |
| Tests / CI | 🔴 Not yet |

Legend: ✅ done · 🟡 partial · 🔴 stub / not started

---

## Backend (NestJS + Prisma)

**Implemented modules:** `auth`, `prisma`, `users` (profile, password/mobile change with OTP, avatar,
delete, notifications, reports), `seo` (sitemap feed, landing content), `lawyers` (public search /
profile-by-slug, verification review + slug generation), plus admin endpoints for reports and users.

**Partial:** `leads` (routing excludes unverified / expired-subscription lawyers; contact reveal is
subscription-gated) and `subscriptions` (Razorpay checkout + verify, admin plan pricing + lead caps).

**Stubs (empty `@Module({})`):** `documents`, `ai-intake`.

**Schema highlights:** `User` (role, `status`, `pendingMobile`, `avatarUrl`, `deletedAt`), `Lawyer`
(`slug`, verification + subscription state), `Lead`, `Verification`, `Subscription`, `Report`,
`LandingContent`, `RefreshToken`. Enums: `UserStatus`, `ReportStatus`, plus role / verification /
subscription / lead enums.

> Local DB steps required after pulling schema changes: `npx prisma migrate dev && npx prisma generate`
> then `npm run prisma:seed`.

## Frontend (Next.js 16 App Router)

Full product surface wired to the live API via a single `authFetch` + react-query pattern. Route
groups: `(auth)`, `(public)`, `(dashboard)`, `(admin)`.

**Wired:** signup → OTP → login → password reset · lawyer onboarding · lawyer lead inbox (reveal /
status) · client requirements (confirm / withdraw) · settings · notifications · search · SEO routes ·
subscription plan + Razorpay checkout · admin console (approvals, users, plans, moderation) · in-app
reports (client↔lawyer). Full route map: [docs/26-frontend-implementation.md](./docs/26-frontend-implementation.md).

## Known follow-ups

- **reCAPTCHA** on signup — currently a placeholder `captchaToken: 'dev-token'`.
- **Session hardening** — tokens are in `localStorage`; move to httpOnly cookies + CSRF.
- **Documents module** — backend stub; needs endpoints + an admin template-management page.
- **Tests / CI** — unit + e2e coverage and a pipeline not yet in place.

## Sandbox / tooling notes

- Prisma engine download is blocked in the sandbox, so `migrate` / `generate` / tests run **locally**.
- Freshly-edited files can read stale via bash/`tsc` (dual-path mount); trust the Read/Grep tools for
  authoritative content, and rely on a local `next build` for the final parse check.

---

**Related:** [ROADMAP.md](./ROADMAP.md) · [docs/architecture-diagrams.md](./docs/architecture-diagrams.md) ·
[docs/26-frontend-implementation.md](./docs/26-frontend-implementation.md) · [CONTRIBUTING.md](./CONTRIBUTING.md)
