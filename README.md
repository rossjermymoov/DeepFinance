# DeepFinance

**Complete Financial Management Module for Deep-Stack**

DeepFinance is the core accounting engine within the Deep-Stack platform. It handles accounting, reporting, forecasting, invoicing, expense management, and fixed asset tracking for every business that runs on Deep-Stack, regardless of industry.

## Architecture

```
packages/
  shared/       # TypeScript types shared between backend and frontend
  backend/      # NestJS API (Node.js + TypeScript + PostgreSQL)
  frontend/     # React + TypeScript + Vite
```

### Tech Stack

- **Backend:** NestJS + TypeScript + TypeORM
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Package Manager:** npm workspaces (monorepo)

## Prerequisites

- Node.js >= 20
- Docker and Docker Compose (for local database)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/rossjermymoov/DeepFinance.git
cd DeepFinance

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL and Redis
docker compose up -d

# Build shared types
npm run build --workspace=packages/shared

# Start backend and frontend in development mode
npm run dev
```

The API will be available at `http://localhost:3000/api` with Swagger docs at `http://localhost:3000/api/docs`.

The frontend will be available at `http://localhost:5173`.

## Project Structure

### Backend Modules

| Module | Purpose | Status |
|--------|---------|--------|
| `accounts` | Chart of Accounts CRUD | Scaffolded |
| `journals` | General Ledger & journal processing | Scaffolded |
| `contacts` | Customer & supplier management | Stub |
| `invoices` | Accounts Receivable | Stub |
| `bills` | Accounts Payable | Stub |
| `bank` | Bank reconciliation & feeds | Stub |
| `tax` | VAT & Making Tax Digital | Stub |
| `entities` | Legal entity management | Scaffolded |
| `tenants` | Multi-tenant management | Scaffolded |
| `periods` | Financial period management | Stub |
| `reports` | Financial reporting engine | Stub |

### Database

- Schema: `core` (main accounting tables)
- Schema: `audit` (audit trail - future)
- Schema: `config` (system configuration - future)

Migrations are managed via TypeORM. Run with:

```bash
npm run db:migrate
```

## Scripts

```bash
npm run dev            # Start backend + frontend in watch mode
npm run dev:backend    # Start backend only
npm run dev:frontend   # Start frontend only
npm run build          # Build all packages
npm run test           # Run backend tests
npm run lint           # Lint all packages
npm run db:migrate     # Run database migrations
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
```

## Environment Variables

See `.env.example` for all configuration options.

## Licence

Proprietary - Deep-Stack
