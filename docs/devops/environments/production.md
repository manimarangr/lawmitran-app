# Environment — Production

Live environment serving real users. Runs as the `lawmitran-prod` Compose project on a **dedicated** EC2 box — physically separate from Dev/QA.

| | |
|---|---|
| Host | Dedicated EC2 (`t3.medium`+), own Elastic IP |
| Frontend | `https://lawmitran.com` (+ `www` redirect) |
| API | `https://api.lawmitran.com/api` |
| Branch | `main` (tagged `vX.Y.Z`) |
| Deploy | **Manual approval** (GitHub Environment reviewer) |
| Compose project | `lawmitran-prod` |
| Path | `/opt/lawmitran/prod` |
| Data dir | `/opt/lawmitran/data/prod` |
| Host ports | FE `3000`, BE `3001` (localhost only) |

## Config

`NODE_ENV=production`, error-level logging, Swagger gated/disabled, `CORS_ORIGIN=https://lawmitran.com`, unique strong secrets. See [10-environment-variables.md](../10-environment-variables.md).

## Hardening specific to prod

- Manual-approval deploys via the `production` GitHub Environment reviewer.
- Zero-downtime blue-green cutover ([17](../17-zero-downtime-deployment.md)).
- Backups **required** — nightly `pg_dump` + MinIO mirror + EBS snapshots ([20](../20-backup-disaster-recovery.md)).
- Monitoring **required** — uptime, CloudWatch/Prometheus, alerts ([19](../19-monitoring.md)).
- `restart: always` + healthchecks on every container ([16](../16-health-checks.md)).
- Tight security group, fail2ban, unattended upgrades ([21](../21-security-best-practices.md)).

## Business rules that must hold

- Only lawyers with `verificationStatus = APPROVED` appear in public search.
- Lead routing **excludes** `subscriptionStatus = EXPIRED` (profile stays visible, no new leads).
- Public search/profile/document browsing stays unauthenticated (SEO); only lead submission and document purchase require login.

Verified in the post-deploy smoke test ([22](../22-deployment-checklist.md)).

## Deploy flow

Merge `qa → main`, tag `vX.Y.Z` → CD builds (`NEXT_PUBLIC_API_URL=https://api.lawmitran.com/api`), pushes to GHCR, **pauses for approval** → on approval: blue-green cutover with readiness gate, `prisma migrate deploy` against `lawmitran_prod`, drain old colour. Rollback: [18](../18-rollback.md).

See also: [Development](./development.md) · [QA](./qa.md).
