# 13 — PostgreSQL Deployment & Backup

Primary datastore, self-hosted as a `postgres:16` container per environment, managed through Prisma.

## Container

```yaml
postgres:
  image: postgres:16
  env_file: .env
  volumes: ["${DATA_DIR}/pg:/var/lib/postgresql/data"]
  restart: always
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER"]
    interval: 10s
    timeout: 5s
    retries: 5
  # NO host ports — reachable only on the compose network
```

Not publishing port 5432 is the key control — only the backend container reaches the DB.

## Domain model (Prisma)

`User` (`CLIENT|LAWYER|ADMIN`), `Lawyer` (1:1 extension carrying `verificationStatus` + `subscriptionStatus`), `Verification` (append-only review trail), `Subscription`, `Lead` (`NEW→CONTACTED→CLOSED`), `RefreshToken` (SHA-256, single-use), `Rating`. Source: `backend/prisma/schema.prisma`.

## Migrations

- Author locally: `npx prisma migrate dev --name <change>`.
- Apply in deployed envs (CD step, before backend serves): `npx prisma migrate deploy`.
- Commit `prisma/migrations/` — it's the source of truth.

### Backward-compatible (expand/contract)

Prefer additive migrations so app rollback never needs DB rollback: add nullable column/table → backfill + dual-write → tighten/drop only after old code is gone. Avoid pairing a destructive change with its replacement in one release. (See [17](./17-zero-downtime-deployment.md), [18](./18-rollback.md).)

## Tuning (prod, ~4 GB box)

```
shared_buffers = 1GB
effective_cache_size = 2GB
work_mem = 16MB
maintenance_work_mem = 128MB
max_connections = 100
```

Add **PgBouncer** (transaction pooling) if Prisma connection counts climb.

## Indexing priorities

Public search filters on `Lawyer` (`verificationStatus`, city/practice-area, location); lead-routing eligibility (`subscriptionStatus`); `RefreshToken` by hash; `Lead` by client and by lawyer. Validate with `EXPLAIN ANALYZE` on QA data.

## Backup

Nightly logical dump, gzipped, pushed offsite, with retention. `backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F)
DEST=/opt/lawmitran/data/backups; mkdir -p "$DEST"
docker compose -p lawmitran-prod exec -T postgres \
  pg_dump -U lawmitran lawmitran_prod | gzip > "$DEST/pg-$STAMP.sql.gz"
mc cp "$DEST/pg-$STAMP.sql.gz" offsite/lawmitran-backups/pg/    # separate bucket/region
find "$DEST" -name 'pg-*.sql.gz' -mtime +14 -delete
```

Cron (as `deploy`): `0 2 * * * /opt/lawmitran/prod/backup.sh >> /var/log/lawmitran-backup.log 2>&1`

Full backup/restore/DR: [20](./20-backup-disaster-recovery.md).

## Restore (summary)

```bash
docker compose -p lawmitran-prod stop backend
gunzip -c pg-<date>.sql.gz | docker compose -p lawmitran-prod exec -T postgres psql -U lawmitran -d lawmitran_prod
docker compose -p lawmitran-prod start backend
```

## Future: RDS

Lift to **RDS PostgreSQL (Multi-AZ)** for managed backups, PITR, and failover — change only `DATABASE_URL`. See [02](./02-aws-infrastructure.md).

Next: [14-redis.md](./14-redis.md).
