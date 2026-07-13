# Environment — Development

Integration environment for the `develop` branch. Runs as the `lawmitran-dev` Compose project on the **shared** EC2 box, isolated from QA.

| | |
|---|---|
| Host | Shared EC2 (Elastic IP shared with QA) |
| Frontend | `https://dev.lawmitran.com` |
| API | `https://api-dev.lawmitran.com/api` |
| Branch | `develop` |
| Deploy | **Auto** on merge to `develop` |
| Compose project | `lawmitran-dev` |
| Path | `/opt/lawmitran/dev` |
| Data dir | `/opt/lawmitran/data/dev` |
| Host ports | FE `3100`, BE `3101` (localhost only) |

## Isolation from QA (same box)

Guaranteed by four separations: separate **Compose project** (`-p lawmitran-dev`), separate **Postgres DB** (`lawmitran_dev`), separate **Redis** container/password, separate **MinIO** buckets (`lawmitran-dev-*`). A Dev deploy cannot touch QA.

## Config

`NODE_ENV=development`, verbose logging, Swagger (`/api/docs`) enabled, `CORS_ORIGIN=https://dev.lawmitran.com`. Unique secrets — never shared with QA/Prod. See [10-environment-variables.md](../10-environment-variables.md).

## Data

Seed with synthetic fixtures (test lawyers across `verificationStatus`, sample leads/plans) via `prisma/seed.ts` after `migrate deploy`. Freely resettable; backups optional.

## Deploy flow

Merge to `develop` → CI green → CD builds (`NEXT_PUBLIC_API_URL=https://api-dev.lawmitran.com/api`), pushes to GHCR, SSHes to the shared box, runs `prisma migrate deploy` against `lawmitran_dev`, restarts the `lawmitran-dev` stack. No approval.

See also: [QA](./qa.md) · [Production](./production.md).
