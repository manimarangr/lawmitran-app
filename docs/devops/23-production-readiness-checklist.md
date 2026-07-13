# 23 — Production Readiness Checklist

A one-time gate before the **first** production go-live (and a periodic re-review). Every item should be true before serving real users.

## Infrastructure

- [ ] Region chosen (`ap-south-1`); VPC/subnets ready
- [ ] Dedicated Production EC2 (Ubuntu 24.04) launched; Elastic IP associated
- [ ] Shared Dev/QA EC2 launched; Elastic IP associated
- [ ] Dedicated data volume mounted; EBS daily snapshots enabled (prod)
- [ ] Security group: 80/443 public, 22 restricted, DB ports closed ([05](./05-security-groups.md))

## Platform

- [ ] Docker + Compose installed; log rotation configured ([06](./06-docker.md))
- [ ] Compose base + prod override in place; app ports bound to localhost ([07](./07-docker-compose.md))
- [ ] Nginx vhosts for `lawmitran.com` / `www` / `api` ([08](./08-nginx.md))
- [ ] TLS issued; `certbot renew --dry-run` passes; deploy-hook reloads Nginx ([09](./09-ssl.md))
- [ ] `.env` present, `chmod 600`, unique secrets, env validation at boot ([10](./10-environment-variables.md))

## Data services

- [ ] Postgres tuned; indexes on hot paths verified with `EXPLAIN ANALYZE` ([13](./13-postgresql.md))
- [ ] Redis password set; maxmemory/eviction configured; queue isolated from cache ([14](./14-redis.md))
- [ ] MinIO buckets created; scoped app key; private + presigned URLs for PII ([15](./15-minio.md))

## CI/CD

- [ ] CI (lint + `tsc` + tests) required on `develop`/`qa`/`main` ([11](./11-github-actions.md))
- [ ] CD wired; GitHub Environments with per-env secrets; prod reviewer gate
- [ ] Branch protection on all three long-lived branches ([12](./12-branching-strategy.md))
- [ ] Zero-downtime deploy script tested on staging ([17](./17-zero-downtime-deployment.md))
- [ ] Rollback rehearsed (flip + previous-SHA redeploy) ([18](./18-rollback.md))

## Reliability

- [ ] `/api/health` (liveness) + `/api/health/ready` (readiness) implemented ([16](./16-health-checks.md))
- [ ] Container healthchecks + `restart: always` on every service
- [ ] NestJS handles `SIGTERM` (graceful shutdown)
- [ ] Nightly Postgres + MinIO backups running, offsite copy verified ([20](./20-backup-disaster-recovery.md))
- [ ] Restore tested end-to-end; RTO/RPO recorded
- [ ] DR runbooks reviewed; Elastic IP reassociation procedure known

## Observability

- [ ] External uptime monitor on FE + API with alerts ([16](./16-health-checks.md))
- [ ] Log rotation + Nginx logs retained ([19](./19-monitoring.md))
- [ ] CloudWatch agent + alarms (CPU/disk/status) OR Prometheus+Grafana live
- [ ] TLS-expiry and backup-failure alerts configured
- [ ] (Recommended) Sentry error tracking

## Security

- [ ] SSH key-only; fail2ban; unattended-upgrades ([21](./21-security-best-practices.md))
- [ ] Server-side enforcement: `APPROVED`-only search; `EXPIRED` excluded from lead routing
- [ ] Public routes limited to SEO surfaces; auth required for lead submit / doc purchase
- [ ] CORS locked per environment; upload validation in place
- [ ] `npm audit` clean; secrets rotated from any defaults
- [ ] No raw prod PII in Dev/QA

## Business & ops

- [ ] Domains resolve; `www` → apex redirect works ([03](./03-domain-dns.md))
- [ ] Transactional email (OTP/notifications) deliverable (SPF/DKIM/DMARC)
- [ ] Runbook owners, AWS root contact, DNS registrar access, secrets vault documented
- [ ] Deployment ([22](./22-deployment-checklist.md)) and rollback procedures shared with the team

## Go / No-go

| Area | Status | Owner |
|---|---|---|
| Infrastructure | ⬜ | |
| CI/CD | ⬜ | |
| Reliability & backups | ⬜ | |
| Observability | ⬜ | |
| Security | ⬜ | |

Ship only when all areas are ✅.

Back to [README.md](./README.md).
