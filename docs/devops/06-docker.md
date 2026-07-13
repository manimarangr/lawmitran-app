# 06 — Docker Installation

Install Docker Engine + Compose plugin from Docker's official APT repository on **Ubuntu 24.04 LTS** (more current than the distro package).

## Install

```bash
# Remove any distro versions
for p in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt remove -y $p; done

# Add Docker's GPG key + repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

## Post-install

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker $USER        # and: sudo usermod -aG docker deploy
# log out/in for group membership to apply
docker run --rm hello-world
```

## Daemon config — log rotation

Prevent container logs from filling the disk. `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" },
  "live-restore": true
}
```

`live-restore` keeps containers running across Docker daemon restarts. Apply:

```bash
sudo systemctl restart docker
```

## Dockerfiles

The apps build to images in CI (pushed to GHCR). Both use multi-stage builds.

**`backend/Dockerfile`** (NestJS): `deps → build (prisma generate + nest build) → runtime (node dist/main.js)`, keeping `prisma/` for `migrate deploy`.

**`frontend/Dockerfile`** (Next.js standalone): builds with `output: 'standalone'`; `NEXT_PUBLIC_API_URL` passed as a build-arg per environment (baked at build time). See [11](./11-github-actions.md) for the build args and [07](./07-docker-compose.md) for runtime wiring.

`.dockerignore` (repo root):

```
node_modules
**/node_modules
**/.next
**/dist
.git
*.md
.env*
sample-ui
```

Next: [07-docker-compose.md](./07-docker-compose.md).
