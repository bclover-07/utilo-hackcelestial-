import { api } from "./api";
import { LocalAiRuntime, selectLocalModel, validateLocalConfig } from "./local-ai-runtime";
import type { LocalConfig } from "./local-ai-runtime";

type Adapter = { features: { has: (feature: string) => boolean }; limits: { maxStorageBufferBindingSize: number } };
type GpuNavigator = Navigator & { gpu?: { requestAdapter: () => Promise<Adapter | null> } };

export async function getLocalAiConfig(signal: AbortSignal) {
  return validateLocalConfig(await api<LocalConfig>("/ai/local-config", { signal }));
}

async function deviceModel(config: LocalConfig, compact: boolean, signal: AbortSignal) {
  if (typeof navigator === "undefined" || !globalThis.isSecureContext) {
    throw new Error("Local AI requires HTTPS or localhost. Open the app on a secure connection.");
  }
  const gpu = (navigator as GpuNavigator).gpu;
  if (!gpu) throw new Error("WebGPU is unavailable. Use a WebGPU-capable browser with hardware acceleration enabled.");
  const adapter = await gpu.requestAdapter();
  signal.throwIfAborted();
  if (!adapter) throw new Error("No WebGPU adapter is available. Check browser hardware acceleration and your GPU drivers.");
  const webllm = await import("@mlc-ai/web-llm");
  signal.throwIfAborted();
  const modelId = selectLocalModel(config, compact, adapter.features.has("shader-f16"));
  const record = webllm.prebuiltAppConfig.model_list.find(model => model.model_id === modelId);
  if (!record) throw new Error("The configured model is not supported by the installed WebLLM version.");
  if ((record.buffer_size_required_bytes || 0) > adapter.limits.maxStorageBufferBindingSize ||
      record.required_features?.some(feature => !adapter.features.has(feature))) {
    throw new Error("This GPU cannot run the selected model. Try the smaller model.");
  }
  return { webllm, modelId, record };
}

export async function inspectLocalAi(compact: boolean, signal: AbortSignal) {
  const config = await getLocalAiConfig(signal);
  const { webllm, modelId, record } = await deviceModel(config, compact, signal);
  // A cache probe must never claim weights are installed merely because npm is installed.
  const cached = await webllm.hasModelInCache(modelId).catch(() => null);
  signal.throwIfAborted();
  return { config, modelId, cached, memoryMB: record.vram_required_MB };
}

export const localAi = new LocalAiRuntime({
  getConfig: getLocalAiConfig,
  prepare: async (config, compact, signal) => {
    const { webllm, modelId } = await deviceModel(config, compact, signal);
    return {
      modelId,
      create: onFatal => {
        const worker = new Worker(new URL("./local-ai.worker.ts", import.meta.url), { type: "module" });
        worker.onerror = event => {
          event.preventDefault();
          onFatal(new Error("The local AI worker failed. Reload the model and try again."));
        };
        worker.onmessageerror = () => onFatal(new Error("The browser could not read a local AI worker response. Reload the model."));
        const engine = new webllm.WebWorkerMLCEngine(worker);
        return { engine, terminate: () => { worker.onerror = null; worker.onmessageerror = null; worker.terminate(); } };
      },
    };
  },
});

export const unloadLocalAi = localAi.unload;
export const runLocalAi = localAi.run.bind(localAi);
