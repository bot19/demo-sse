import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

dotenv.config({ path: "../../.env" });

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  const { messages }: { messages: ChatCompletionMessageParam[] } = req.body;

  // These 3 headers turn a normal HTTP response into an SSE stream.
  // The client keeps the connection open and reads chunks as they arrive.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      stream: true, // OpenAI returns an async iterator of partial chunks
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      console.log("chunk", chunk, chunk.choices[0]?.delta);

      if (delta) {
        // SSE wire format: every event is "data: <payload>\n\n"
        // The double newline signals the end of one event to the client.
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    // Sentinel value — tells the client the stream is finished.
    res.write("data: [DONE]\n\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    res.end();
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Demo 1 server → http://localhost:${PORT}`);
});
