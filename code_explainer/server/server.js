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
  // Fallback: try project-relative server/openapi.json
  const raw = fs.readFileSync(path.resolve(process.cwd(), "server/openapi.json"), "utf8");
  openapiSpec = JSON.parse(raw);
}
import {
  buildPromptMessage,
  createOllamaPayload,
  fetchOllamaStream,
  validateCodeRequest,
  processOllamaStream,
} from "./utils/ollamaService.js";

const app = express();
const corsOptions = {
  origin: "http://localhost:5173", // Allow requests from this origin
  credentials: true, // Allow cookies and credentials
};
app.use(cors(corsOptions));
app.use(helmet())
app.use(express.json());

async function main() {
  // Swagger UI for interactive docs
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // Health check route
  app.get("/", (req, res) => {
    res.send("Server is running! Use POST /api/chat to interact.");
  });

  // Explain-code endpoint
  app.post("/api/explain-code", async (req, res) => {
    try {
      const { code, language } = req.body;
      validateCodeRequest(code, language);
      // Set up headers for NDJSON streaming
      res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.flushHeaders?.();

      //Build Ollama prompt message
      const messages = buildPromptMessage(code, language);
      const payload = createOllamaPayload(messages, "llama3");

      //Connect to Ollama API stream
      const ollamaResponse = await fetchOllamaStream(
        "http://localhost:11434/api/chat",
        payload
      );
      console.log("✅ Connected to Ollama stream");

      let fullText = await processOllamaStream(ollamaResponse, (token) => {
        //Stream each token to client as NDJSON
        res.write(JSON.stringify({ type: "token", content: token }) + "\n");
      });
      res.write(JSON.stringify({ type: "done", content: fullText }) + "\n");
      res.end();
    } catch (error) {
      console.error("API error", error);
      res.write(
        JSON.stringify({
          type: "error",
          message: "Server error or Ollama not running.",
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

  // Start server
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

