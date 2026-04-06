# ============================================================
# DeepFinance Frontend — Multi-stage Docker build
# ============================================================
# Builds the React + Vite SPA and serves it with `serve`
# VITE_API_URL is baked in at build time via ARG → ENV
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept VITE_API_URL at build time (Railway passes env vars as build args)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy root package files first (for workspace resolution)
COPY package.json package-lock.json* ./

# Copy workspace package.json files needed for install
COPY packages/shared/package.json packages/shared/
COPY packages/frontend/package.json packages/frontend/

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/frontend/ packages/frontend/
COPY tsconfig.base.json ./

# Build shared package FIRST (frontend depends on it)
RUN npm run build --workspace=packages/shared

# Build frontend (Vite bakes VITE_API_URL into the JS bundle)
RUN npm run build --workspace=packages/frontend

# ── Stage 2: Production ────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built static files from builder
COPY --from=builder /app/packages/frontend/dist ./dist

ENV NODE_ENV=production

EXPOSE 5173

# Serve the SPA on 0.0.0.0 with fallback for client-side routing
CMD ["sh", "-c", "serve dist -s -l tcp://0.0.0.0:${PORT:-5173}"]
