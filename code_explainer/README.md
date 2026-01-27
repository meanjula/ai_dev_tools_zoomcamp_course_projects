# AI_Code_explainer_with_Ollama (Server)

 A full-stack app that uses ollama's llama3 model to explain code in plain language.

It Features:
- 🧠 local AI interface using ollama.
- ⚙️ Express.js to stream responses
- ⚡ React for UI

## Prerequisite
- **Node.js**,
-  **VS Code**,
- **Ollama** install locally
  → [Download ollama](https://ollama.com/download)

## 🏗️ Project Structure 
```bash

OLLAMA_APP/
├── backend/
│   ├── node_modules
# AI Code Explainer (Ollama + Express + React)

An interactive full-stack project that uses a locally-hosted Ollama model to produce streaming, human-readable explanations of source code snippets. The goal is to let developers paste code and receive a fast, progressive explanation (token-by-token) displayed in the browser, while optionally persisting conversations to Postgres.

This README documents the system design, developer setup, runtime configuration, and troubleshooting steps so you can run and extend the project.

**Quick summary**
- **Backend:** Node.js (ESM) + Express — proxies requests to Ollama, parses NDJSON streaming responses, and forwards tokens to the frontend. Optionally persists chats/messages in Postgres.
- **Frontend:** React + Vite — posts code to the backend and renders streaming tokens progressively.
- **LLM:** Ollama (local) — used as the inference server (e.g., `llama3`, `mistral-7b`, etc.).

**Table of contents**
- Purpose
- Features
- Architecture & data flow
- Prerequisites
- Local development (backend, frontend, DB)
- Environment variables
- Usage
- Troubleshooting
- Notes on models & limits
- Tests & CI
- Deployment recommendations

---

## Purpose

This project demonstrates how to build a streaming code-explanation UI that:
- Sends a structured prompt to an LLM (via Ollama) asking for a beginner-friendly explanation of a code snippet.
- Streams the model output token-by-token (NDJSON) from Ollama to the Express server, and from the server to the browser.
- Renders incremental updates in the UI so users see the explanation as it is generated.
- Supports developer control over the LLM model and persists chat history when desired.

## Features

- Streaming NDJSON proxy from Ollama to browser (low latency UX)
- Configurable model selection (frontend dropdown + request override)
- Simple auth (register/login) — stores user record and ties chat history (bearer is user id in current simple model)
- Postgres persistence for chats, messages, and code snippets
- OpenAPI spec (backend/openapi.json) and Swagger UI at `/docs`
- Dev-friendly structure (separate `frontend` and `backend` folders)

---

## Architecture & data flow

1. Frontend sends POST /api/explain-code with `{ code, language, model?, chatId? }`.
2. Backend validates, optionally loads prior chat messages, and constructs a chat-style prompt.
3. Backend requests Ollama at `http://localhost:11434/api/chat` with `stream: true`.
4. Ollama streams NDJSON tokens. Backend reads, converts to lines of JSON, and writes newline-delimited token objects to the client response.
5. Frontend reads the response ReadableStream and updates the explanation progressively.

Persistence (optional): backend saves chats/messages to Postgres so the conversation can be resumed in future requests using `chatId`.

---

## Prerequisites

- Node.js (v18+ recommended)
- npm (or yarn)
- Ollama installed and available on your PATH
- Optional: Postgres (for persistence) — local or remote

Install Ollama: see https://ollama.com/download

Start Ollama and pull models you want to use:

```bash
ollama serve
ollama pull llama3 (or any model you want to use)
# optional larger models (make sure your machine has capacity):
# ollama pull mistral-7b
# ollama pull mixtral-8x7b
# ollama pull vicuna-13b
ollama list
```

---

## TL;DR to quickly test
Following is my deployment enpoint from automated deployment done in render. since main purpose of this project was to use local model, main focus will be to host privately with oss model but to 
showcase deployment, i have used openai oss remote model using groq API. please choose that model and test it, test it only few times else groq will block my account :D

https://code-explainer-1-qvje.onrender.com/


## End-to-end Setup, Run, Test & Deploy

Follow these steps to run and verify the full system locally, then deploy safely.

1) Clone & prerequisites

```bash
git clone <your-repo>
cd code_explainer
# Install Node deps for both services
cd backend && npm ci
cd ../frontend && npm ci
```

2) Run Ollama locally (recommended for testing)

```bash
# start Ollama locally and pull a model (run on the host where backend will connect)
ollama run llama3 (or model you have chosen to use)
```

3) Local DB (optional) and init

Use Postgres locally or a managed DB. To create schema locally:

```bash
cd backend
DATABASE_URL=postgres://user:pass@localhost:5432/code_explainer node scripts/init-db.mjs
```

4) Start backend and frontend (development)

```bash
# terminal 1 - backend
cd backend
export OLLAMA_URL=http://localhost:11434
export OLLAMA_MODEL=llama3
npm run dev

# terminal 2 - frontend
cd frontend
npm run dev
# open http://localhost:5173
```

5) Quick end-to-end test

From a separate shell, verify the backend register endpoint works:

```bash
curl -v -H "Content-Type: application/json" \
  -X POST http://localhost:3001/api/register \
  -d '{"name":"test","email":"test@example.com"}'
```

Open the UI at `http://localhost:5173`, register/login and try an explanation. Local testing ensures Ollama and DB connectivity before deploying.

6) Run backend tests

```bash
cd backend
npm test
```

7) Docker compose (optional)

```bash
docker-compose build
docker-compose up
# then init DB in container if needed
docker-compose run --rm backend node scripts/init-db.mjs
```

8) Deploy to Render (example)

- Commit `render.yaml` at repo root and push to your branch.
- In Render dashboard: New → Import from GitHub / From Repository → connect repo. Render will read `render.yaml` and create services.
- Set required environment variables in each service (do NOT commit secrets):
  - Backend: `DATABASE_URL`, `DATABASE_SSL` (if required), `CORS_ORIGIN` (frontend origin), `OLLAMA_URL` (if Ollama is reachable from render), `OLLAMA_MODEL` (default), `REMOTE_LLM_URL` & `REMOTE_LLM_API_KEY` (optional)
  - Frontend (Static Site): `VITE_API_URL` (backend public URL), `VITE_DEFAULT_MODEL` (optional)
- Ensure `autoDeploy: true` is set for services you want CI/CD deploys for (this is enabled in the sample `render.yaml`).

9) Best practice: Ollama in private network

- For production, run Ollama on a private host or VM within the same network or VPC as your backend so the inference API is not publicly exposed.
- Test everything locally (Ollama + backend + frontend) before deploying. When deploying, ensure the backend can reach `OLLAMA_URL` (private IP / internal hostname) and that only the backend network path is allowed.

10) Troubleshooting common deployment issues

- If frontend requests are blocked by the browser, set the backend `CORS_ORIGIN` to your frontend origin and redeploy backend.
- If the backend can't connect to the DB, verify `DATABASE_URL` and `DATABASE_SSL` in service envs and consult Render logs.
- If remote LLM integration fails, confirm `REMOTE_LLM_URL` and `REMOTE_LLM_API_KEY` and whether the provider expects `Authorization: Bearer` or an `x-api-key` header; adjust backend env or code accordingly.


Note: The init script reads `backend/db/schema.sql` to create tables. For remote managed Postgres (e.g., Render), set `DATABASE_SSL=true` if required.

---

## Environment variables

Backend examples (set in your shell or a .env file / process manager):

- `PORT` — port for backend (default 3001)
- `DATABASE_URL` — Postgres connection string (optional)
- `DATABASE_SSL` — `true` to enable SSL for DB connections
- `OLLAMA_URL` — optional override for Ollama endpoint (default `http://localhost:11434`)
- `OLLAMA_MODEL` — backend default model (overridden by request body `model`)

Frontend (Vite):
- `VITE_API_URL` — base URL for backend API (default `http://localhost:3001`)
- `VITE_DEFAULT_MODEL` — UI default model shown in the dropdown

---

## Using the app

1. Open the frontend in your browser.
2. Register or login with an email (simple auth): the app stores a lightweight user and uses the user id as a bearer token for the explain request.
3. Paste code, choose language, choose `LLM Model`, and click Explain.
4. The explanation will stream in progressively. If you provide a `chatId` (when continuing a conversation), prior messages are included as context.

---

## Troubleshooting

- Blank/white frontend page:
  - Ensure `npm run dev` for `frontend` is running and shows Vite's local URL (usually http://localhost:5173).
  - Check the browser console for JS errors and the terminal for Vite compile errors.

- Frontend can't reach backend:
  - Confirm `backend` is running on the port set in `VITE_API_URL` (default 3001).
  - If using CORS or proxy, verify settings.

- Ollama connection errors:
  - Make sure `ollama serve` is running and models are pulled with `ollama pull <model>`.
  - If Ollama runs on a different host/port, set `OLLAMA_URL`.

- Postgres issues:
  - Check `DATABASE_URL` and whether SSL is required (set `DATABASE_SSL=true`).
  - Schema initialization errors are logged by `backend/scripts/init-db.mjs`.

---

## Notes on model selection and compatibility

- The UI allows selecting different LLM names; the backend will pass the chosen `model` to Ollama (if the model is available locally to Ollama). If Ollama doesn't have the requested model pulled, the call will fail.
- Models like `mistral-7b`, `mixtral-8x7b`, and `vicuna-13b` may require significant RAM; test with smaller models like `llama3` first.

---

## Security & Production considerations

- Current auth is intentionally simple (user id used as a Bearer token). For production, replace with JWTs or session-based auth and implement proper password handling.
- Validate user input thoroughly and rate-limit the `/api/explain-code` endpoint to limit abuse.
 - Validate user input thoroughly and rate-limit the `/api/explain-code` endpoint to limit abuse.

---

## Tests

There are Mocha/Chai/Supertest tests in the `backend` for core endpoints. To run tests:

```bash
cd backend
npm test
```

Add more tests to cover chat-history reuse and persistence paths.

---

## Deployment notes

- For simple deployments, run Ollama on the same host and keep it private to your backend.
- The repo includes a sample `render.yaml` and `backend/scripts/init-db.mjs` to help with a Render deployment (run the init job once to create schema and pull models as needed).

### Render deployment (CI/CD and Auto Deploy)

This project includes `render.yaml` so you can use Render's Infrastructure-as-Code or the dashboard to deploy both the backend and the frontend. To enable automated CI/CD deploys on Render:

- Commit `render.yaml` at the repository root and push to your deploy branch (e.g. `main`).
- In Render dashboard choose **New → Import from GitHub / From Repository** and connect the repo. Render will detect `render.yaml` and propose services.
- Ensure each service in `render.yaml` has `autoDeploy: true` (the provided sample sets this for backend and frontend). This enables automatic builds on each push to the configured branch.
- In the Render Service settings add the required environment variables and secrets (do not commit them):
  - `DATABASE_URL` (or use the managed DB connection string)
  - `DATABASE_SSL` (true/false as required)
  - `OLLAMA_URL` (if you host Ollama elsewhere)
  - `OLLAMA_MODEL` (default model)
  - `REMOTE_LLM_URL` (optional — remote LLM streaming endpoint)
  - `REMOTE_LLM_API_KEY` (optional secret for remote LLMs)

- After the first deploy, copy the backend public URL into the frontend service `VITE_API_URL` environment variable and trigger a frontend redeploy (Render will redeploy automatically if `autoDeploy` is enabled when you push changes).

Notes:
- `autoDeploy: true` in `render.yaml` lets Render run builds and deploys on each push to the configured branch; you can still disable auto-deploy per service in the dashboard if you prefer manual control.
- Keep secrets in Render's Environment / Secrets UI. For remote LLM API keys use `REMOTE_LLM_API_KEY` and the backend will send it as `Authorization: Bearer <key>` when `provider: "remote"` is requested.
- If your remote LLM requires a different header (e.g. `x-api-key`), set `REMOTE_LLM_API_KEY_HEADER` in Render and I can wire the backend to read that header name instead.


---

## Docker / Containerization

This project includes Dockerfiles for the `backend` and `frontend`, plus a `docker-compose.yml` that runs:
- `db` (Postgres)
- `backend` (Express)
- `frontend` (built static site served by nginx)

Quick local run (from the repository root):

```bash
# build images
docker-compose build

# bring services up (attached)
docker-compose up
```

Initialize the Postgres schema (run once after DB is up):

```bash
# runs the init script inside the backend container
docker-compose run --rm backend node scripts/init-db.mjs
```

Service endpoints after `up`:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

Notes and recommendations:
- Ollama is not included in the compose setup — you must run `ollama serve` on the host or provide an Ollama container and update `docker-compose.yml` accordingly.
- The compose file uses a simple Postgres password for convenience. Replace credentials with secrets in production.
- To rebuild after code changes: `docker-compose build backend frontend && docker-compose up -d`.

If you want, I can add an `init-db` one-off service to run the migration automatically on `docker-compose up`, or add an Ollama service entry if you have a container image for it.


## Contributing

Contributions welcome. Open an issue describing your change and submit a PR that keeps the frontend/backed separation intact. Add tests for backend behavior that manipulates persisted data.

---

<!-- Development suggestions removed. See CONTRIBUTING.md or open an issue to request new features. -->