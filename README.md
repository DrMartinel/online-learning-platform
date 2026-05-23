# Online Learning Platform

Full-stack learning platform with a **Next.js (App Router)** frontend, a **Node HTTP API** (business logic), and **self-hosted Supabase** (Postgres, Auth, Kong, Studio, and related services), orchestrated with **Docker Compose**.

## Architecture

- **Frontend** (`frontend/`): Next.js 16. Route handlers under `app/api/` act as a thin BFF: they **proxy HTTP requests** to the backend service using `BACKEND_URL`. The frontend does **not** import the backend package as a library.
- **Backend API** (`backend/`): A **NestJS** application structured using Feature-Based Modular Architecture (e.g., `auth`, `user`, `course`, `lesson`). Each module is divided into layered directories (`controllers/`, `services/`, `repositories/`, and `test/`). Request and response shapes are defined with **Zod** using `nestjs-zod`, enabling seamless validation and OpenAPI/Swagger documentation generation. **Swagger UI** is available at `/docs` (e.g., port **3003** on the host when using Compose). Security is strictly enforced using a custom **IAM/RBAC module** with `@Auth()` decorators and URN-based permissions.
- **Supabase stack**: Postgres, GoTrue (auth), Kong (API gateway), PostgREST, Realtime, Storage, Studio, Analytics, Edge Functions, pooler, etc., defined in the Compose files below.

```
Browser → Next.js (e.g. /api/auth/signup) → Backend HTTP API → Supabase (Kong)
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ and pnpm (optional; useful for local lint/typecheck without Docker)
- Git

## Environment

Copy or create a `.env` at the repository root. It must define Supabase-related variables (for example `ANON_KEY`, `JWT_SECRET`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, ports, and URLs). The stack reads this file when you run Compose.

**Important:** `POSTGRES_PASSWORD` is applied when the Postgres data directory is **first** initialized. If you change `POSTGRES_PASSWORD` in `.env` after `./volumes/db/data` already exists, services such as analytics and auth will fail with `password authentication failed` until you either restore the old password or **reset the DB volume** (see Troubleshooting).

## Docker Compose layout

| File                     | Purpose                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docker-compose.yml`     | **Production-style** builds: `frontend/Dockerfile` and `backend/Dockerfile` bake source and dependencies into isolated images tagged `prod`. No bind mounts for app source.                                                                           |
| `docker-compose.dev.yml` | **Development**: same Supabase services as production compose, plus `app` and `backend` built from `frontend/Dockerfile.dev` and `backend/Dockerfile.dev` tagged `dev`, with **bind-mounted** `./frontend` and `./backend` for live reload. |

Optional overrides (S3 storage, nginx, etc.) remain as separate `docker-compose.*.yml` files in the repo; combine them with `-f` when needed.

**Docker build context:** `frontend/.dockerignore` and `backend/.dockerignore` exclude `node_modules`, build output (`.next` / `dist`), and other junk so `docker build` sends less to the daemon and does not layer host artifacts into the image. The backend production Dockerfile also runs `rm -rf dist` before `tsc` so each image build compiles from a clean output directory (helps reproducibility; memory savings are modest compared to TypeScript’s own work).

**Backend `npm ci` in Docker:** The backend `package.json` defines a `prepare` script that runs `tsc`. During the image **deps** layer only `package.json` / lockfile are present, so `prepare` must not run there. The backend `Dockerfile` uses `npm ci --ignore-scripts` in that stage; the real build runs later after `COPY` of the full source.

## NPM scripts (repository root)

Run these from the project root:

| Script                     | Command                                                      | Description                                                                                                                                |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm run dev`             | `docker compose -f docker-compose.dev.yml up --build -d`     | Start the **dev** stack (Supabase + hot-reload frontend/backend).                                                                          |
| `pnpm run dev:down`        | `docker compose -f docker-compose.dev.yml down`              | Stop the dev stack.                                                                                                                        |
| `pnpm run dev:reset`       | Compose down with volumes + up                               | Nuclear reset of dev stack volumes/orphans; use when things are inconsistent.                                                              |
| `pnpm run dev:volume-reset`| Removes `./volumes/db/data` and `./volumes/storage`          | **Deletes local DB and file storage** on disk; stop Compose first. Then bring the stack up again so Postgres re-inits with current `.env`. |
| `pnpm run build`           | Builds `frontend` then `backend` with local `npm run build`  | Compile Next.js and TypeScript **without Docker** (run from repo root after `pnpm install` in each app).                                   |
| `pnpm run build:docker`    | `docker compose -f docker-compose.yml build`                 | Build **production Docker images** (requires Docker).                                                                                      |
| `pnpm run start`           | `docker compose -f docker-compose.yml up -d`                 | Run **production** stack in the background.                                                                                                |
| `pnpm run stop`            | `docker compose -f docker-compose.yml down`                  | Stop production stack.                                                                                                                     |

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

- **Clean slate:** stop Compose, remove `./volumes/db/data` (or use `pnpm run dev:volume-reset` after stopping), then start again so init runs with your current `.env`.
- **Manual:** run SQL in Supabase Studio's SQL editor against your project.

### IAM data seeding

After a fresh database initialization, you must seed the IAM roles and permissions:

```bash
docker exec -it olp-backend pnpm run load-iam
```

This runs `backend/src/utils/load-iam-data.ts`, which reads the role-to-permission mapping from `backend/src/iam/iam.constants.ts` and upserts the `iam_roles`, `iam_permissions`, and `iam_role_permissions` tables. The admin role automatically receives all permissions.

## Local development without Docker (optional)

- **Frontend:** `cd frontend && pnpm install && pnpm run dev`
- **Backend:** `cd backend && pnpm install && pnpm run dev` (set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`, `PORT` as needed)
- Point `BACKEND_URL` at the backend URL your Next dev server should proxy to.

## Testing & Quality Assurance

- **Unit Tests:** Run `pnpm run test` inside the `backend/` directory to execute all Jest unit tests and generate a code coverage report.
- **Pre-commit Hooks:** This repository uses **Husky** to enforce code quality. Every time you attempt to run `git commit`, a pre-commit hook automatically executes the backend unit tests.
- **Coverage Requirement:** The backend has a strictly enforced **70% global code coverage threshold** (for branches, functions, lines, and statements). If your commit causes the coverage to dip below 70%, the pre-commit hook will block the commit.
- **Current status:** 13 test suites, 98 tests, all passing with >98% statement coverage.

## Repository layout

```text
online-learning-platform/
├── backend/
│   ├── Dockerfile              # production image (build + node dist server)
│   ├── Dockerfile.dev          # dev image (deps only; source bind-mounted)
│   ├── migrations/             # SQL migrations (00001 schema, 00002 policies, 00003 IAM)
│   └── src/
│       ├── auth/               # Feature module: Auth (signup, signin, signout)
│       ├── course/             # Feature module: Course (CRUD + admin)
│       ├── database/           # Global Supabase client provider
│       ├── iam/                # IAM module: guards, decorators, constants
│       │   ├── guards/         # AuthGuard (JWT) + PermissionGuard (action URNs)
│       │   ├── decorators/     # @Auth(), @Permission() decorators
│       │   └── iam.constants.ts # DEFAULT_ROLES → action_urn mapping
│       ├── lesson/             # Feature module: Lesson (CRUD + admin)
│       ├── user/               # Feature module: User (profile, admin, progress)
│       │   ├── controllers/    # NestJS HTTP request handlers
│       │   ├── services/       # Core business logic
│       │   ├── repositories/   # Supabase data persistence layer
│       │   ├── dto/            # Zod validation schemas
│       │   └── test/           # Unit tests for the module
│       └── utils/              # Utility scripts (load-iam-data.ts)
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── app/                    # App Router, including api/ route handlers (proxy to backend)
│   ├── components/             # Reusable UI components (admin, layout, etc.)
│   └── lib/supabase/           # Supabase clients (browser/server/middleware)
├── volumes/                    # Docker persistence (db data, storage, kong config, …)
├── docker-compose.yml          # production stack
├── docker-compose.dev.yml      # dev stack (Supabase + app + backend)
├── package.json                # root scripts wrapping docker compose
└── .env                        # secrets and ports (not committed if gitignored)
```

## Security and Identity Access Management (IAM)

Security is handled via a robust Identity and Access Management (IAM) module using **action-based permissions** (no column-based role checks).

1. **Authentication**: Handled via Supabase Auth (GoTrue). The Next.js BFF securely proxies the user's `access_token` to the NestJS backend.
2. **Authorization**: The backend's `AuthGuard` verifies the JWT, while the `PermissionGuard` resolves the user's granted `action_urn`s from the IAM tables and checks them against the endpoint's required permission.
3. **URN-based Permissions**: All endpoints are secured using granular action URNs (e.g., `action:course:create`, `action:admin:user:list`). The guard **never** checks a role name directly — it only checks whether the user's roles grant the required action.
4. **Normalized Schema**: Permissions are dynamically mapped via Postgres tables (`iam_roles`, `iam_permissions`, `iam_role_permissions`, `iam_user_roles`). The `profiles` table has **no `role` column**; roles are resolved entirely from `iam_user_roles`.
5. **Predefined Roles**: Three system roles are defined in `iam.constants.ts`:
   - `role:user:student` — read-only access to courses, lessons, and own profile/progress
   - `role:user:operator` — student permissions + CRUD on courses/lessons + admin panel access
   - `role:user:admin` — all permissions (automatically granted during IAM seeding)

New users are automatically assigned `role:user:student` via a database trigger on signup.

## Troubleshooting

- **Node.js `JavaScript heap out of memory` during `next build` or `tsc`:** The default V8 heap (~2GB on 64-bit) is often too small. This repo sets `NODE_OPTIONS=--max-old-space-size=4096` for **Next.js** builds and **8192** for **backend `tsc`** (declaration emit and dependency types can use several GB). Production Dockerfiles set the same; `backend/Dockerfile.dev` sets **8192** for the dev container. If it still fails, raise further or add RAM/swap. On Windows, use `cross-env` or set `NODE_OPTIONS` in the environment.
- **Postgres `invalid_password` / `supabase_admin` (or similar) auth failures:** The data directory was initialized with a different `POSTGRES_PASSWORD` than your current `.env`. Stop Compose, remove `./volumes/db/data`, confirm `.env`, then start again—or restore the old password to match the existing volume.
- **Next.js cannot reach Supabase:** Wait until Kong and `db` are healthy; cold start can take a minute.
- **Auth redirects:** `SITE_URL` and related URLs in `.env` should match how users open the app (for example `http://localhost:3002` if that is your published app port).
- **Kong / Studio not on 8000:** Check `KONG_HTTP_PORT` in `.env`.

## Legacy compose note

Older docs referred to `docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml`. Dev overrides now live in **`docker-compose.dev.yml`** at the repo root; use `pnpm run dev` or `docker compose -f docker-compose.dev.yml up` instead.
