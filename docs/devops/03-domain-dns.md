# 03 — DNS & Route 53

## Hosted zone

Manage DNS in **Route 53**:

1. Create a **hosted zone** for `lawmitran.com`.
2. Set the four Route 53 NS records as your registrar's nameservers.
3. Wait for propagation.

## Records

All `A` records to the appropriate Elastic IP. Keep **TTL = 300s** during rollout; raise to 3600s once stable.

| Record | Type | Target | Serves |
|---|---|---|---|
| `lawmitran.com` | A | Prod EIP | Production frontend |
| `www.lawmitran.com` | A / CNAME | Prod | Redirect → apex |
| `api.lawmitran.com` | A | Prod EIP | Production API |
| `dev.lawmitran.com` | A | Shared EIP | Dev frontend |
| `api-dev.lawmitran.com` | A | Shared EIP | Dev API |
| `qa.lawmitran.com` | A | Shared EIP | QA frontend |
| `api-qa.lawmitran.com` | A | Shared EIP | QA API |

Recommended extras:

- `CAA` limiting issuance to `letsencrypt.org`.
- `MX` / `TXT` (SPF, DKIM, DMARC) if sending transactional email (OTP, notifications).

## API URL wiring

Next.js bakes `NEXT_PUBLIC_*` at build time, so each env builds with its own API base:

| Env | `NEXT_PUBLIC_API_URL` |
|---|---|
| Dev | `https://api-dev.lawmitran.com/api` |
| QA | `https://api-qa.lawmitran.com/api` |
| Prod | `https://api.lawmitran.com/api` |

Set backend CORS to the matching frontend origin per environment. See [10](./10-environment-variables.md).

## Verification

```bash
dig +short lawmitran.com
dig +short api.lawmitran.com
curl -I https://lawmitran.com
curl -I https://api.lawmitran.com/api/health
```

## Future: CloudFront

When adopting CloudFront ([02](./02-aws-infrastructure.md)), point the apex/`www` at the CloudFront distribution (alias/ALIAS record) instead of the EC2 EIP, and serve TLS via ACM at the edge.

Next: [04-ec2-setup.md](./04-ec2-setup.md).
