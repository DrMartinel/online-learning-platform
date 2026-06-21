@AGENTS.md

# GEMINI.md - Online Learning Platform

## Project Overview

A full-stack online learning platform (OLP) built with a **Next.js** frontend, a **Node.js/NestJS** backend utilizing feature-based modules, and a **self-hosted Supabase** infrastructure.

### Architecture

- **Frontend (`frontend/`):** Next.js 16 (App Router). Acting as a thin BFF, it proxies HTTP requests to the backend service via route handlers in `app/api/`.
- **Backend (`backend/`):** Node.js API using **NestJS**. Structured into Feature-Based Modules (Auth, User, Course, etc.) grouping Domain, Application, and Presentation concerns per feature.
  - **Validation:** Zod schemas wrapped with `nestjs-zod` in feature `dto/` folders are used for request/response validation and type inference.
  - **Documentation:** OpenAPI 3 / Swagger UI is available at `/docs` (port 3003 in dev).
- **Infrastructure:** Full Supabase stack (Postgres, Auth, Kong, PostgREST, Realtime, Storage, Studio, etc.) orchestrated via Docker Compose.

## Key Technologies

- **Frontend:** Next.js, React, Tailwind CSS, Supabase SSR.
- **Backend:** NestJS, Zod (`nestjs-zod`), Supabase JS Client, TypeScript.
- **Database/Auth:** PostgreSQL (v15), GoTrue (Auth), Kong (Gateway).
- **Orchestration:** Docker Compose.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ & pnpm

### Environment Setup

1. Create a `.env` file in the root based on `.env.example`.
2. Generate required keys using provided utilities:
   ```bash
   sh ./utils/generate-keys.sh
   sh ./utils/add-new-auth-keys.sh
   ```
3. Ensure `POSTGRES_PASSWORD` is set before the first run.

### Critical Commands

| Command                     | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `pnpm run dev`              | Starts the dev stack (Supabase + hot-reload frontend/backend) |
| `pnpm run dev:reset`        | Nukes volumes and orphans, then restarts the dev stack        |
| `pnpm run dev:volume-reset` | **Deletes local DB and storage data** on disk                 |
| `pnpm run build`            | Local build (Next.js + Backend NestJS)                        |
| `pnpm run start`            | Runs the production-style stack                               |
| `pnpm run db:migrate`       | Apply any pending migrations to the running DB container      |
| `pnpm run db:migrate:status`| Show which migrations are applied vs pending                  |

## Development Conventions

### Backend Structure

The backend follows a **Feature-Based Module** structure via NestJS. Each feature (e.g., `course`, `user`) contains:
- **Entities:** Pure domain models (`entities/` folder).
- **DTOs:** `nestjs-zod` schemas defining I/O (`dto/` folder).
- **Service:** Business logic and use cases.
- **Controller:** NestJS HTTP request handlers and Swagger decorators.
- **Repository:** Interfaces and Supabase implementations handling database persistence.

### API Contracts

- Always define request/response shapes using **Zod** within the respective feature's `dto/` folder.
- Backend types should be inferred from these schemas using `createZodDto`.
- The frontend should stay in sync with these DTOs via the proxy layer.

### Database Migrations

- Place new SQL migrations in `backend/migrations/` using the `NNNNN_description.sql` naming convention (e.g. `00013_new_feature.sql`).
- Applied migrations are tracked in the `public.schema_migrations` table — each filename is recorded on first successful execution.
- **Fresh volume:** migrations are auto-applied at DB init time via `volumes/db/run-user-migrations.sh`.
- **Existing volume (e.g. after `git pull`):** apply new migrations without a reset:
  ```bash
  pnpm run db:migrate            # apply pending migrations
  pnpm run db:migrate:status     # check status (does not apply anything)
  ```
- The `db:migrate` command requires the stack to be running (`pnpm run dev`) and is idempotent — already-applied migrations are safely skipped.
- Write new migrations defensively using `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, etc. to keep them idempotent.

### Security

- Use Row Level Security (RLS) in Postgres for data protection.
- The `SERVICE_ROLE_KEY` should **never** be exposed to the client.

## Troubleshooting

- **Memory Issues:** `NODE_OPTIONS=--max-old-space-size=8192` is often required for backend `tsc`.
- **Auth Failures:** Usually caused by mismatched `POSTGRES_PASSWORD` or `JWT_SECRET` after volume initialization. Reset volumes if secrets change.
- **URLs:** Default dev ports are `3002` (Frontend), `3003` (Backend API), and `8000` (Supabase Studio/Gateway).
