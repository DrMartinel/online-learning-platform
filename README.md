# Online Learning Platform

Full-stack learning platform with a **Next.js (App Router)** frontend, a **NestJS** backend, and **self-hosted Supabase** (Postgres, Auth, Kong, Studio, Analytics, and related services), orchestrated with **Docker Compose**.

## Architecture       
       
- **Frontend** (`frontend/`): Next.js 16. Route handlers under `app/api/` act as a thin BFF: they **proxy HTTP requests** to the backend service using `BACKEND_URL`. The frontend does **not** import the backend package as a library.
- **Backend API** (`backend/`): A **NestJS** application structured using Feature-Based Modular Architecture (e.g., `auth`, `user`, `course`, `lesson`, `iam`, `system-analytics`). Each module is divided into layered directories (`controllers/`, `services/`, `repositories/`, `dto/`, and `test/`). Request and response shapes are defined with **Zod** using `nestjs-zod`, enabling seamless validation and OpenAPI/Swagger documentation generation. **Swagger UI** is available at `/docs` (e.g., port **3003** on the host when using Compose). Security is strictly enforced using a custom **IAM/RBAC module** with `@Auth()` decorators and URN-based permissions.
- **Supabase stack**: Postgres, GoTrue (auth), Kong (API gateway), PostgREST, Realtime, Storage, Studio, Logflare Analytics, Vector, Edge Functions, Supavisor pooler, etc., defined in the Compose files below.
          
```
Browser → Next.js (e.g. /api/auth/signup) → Backend HTTP API → Supabase (Kong)
```

## Quick Start

Follow these steps to get the full stack running locally from scratch.
         
### 1. Prerequisites

- **Docker** and **Docker Compose** (v2+)
- **Node.js 20+** and **pnpm** (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- **Git**

### 2. Clone the Repository
       
```bash
git clone https://github.com/DrMartinel/online-learning-platform.git
cd online-learning-platform
```
       
### 3. Configure Environment Variables

```bash
cp .env.example .env
```       

Generate the required secret keys:
     
```bash
sh ./utils/generate-keys.sh       
sh ./utils/add-new-auth-keys.sh   
```

Open `.env` and set `POSTGRES_PASSWORD` to a strong, unique password.

> [!IMPORTANT]
> `POSTGRES_PASSWORD` is applied when the Postgres data directory is **first initialized**. If you change it after `./volumes/db/data` already exists, services like analytics and auth will fail with `password authentication failed` until you either restore the old password or **reset the DB volume** (`pnpm run dev:volume-reset`).

### 4. Start the Development Stack

```bash
pnpm install
pnpm run dev
```

This builds and starts all containers (Supabase infrastructure + frontend + backend) and automatically tails the app logs. On first run, Postgres will initialize the database schema from `backend/migrations/`.

### 5. Seed IAM Roles and Permissions

After the containers are healthy (wait ~30 seconds on first boot):

```bash
docker exec -it olp-backend pnpm run load-iam
```

This seeds the `iam_roles`, `iam_permissions`, and `iam_role_permissions` tables from `backend/src/iam/iam.constants.ts`. The admin role automatically receives all permissions.

### 6. Verify It's Working

| Service                          | URL                                                  |
| -------------------------------- | ---------------------------------------------------- |
| Next.js app                      | `http://localhost:3002`                               |
| Backend API (Swagger UI)         | `http://localhost:3003/docs`                          |
| Supabase Studio (via Kong)       | `http://localhost:8000`                               |

You're ready to go! Sign up at `http://localhost:3002`, then use the Supabase Studio or IAM seeding to grant yourself an admin role.

---

## Docker Compose Layout

| File                     | Purpose                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`     | **Production-style** builds: `frontend/Dockerfile` and `backend/Dockerfile` bake source and dependencies into isolated images. No bind mounts for app source.                     |
| `docker-compose.dev.yml` | **Development**: same Supabase services plus `app` and `backend` built from `Dockerfile.dev` files, with **bind-mounted** `./frontend` and `./backend` for live reload.            |

Optional overrides for additional infra:

| File                          | Purpose                          |
| ----------------------------- | -------------------------------- |
| `docker-compose.s3.yml`       | MinIO S3 storage backend         |
| `docker-compose.caddy.yml`    | Caddy reverse proxy with TLS     |
| `docker-compose.nginx.yml`    | Nginx reverse proxy with TLS     |
| `docker-compose.pg17.yml`     | PostgreSQL 17 upgrade            |
| `docker-compose.rustfs.yml`   | Rust-based file storage          |

Combine with `-f` when needed (e.g., `docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d`).

## NPM Scripts (Repository Root)

Run these from the project root using `pnpm`:

| Script                      | Description                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm run dev`              | Start the **dev** stack (Supabase + hot-reload frontend/backend) and tail logs.                                 |
| `pnpm run dev:down`         | Stop the dev stack.                                                                                            |
| `pnpm run dev:logs`         | Tail frontend and backend container logs.                                                                      |
| `pnpm run dev:reset`        | Nuclear reset: destroy all dev volumes/orphans, then rebuild and restart.                                      |
| `pnpm run dev:volume-reset` | **Delete local DB and file storage** on disk. Stop Compose first, then bring the stack up again.               |
| `pnpm run build`            | Build **production Docker images** via `docker compose -f docker-compose.yml build`.                           |
| `pnpm run start`            | Run **production** stack in the background.                                                                    |
| `pnpm run stop`             | Stop production stack.                                                                                         |
-------------------------------
## Typical URLs and Ports

Defaults depend on `.env` (for example `KONG_HTTP_PORT`). Commonly:

| Service                          | URL / port                                             |
| -------------------------------- | ------------------------------------------------------ |
| Next.js app (Compose)            | `http://localhost:3002` (maps container port 3000)     |
| Backend HTTP API (Compose)       | `http://localhost:3003` (maps container port 3001)     |
| Supabase API / Studio (via Kong) | `http://localhost:8000` if `KONG_HTTP_PORT=8000`       |

Adjust if your `.env` changes host ports.

## API Contracts (Zod and OpenAPI)

- **Zod** (`backend` dependencies): DTOs such as sign-up and sign-in are `z.object(...)` schemas in each feature's `dto/` folder. Types are inferred using `createZodDto` from `nestjs-zod` for use in controllers and services.
- **OpenAPI / Swagger**: By using `@nestjs/swagger` and `nestjs-zod`, the Swagger documentation is automatically generated from the DTOs without needing parallel hand-written OpenAPI models.

## Database Migrations

SQL migrations live under `backend/migrations/`:

| Migration                        | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `00001_initial_schema.sql`       | Core tables (profiles, courses, lessons, etc.)|
| `00002_user_progress_policy.sql` | RLS policies for user progress tracking      |
| `00003_iam_schema.sql`           | IAM tables (roles, permissions, mappings)    |
| `00004_course_media_bucket.sql`  | Supabase Storage bucket for course media     |

On a **fresh** Postgres volume, init scripts apply them automatically (see `volumes/db/run-user-migrations.sh`).

If you add migrations later:

- **Clean slate:** stop Compose, remove `./volumes/db/data` (or use `pnpm run dev:volume-reset` after stopping), then start again so init runs with your current `.env`.
- **Manual:** run SQL in Supabase Studio's SQL editor against your project.

### IAM Data Seeding

After a fresh database initialization, you must seed the IAM roles and permissions:

```bash
docker exec -it olp-backend pnpm run load-iam
```

This runs `backend/src/utils/load-iam-data.ts`, which reads the role-to-permission mapping from `backend/src/iam/iam.constants.ts` and upserts the `iam_roles`, `iam_permissions`, and `iam_role_permissions` tables. The admin role automatically receives all permissions.

## Local Development Without Docker (Optional)

- **Frontend:** `cd frontend && pnpm install && pnpm run dev`
- **Backend:** `cd backend && pnpm install && pnpm run dev` (set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`, `PORT` as needed)
- Point `BACKEND_URL` at the backend URL your Next dev server should proxy to.

> [!NOTE]
> You still need Docker for the Supabase infrastructure (Postgres, Auth, Kong, etc.) — only the frontend and backend can run natively.

## Testing & Quality Assurance

- **Unit Tests:** Run `pnpm run test` inside the `backend/` directory to execute all Jest unit tests and generate a code coverage report.
- **Pre-commit Hooks:** This repository uses **Husky** to enforce code quality. Every time you attempt to run `git commit`, a pre-commit hook automatically executes the backend unit tests.
- **Coverage Requirement:** The backend has a strictly enforced **70% global code coverage threshold** (for branches, functions, lines, and statements). If your commit causes the coverage to dip below 70%, the pre-commit hook will block the commit.
- **Current status:** 17 test suites, 155 tests, all passing with >89% branch and >98% statement coverage.

## Repository Layout

```text
online-learning-platform/
├── backend/
│   ├── Dockerfile              # production image (build + node dist server)
│   ├── Dockerfile.dev          # dev image (deps only; source bind-mounted)
│   ├── migrations/             # SQL migrations (schema, policies, IAM, storage)
│   └── src/
│       ├── auth/               # Feature module: Auth (signup, signin, signout)
│       ├── course/             # Feature module: Course (CRUD + admin)
│       ├── database/           # Global Supabase client provider
│       ├── iam/                # IAM module: guards, decorators, admin CRUD, constants
│       │   ├── guards/         # AuthGuard (JWT) + PermissionGuard (action URNs)
│       │   ├── decorators/     # @Auth(), @Permission() decorators
│       │   ├── controllers/    # IAM admin API (roles, permissions management)
│       │   ├── services/       # IAM admin service (Supabase queries)
│       │   ├── dto/            # Zod schemas for IAM requests/responses
│       │   ├── test/           # Unit tests for IAM module
│       │   └── iam.constants.ts # DEFAULT_ROLES → action_urn mapping
│       ├── lesson/             # Feature module: Lesson (CRUD + admin)
│       ├── system-analytics/   # System Analytics module (request volume, error tracking)
│       │   ├── controllers/    # Admin analytics API endpoints
│       │   ├── services/       # Postgres _analytics queries
│       │   ├── dto/            # MetricPoint Zod schemas
│       │   └── test/           # Unit tests for analytics module
│       ├── user/               # Feature module: User (profile, admin, progress)
│       │   ├── controllers/    # NestJS HTTP request handlers
│       │   ├── services/       # Core business logic
│       │   ├── repositories/   # Supabase data persistence layer
│       │   ├── dto/            # Zod validation schemas
│       │   └── test/           # Unit tests for the module
│       └── utils/              # Utility scripts (load-iam-data.ts)
├── frontend/
│   ├── Dockerfile              # production image (pnpm build + standalone runner)
│   ├── Dockerfile.dev          # dev image (deps only; source bind-mounted)
│   ├── app/                    # App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (main)/             # Main pages (home, courses, learn)
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # Route handlers (BFF proxy to backend)
│   │   └── actions/            # Server Actions (IAM checks)
│   ├── components/             # Reusable UI components
│   │   ├── admin/              # Admin dashboard, SystemMetrics, IAM management
│   │   ├── courses/            # Course cards, catalog, enrollment, lesson forms
│   │   ├── learn/              # Video player, lesson sidebar, progress tracking
│   │   ├── layout/             # Shared layout components (navbar, footer)
│   │   └── user/               # User profile components
│   └── lib/supabase/           # Supabase clients (browser/server/middleware)
├── volumes/                    # Docker persistence (db data, storage, kong config, …)
├── utils/                      # Key generation and DB utility scripts
├── docker-compose.yml          # Production stack
├── docker-compose.dev.yml      # Dev stack (Supabase + app + backend)
├── package.json                # Root scripts wrapping docker compose
└── .env                        # Secrets and ports (not committed)
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
6. **Admin IAM API**: Full CRUD endpoints under `/admin/iam/` for managing roles, permissions, and role-permission assignments at runtime.

New users are automatically assigned `role:user:student` via a database trigger on signup.

## System Analytics

The platform includes a **System Analytics** module that queries Supabase's Logflare analytics backend (via the `_analytics` Postgres schema) to provide:

- **Request Volume**: Hourly request counts over the last 24 hours
- **Error Rate**: Hourly 4xx/5xx error counts over the last 24 hours

These metrics are visualized on the admin dashboard using interactive **Recharts** line and bar charts.

## Troubleshooting

- **Node.js `JavaScript heap out of memory` during `next build` or `tsc`:** The default V8 heap (~2GB on 64-bit) is often too small. This repo sets `NODE_OPTIONS=--max-old-space-size=4096` for **Next.js** builds and **8192** for **backend `tsc`** (declaration emit and dependency types can use several GB). Production Dockerfiles set the same; `backend/Dockerfile.dev` sets **8192** for the dev container. If it still fails, raise further or add RAM/swap. On Windows, use `cross-env` or set `NODE_OPTIONS` in the environment.
- **Postgres `invalid_password` / `supabase_admin` (or similar) auth failures:** The data directory was initialized with a different `POSTGRES_PASSWORD` than your current `.env`. Stop Compose, remove `./volumes/db/data`, confirm `.env`, then start again—or restore the old password to match the existing volume.
- **Next.js cannot reach Supabase:** Wait until Kong and `db` are healthy; cold start can take a minute.
- **Auth redirects:** `SITE_URL` and related URLs in `.env` should match how users open the app (for example `http://localhost:3002` if that is your published app port).
- **Kong / Studio not on 8000:** Check `KONG_HTTP_PORT` in `.env`.
- **Pre-commit hook failing:** Usually means branch coverage dropped below 70%. Run `cd backend && pnpm run test` to see which files need more test coverage.
- **Containers not starting:** Run `docker compose -f docker-compose.dev.yml logs` to see which service is failing. Common cause is missing `.env` variables — compare with `.env.example`.

## Legacy Compose Note

Older docs referred to `docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml`. Dev overrides now live in **`docker-compose.dev.yml`** at the repo root; use `pnpm run dev` or `docker compose -f docker-compose.dev.yml up` instead.


## Online Learning Platform

