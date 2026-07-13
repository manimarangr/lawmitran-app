# LawMitran — DevOps Documentation

Long-term operational and deployment documentation for the LawMitran platform.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | NestJS |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | MinIO (→ future AWS S3) |
| Deployment | Docker Compose |
| OS | Ubuntu 24.04 LTS |
| Web server | Nginx reverse proxy |
| SSL | Let's Encrypt (auto-renew) |
| CI/CD | GitHub Actions |
| Source control | GitHub |

## Environments & domains

| Env | Frontend | API | Branch | Deploy |
|---|---|---|---|---|
| Development | `dev.lawmitran.com` | `api-dev.lawmitran.com` | `develop` | Auto |
| QA | `qa.lawmitran.com` | `api-qa.lawmitran.com` | `qa` | Auto |
| Production | `lawmitran.com` (+ `www`) | `api.lawmitran.com` | `main` | Manual approval |

## Infrastructure

- **Initial**: one EC2 for Development + QA (shared, isolated stacks); one dedicated EC2 for Production.
- **Future migration**: RDS, ElastiCache, ECS/EKS, CloudFront, ALB, Auto Scaling — see [02](./02-aws-infrastructure.md).

## Table of contents

| # | Document |
|---|---|
| 01 | [Overall Architecture](./01-system-architecture.md) |
| 02 | [AWS Infrastructure](./02-aws-infrastructure.md) |
| 03 | [DNS & Route 53](./03-domain-dns.md) |
| 04 | [EC2 Setup Guide](./04-ec2-setup.md) |
| 05 | [Security Groups](./05-security-groups.md) |
| 06 | [Docker Installation](./06-docker.md) |
| 07 | [Docker Compose Structure](./07-docker-compose.md) |
| 08 | [Nginx Configuration](./08-nginx.md) |
| 09 | [SSL Setup](./09-ssl.md) |
| 10 | [Environment Variable Management](./10-environment-variables.md) |
| 11 | [GitHub Actions Workflows](./11-github-actions.md) |
| 12 | [Branching Strategy](./12-branching-strategy.md) |
| 13 | [PostgreSQL Deployment & Backup](./13-postgresql.md) |
| 14 | [Redis Configuration](./14-redis.md) |
| 15 | [MinIO Configuration](./15-minio.md) |
| 16 | [Health Checks](./16-health-checks.md) |
| 17 | [Zero-Downtime Deployment](./17-zero-downtime-deployment.md) |
| 18 | [Rollback Procedure](./18-rollback.md) |
| 19 | [Monitoring (Prometheus · Grafana · CloudWatch)](./19-monitoring.md) |
| 20 | [Backup & Disaster Recovery](./20-backup-disaster-recovery.md) |
| 21 | [Security Best Practices](./21-security-best-practices.md) |
| 22 | [Deployment Checklist](./22-deployment-checklist.md) |
| 23 | [Production Readiness Checklist](./23-production-readiness-checklist.md) |

**Environments**: [Development](./environments/development.md) · [QA](./environments/qa.md) · [Production](./environments/production.md)

**Diagrams** (Mermaid sources): [`./diagrams/`](./diagrams/) — architecture, AWS infrastructure, CI/CD pipeline, branch strategy.

## Deployment flow

```
feature/*  ──►  develop  ──►  qa  ──►  main
   PR           Dev          QA        Prod (manual approval)
```
