// Reads a fetch response body formatted as SSE (text/event-stream).
// SSE wire format:  data: <payload>\n\n
// We use fetch (not EventSource) because we need to POST a request body.
export async function readSSEStream(
  response: Response,
  onDelta: (delta: string) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // A single read() call may contain multiple SSE events or a partial event.
    // Split on newlines and process each "data: ..." line individually.
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return;
      try {
        const parsed = JSON.parse(payload) as { delta?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.delta) onDelta(parsed.delta);
      } catch (e) {
        if (e instanceof Error && e.message !== 'Unexpected token') throw e;
        // Partial JSON across chunk boundaries — safe to ignore, next chunk completes it.
      }
    }
  }
}
