# 22 — Deployment Checklist

Use this for every production release. Dev/QA deploys are automatic; the smoke tests still apply.

## Pre-deploy

- [ ] Change validated and signed off in QA ([environments/qa.md](./environments/qa.md))
- [ ] `qa` merged to `main`, tagged `vX.Y.Z`
- [ ] Migrations reviewed — backward-compatible (expand/contract), no destructive change paired with its replacement ([13](./13-postgresql.md))
- [ ] Fresh **backup taken** before deploy (`backup.sh`, [20](./20-backup-disaster-recovery.md))
- [ ] Changelog / release notes updated
- [ ] Team notified of deploy window

## Deploy

- [ ] CI green on `main`
- [ ] `build-and-push` succeeded (images in GHCR, SHA noted)
- [ ] Prod deploy **approved** by reviewer ([11](./11-github-actions.md))
- [ ] Zero-downtime cutover: new colour started, `/api/health/ready` passed before Nginx flip ([16](./16-health-checks.md), [17](./17-zero-downtime-deployment.md))
- [ ] `prisma migrate deploy` ran cleanly
- [ ] `docker compose ps` — all services healthy
- [ ] Old colour drained and stopped; old images pruned (kept last few for rollback)

## Post-deploy smoke test

- [ ] `https://lawmitran.com` loads; valid cert
- [ ] `https://api.lawmitran.com/api/health` returns 200
- [ ] Public search returns results — only `APPROVED` lawyers shown
- [ ] City×practice landing renders with SEO metadata + JSON-LD
- [ ] Signup → OTP verify works
- [ ] Login works; authed dashboard loads; 401 redirects to `/login`
- [ ] Lawyer onboarding + document upload to MinIO works
- [ ] Lead submission works; routing **excludes** `EXPIRED`-subscription lawyers
- [ ] Subscription/trial state displays correctly
- [ ] No error spike in logs / Sentry; Nginx 5xx flat ([19](./19-monitoring.md))

## If smoke test fails

- [ ] Roll back ([18-rollback.md](./18-rollback.md)) — flip to previous colour or redeploy previous SHA
- [ ] Confirm smoke test passes on rolled-back version
- [ ] Incident note; fix forward via `hotfix/*`

## Sign-off

| Role | Name | ✔ |
|---|---|---|
| Deploy engineer | | |
| Reviewer (prod gate) | | |
| QA sign-off | | |

Next: [23-production-readiness-checklist.md](./23-production-readiness-checklist.md).
