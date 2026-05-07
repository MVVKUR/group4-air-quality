# Deployment with podman-compose

## On the target host (one-time)

```bash
# Install podman + podman-compose if missing (RHEL/Rocky/Alma example)
sudo dnf install -y podman
pip3 install --user podman-compose
# or: sudo apt install -y podman podman-compose   # Debian/Ubuntu
```

## Bring up the app

```bash
cd ~/jakarta-air

# Set the WAQI token (free: https://aqicn.org/data-platform/token/)
echo 'VITE_WAQI_TOKEN=YOUR_TOKEN_HERE' > .env

# Build and start (rootless OK)
podman-compose up -d --build

# Verify
curl -fsS http://localhost:8080/ | head
podman ps
```

App is now reachable at `http://<server-ip>:8080`.

## Update / redeploy

```bash
cd ~/jakarta-air
git pull            # if you keep this in git
podman-compose up -d --build
```

## Stop / clean up

```bash
podman-compose down
# also remove the image:
podman image rm jakarta-air:latest
```

## Reverse proxy (recommended)

Behind nginx/Caddy/Traefik, terminate TLS upstream and proxy to
`http://127.0.0.1:8080`. The container deliberately does not set HSTS so
your reverse proxy can own that header.

## Logs

```bash
podman logs -f jakarta-air
```

## Healthcheck

The container has a built-in `curl` healthcheck — `podman ps` will show
`(healthy)` once nginx is serving.
