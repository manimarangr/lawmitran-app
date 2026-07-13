# Screenshots & UI Reference

The visual reference for LawMitran. Until we capture screenshots of the running Next.js app, the
**`sample-ui/` HTML mockups** are the source of truth for each screen's layout and states — open any
file in a browser to view it.

Put captured PNGs in [`docs/screenshots/`](./screenshots/) using the filenames below, and they'll
render inline here.

---

## Public

| Screen | Mockup | Screenshot |
|---|---|---|
| Home / landing | `sample-ui/index.html` | `screenshots/home.png` |
| Lawyer search | `sample-ui/lawyer-search.html` | `screenshots/search.png` |
| Lawyer search — map | `sample-ui/lawyer-search-map.html` | `screenshots/search-map.png` |
| Search results | `sample-ui/search-results.html` | `screenshots/search-results.png` |
| Lawyer profile | `sample-ui/lawyer-profile.html` | `screenshots/lawyer-profile.png` |
| Lawyer details | `sample-ui/lawyer-details.html` | `screenshots/lawyer-details.png` |
| SEO landing (city/area) | `sample-ui/seo-landing-example.html` | `screenshots/seo-landing.png` |

## Auth

| Screen | Mockup | Screenshot |
|---|---|---|
| Login | `sample-ui/login.html` | `screenshots/login.png` |
| Sign up | `sample-ui/signup.html` | `screenshots/signup.png` |
| Lawyer sign up | `sample-ui/lawyer-signup.html` | `screenshots/lawyer-signup.png` |
| OTP verify (client) | `sample-ui/client-otp.html` | `screenshots/otp.png` |
| OTP verify (lawyer) | `sample-ui/lawyer-signup-otp.html` | `screenshots/lawyer-otp.png` |
| Forgot / reset password | `sample-ui/forgot-password.html`, `sample-ui/reset-password.html` | `screenshots/reset.png` |

## Client & lawyer dashboards

| Screen | Mockup | Screenshot |
|---|---|---|
| Client dashboard | `sample-ui/client-dashboard.html` | `screenshots/client-dashboard.png` |
| Lawyer dashboard (lead inbox) | `sample-ui/lawyer-dashboard.html` | `screenshots/lawyer-dashboard.png` |
| Lawyer onboarding | `sample-ui/lawyer-onboarding.html` | `screenshots/onboarding.png` |
| Subscription plans | `sample-ui/lawyer-plan.html` | `screenshots/plan.png` |
| Settings | `sample-ui/settings.html` | `screenshots/settings.png` |
| Notifications | `sample-ui/notifications.html` | `screenshots/notifications.png` |
| Lawyer documents | `sample-ui/lawyer-documents.html` | `screenshots/lawyer-documents.png` |
| Win-back (expired) demo | `sample-ui/winback-demo.html` | `screenshots/winback.png` |

## Admin console

| Screen | Mockup | Screenshot |
|---|---|---|
| Admin dashboard | `sample-ui/admin-dashboard.html` | `screenshots/admin-dashboard.png` |
| Approvals (lawyers) | `sample-ui/admin-lawyers.html` | `screenshots/admin-approvals.png` |
| Practice review | `sample-ui/lawyer-practice-review.html` | `screenshots/practice-review.png` |
| Moderation (reports) | `sample-ui/admin-moderation.html` | `screenshots/admin-moderation.png` |
| Reports | `sample-ui/admin-reports.html` | `screenshots/admin-reports.png` |
| Users | `sample-ui/admin-users.html` | `screenshots/admin-users.png` |
| Plans | `sample-ui/admin-plans.html` | `screenshots/admin-plans.png` |
| Documents | `sample-ui/admin-documents.html` | `screenshots/admin-documents.png` |

## Legal / static

`sample-ui/terms.html` · `sample-ui/privacy-policy.html` · `sample-ui/refund-policy.html` ·
`sample-ui/disclaimer.html`

---

## Capturing screenshots

Run the app, then capture each route into `docs/screenshots/` with the filename from the tables above.

```bash
# 1. Backend (from backend/)
npx prisma migrate dev && npx prisma generate && npm run prisma:seed
npm run dev:backend            # http://localhost:3001/api

# 2. Frontend (from repo root) — set NEXT_PUBLIC_API_URL first
npm run dev:frontend           # http://localhost:3000
```

Capture at a consistent width (e.g. 1440px desktop, 390px mobile). A full-page browser screenshot
extension or Playwright works well:

```bash
# example: one-off full-page shot with Playwright
npx playwright screenshot --full-page http://localhost:3000 docs/screenshots/home.png
```

Keep images reasonably compressed (PNG or WebP) so the repo stays lean.

---

**Related:** [26-frontend-implementation.md](./26-frontend-implementation.md) ·
[architecture-diagrams.md](./architecture-diagrams.md) · [../STATUS.md](../STATUS.md)
