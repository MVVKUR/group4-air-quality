# syntax=docker/dockerfile:1.7
# Multi-stage build for the ChildAir dashboard (frontend).
#   Stage 1 (build):  install deps + produce static bundle in /app/dist
#   Stage 2 (runtime): nginx serving the bundle, SPA fallback to index.html

ARG NODE_VERSION=20-alpine
ARG NGINX_VERSION=1.27-alpine

# ---------- Stage 1: build ---------------------------------------------------
FROM docker.io/library/node:${NODE_VERSION} AS build
WORKDIR /app

# Install deps with predictable cache layer.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy the rest and build.
COPY . .
# Token is no longer baked in — frontend talks to /api/* on the same origin.
RUN npm run build

# ---------- Stage 2: nginx runtime ------------------------------------------
FROM docker.io/library/nginx:${NGINX_VERSION} AS runtime

# Healthcheck dependency
RUN apk add --no-cache curl

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
