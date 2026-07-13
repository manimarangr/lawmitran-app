# 08 — Nginx Configuration

Nginx runs on the host, terminates TLS, and reverse-proxies by `Host` header to the frontend (`:3000`) and backend (`:3001`). One `server` block per hostname.

## Production vhosts

`/etc/nginx/sites-available/lawmitran-prod.conf`:

```nginx
# HTTP → HTTPS (certbot keeps the ACME location)
server {
    listen 80;
    server_name lawmitran.com www.lawmitran.com api.lawmitran.com;
    location / { return 301 https://$host$request_uri; }
}

# Frontend
server {
    listen 443 ssl http2;
    server_name lawmitran.com www.lawmitran.com;
    # ssl_certificate ... (managed by certbot — see 09)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# API
server {
    listen 443 ssl http2;
    server_name api.lawmitran.com;
    client_max_body_size 20M;                 # cert / ID / document uploads

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/health { proxy_pass http://127.0.0.1:3001/api/health; access_log off; }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/lawmitran-prod.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Shared box (Dev + QA)

Same pattern, one file per env, proxying to that env's ports:

| Host | proxy_pass |
|---|---|
| `dev.lawmitran.com` | `http://127.0.0.1:3100` |
| `api-dev.lawmitran.com` | `http://127.0.0.1:3101` |
| `qa.lawmitran.com` | `http://127.0.0.1:3200` |
| `api-qa.lawmitran.com` | `http://127.0.0.1:3201` |

## Security headers (add to server blocks)

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Rate limiting (defense in depth)

```nginx
# http {} context
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

# in the API server block, on sensitive paths
location /api/auth/ {
    limit_req zone=auth burst=10 nodelay;
    proxy_pass http://127.0.0.1:3001;
}
```

Complements app-level Redis rate limiting ([14](./14-redis.md)).

## Zero-downtime note

The blue-green reload strategy in [17](./17-zero-downtime-deployment.md) uses an Nginx `upstream` with two backend colours and a graceful `reload`. See that doc for the upstream block.

TLS issuance/renewal: [09-ssl.md](./09-ssl.md).
