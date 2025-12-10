# Deployment Guide — Render (backend + Postgres) and Netlify (frontend)

This document contains step-by-step commands and example settings to deploy the project in this repository:

- Backend: `backend/` (Node.js + Postgres)
- Frontend: `code-collab-studio/` (Vite + React)

Recommended order: 
1. Database on Render, 
2. Backend on Render, 
3. Frontend on Netlify.

---

## 1 Create a Managed Postgres on Render

1. In Render dashboard, create a new **Database > PostgreSQL** instance.
2. Choose a plan and region.
3. After creation, open **Connection Details** and note these values:
   - `host`, `port`, `database`, `user`, `password`.

Important: the backend code expects environment variables named `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` (or `DB_PASSWORD_FILE`) and `DB_NAME`.

Set them in Render later (service env) or use the connection details when running the migration job.

---

## 2 Apply schema / run migrations

There are two simple ways to run migrations (both use `backend/src/migrate.js` and `backend/schema.sql`):

- Option A — One-off Render Job (recommended for production):
  - Create a **Background Job** or **One-Time Job** in Render that runs in the context of the repo, with the root path set to the repository root and a command similar to:

    cd backend && npm ci && npm run migrate

  - Provide the same DB env vars (see previous step) in the Job's environment.

- Option B — Run locally against the Render DB (quick):
  - Set environment variables in your terminal (macOS / zsh):

    ```bash
    export DB_HOST="<host_from_render>"
    export DB_PORT="<port_from_render>"
    export DB_USER="<user_from_render>"
    export DB_PASSWORD="<password_from_render>"
    export DB_NAME="<database_from_render>"
    cd backend
    npm ci
    npm run migrate
    ```

Notes about `migrate.js`:
- If the DB user can create databases, `migrate.js` will create `DB_NAME` if missing. Managed Postgres often already provides the DB and restricting permissions; in that case the script will detect the DB and apply `schema.sql`.
- `migrate.js` reads `backend/schema.sql` and applies it.

---

## 3 Deploy backend to Render

You have two deployment options:

- Docker (recommended since `backend/Dockerfile` already runs `wait-for-db` + migrations):
  - Create a new **Web Service** on Render and choose **Docker** (or connect to the repo and select `backend` as service root if Render detects multiple services).
  - Set `Root Directory` to `backend` if required.
  - Environment variables (in Render > Service > Environment):
    - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` (or `DB_PASSWORD_FILE`), `DB_NAME` — from the Postgres service
    - `NODE_ENV=production`
    - (Optional) `PORT` — Render provides a port and maps it into the container automatically; container can expose `3000` as done in `backend/Dockerfile`.
  - Render will build the Docker image using `backend/Dockerfile`. The Docker `CMD` already runs `wait-for-db` and attempts `npm run migrate` before starting.

- Static Node (no Docker):
  - Create a Web Service selecting the `Node` environment and set the **Start Command** to `npm start`.
  - Set the `Build Command` to `npm ci` (Render runs `npm start` afterwards).
  - Ensure the same env variables are set.

Health check: the backend exposes a health endpoint at `/api/health`. Example: `https://your-api.onrender.com/api/health`.

---

## 4 Verify backend

- Check logs in Render to confirm the service started and migrations applied.
- Curl the health endpoint:

  ```bash
  curl -fsS https://your-api.onrender.com/api/health
  ```

- Test key endpoints (`/api/sessions`, `/api/users`) with `curl` or Postman.

---

## 5 Deploy frontend to Netlify

1. In Netlify, create a new site from Git and connect your repo.
2. Set the **Base directory** (publish/build root) to `code-collab-studio`.
3. Build command: `npm ci && npm run build`
4. Publish directory: `dist`
5. Environment variables (Netlify > Site > Site settings > Build & deploy > Environment):
   - `VITE_API_URL=https://your-api.onrender.com/api` (important — frontend concatenates endpoints onto this value)

Example Netlify environment variable (set it manually in the UI):

  - `VITE_API_URL` = `https://your-api.onrender.com/api`

6. (Optional) Add a `_redirects` file in `code-collab-studio/public/_redirects` with this content to support client-side routing:

    ```txt
    /*    /index.html   200
    ```

Or add a minimal `netlify.toml` to the frontend root:

```toml
[build]
  publish = "dist"
  command = "npm ci && npm run build"

[[redirects]]
  from = "/**"
  to = "/index.html"
  status = 200
```

---

## 6 CORS and security

- `backend/src/app.js` uses `cors()` with default options (allows all origins). For production, tighten this to only allow your Netlify domain, e.g.:

  const cors = require('cors');
  app.use(cors({ origin: 'https://yoursite.netlify.app' }));

- Ensure secrets are stored in Render/Netlify environment settings — do not commit them to the repo.

---

## 7 Useful commands (local/CI)

- Run backend locally with Postgres: (set env vars first)
  ```bash
  cd backend
  npm ci
  export DB_HOST=localhost
  export DB_PORT=5432
  export DB_USER=postgres
  export DB_PASSWORD=postgres
  export DB_NAME=codecollab
  npm run migrate
  npm start
  ```

- Build frontend locally:
  ```bash
  cd code-collab-studio
  npm ci
  npm run build
  npx serve -s dist
  ```

- How to test auto-deploy immediately
trigger Render deploy hook (if you have a Deploy Hook):
```bash
curl -X POST '<YOUR_RENDER_DEPLOY_HOOK_URL>'
```

---

## 8 Where files referenced live in this repo

- Backend entry: `backend/src/app.js` (exposes `/api/*` endpoints, health at `/api/health`)
- Migrate script: `backend/src/migrate.js` (reads `backend/schema.sql`)
- Dockerfile for backend: `backend/Dockerfile` (waits for DB and runs migrations)
- Frontend root: `code-collab-studio/` (Vite project). Frontend reads `import.meta.env.VITE_API_URL`.

---

### NOTE: 
- both Netlify and Render do auto-deploy when you push to Git
curl -X POST '<YOUR_RENDER_DEPLOY_HOOK_URL>'
