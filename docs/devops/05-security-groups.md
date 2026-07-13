# 05 — Security Groups

The Security Group is the network firewall in front of each EC2 box. The guiding rule: **only the web ports and restricted SSH are public; databases, cache, and storage are never reachable from the internet.**

## `sg-lawmitran-web` (both boxes)

### Inbound

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 443 | TCP | `0.0.0.0/0`, `::/0` | HTTPS |
| 80 | TCP | `0.0.0.0/0`, `::/0` | HTTP → HTTPS redirect + ACME challenge |
| 22 | TCP | `<office/VPN IP>/32` | SSH (restricted) |

### Outbound

| Port | Source | Purpose |
|---|---|---|
| all | `0.0.0.0/0` | OS updates, GHCR image pulls, Let's Encrypt |

### Explicitly NOT opened

`5432` (Postgres), `6379` (Redis), `9000`/`9001` (MinIO). These bind to the Docker network / localhost only. **Not adding these rules is the single most important database-security control in a self-hosted setup.**

## Why ports stay closed even on a shared box

Dev and QA share a host but each service binds to `127.0.0.1` (see [07](./07-docker-compose.md)); Nginx is the only process bridging public traffic to them. There is no path from the internet to Postgres/Redis/MinIO.

## SSH access options

- Restrict `22` to a static office/VPN IP.
- Better: use **AWS Systems Manager Session Manager** (no open SSH port at all) once you attach an SSM instance role — recommended for production.

## Terraform sketch (optional, for reproducibility)

```hcl
resource "aws_security_group" "web" {
  name        = "sg-lawmitran-web"
  description = "LawMitran web tier"
  vpc_id      = var.vpc_id

  ingress { from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 80  to_port = 80  protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 22  to_port = 22  protocol = "tcp" cidr_blocks = [var.admin_cidr] }
  egress  { from_port = 0   to_port = 0   protocol = "-1"  cidr_blocks = ["0.0.0.0/0"] }
}
```

## Future (managed tiers)

When moving to RDS/ElastiCache/ALB ([02](./02-aws-infrastructure.md)), use **separate SGs per tier** with SG-to-SG references (e.g., RDS SG allows `5432` only from the app SG), never CIDR-opening database ports.

Next: [06-docker.md](./06-docker.md).
