# 07 — Docker Compose Structure

A base `docker-compose.yml` defines every service; per-environment override files set images, ports, and volumes. On the shared box, Dev and QA run as **separate Compose projects** (`-p`) for full isolation.

## Folder structure

```
/opt/lawmitran/<env>/
├── docker-compose.yml            # base (all services)
├── docker-compose.<env>.yml      # prod | dev | qa overrides
├── .env                          # secrets (chmod 600)
└── backup.sh
```

## Base — `docker-compose.yml`

```yaml
services:
  backend:
    image: ghcr.io/<org>/lawmitran-backend:${IMAGE_TAG:-latest}
    env_file: .env
    restart: always
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
      minio:    { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    image: ghcr.io/<org>/lawmitran-frontend:${IMAGE_TAG:-latest}
    env_file: .env
    restart: always
    depends_on:
      backend: { condition: service_healthy }

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

  redis:
    image: redis:7
    command: ["redis-server", "--requirepass", "${REDIS_PASSWORD}", "--appendonly", "yes"]
    volumes: ["${DATA_DIR}/redis:/data"]
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

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
```

Healthchecks feed both Compose `depends_on` ordering and the health-check strategy in [16](./16-health-checks.md).

## Overrides — bind app ports to localhost only

`docker-compose.prod.yml`:

```yaml
services:
  frontend: { ports: ["127.0.0.1:3000:3000"] }
  backend:  { ports: ["127.0.0.1:3001:3001"] }
```

`docker-compose.dev.yml` → FE `3100` / BE `3101`; `docker-compose.qa.yml` → FE `3200` / BE `3201`. Postgres/Redis/MinIO publish **no** host ports (network-internal only).

## Bringing stacks up

```bash
# Production
cd /opt/lawmitran/prod
DATA_DIR=/opt/lawmitran/data/prod IMAGE_TAG=<sha> \
  docker compose -p lawmitran-prod -f docker-compose.yml -f docker-compose.prod.yml up -d

# Shared box — two isolated projects
DATA_DIR=/opt/lawmitran/data/dev docker compose -p lawmitran-dev \
  -f docker-compose.yml -f docker-compose.dev.yml up -d
DATA_DIR=/opt/lawmitran/data/qa  docker compose -p lawmitran-qa \
  -f docker-compose.yml -f docker-compose.qa.yml up -d
```

Separate `-p` project + `DATA_DIR` + `.env` (distinct DB names, Redis passwords, MinIO buckets) guarantee Dev and QA never share state.

## Migrations

Run before the new backend serves traffic:

```bash
docker compose -p lawmitran-prod run --rm backend npx prisma migrate deploy
```

Always `migrate deploy` (non-interactive) — never `migrate dev` in a deployed environment.

## Common operations

```bash
docker compose -p lawmitran-prod ps
docker compose -p lawmitran-prod logs -f backend
docker compose -p lawmitran-prod pull
docker compose -p lawmitran-prod up -d
docker image prune -f
```

Next: [08-nginx.md](./08-nginx.md).
