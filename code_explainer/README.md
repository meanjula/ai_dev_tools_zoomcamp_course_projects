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
│   ├── package.json 
│   ├── package-lock.json 
│   └── server.js                 
├── frontend/      # React frontend app
├── .gitignore
└── README.md

```
<img src="frontend/public/code-explanation.png" width="45%" style="margin: auto;" alt="app UI screenshot after response" />

## ⚙️ Server Setup Instructions For OllAMA_APP 

### Prerequisites

Make sure you have installed:

- Node.js **v18+**

#### Setup Ollama

```bash
ollama serve

ollama pull llama3

ollama list 

```
#### Express server setup
In the project root, inititae node project and install all dependencies
```bash

- npm init 
- npm install express node-fetch cors helmet
- npm run dev

```
### server.js

- create express server using express
- create security middleware using helmet and cors.
- create endpoint for calling api to explain code .POST method is used 
chunk is a Buffer or Uint8Array
convert raw binary chunk to string and split into array of lines using newline as separator and filter out empty lines, as in js Boolean("") is false
                   
.toString()
'{"response":"Hello"}\n{"response":"World"}\n'

.split("\n")
[
  '{"response":"Hello world"}',
  '{"response":"!"}',
  ''
]

.filter(Boolean)[
  '{"response":"Hello world"}',
  '{"response":"!"}'
]





🧠 How It Works

Code explainer backend uses **Express.js** and **Ollama (Laama3)** to provide real time, AI-powered explanation for any code snippet.

---
### Client Sends Request  
THe frontend (React app) sends a 'POST' request wirh a jso body like:

```json
{
  "code":"function sum(a,b){ return a+b}",
  "language":"javascript"
}
```

### AI Prompt in server

The Express server validates the input, then creates a chat-style prompt for Ollama:
```bash
const message = [
  ```javascript
  {
    role: "user",
    content: `You are a senior ${language} developer and mentor.
    Explain the following ${language} code to a junior developer.
    Be accurate and concise, use Markdown formatting when useful.
    
    Code:
    \`\`\`${language}
    ${code}
    \`\`\``
    }
  ```
];
```
This prompt gives the LLM context and structure for producing a technical yet beginner-friendly explanation.

### Request Sent to Ollama
The backend sends this prompt to a locally running Ollama model via:
`POST http://localhost:11434/api/chat`
with streaming enabled:
```bash
{
  model: "llama3",
  stream: true,
  temperature: 0.3,
  max_tokens: 800
}
```

### Streaming NDJSON Response
Ollama responds token-by-token in NDJSON format (newline-delimited JSON).
The Express server forwards each chunks directly to the frontend as a live stream.

```bash
res.write(JSON.stringify({ type: "token", content: data.response }) + "\n");
```
### Frontend Renders in Real Time

The React app reads the streamed tokens and updates the UI instantly, showing the explanation as it’s generated.
This gives a streaming experience, all powered locally via Ollama.

## Summary Flow

```scss
[ User ]
   │
   ▼
[ React Frontend ]
   │  (POST /api/explain-code)
   ▼
[ Express Server ]
   │  (Forwards request to Ollama)
   ▼
[ Ollama LLM ]
   │  (Streams NDJSON tokens)
   ▼
[ Express Streams Back to Client ]
   │
   ▼
[ React UI updates in real time 💬 ]

```
## ⚙️ Why NDJSON Streaming?

Using NDJSON (Newline-Delimited JSON) allows:

Incremental reading (no need to wait for full response)

Real-time updates with minimal latency

Compatibility with both Node.js streams and browser ReadableStream