# 10 — Environment Variable Management

Each environment has its own `.env` file living **on the box** at `/opt/lawmitran/<env>/.env` — never committed to git. Secrets used by CI live in **GitHub Environments** ([11](./11-github-actions.md)).

## Principles

- **One `.env` per environment**; unique secrets across Dev / QA / Prod — never reuse a production secret.
- File permissions `chmod 600`, owner `deploy`.
- `.env*` is in `.gitignore` and `.dockerignore`.
- `NEXT_PUBLIC_*` values are **build-time** (baked into the frontend image) — set them as CI build-args, not runtime env. Everything else is runtime.

## Reference `.env`

```dotenv
# --- Core ---
NODE_ENV=production
PORT=3001

# --- Database (Postgres container) ---
POSTGRES_USER=lawmitran
POSTGRES_PASSWORD=<strong-pw>
POSTGRES_DB=lawmitran_prod
DATABASE_URL=postgresql://lawmitran:<strong-pw>@postgres:5432/lawmitran_prod

# --- Redis ---
REDIS_PASSWORD=<strong-pw>
REDIS_URL=redis://:<strong-pw>@redis:6379/0

# --- Auth (JWT) ---
JWT_ACCESS_SECRET=<unique-long-secret>
JWT_REFRESH_SECRET=<unique-long-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# --- Storage (MinIO / S3-compatible) ---
S3_ENDPOINT=http://minio:9000
S3_FORCE_PATH_STYLE=true
S3_ACCESS_KEY=<app-key>
S3_SECRET_KEY=<app-secret>
S3_BUCKET=lawmitran-prod
MINIO_ROOT_USER=<admin-user>
MINIO_ROOT_PASSWORD=<admin-pw>

# --- App ---
CORS_ORIGIN=https://lawmitran.com

# --- Build-time (frontend image, set as CI build-arg, not here) ---
# NEXT_PUBLIC_API_URL=https://api.lawmitran.com/api
```

## Per-environment differences

| Key | Dev | QA | Prod |
|---|---|---|---|
| `POSTGRES_DB` | `lawmitran_dev` | `lawmitran_qa` | `lawmitran_prod` |
| `S3_BUCKET` | `lawmitran-dev` | `lawmitran-qa` | `lawmitran-prod` |
| `CORS_ORIGIN` | `https://dev.lawmitran.com` | `https://qa.lawmitran.com` | `https://lawmitran.com` |
| `NODE_ENV` | `development` | `production` | `production` |
| Secrets | unique | unique | unique |

## Validation

The backend runs a global `ValidationPipe`; validate required env at boot (e.g. a Nest config schema with Joi/zod) so a missing/blank variable fails fast rather than at first request.

## Rotation

Rotate DB/Redis/MinIO credentials and JWT secrets periodically and immediately on suspected exposure. Update the box `.env`, restart the stack, and update any dependent GitHub secret. Rotating `JWT_*` invalidates existing tokens (users re-login) — schedule accordingly.

## Future: Secrets Manager / SSM Parameter Store

As the platform grows, move secrets out of flat files into **AWS Secrets Manager** or **SSM Parameter Store**, injected at container start via an entrypoint or task definition. This centralizes rotation and auditing.

Next: [11-github-actions.md](./11-github-actions.md).
