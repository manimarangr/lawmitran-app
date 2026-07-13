# 15 — MinIO Configuration

S3-compatible object storage, self-hosted per environment. Stores lawyer bar-council certificates, ID cards, and marketplace documents. The backend uses `@aws-sdk/client-s3` with path-style addressing, so migrating to AWS S3 later needs only config changes.

## Container

```yaml
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  env_file: .env
  volumes: ["${DATA_DIR}/minio:/data"]
  restart: always
  healthcheck:
    test: ["CMD", "mc", "ready", "local"]
    interval: 30s
    timeout: 10s
    retries: 3
  # NO public host ports; console tunneled via SSH if needed
```

`.env`: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `S3_ENDPOINT=http://minio:9000`, `S3_FORCE_PATH_STYLE=true`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`.

## Buckets & layout

Per-environment bucket with content prefixes, or distinct buckets:

- `lawmitran-prod` with `bar-council-certs/`, `id-cards/`, `documents/`, or
- `lawmitran-prod-verification`, `lawmitran-prod-documents`.

Provision with `mc`:

```bash
docker run --rm --network lawmitran-prod_default minio/mc sh -c '
  mc alias set local http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD &&
  mc mb -p local/lawmitran-prod &&
  mc admin user add local <app-key> <app-secret> &&
  mc admin policy attach local readwrite --user <app-key>'
```

## Access control

- **Verification uploads (certs, IDs)** are sensitive PII → **private buckets**, served via **presigned URLs** with short expiry. Never public.
- **Marketplace documents** → private / purchase-gated; presigned URLs after authorization.
- Give the app a **scoped** key (not root) limited to its buckets.

## Upload size

Match Nginx `client_max_body_size 20M` ([08](./08-nginx.md)); validate MIME type and size server-side.

## Isolation on shared box

Dev and QA each run their own MinIO container, buckets, and keys — no cross-env access.

## Backup

Mirror buckets off-box regularly:

```bash
mc mirror --overwrite local/lawmitran-prod offsite/lawmitran-backups/minio/
```

Details in [20](./20-backup-disaster-recovery.md).

## Future: AWS S3 migration

Point `S3_ENDPOINT` at S3, drop `S3_FORCE_PATH_STYLE`, swap keys for IAM credentials, and copy objects with `mc mirror` / `aws s3 sync`. **No application code change.** This is the storage step of the migration path in [02](./02-aws-infrastructure.md).

Next: [16-health-checks.md](./16-health-checks.md).
