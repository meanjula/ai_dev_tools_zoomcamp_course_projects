# 02-coding-interview — CodeCollab

Lightweight collaborative code editor used for interview practice (frontend + backend + Postgres). This README explains how to run the app locally, run it with Docker Compose, handle database migrations, and deploy the frontend to Netlify.

**Quick summary**
- **Frontend:** Vite + React + TypeScript (folder: `code-collab-studio`)
- **Backend:** Node + Express (folder: `backend`)
- **DB:** Postgres (Docker Compose + named volume)

**Table of contents**
- **Prerequisites**
- **Local development**
- **Docker Compose**
- **Database migrations**
- **Running tests**
- **Production (Netlify)**
- **Troubleshooting**
- **Repo layout**

**Prerequisites**
- Node 18+, npm
- Docker & Docker Compose (for containerized workflows)
- Optional: `psql` client for manual DB queries

**Local development**

- Frontend (dev server)
  - Install deps and run dev server:
    ```bash
    cd code-collab-studio
    npm ci
    npm run dev
    ```
  - The Vite dev server serves the app and exposes `import.meta.env` variables from `code-collab-studio/.env`.

- Backend (local)
  - Install deps and start in dev mode:
    ```bash
    cd backend
    npm ci
    npm run dev
    ```
  - Backend listens on `PORT` (default `3000`). Configure DB connection via `backend/.env` (for local Postgres) or environment variables.

**Docker Compose (recommended for full local stack)**

- Create the DB password secret (do NOT commit this):
  ```bash
  mkdir -p secrets
  echo "your-db-password" > secrets/db_password.txt
  chmod 600 secrets/db_password.txt
  ```
- Start the full stack (db, backend, frontend):
  ```bash
  docker compose up --build
  ```
- The compose file exposes:
  - Postgres: `localhost:5432`
  - Backend: `localhost:3000`
  - Frontend (static): `localhost:8080`

- Useful compose commands
  - Stop and remove containers (preserve volumes): `docker compose down`
  - Recreate and wipe volumes (WARNING: deletes DB data): `docker compose down -v && docker compose up --build`
  - Build frontend only: `docker compose build --no-cache frontend`
  - docker ps   
  - docker volume ls 
  - docker images 
  

**Database migrations**

- This project includes `schema.sql` and a migration runner `backend/src/migrate.js`.
- To run migrations (inside the backend container or locally):
  ```bash
  # from host using compose environment
  docker compose run --rm backend npm run migrate

  # or locally (ensure BACKEND env vars point to your Postgres)
  cd backend
  npm run migrate
  ```
- The migration script is idempotent and will create the `codecollab` DB and the required tables if missing.

**Running tests**

- Frontend tests use Vitest. From `code-collab-studio`:
  ```bash
  cd code-collab-studio
  npx vitest --run
  ```
- Backend tests use Mocha (if any):
  ```bash
  cd backend
  npm test
  ```

**Production deployment (Netlify for frontend)**

- Two common strategies:
  1. **Build-time injection (simple):** set `VITE_API_URL` during the frontend build so the compiled assets call your API endpoint (e.g. `https://api.myapp.com/api`). Configure this in Netlify under Site settings → Build & deploy → Environment.
     - Build command: `cd code-collab-studio && npm ci && npm run build`
     - Publish directory: `code-collab-studio/dist`

  2. **Proxy mode (recommended to avoid CORS):** let the frontend call relative `/api/*` and add a Netlify redirect/proxy to forward `/api/*` to your backend. Example `netlify.toml` or `_redirects` can be used (see repo docs above). This avoids cross-origin requests.

- Backend + Postgres: host your backend and DB on a platform like Render, Railway, Fly, or DigitalOcean App Platform. Provide DB connection env vars as secrets and run migrations on deploy.

**Troubleshooting**

- Backend returns 500 / empty error:
  - Check backend logs: `docker compose logs backend --tail 200`
  - Ensure migrations ran and `users` table exists: `docker compose exec db psql -U anjula -d codecollab -c "\dt"`
- Postgres not accepting connections / ECONNREFUSED:
  - Ensure container is running: `docker compose ps`
  - Inspect DB logs: `docker compose logs db --tail 200`
  - If DB init scripts fail, inspect `docker/postgres/init` files
- Frontend 404 on `/api/*`: this usually means the static server served the request instead of proxying it — either set a proper `VITE_API_URL` or configure a proxy (nginx or Netlify redirects).

**Repo layout (top-level)**
- `backend/` — Node/Express server, migrations, Dockerfile
- `code-collab-studio/` — frontend app (Vite + React + TS), Dockerfile
- `docker/` — postgres init scripts
- `secrets/` — local-only secrets (gitignored)
- `schema.sql` — DB schema used by migration script

If you want, I can also:
- Add a `netlify.toml` or `_redirects` file for you to deploy to Netlify with proxying.
- Create a small deployment guide for a specific host (Render, Railway, Fly).

---
If anything here should be tailored to your preferred production host, tell me which provider you want and I will add concrete deployment steps for that provider.
