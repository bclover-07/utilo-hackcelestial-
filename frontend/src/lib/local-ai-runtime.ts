import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";

export type LocalTask = "polish" | "summarize";
export type LocalConfig = {
  version: number;
  webModel: string;
  webSmallModel: string;
  webModelFallback: string;
  webSmallModelFallback: string;
  defaultCompact: boolean;
  contextWindowTokens: number;
  maxInputCharacters: number;
  maxOutputTokens: number;
  loadTimeoutMs: number;
  generationTimeoutMs: number;
  tasks: Record<LocalTask, string>;
};
export type LocalProgress = { text: string; progress?: number; output?: string };
type Engine = Pick<WebWorkerMLCEngine, "reload" | "resetChat" | "chat" | "setInitProgressCallback">;
export type EngineHandle = { engine: Engine; terminate: () => void };
type Prepared = { modelId: string; create: (onFatal: (error: Error) => void) => EngineHandle };
type Dependencies = {
  getConfig: (signal: AbortSignal) => Promise<LocalConfig>;
  prepare: (config: LocalConfig, compact: boolean, signal: AbortSignal) => Promise<Prepared>;
};
export type LocalResult = { text: string; truncated: boolean; modelId: string };
const initialState = { busy: false, modelId: "", ready: false };

// Reject incompatible metadata before allocating a worker or downloading weights.
export function validateLocalConfig(value: LocalConfig): LocalConfig {
  const integers = [
    [value?.contextWindowTokens, 1024, 8192], [value?.maxInputCharacters, 1, 12000],
    [value?.maxOutputTokens, 1, 2048], [value?.loadTimeoutMs, 1000, 900000],
    [value?.generationTimeoutMs, 1000, 600000],
  ];
  if (value?.version !== 2 || typeof value.defaultCompact !== "boolean" ||
      integers.some(([n, min, max]) => !Number.isInteger(n) || n < min || n > max) ||
      value.maxOutputTokens >= value.contextWindowTokens ||
      [value.webModel, value.webSmallModel, value.webModelFallback, value.webSmallModelFallback,
        value.tasks?.polish, value.tasks?.summarize].some(s => typeof s !== "string" || !s.trim())) {
    throw new Error("Local AI configuration is incompatible. Refresh the app and check the API version.");
  }
  return value;
}

export function selectLocalModel(config: LocalConfig, compact: boolean, supportsF16: boolean) {
  return compact
    ? supportsF16 ? config.webSmallModel : config.webSmallModelFallback
    : supportsF16 ? config.webModel : config.webModelFallback;
}

// One worker per tab. Check ownership after each await so a late import/reload
// cannot revive an aborted model or touch a subsequent run.
export class LocalAiRuntime {
  private dependencies: Dependencies;
  private handle?: EngineHandle;
  private key = "";
  private operation?: AbortController;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private state = initialState;
  private listeners = new Set<() => void>();
  constructor(dependencies: Dependencies) { this.dependencies = dependencies; }
  snapshot = () => this.state;
  serverSnapshot = () => initialState;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(patch: Partial<typeof initialState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
  private dispose() {
    clearTimeout(this.idleTimer);
    this.handle?.terminate();
    this.handle = undefined;
    this.key = "";
    this.update({ ready: false, modelId: "" });
  }
  unload = () => {
    this.operation?.abort(new Error("Local AI stopped. You can run it again."));
    this.dispose();
  };
  async run(task: LocalTask, input: string, compact: boolean, report: (value: LocalProgress) => void,
    signal: AbortSignal, prepareOnly = false): Promise<LocalResult> {
    if (signal.aborted) throw new Error("Cancelled.");
    if (this.operation) throw new Error("Another local AI task is running. Please wait.");
    if (!prepareOnly && !input.trim()) throw new Error("Add some text first.");
    const operation = new AbortController();
    this.operation = operation;
    this.update({ busy: true });
    clearTimeout(this.idleTimer);
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      if (operation.signal.aborted || this.operation !== operation) throw operation.signal.reason || new Error("Cancelled.");
    };
    const cancel = () => operation.abort(new Error("Cancelled. You can keep editing."));
    signal.addEventListener("abort", cancel, { once: true });
    let rejectFailure: (error: Error) => void = () => {};
    const failure = new Promise<never>((_, reject) => { rejectFailure = reject; });
    const aborted = () => {
      if (this.operation === operation) this.dispose();
      rejectFailure(operation.signal.reason);
    };
    operation.signal.addEventListener("abort", aborted, { once: true });
    const deadline = (ms: number, message: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => operation.abort(new Error(message)), ms);
    };
    const progress = (value: LocalProgress) => { check(); report(value); };
    deadline(600000, "Local AI setup timed out. Check your connection and try again.");
    try {
      return await Promise.race([failure, (async () => {
        progress({ text: "Checking local AI configuration and GPU…" });
        const config = validateLocalConfig(await this.dependencies.getConfig(operation.signal));
        check();
        if (!config.tasks[task]) throw new Error("Unsupported local AI task.");
        if (!prepareOnly && input.length > config.maxInputCharacters) {
          throw new Error(`Select an excerpt of at most ${config.maxInputCharacters.toLocaleString()} characters. No text was silently removed.`);
        }
        deadline(config.loadTimeoutMs, "Model loading timed out. Check your connection or use the smaller model.");
        const prepared = await this.dependencies.prepare(config, compact, operation.signal);
        check();
        const key = `${prepared.modelId}:${config.contextWindowTokens}`;
        if (!this.handle || this.key !== key) {
          this.dispose();
          const handle = prepared.create(error => {
            if (this.handle !== handle) return;
            if (this.operation) this.operation.abort(error);
            else this.dispose();
          });
          this.handle = handle;
          handle.engine.setInitProgressCallback(value => {
            // WebLLM can still deliver queued events after cancellation.
            if (!operation.signal.aborted && this.operation === operation) report({ text: value.text, progress: value.progress });
          });
          progress({ text: "Loading model files. First use downloads the model; later loads reuse browser storage…", progress: 0 });
          await handle.engine.reload(prepared.modelId, { context_window_size: config.contextWindowTokens });
          check();
          this.key = key;
          this.update({ ready: true, modelId: prepared.modelId });
        }
        const engine = this.handle.engine;
        if (prepareOnly) return { text: "", truncated: false, modelId: prepared.modelId };
        deadline(config.generationTimeoutMs, "Local generation timed out. Try a shorter excerpt or the smaller model.");
        await engine.resetChat();
        check();
        progress({ text: "Writing on this device…" });
        const stream = await engine.chat.completions.create({
          messages: [{ role: "system", content: config.tasks[task] }, { role: "user", content: JSON.stringify({ sourceText: input }) }],
          temperature: 0.2, max_tokens: config.maxOutputTokens, stream: true,
        });
        check();
        let text = "", truncated = false, lastReport = 0;
        for await (const chunk of stream) {
          check();
          text += chunk.choices[0]?.delta.content || "";
          if (chunk.choices[0]?.finish_reason === "length") truncated = true;
          if (Date.now() - lastReport >= 80) {
            progress({ text: "Writing on this device…", output: text });
            lastReport = Date.now();
          }
        }
        check();
        await engine.resetChat(); // Clear private source text and KV history between tasks.
        check();
        if (!text.trim()) throw new Error("The local model returned no text. Try a shorter excerpt.");
        return { text: text.trim(), truncated, modelId: prepared.modelId };
      })()]);
    } catch (error) {
      if (this.operation === operation) this.dispose();
      if (error instanceof Error && /context window|prompt tokens/i.test(error.message)) {
        throw new Error("This excerpt exceeds the model's token limit. Select a shorter excerpt; no text was silently removed.");
      }
      throw error;
    } finally {
      clearTimeout(timer!);
      signal.removeEventListener("abort", cancel);
      operation.signal.removeEventListener("abort", aborted);
      if (this.operation === operation) {
        this.operation = undefined;
        this.update({ busy: false });
        // Reuse warm weights across forms, then return GPU memory after five idle minutes.
        if (this.handle) this.idleTimer = setTimeout(this.unload, 5 * 60 * 1000);
      }
    }
  }
}
