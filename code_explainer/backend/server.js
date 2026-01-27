import express from "express";
import helmet from "helmet"
import cors from "cors";
import swaggerUi from "swagger-ui-express";
// express-openapi-validator removed — serving OpenAPI spec via Swagger UI only
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load OpenAPI spec without using `assert { type: "json" }` (avoids Node import assertion issues)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapiPath = path.resolve(__dirname, "openapi.json");
let openapiSpec;
try {
  const raw = fs.readFileSync(openapiPath, "utf8");
  openapiSpec = JSON.parse(raw);
} catch (err) {
  // Fallback: try project-relative backend/openapi.json
  const raw = fs.readFileSync(path.resolve(process.cwd(), "backend/openapi.json"), "utf8");
  openapiSpec = JSON.parse(raw);
}
import {
  buildPromptMessage,
  createOllamaPayload,
  fetchOllamaStream,
  validateCodeRequest,
  processOllamaStream,
} from "./utils/ollamaService.js";
import { initDB } from './db/index.js';
import { createUser, createChat, addMessageWithOptionalCode, createMessage, getUserById, getChatMessages, getUserChats } from './db/models.js';

const app = express();
const corsOptions = {
  origin: "http://localhost:5173", // Allow requests from this origin
  credentials: true, // Allow cookies and credentials
};
app.use(cors(corsOptions));
app.use(helmet())
app.use(express.json());

// Export app for testing (tests set NODE_ENV=test to avoid auto-start)
export { app };

// Swagger UI for interactive docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Health check route
app.get("/", (req, res) => {
  res.send("Server is running! Use POST /api/chat to interact.");
});

// Simple registration: create user if missing
app.post('/api/register', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const existing = await (await import('./db/models.js')).getUserByEmail(email);
    if (existing) return res.status(200).json({ id: existing.id, name: existing.name, email: existing.email });
    const user = await (await import('./db/models.js')).createUser({ name, email });
    return res.status(201).json(user);
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Simple login: return user by email (no password)
app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const existing = await (await import('./db/models.js')).getUserByEmail(email);
    if (!existing) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ id: existing.id, name: existing.name, email: existing.email });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// List chats for authenticated user
app.get('/api/chats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!bearer) return res.status(401).json({ error: 'authentication required' });
    const user = await getUserById(bearer).catch(()=>null);
    if (!user) return res.status(401).json({ error: 'invalid_user' });
    const chats = await getUserChats(bearer);
    res.json(chats);
  } catch (err) {
    console.error('GET /api/chats error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// List messages for a chat
app.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!bearer) return res.status(401).json({ error: 'authentication required' });
    const user = await getUserById(bearer).catch(()=>null);
    if (!user) return res.status(401).json({ error: 'invalid_user' });
    const { chatId } = req.params;
    const messages = await getChatMessages(chatId);
    res.json(messages);
  } catch (err) {
    console.error('GET /api/chats/:chatId/messages error', err);
    res.status(500).json({ error: 'internal' });
  }
});

// Explain-code endpoint
app.post("/api/explain-code", async (req, res) => {
  try {
    const { code, language } = req.body;
    // Require authenticated userId (either in body or Authorization header)
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const userId = req.body.userId || bearer;
    console.log('Incoming explain request', { userId: userId || null, hasAuthHeader: !!authHeader, hasCode: !!code });
    if (!userId) {
      return res.status(401).json({ error: 'authentication required', message: 'Please login and provide userId' });
    }
    validateCodeRequest(code, language);
    // Set up headers for NDJSON streaming
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders?.();

    // Require authenticated user exists (skip DB lookup during tests)
    let userExists = null;
    if (process.env.NODE_ENV === 'test') {
      userExists = { id: userId };
    } else {
      userExists = await getUserById(userId).catch(()=>null);
      if (!userExists) {
        return res.status(401).json({ error: 'invalid_user', message: 'user not found, please login' });
      }
    }

    // If chatId provided, preload chat history and include it as prior messages
    let messages;
    if (req.body.chatId) {
      const history = await getChatMessages(req.body.chatId);
      // Transform history rows into message objects
      const historyMessages = history.map((m) => {
        let content = m.content || '';
        if (m.code) {
          content += `\n\n\`\`\`${m.language || ''}\n${m.code}\n\`\`\``;
        }
        return { role: m.role, content };
      });
      // current user message
      const current = buildPromptMessage(code, language)[0];
      messages = [...historyMessages, current];
    } else {
      messages = buildPromptMessage(code, language);
    }
        // Choose model: request override -> env var -> default
        const model = req.body.model || process.env.OLLAMA_MODEL || "llama3";
        console.log('Using Ollama model:', model);
        const payload = createOllamaPayload(messages, model);

    //Connect to Ollama API stream
    let ollamaResponse;
    try {
      ollamaResponse = await fetchOllamaStream("http://localhost:11434/api/chat", payload);
      console.log("✅ Connected to Ollama stream");
    } catch (modelErr) {
      console.error('Ollama request failed', modelErr);
      const msg = modelErr?.message || 'Model not available';
      // Inform client via NDJSON error token with an actionable message
      res.write(JSON.stringify({ type: 'error', message: `Model ${model} is not available locally. Run: ollama pull ${model}` }) + "\n");
      res.end();
      return;
    }

    let fullText = await processOllamaStream(ollamaResponse, (token) => {
      //Stream each token to client as NDJSON
      res.write(JSON.stringify({ type: "token", content: token }) + "\n");
    });

    // Persist conversation to DB (best-effort) for authenticated user
    try {
      const chat = await createChat(userId, { title: 'Code explanation' });
      // store the original user message with code as a message + optional code snippet
      await addMessageWithOptionalCode(chat.id, { role: 'user', content: 'Request to explain code', code, language });
      // store the assistant response
      await createMessage(chat.id, { role: 'assistant', content: fullText });
      console.log('✅ Saved explanation to DB', { userId: userId, chatId: chat.id });
    } catch (dbErr) {
      console.error('DB save failed', dbErr);
    }

    res.write(JSON.stringify({ type: "done", content: fullText }) + "\n");
    res.end();
  } catch (error) {
    console.error("API error", error);
    const msg = (error && error.message) ? error.message : 'Server error or Ollama not running.';
    res.write(
      JSON.stringify({
        type: "error",
        message: msg,
      }) + "\n"
    );
    res.end();
  }
});

// Error handler for OpenAPI validation errors and others
app.use((err, req, res, next) => {
  if (err && err.errors) {
    return res.status(err.status || 400).json({ error: err.message, details: err.errors });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server only when not testing
if (process.env.NODE_ENV !== "test") {
  // initialize DB and then start
  (async () => {
    try {
      await initDB();
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT} (PORT=${PORT})`);
      });
    } catch (err) {
      console.error('Failed to initialize DB or start server', err);
      process.exit(1);
    }
  })();
}

