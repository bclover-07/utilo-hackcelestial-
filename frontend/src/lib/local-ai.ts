import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { api } from "./api";
type Config = { webModel: string; webSmallModel: string; maxInputCharacters: number; maxOutputTokens: number; tasks: Record<string, string> };
let engine: WebWorkerMLCEngine | undefined;
let worker: Worker | undefined;
let activeModel = "";
let busy = false;
export function unloadLocalAi() {
  worker?.terminate(); worker = undefined; engine = undefined; activeModel = "";
}
export async function runLocalAi(task: "polish" | "summarize", input: string, compact: boolean, progress: (text: string) => void, signal: AbortSignal) {
  if (busy) throw new Error("Another local AI task is running. Please wait.");
  if (!("gpu" in navigator)) throw new Error("WebGPU is unavailable. Use a supported browser and device. Your draft has not been sent to an AI server.");
  if (!input.trim()) throw new Error("Add some text first.");
  busy = true;
  let rejectCancelled: (error: Error) => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => { rejectCancelled = reject; });
  const cancel = () => { unloadLocalAi(); rejectCancelled(new Error("Cancelled.")); };
  signal.addEventListener("abort", cancel, { once: true });
  const deadline = setTimeout(() => { unloadLocalAi(); rejectCancelled(new Error("Local AI timed out. Try the smaller model or a shorter excerpt.")); }, 10 * 60 * 1000);
  try {
    return await Promise.race([cancelled, (async () => {
    const config = await api<Config>("/ai/local-config", { signal });
    if (signal.aborted) throw new Error("Cancelled.");
    if (input.length > config.maxInputCharacters) throw new Error(`Select an excerpt of at most ${config.maxInputCharacters} characters. No text was silently removed.`);
    const model = compact ? config.webSmallModel : config.webModel;
    if (!engine || activeModel !== model) {
      unloadLocalAi();
      progress("Downloading and loading model. First use can take several minutes…");
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      if (signal.aborted) throw new Error("Cancelled.");
      worker = new Worker(new URL("./local-ai.worker.ts", import.meta.url), { type: "module" });
      engine = await CreateWebWorkerMLCEngine(worker, model, { initProgressCallback: report => progress(report.text) });
      activeModel = model;
    }
    if (signal.aborted) throw new Error("Cancelled.");
    progress("Writing on this device…");
    const reply = await engine.chat.completions.create({
      messages: [{ role: "system", content: config.tasks[task] }, { role: "user", content: JSON.stringify({ sourceText: input }) }],
      temperature: 0.2, max_tokens: config.maxOutputTokens,
    });
    if (signal.aborted) throw new Error("Cancelled.");
    const text = reply.choices[0]?.message.content?.trim();
    if (!text) throw new Error("The local model returned no text. Try a shorter excerpt.");
    return text;
    })()]);
  } finally { clearTimeout(deadline); signal.removeEventListener("abort", cancel); busy = false; }
}
