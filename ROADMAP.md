# Roadmap

Where LawMitran is headed. This is the consolidated view; the granular per-area plan lives in
[docs/18-roadmap.md](./docs/18-roadmap.md). For what's built **today**, see [STATUS.md](./STATUS.md).

LawMitran is a lead-generation legal marketplace for India: a client submits a legal requirement, it
routes to verified + subscribed lawyers as a lead, and the lawyer contacts the client directly. No
in-app scheduling or consultation booking.

---

## Phase 0 — Foundation ✅ (done)

- npm workspace (`backend`, `frontend`), Docker Compose (postgres, redis, minio, nginx).
- NestJS + Prisma schema (User / Lawyer / Lead / Verification / Subscription / Report / RefreshToken).
- Global JWT + role guards; `@Public()` / `@Roles()` conventions.
- Auth: register / login / refresh (rotating, hashed) / logout.

## Phase 1 — MVP marketplace ✅ (largely done)

- Signup → WhatsApp-first OTP → password login.
- Lawyer onboarding (Bar Council details + certificate upload) and verification queue.
- Public lawyer search + map + SEO landing pages / profiles (slugs, JSON-LD, sitemap, robots, ISR).
- Lead submission + routing (excludes unverified / expired-subscription lawyers).
- Lawyer lead inbox with subscription-gated contact reveal; client requirement tracking.
- Subscriptions: trial → Razorpay checkout → active; admin plan pricing + lead caps.
- Settings (password, mobile-change OTP, avatar, delete) + notifications.
- Two-sided reporting + admin console (approvals, users, plans, moderation).

## Phase 2 — Hardening 🔜 (next)

- **reCAPTCHA** on signup (replace placeholder `captchaToken`).
- **httpOnly-cookie sessions** + silent refresh + CSRF (move off localStorage).
- Test coverage: unit + e2e for auth, leads routing, subscription gating; CI.
- Rate-limit + abuse monitoring on OTP and lead submission.
- Observability: structured logging, error tracking, uptime.

## Phase 3 — Document marketplace + multi-professional 📋 (planned)

- Fill in the `documents` module (currently a stub): template catalog, purchase, delivery.
- Admin document/template management page.
- Payment reconciliation + invoices (GST).
- **Multi-professional expansion** — "Find Professionals" with a profession filter:
  Lawyers · Law Firms · Chartered Accountants · Company Secretaries · GST Consultants ·
  Mediators · Notaries. Extends the same verify → subscribe → lead-routing model across professions
  (schema, search facets, onboarding fields, verification docs per profession). See
  [docs/25-multi-professional-expansion.md](./docs/25-multi-professional-expansion.md).

## Phase 4 — AI intake & growth 🔭 (later)

- `ai-intake` module: structured requirement capture → better lead routing / matching.
- Ratings & reviews; lawyer response-time signals.
- Notifications: email + WhatsApp templates for lead + subscription events.
- Analytics dashboard for lawyers (lead volume, conversion).

---

## Legend

| Marker | Meaning |
|---|---|
| ✅ | Built |
| 🔜 | In progress / next up |
| 📋 | Planned, scoped |
| 🔭 | Future, not yet scoped |

**Related:** [STATUS.md](./STATUS.md) · [docs/18-roadmap.md](./docs/18-roadmap.md) ·
[docs/MVP-launch-checklist.md](./docs/MVP-launch-checklist.md) ·
[docs/architecture-diagrams.md](./docs/architecture-diagrams.md)
