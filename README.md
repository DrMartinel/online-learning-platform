# Online Learning Platform

Full-stack learning platform with a **Next.js (App Router)** frontend, a **Node HTTP API** (business logic), and **self-hosted Supabase** (Postgres, Auth, Kong, Studio, and related services), orchestrated with **Docker Compose**.

## Architecture

- **Frontend** (`frontend/`): Next.js 16. Route handlers under `app/api/`* act as a thin BFF: they **proxy HTTP requests** to the backend service using `BACKEND_URL`. The frontend does **not** import the backend package as a library.
- **Backend API** (`backend/`): Clean Architecture (domain, application, infrastructure). A **Fastify** server exposes HTTP routes (for example `/auth/signup`, `/auth/login`, `/auth/logout`, `/health`) and uses the Supabase JS client with `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- **Supabase stack**: Postgres, GoTrue (auth), Kong (API gateway), PostgREST, Realtime, Storage, Studio, Analytics, Edge Functions, pooler, etc., defined in the Compose files below.

```
Browser → Next.js (e.g. /api/auth/signup) → Backend HTTP API → Supabase (Kong)
```

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm (optional; useful for local lint/typecheck without Docker)
- Git

## Environment

Copy or create a `.env` at the repository root. It must define Supabase-related variables (for example `ANON_KEY`, `JWT_SECRET`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, ports, and URLs). The stack reads this file when you run Compose.

**Important:** `POSTGRES_PASSWORD` is applied when the Postgres data directory is **first** initialized. If you change `POSTGRES_PASSWORD` in `.env` after `./volumes/db/data` already exists, services such as analytics and auth will fail with `password authentication failed` until you either restore the old password or **reset the DB volume** (see Troubleshooting).

## Docker Compose layout


| File                     | Purpose                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docker-compose.yml`     | **Production-style** builds: `frontend/Dockerfile` and `backend/Dockerfile` bake source and dependencies into images. No bind mounts for app source.                                                                           |
| `docker-compose.dev.yml` | **Development**: same Supabase services as production compose, plus `app` and `backend` built from `frontend/Dockerfile.dev` and `backend/Dockerfile.dev`, with **bind-mounted** `./frontend` and `./backend` for live reload. |


Optional overrides (S3 storage, nginx, etc.) remain as separate `docker-compose.*.yml` files in the repo; combine them with `-f` when needed.

## NPM scripts (repository root)

Run these from the project root:


| Script                     | Command                                                  | Description                                                                                                                                |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`              | `docker compose -f docker-compose.dev.yml up --build -d` | Start the **dev** stack (Supabase + hot-reload frontend/backend).                                                                          |
| `npm run dev:down`         | `docker compose -f docker-compose.dev.yml down`          | Stop the dev stack.                                                                                                                        |
| `npm run dev:reset`        | Compose down with volumes + up                           | Nuclear reset of dev stack volumes/orphans; use when things are inconsistent.                                                              |
| `npm run dev:volume-reset` | Removes `./volumes/db/data` and `./volumes/storage`      | **Deletes local DB and file storage** on disk; stop Compose first. Then bring the stack up again so Postgres re-inits with current `.env`. |
| `npm run build`            | `docker compose -f docker-compose.yml build`             | Build **production** images.                                                                                                               |
| `npm run start`            | `docker compose -f docker-compose.yml up -d`             | Run **production** stack in the background.                                                                                                |
| `npm run stop`             | `docker compose -f docker-compose.yml down`              | Stop production stack.                                                                                                                     |


Equivalent manual invocations work if you prefer not to use npm.

## Typical URLs and ports

Defaults depend on `.env` (for example `KONG_HTTP_PORT`). Commonly:


| Service                          | URL / port                                             |
| -------------------------------- | ------------------------------------------------------ |
| Next.js app (Compose)            | `http://localhost:3002` (maps container port 3000)     |
| Backend HTTP API (Compose)       | `http://localhost:3003` (maps container port 3001)     |
| Supabase API / Studio (via Kong) | Often `http://localhost:8000` if `KONG_HTTP_PORT=8000` |


Adjust if your `.env` changes host ports.

## Database migrations

SQL migrations live under `backend/migrations/`. On a **fresh** Postgres volume, init scripts can apply them (see `volumes/db/run-user-migrations.sh` and related mounts in Compose).

If you add migrations later:

- **Clean slate:** stop Compose, remove `./volumes/db/data` (or use `npm run dev:volume-reset` after stopping), then start again so init runs with your current `.env`.
- **Manual:** run SQL in Supabase Studio’s SQL editor against your project.

## Local development without Docker (optional)

- **Frontend:** `cd frontend && npm install && npm run dev`
- **Backend:** `cd backend && npm install && npm run build && npm run start` (set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT` as needed)
- Point `BACKEND_URL` at the backend URL your Next dev server should proxy to.

## Repository layout

```text
online-learning-platform/
├── backend/
│   ├── Dockerfile              # production image (build + node dist server)
│   ├── Dockerfile.dev          # dev image (deps only; source bind-mounted)
│   ├── migrations/             # SQL migrations
│   └── src/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/       # handlers + http/ (Fastify routes, server)
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── app/                    # App Router, including api/ route handlers (proxy to backend)
│   └── lib/supabase/           # Supabase clients (browser/server/middleware)
├── volumes/                    # Docker persistence (db data, storage, kong config, …)
├── docker-compose.yml          # production stack
├── docker-compose.dev.yml      # dev stack (Supabase + app + backend)
├── package.json                # root scripts wrapping docker compose
└── .env                        # secrets and ports (not committed if gitignored)
```

## Security and roles

Row Level Security (RLS) is used where configured. New users are typically assigned a default role (for example student) via database triggers; privileged roles may be adjusted in Supabase Studio or SQL.

## Troubleshooting

- **Next.js cannot reach Supabase:** Wait until Kong and `db` are healthy; cold start can take a minute.
- **Auth redirects:** `SITE_URL` and related URLs in `.env` should match how users open the app (for example `http://localhost:3002` if that is your published app port).
- **Kong / Studio not on 8000:** Check `KONG_HTTP_PORT` in `.env`.

## Legacy compose note

Older docs referred to `docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml`. Dev overrides now live in `**docker-compose.dev.yml` at the repo root**; use `npm run dev` or `docker compose -f docker-compose.dev.yml up` instead.