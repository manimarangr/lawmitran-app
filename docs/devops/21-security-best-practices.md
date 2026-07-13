# 21 — Security Best Practices

Defense in depth across network, host, application, and data layers.

## Network

- **Security group** ([05](./05-security-groups.md)): only 80/443 public; 22 restricted (or SSM Session Manager). No 5432/6379/9000/9001 inbound — ever.
- Databases/cache/storage bind to the Docker network only (no host port publishing) — the single most important self-hosting control.
- TLS everywhere ([09](./09-ssl.md)); HTTP→HTTPS redirect; HSTS + security headers ([08](./08-nginx.md)).

## Host

- SSH key-only (`PasswordAuthentication no`, `PermitRootLogin no`).
- `fail2ban` for SSH brute-force; `unattended-upgrades` for OS security patches.
- Separate `deploy` user for CI (docker group, no sudo); admins use their own accounts.
- `ufw` allows only OpenSSH + Nginx Full.

## Secrets

- `.env` on the box, `chmod 600`, owner `deploy`, never committed ([10](./10-environment-variables.md)).
- CI secrets in **GitHub Environments** (per-env, scoped); prod behind the reviewer gate.
- Unique secrets per environment; rotate periodically and on suspected exposure.

## Application (enforce in code)

- Global `JwtAuthGuard` + `RolesGuard`; every route authed unless `@Public()`. Public only where SEO needs it (search/profile/document browsing); lead submission and document purchase require login.
- Separate access/refresh JWT secrets; refresh tokens stored as **SHA-256 hashes**, single-use (rotated on refresh, revoked on logout).
- Registration rejects self-assigned `ADMIN`.
- Global `ValidationPipe({ whitelist: true, transform: true })` — unknown props stripped; DTOs use `class-validator`.
- Enforce business rules server-side: only `APPROVED` lawyers in search; exclude `EXPIRED` subscriptions from lead routing. Never trust the client.

## Data protection

- Verification uploads (certs, IDs) and marketplace documents are PII/sensitive → **private buckets + presigned URLs** ([15](./15-minio.md)).
- CORS locked to the exact frontend origin per environment.
- Upload size limits + server-side MIME/size validation.
- Never load raw production PII into Dev/QA — mask first ([20](./20-backup-disaster-recovery.md)).

## Abuse & rate limiting

- App-level rate limiting on auth/OTP via Redis ([14](./14-redis.md)); optional Nginx `limit_req` outer layer ([08](./08-nginx.md)).

## Audit & review

- Keep the append-only `Verification` trail; log admin actions (approvals, suspensions).
- Run `npm audit` regularly; apply the repo's `/security-review` on significant changes.
- Encrypt backups; store offsite; restrict access.

## Checklist

- [ ] Port 22 restricted (or SSM); DB ports closed; TLS valid & auto-renewing
- [ ] Key-only SSH; fail2ban + unattended-upgrades active
- [ ] Unique per-env secrets; `.env` 600; none in git
- [ ] Prod deploy behind manual approval
- [ ] Private buckets + presigned URLs for PII
- [ ] Server-side enforcement of role/eligibility rules
- [ ] Backups encrypted & offsite; restore tested

## Future

Managed tiers add: RDS encryption at rest + IAM auth, Secrets Manager rotation, WAF on CloudFront/ALB, GuardDuty, and per-tier security groups ([02](./02-aws-infrastructure.md)).

Next: [22-deployment-checklist.md](./22-deployment-checklist.md).
