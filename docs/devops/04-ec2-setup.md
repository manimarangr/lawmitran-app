# 04 — EC2 Setup Guide

Run once per box (Production, and the shared Dev/QA box). OS: **Ubuntu 24.04 LTS**.

## 1. Launch

- AMI: Ubuntu Server 24.04 LTS.
- Type: `t3.medium` (Prod) / `t3.small`–`t3.medium` (shared).
- Storage: 30–50 GB gp3 root + optional dedicated data volume.
- Security group: `sg-lawmitran-web` ([05](./05-security-groups.md)).
- Key pair: create/download `.pem`, store securely (never commit).
- Associate the **Elastic IP** after launch.

## 2. Base packages

```bash
ssh -i lawmitran-prod.pem ubuntu@<EIP>

sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  ca-certificates curl gnupg \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban unattended-upgrades git
```

Docker installation is covered in [06](./06-docker.md).

## 3. (Optional) mount data volume

```bash
lsblk                                   # find device, e.g. /dev/nvme1n1
sudo mkfs -t ext4 /dev/nvme1n1
sudo mkdir -p /opt/lawmitran/data
sudo mount /dev/nvme1n1 /opt/lawmitran/data
echo '/dev/nvme1n1 /opt/lawmitran/data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

## 4. Deploy user for CI

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh && sudo chmod 700 /home/deploy/.ssh
sudo tee /home/deploy/.ssh/authorized_keys < deploy_key.pub
sudo chown -R deploy:deploy /home/deploy/.ssh && sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

The **private** key becomes the `DEPLOY_SSH_KEY` GitHub secret ([11](./11-github-actions.md)).

## 5. Firewall & hardening

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# /etc/ssh/sshd_config: PermitRootLogin no ; PasswordAuthentication no
sudo systemctl restart ssh
sudo systemctl enable --now fail2ban
sudo dpkg-reconfigure -plow unattended-upgrades
```

Full hardening in [21](./21-security-best-practices.md).

## 6. Directory layout

```
/opt/lawmitran/
├── prod/                    # or dev/ and qa/ on the shared box
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── .env                 # chmod 600, owner deploy
│   └── backup.sh
└── data/
    ├── prod/{pg,redis,minio}
    ├── dev/{pg,redis,minio}
    └── qa/{pg,redis,minio}
```

```bash
sudo mkdir -p /opt/lawmitran/prod
sudo chown -R deploy:deploy /opt/lawmitran
```

On the shared box create both `/opt/lawmitran/dev` and `/opt/lawmitran/qa`.

## 7. Verify

```bash
docker --version && docker compose version
nginx -v && sudo ufw status
```

Next: [05-security-groups.md](./05-security-groups.md).
