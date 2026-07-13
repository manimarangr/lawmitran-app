# Environment — QA

Release-hardening environment for the `qa` branch. Runs as the `lawmitran-qa` Compose project on the **shared** EC2 box, isolated from Dev.

| | |
|---|---|
| Host | Shared EC2 (Elastic IP shared with Dev) |
| Frontend | `https://qa.lawmitran.com` |
| API | `https://api-qa.lawmitran.com/api` |
| Branch | `qa` (promoted from `develop`) |
| Deploy | **Auto** on merge to `qa` |
| Compose project | `lawmitran-qa` |
| Path | `/opt/lawmitran/qa` |
| Data dir | `/opt/lawmitran/data/qa` |
| Host ports | FE `3200`, BE `3201` (localhost only) |

## Purpose

Final validation before production: regression, UAT, verification/subscription/lead-routing sign-off, SEO/metadata checks, performance smoke tests. Mirrors production config (`NODE_ENV=production`, prod-like logging) so results predict prod behavior.

## Isolation from Dev

Same guarantees as Dev↔QA: separate Compose project (`lawmitran-qa`), Postgres DB (`lawmitran_qa`), Redis, and MinIO buckets. A QA deploy cannot touch Dev.

## Data

Prod-like but **sanitized** — masked copy of production shape (PII scrubbed). Refresh periodically from a sanitized prod dump ([20](../20-backup-disaster-recovery.md)). Never use raw production PII.

## Deploy flow

Merge `develop → qa` → CD builds (`NEXT_PUBLIC_API_URL=https://api-qa.lawmitran.com/api`), deploys the `lawmitran-qa` stack, migrates `lawmitran_qa`. Auto (approval reserved for prod).

## Exit criteria (QA → Prod)

- All planned tests pass; no open blockers/criticals.
- Migrations apply cleanly on prod-like data.
- Key flows verified: signup/OTP, lawyer onboarding + verification, subscription/trial transitions, lead submission + routing (excludes `EXPIRED`), public search shows only `APPROVED`, SEO metadata/JSON-LD present.

On sign-off, merge `qa → main`, tag, trigger the gated prod deploy.

See also: [Development](./development.md) · [Production](./production.md).
