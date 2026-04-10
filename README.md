# 🚀 Online Learning Platform: Getting Started Guide

This project is a unified full-stack application featuring a **Next.js (App Router)** frontend and a **Self-Hosted Supabase** backend, all orchestrated via **Docker Compose**.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
*   **Docker & Docker Compose** (Required for the database, auth, and API layers).
*   **Node.js (v18+) & npm** (Optional for local linting/types, but all execution happens in Docker).
*   **Git**

---

## 🛠️ Installation & Setup

### 1. Initialize the Environment
Navigate to the project root and ensure your environment variables are set. A default `.env` file has been generated for you with secure-ish defaults for local development.

```zsh
cd online-learning-platform
# Verify .env exists and contains ANON_KEY, JWT_SECRET, etc.
cat .env
```

### 2. Launch the Unified Stack
This command starts the database, all Supabase microservices (Auth, API, Studio), and the Next.js frontend in a single network.

```zsh
docker compose up -d
```

### 3. Initialize the Database Schema (CRITICAL)
Supabase is running, but the tables and security policies are not yet created.
1.  Open your browser to **Supabase Studio**: [http://localhost:8000](http://localhost:8000)
2.  In the left sidebar, click on **SQL Editor**.
3.  Click **New Query**.
4.  Open the file `supabase_schema.sql` (found in the project root) in your code editor.
5.  **Copy all contents** of `supabase_schema.sql` and paste them into the Supabase SQL Editor.
6.  Click **Run**.

---

## 🌐 Accessing the Platform

| Service | URL | Description |
| :--- | :--- | :--- |
| **Next.js App** | [http://localhost:3000](http://localhost:3000) | The main student/instructor portal. |
| **Supabase Studio** | [http://localhost:8000](http://localhost:8000) | Database dashboard (Postgres, Auth, Logs). |
| **API Gateway** | [http://localhost:8000/rest/v1](http://localhost:8000/rest/v1) | Direct access to the PostgREST API. |

---

## 💻 Development Workflow

### Hot-Reloading
The `web` service in `docker-compose.yml` mounts your local `./web` directory as a volume. Any changes you make to the code on your host machine will trigger an instant hot-reload inside the container.

### Directory Structure
```text
online-learning-platform/
├── web/                  # Next.js Frontend
│   ├── app/              # App Router (Pages & Layouts)
│   ├── components/       # UI & Logic Components
│   ├── lib/supabase/     # Supabase client & middleware config
│   └── actions/          # Server Actions (DB mutations/fetches)
├── volumes/              # Persistent Docker data (DB, Storage)
├── docker-compose.yml    # Orchestration config
└── supabase_schema.sql   # Database source of truth
```

### Networking Logic
The platform uses a "Hybrid Networking" approach:
*   **Client-side (Browser):** Requests are sent to `http://localhost:8000`.
*   **Server-side (Next.js SSR/Actions):** Requests are sent to `http://kong:8000` via the internal Docker network for high performance and reliability.

---

## 🔐 Security & Roles

The platform implements **Row Level Security (RLS)**. By default, three roles are supported:
1.  **Student:** Can view published courses and track their own progress.
2.  **Instructor:** Can create, edit, and delete their own courses.
3.  **Admin:** Full system access.

**Note:** When a user signs up via the app, they are assigned the `student` role by default via a database trigger. To test instructor features, manually update a user's role in the `profiles` table using Supabase Studio.

---

## 📜 Common Commands

| Command | Action |
| :--- | :--- |
| `docker compose up -d` | Start the platform in the background. |
| `docker compose stop` | Stop all services without removing containers. |
| `docker compose down -v` | Stop services and **delete all database data**. |
| `docker compose logs -f web` | View real-time Next.js server logs. |
| `docker compose logs -f db` | View real-time PostgreSQL logs. |

---

## ⚠️ Troubleshooting
*   **Next.js can't connect to Supabase:** Ensure `docker compose up` is fully finished. The database and Kong gateway can take ~20 seconds to become "Healthy".
*   **Auth redirects failing:** Check the `SITE_URL` in your `.env` file; it should match your Next.js address (`http://localhost:3000`).
*   **Permission Denied:** If you receive errors when fetching courses, ensure you have executed the `supabase_schema.sql` in the Studio SQL Editor.
