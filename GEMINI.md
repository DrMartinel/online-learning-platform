@AGENTS.md

# GEMINI.md - Online Learning Platform

## Project Overview

A full-stack online learning platform (OLP) built with a **Next.js** frontend, a **Node.js/Fastify** backend following **Clean Architecture**, and a **self-hosted Supabase** infrastructure.

### Architecture

- **Frontend (`frontend/`):** Next.js 16 (App Router). Acting as a thin BFF, it proxies HTTP requests to the backend service via route handlers in `app/api/`.
- **Backend (`backend/`):** Node.js API using Fastify. Follows Clean Architecture (Domain, Application, Infrastructure, Presentation).
  - **Validation:** Zod schemas in `application/dtos/` are used for request/response validation and type inference.
  - **Documentation:** OpenAPI 3 / Swagger UI is available at `/docs` (port 3003 in dev).
- **Infrastructure:** Full Supabase stack (Postgres, Auth, Kong, PostgREST, Realtime, Storage, Studio, etc.) orchestrated via Docker Compose.

## Key Technologies

- **Frontend:** Next.js, React, Tailwind CSS, Supabase SSR.
- **Backend:** Fastify, Zod, Supabase JS Client, TypeScript.
- **Database/Auth:** PostgreSQL (v15), GoTrue (Auth), Kong (Gateway).
- **Orchestration:** Docker Compose.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ & npm

### Environment Setup

1. Create a `.env` file in the root based on `.env.example`.
2. Generate required keys using provided utilities:
   ```bash
   sh ./utils/generate-keys.sh
   sh ./utils/add-new-auth-keys.sh
   ```
3. Ensure `POSTGRES_PASSWORD` is set before the first run.

### Critical Commands

| Command                    | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `npm run dev`              | Starts the dev stack (Supabase + hot-reload frontend/backend) |
| `npm run dev:reset`        | Nukes volumes and orphans, then restarts the dev stack        |
| `npm run dev:volume-reset` | **Deletes local DB and storage data** on disk                 |
| `npm run build`            | Local build (Next.js + Backend TSC)                           |
| `npm run start`            | Runs the production-style stack                               |

## Development Conventions

### Backend Structure

- **Domain:** Entities, repositories (interfaces), and business errors.
- **Application:** Use cases and DTOs (Zod schemas).
- **Infrastructure:** Supabase repository implementations and external services.
- **Presentation:** Fastify handlers, routes, and OpenAPI registration.

### API Contracts

- Always define request/response shapes using **Zod** in `backend/src/application/dtos/`.
- Backend types should be inferred from these schemas.
- The frontend should stay in sync with these DTOs via the proxy layer.

### Database Migrations

- Place new SQL migrations in `backend/migrations/`.
- Migrations are automatically applied on a fresh database volume via `volumes/db/run-user-migrations.sh`.
- To apply new migrations to an existing volume, use Supabase Studio or reset the volume.

### Security

- Use Row Level Security (RLS) in Postgres for data protection.
- The `SERVICE_ROLE_KEY` should **never** be exposed to the client.

## Troubleshooting

- **Memory Issues:** `NODE_OPTIONS=--max-old-space-size=8192` is often required for backend `tsc`.
- **Auth Failures:** Usually caused by mismatched `POSTGRES_PASSWORD` or `JWT_SECRET` after volume initialization. Reset volumes if secrets change.
- **URLs:** Default dev ports are `3002` (Frontend), `3003` (Backend API), and `8000` (Supabase Studio/Gateway).
