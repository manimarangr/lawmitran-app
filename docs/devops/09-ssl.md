# 09 — SSL Setup (Let's Encrypt)

TLS certificates are issued by **Let's Encrypt via certbot** on each box, with automatic renewal. (ACM isn't used yet — it only integrates with ALB/CloudFront, which come later.)

## Issue certificates

```bash
# Production box
sudo certbot --nginx \
  -d lawmitran.com -d www.lawmitran.com -d api.lawmitran.com

# Shared box (Dev + QA)
sudo certbot --nginx \
  -d dev.lawmitran.com -d api-dev.lawmitran.com \
  -d qa.lawmitran.com  -d api-qa.lawmitran.com
```

certbot edits the Nginx vhosts to add `ssl_certificate` / `ssl_certificate_key` and an HTTP→HTTPS redirect, then obtains the certs via the HTTP-01 challenge (needs port 80 open — it is, per [05](./05-security-groups.md)).

## Automatic renewal

certbot installs a systemd timer that renews certs ~30 days before expiry and reloads Nginx. Verify:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run          # must succeed
```

Add a deploy hook so Nginx always reloads on renewal:

```bash
sudo certbot renew --deploy-hook "systemctl reload nginx"
```

## Recommended TLS hardening

Let certbot manage the Mozilla "intermediate" config, or set in the server block:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_stapling on;
ssl_stapling_verify on;
```

Pair with the `Strict-Transport-Security` header ([08](./08-nginx.md)).

## Wildcard alternative

If subdomains proliferate, switch to a **wildcard** cert (`*.lawmitran.com`) via the DNS-01 challenge using the Route 53 plugin:

```bash
sudo apt install -y python3-certbot-dns-route53
sudo certbot certonly --dns-route53 -d 'lawmitran.com' -d '*.lawmitran.com'
```

## Monitoring

Track certificate expiry externally (many uptime tools check TLS) so a renewal failure surfaces before an outage. See [19](./19-monitoring.md).

## Future: TLS at the edge

With CloudFront/ALB later, terminate TLS using **ACM** certificates at the edge and let origin traffic ride inside the VPC. certbot on EC2 is retired at that point.

Next: [10-environment-variables.md](./10-environment-variables.md).
