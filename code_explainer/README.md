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
ollama pull llama3
# optional larger models (make sure your machine has capacity):
# ollama pull mistral-7b
# ollama pull mixtral-8x7b
# ollama pull vicuna-13b
ollama list
```

---

## Local development

Run the frontend and backend (separate terminals):

Backend

```bash
cd backend
npm install
# set DATABASE_URL and other env vars as needed
npm run dev
```

Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173 (Vite default) in browser
```

If the frontend can't connect to Vite on port 5173, ensure `npm run dev` started successfully and note the URL Vite printed in terminal.

### Initialize Postgres schema (optional)

If you want persistence, configure `DATABASE_URL` then run the init script:

```bash
cd backend
# Option A: run the included script
node ./scripts/init-db.mjs

# Option B: let the server call initDB() on startup (server logs mention schema init)
```

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
- When deploying, secure Ollama (do not expose its API to the public) and consider network isolation between your app and inference server.

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

---

## Contributing

Contributions welcome. Open an issue describing your change and submit a PR that keeps the frontend/backed separation intact. Add tests for backend behavior that manipulates persisted data.

---

<!-- Development suggestions removed. See CONTRIBUTING.md or open an issue to request new features. -->