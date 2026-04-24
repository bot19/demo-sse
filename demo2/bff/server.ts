import express from 'express';
import cors from 'cors';

// No OpenAI dependency here — the BFF doesn't know or care about OpenAI.
// It only knows about the AI service it's sitting in front of.
const AI_SERVICE = 'http://localhost:3003';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // Open an SSE connection to the browser.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // ── HOP 1: BFF calls the AI service and receives an SSE stream back ─────
    const aiRes = await fetch(`${AI_SERVICE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });

    // read the AI service's SSE stream — same wire format, same parsing logic
    const reader = aiRes.body!.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (!result.value) continue;

      const text = decoder.decode(result.value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;

        const payload = line.slice(6).trim();

        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(payload) as { delta?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);

          // ── THIS is where the BFF adds value ─────────────────────────────
          // Between receiving a token from the AI service and sending it to
          // the browser, you can:
          //   - verify the user's auth token
          //   - log usage / billing per user
          //   - filter or rewrite content
          //   - inject extra context mid-stream
          // ──────────────────────────────────────────────────────────────────

          // ── HOP 2: forward the token to the browser ───────────────────────
          if (parsed.delta) {
            console.log('token from AI service ->', parsed.delta);
            res.write(`data: ${JSON.stringify({ delta: parsed.delta })}\n\n`);
          }
        } catch (e) {
          if (e instanceof Error) throw e;
          // partial JSON chunk, ignore
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  } finally {
    res.end();
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Demo 2 BFF → http://localhost:${PORT}`);
});
