# 14 — Redis Configuration

Self-hosted `redis:7` container per environment. Used for caching, rate limiting, session/OTP throttling, and background jobs.

## Container

```yaml
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
  # NO host ports
```

- `--requirepass` — always set a password even though Redis isn't public (defense in depth).
- `--appendonly yes` — AOF persistence across restarts.

`.env`: `REDIS_PASSWORD`, `REDIS_URL=redis://:<pw>@redis:6379/0`.

## Use cases in LawMitran

1. **Rate limiting / throttling** — login attempts and OTP verification (brute-force protection).
2. **Caching hot SEO reads** — public search, city×practice landings, profile pages (unauthenticated, read-heavy). Short TTLs; bust on profile/verification/subscription change.
3. **Background jobs** — lead-routing fan-out, notifications, document processing via **BullMQ**.
4. **Ephemeral tokens** — OTP codes / short-lived state with TTLs.

## Caching guidance

- Namespace keys: `search:*`, `lawyer:<slug>`, `landing:<city>:<area>`.
- **Bust on write**: when a lawyer's profile / `verificationStatus` / `subscriptionStatus` changes, delete affected keys so public pages never serve stale eligibility.
- Never cache authenticated/PII responses.

## Memory & eviction

```
--maxmemory 512mb --maxmemory-policy allkeys-lru
```

If running a durable BullMQ queue alongside an evictable cache, use a **separate Redis instance or logical DB** for the queue so eviction can't drop jobs.

## Isolation on the shared box

Dev and QA each run their **own** Redis container (separate Compose projects). If ever consolidated, use different logical DBs (`/0` vs `/1`) and different passwords.

## Operations

```bash
docker compose -p lawmitran-prod exec redis redis-cli -a "$REDIS_PASSWORD" ping
docker compose -p lawmitran-prod exec redis redis-cli -a "$REDIS_PASSWORD" info memory
```

## Future: ElastiCache

Lift to **ElastiCache for Redis** (HA, managed) later — change only `REDIS_URL`. See [02](./02-aws-infrastructure.md).

Next: [15-minio.md](./15-minio.md).
