type Options = { method?: string; body?: unknown; signal?: AbortSignal };
export async function streamPlan<T = unknown>(body: unknown, onProgress: (event: { step: string; status: string; elapsedMs?: number }) => void): Promise<T> {
  const response = await fetch("/api/ai/plans/stream", { method: "POST", credentials: "include", cache: "no-store", signal: AbortSignal.timeout(110000), headers: { "Content-Type": "application/json", "X-Utlio-Request": "1" }, body: JSON.stringify(body) });
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("utlio:session-expired"));
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Unable to start planning.");
  }
  if (!response.body) throw new Error("Streaming is unavailable. Please retry.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", result: T | undefined;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "progress") onProgress(event);
    if (event.type === "result") result = event.plan;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() || "";
      lines.forEach(consume);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
    if (!result) throw new Error("The connection ended before a result arrived. Check your saved plans before retrying.");
    return result;
  } finally { reader.releaseLock(); }
}
export async function api<T = unknown>(
  path: string,
  options: Options = {},
): Promise<T> {
  let response: Response;
  const deadline = AbortSignal.timeout(110000);
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || "GET",
      credentials: "include",
      cache: "no-store",
      signal: options.signal
        ? AbortSignal.any([options.signal, deadline])
        : deadline,
      headers:
        options.body instanceof FormData
          ? { "X-Utlio-Request": "1" }
          : { "Content-Type": "application/json", "X-Utlio-Request": "1" },
      body:
        options.body instanceof FormData
          ? options.body
          : options.body === undefined
            ? undefined
            : JSON.stringify(options.body),
    });
  } catch {
    if (deadline.aborted)
      throw new Error(
        "This request took too long. Please retry. Check your records before repeating a booking or other change.",
      );
    throw new Error("Cannot reach Utlio. Check your connection and retry.");
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error("The server returned an unreadable response. Please retry; check your records before repeating a change."); }
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/auth/login", "/auth/register"].includes(path) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event("utlio:session-expired"));
    }
    const error = Object.assign(new Error(data.error || "Request failed."), {
      status: response.status,
    });
    throw error;
  }
  return data as T;
}
