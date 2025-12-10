# Docker Guide

This document describes how to build, run, and debug the project using Docker and Docker Compose. It covers building individual images, running containers, secrets handling, running migrations, and common troubleshooting steps.

Paths referenced from the repository root
- Frontend: `code-collab-studio/`
- Backend: `backend/`
- Compose file: `docker-compose.yml`
- Backend schema: `backend/schema.sql`
- Backend migrate: `backend/src/migrate.js`

---

## Prerequisites
- Docker and Docker Compose installed (Docker Desktop recommended)
- `git` and `node` for local testing (optional)

---

## Build images locally

Build backend image (uses `backend/Dockerfile`):

```bash
cd backend
docker build -t codecollab-backend:local .
```

Build frontend image (if you have a Dockerfile in `code-collab-studio`):

```bash
cd code-collab-studio
docker build -t codecollab-frontend:local .
```

If you only want to run the frontend build locally for Netlify, use the Vite commands instead.

---

## Docker Compose (recommended for full stack)

Start the full stack (Postgres + backend + frontend):

```bash
# from repo root
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d --build
```

Stop and remove containers (keep volumes):

```bash
docker compose down
```

Stop and remove containers + named volumes (WARNING: deletes DB data):

```bash
docker compose down -v
```

View logs (all services):

```bash
docker compose logs -f
```

View logs for a single service (backend):

```bash
docker compose logs -f backend
```

Run a shell in the backend container:

```bash
docker compose exec backend sh
# or bash if image provides it
```

---

## Secrets and environment variables

This repo uses `.env` for local development (gitignored). Example keys the backend expects:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` (or `DB_PASSWORD_FILE`)
- `DB_NAME`
- `PORT` (backend port)
- `FRONTEND_URL` (used for CORS)

Local secret file example (recommended for Docker Compose local usage):

```bash
mkdir -p secrets
echo "your-db-password" > secrets/db_password.txt
chmod 600 secrets/db_password.txt
```

Then in a `docker-compose.yml` service definition you can mount it and set `DB_PASSWORD_FILE=/run/secrets/db_password.txt` (the project already supports reading `DB_PASSWORD_FILE`).

Do NOT commit real credentials to the repo.

---

## Running migrations

The project includes `backend/src/migrate.js` which reads `backend/schema.sql` and applies it.

Run migrations locally against a running Postgres (recommended during setup):

```bash
# ensure env vars are set to point to your DB
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=anjula
export DB_PASSWORD=yourpassword
export DB_NAME=codecollab
cd backend
npm ci
npm run migrate
```

Run migrations from inside the backend container (if using compose):

```bash
# run a one-off command in the backend container
docker compose run --rm backend sh -c "npm run migrate"
```

Note: Managed Postgres services (Render, etc.) sometimes require enabling `pgcrypto` for `gen_random_uuid()`. If migrations fail with a `gen_random_uuid` error, run:

```bash
# run using psql client
psql "postgres://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

You can run that command inside the DB container or with a one-off job against your managed DB.

---

## Quick verification commands

Health check (backend):

```bash
curl -fsS http://localhost:3000/api/health
```

List DB tables (using psql inside the DB container):

```bash
# if you have a db container named 'db' in compose
docker compose exec db psql -U <DB_USER> -d <DB_NAME> -c "\dt"
```

Query sessions/users:

```bash
docker compose exec db psql -U <DB_USER> -d <DB_NAME> -c "SELECT id, name, created_at FROM users ORDER BY created_at DESC LIMIT 10;"
```

---

## Debugging tips

- If backend fails to start, check logs: `docker compose logs backend --tail 200`.
- If migrations do not run on container start, the `backend/Dockerfile` runs `wait-for-db.js && npm run migrate || true && node src/app.js`. That means migrations are best-effort on start; running `npm run migrate` as a one-off is more reliable.
- Database connection errors usually indicate bad env values — ensure `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` are correct for the environment the container runs in.
- When using managed DB (Render), prefer a one-off migration job in the provider UI so you don't expose credentials on your workstation.

---

## Common commands reference

Build & run (compose):
```bash
docker compose up -d --build
```

Tail backend logs:
```bash
docker compose logs -f backend
```

Run migrate inside container:
```bash
docker compose run --rm backend npm run migrate
```

Remove containers and volumes (clean slate):
```bash
docker compose down -v
```

---

## Notes about production

- For production, the app uses environment variables (set them via your host provider — Render, AWS, etc.).
- Managed DBs may need `CREATE EXTENSION IF NOT EXISTS pgcrypto;` executed once before migrations if `gen_random_uuid()` is used.
- When deploying backend via Docker to a host, make sure secrets are injected securely and `DB_PASSWORD_FILE` support is used if required by the host.

---

