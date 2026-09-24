type Options = { method?: string; body?: unknown; signal?: AbortSignal };
export async function api<T = unknown>(
  path: string,
  options: Options = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || "GET",
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
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
    throw new Error("Cannot reach Utlio. Check your connection and retry.");
  }
  const data = await response
    .json()
    .catch(() => ({ error: "The server is unavailable. Please retry." }));
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
