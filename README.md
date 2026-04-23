# demo-sse

Two minimal demos showing how SSE (Server-Sent Events) works with LLM streaming chat apps.

---

## What is SSE?

SSE is a technique where a server holds an HTTP connection open and pushes data to the client as it becomes available. For chat apps, this means the AI's response appears word-by-word instead of waiting for the full response.

**Wire format** — every event is just a line starting with `data:` followed by a double newline:

```
data: {"delta":"Hello"}\n\n
data: {"delta":", how"}\n\n
data: {"delta":" can I help?"}\n\n
data: [DONE]\n\n
```

---

## Demo 1 — 1 SSE hop

```
Browser (React)
    │
    │  POST /api/chat  { messages: [...] }
    ▼
Express Server :3001
    │
    │  openai.chat.completions.create({ stream: true })
    ▼
OpenAI API
    │
    │  SSE chunks (async iterator)
    ▼
Express Server :3001
    │
    │  res.write(`data: ${JSON.stringify({ delta })}\n\n`)
    ▼
Browser (React)
    reads via fetch + ReadableStream, appends each delta to UI
```

**Key files:**
- [`demo1/server/server.ts`](demo1/server/server.ts) — sets SSE headers, iterates OpenAI stream, writes `data:` lines
- [`demo1/client/src/sse.ts`](demo1/client/src/sse.ts) — reads a streaming `fetch` response, parses SSE lines
- [`demo1/client/src/App.tsx`](demo1/client/src/App.tsx) — chat UI, calls the server, updates state per delta
- [`demo1/client/src/storage.ts`](demo1/client/src/storage.ts) — localStorage CRUD for conversations

---

## Demo 2 — 2 SSE hops *(coming next)*

```
Browser (React)
    │  POST /api/chat
    ▼
BFF Express Server :3002
    │  receives SSE from OpenAI, immediately re-streams to browser
    │  openai.chat.completions.create({ stream: true })
    ▼
OpenAI API
    │  SSE chunks
    ▼
BFF Express Server :3002
    │  re-writes each chunk as SSE to the browser connection
    ▼
Browser (React)
```

The interesting part: the BFF reads from one SSE stream and writes to another, acting as a transparent pipe. This pattern is used when the BFF needs to enrich, filter, or log tokens mid-flight.

---

## Data model

OpenAI has no memory — you own the full history and send it on every request.

```
Conversation
├── id          string    (crypto.randomUUID)
├── title       string    (first 40 chars of the first user message)
├── createdAt   number    (unix ms)
├── updatedAt   number    (unix ms)
└── messages    Message[]

Message
├── id          string
├── role        'user' | 'assistant'
├── content     string
└── createdAt   number
```

Conversations are stored in `localStorage` under the key `demo1_conversations`.  
On every request to the server, `messages` is mapped to `{ role, content }[]` — the OpenAI format.

---

## Running locally

### Setup (once)

```bash
cp .env.example .env
# add your OpenAI key to .env
```

### Demo 1

**Terminal 1 — server**
```bash
cd demo1/server
npm install
npm run dev
# → http://localhost:3001
```

**Terminal 2 — client**
```bash
cd demo1/client
npm install
npm run dev
# → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173).
