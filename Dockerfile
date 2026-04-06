# ============================================================
# DeepFinance Backend — Multi-stage Docker build
# ============================================================
# Build order matters: shared must compile before backend
# because backend imports @deepfinance/shared types.
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files first (for workspace resolution)
COPY package.json package-lock.json* ./

# Copy workspace package.json files (for dependency resolution)
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/backend/ packages/backend/
COPY tsconfig.base.json ./

# Build shared package FIRST (backend depends on it)
RUN npm run build --workspace=packages/shared

# Build backend
RUN npm run build --workspace=packages/backend

# ── Stage 2: Production ────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy workspace package.json files
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Install production dependencies only
RUN npm install --omit=dev

# Copy built output from builder
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/backend/dist packages/backend/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the backend
CMD ["node", "packages/backend/dist/main.js"]
