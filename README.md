# Online Learning Platform

Full-stack learning platform with a **Next.js (App Router)** frontend, a **Node HTTP API** (business logic), and **self-hosted Supabase** (Postgres, Auth, Kong, Studio, and related services), orchestrated with **Docker Compose**.

## Architecture

- **Frontend** (`frontend/`): Next.js 16. Route handlers under `app/api/` act as a thin BFF: they **proxy HTTP requests** to the backend service using `BACKEND_URL`. The frontend does **not** import the backend package as a library.
- **Backend API** (`backend/`): A **NestJS** application structured using Feature-Based Modular Architecture (e.g., `auth`, `user`, `course`, `lesson`). Each module is divided into layered directories (`controllers/`, `services/`, `repositories/`, and `test/`). Request and response shapes are defined with **Zod** using `nestjs-zod`, enabling seamless validation and OpenAPI/Swagger documentation generation. **Swagger UI** is available at `/docs` (e.g., port **3003** on the host when using Compose).
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

**Docker build context:** `frontend/.dockerignore` and `backend/.dockerignore` exclude `node_modules`, build output (`.next` / `dist`), and other junk so `docker build` sends less to the daemon and does not layer host artifacts into the image. The backend production Dockerfile also runs `rm -rf dist` before `tsc` so each image build compiles from a clean output directory (helps reproducibility; memory savings are modest compared to TypeScript’s own work).

**Backend `npm ci` in Docker:** The backend `package.json` defines a `prepare` script that runs `tsc`. During the image **deps** layer only `package.json` / lockfile are present, so `prepare` must not run there. The backend `Dockerfile` uses `npm ci --ignore-scripts` in that stage; the real build runs later after `COPY` of the full source.

## NPM scripts (repository root)

Run these from the project root:

| Script                     | Command                                                     | Description                                                                                                                                |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`              | `docker compose -f docker-compose.dev.yml up --build -d`    | Start the **dev** stack (Supabase + hot-reload frontend/backend).                                                                          |
| `npm run dev:down`         | `docker compose -f docker-compose.dev.yml down`             | Stop the dev stack.                                                                                                                        |
| `npm run dev:reset`        | Compose down with volumes + up                              | Nuclear reset of dev stack volumes/orphans; use when things are inconsistent.                                                              |
| `npm run dev:volume-reset` | Removes `./volumes/db/data` and `./volumes/storage`         | **Deletes local DB and file storage** on disk; stop Compose first. Then bring the stack up again so Postgres re-inits with current `.env`. |
| `npm run build`            | Builds `frontend` then `backend` with local `npm run build` | Compile Next.js and TypeScript **without Docker** (run from repo root after `npm install` in each app, or use once).                       |
| `npm run build:docker`     | `docker compose -f docker-compose.yml build`                | Build **production Docker images** (requires Docker).                                                                                      |
| `npm run start`            | `docker compose -f docker-compose.yml up -d`                | Run **production** stack in the background.                                                                                                |
| `npm run stop`             | `docker compose -f docker-compose.yml down`                 | Stop production stack.                                                                                                                     |

Equivalent manual invocations work if you prefer not to use npm.

## Typical URLs and ports

Defaults depend on `.env` (for example `KONG_HTTP_PORT`). Commonly:

| Service                          | URL / port                                             |
| -------------------------------- | ------------------------------------------------------ |
| Next.js app (Compose)            | `http://localhost:3002` (maps container port 3000)     |
| Backend HTTP API (Compose)       | `http://localhost:3003` (maps container port 3001)     |
| Supabase API / Studio (via Kong) | Often `http://localhost:8000` if `KONG_HTTP_PORT=8000` |

Adjust if your `.env` changes host ports.

## API contracts (Zod and OpenAPI)

- **Zod** (`backend` dependencies): DTOs such as sign-up and sign-in are `z.object(...)` schemas in each feature's `dto/` folder. Types are inferred using `createZodDto` from `nestjs-zod` for use in controllers and services.
- **OpenAPI / Swagger**: By using `@nestjs/swagger` and `nestjs-zod`, the Swagger documentation is automatically generated from the DTOs without needing parallel hand-written OpenAPI models.

## Database migrations

SQL migrations live under `backend/migrations/`. On a **fresh** Postgres volume, init scripts can apply them (see `volumes/db/run-user-migrations.sh` and related mounts in Compose).

If you add migrations later:

- **Clean slate:** stop Compose, remove `./volumes/db/data` (or use `npm run dev:volume-reset` after stopping), then start again so init runs with your current `.env`.
- **Manual:** run SQL in Supabase Studio’s SQL editor against your project.

## Local development without Docker (optional)

- **Frontend:** `cd frontend && npm install && npm run dev`
- **Backend:** `cd backend && pnpm install && pnpm run start:dev` (set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT` as needed)
- Point `BACKEND_URL` at the backend URL your Next dev server should proxy to.

## Testing & Quality Assurance

- **Unit Tests:** Run `pnpm run test` inside the `backend/` directory to execute all Jest unit tests and generate a code coverage report.
- **Pre-commit Hooks:** This repository uses **Husky** to enforce code quality. Every time you attempt to run `git commit`, a pre-commit hook automatically executes the backend unit tests.
- **Coverage Requirement:** The backend has a strictly enforced **70% global code coverage threshold** (for branches, functions, lines, and statements). If your commit causes the coverage to dip below 70%, the pre-commit hook will block the commit.

## Repository layout

```text
online-learning-platform/
├── backend/
│   ├── Dockerfile              # production image (build + node dist server)
│   ├── Dockerfile.dev          # dev image (deps only; source bind-mounted)
│   ├── migrations/             # SQL migrations
│   └── src/
│       ├── auth/               # Feature module: Auth
│       ├── course/             # Feature module: Course
│       ├── lesson/             # Feature module: Lesson
│       └── user/               # Feature module: User (includes user progress)
│           ├── controllers/    # NestJS HTTP request handlers
│           ├── services/       # Core business logic
│           ├── repositories/   # Supabase data persistence layer
│           ├── dto/            # Zod validation schemas
│           └── test/           # Unit tests for the module
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

- **Node.js `JavaScript heap out of memory` during `next build` or `tsc`:** The default V8 heap (~2GB on 64-bit) is often too small. This repo sets `NODE_OPTIONS=--max-old-space-size=4096` for **Next.js** builds and **8192** for **backend `tsc`** (declaration emit and dependency types can use several GB). Production Dockerfiles set the same; `backend/Dockerfile.dev` sets **8192** for the dev container. If it still fails, raise further or add RAM/swap. On Windows, use `cross-env` or set `NODE_OPTIONS` in the environment.
- **Postgres `invalid_password` / `supabase_admin` (or similar) auth failures:** The data directory was initialized with a different `POSTGRES_PASSWORD` than your current `.env`. Stop Compose, remove `./volumes/db/data`, confirm `.env`, then start again—or restore the old password to match the existing volume.
- **Next.js cannot reach Supabase:** Wait until Kong and `db` are healthy; cold start can take a minute.
- **Auth redirects:** `SITE_URL` and related URLs in `.env` should match how users open the app (for example `http://localhost:3002` if that is your published app port).
- **Kong / Studio not on 8000:** Check `KONG_HTTP_PORT` in `.env`.

## Legacy compose note

Older docs referred to `docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml`. Dev overrides now live in **`docker-compose.dev.yml`** at the repo root; use `npm run dev` or `docker compose -f docker-compose.dev.yml up` instead.
