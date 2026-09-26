import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { LocalAiRuntime, selectLocalModel, validateLocalConfig } from "../src/lib/local-ai-runtime.ts";
import { localAiConfig as config } from "../../backend/src/services/localAiConfig.js";
import { prebuiltAppConfig } from "@mlc-ai/web-llm";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function fixture(t, overrides = {}) {
  const calls = { create: 0, terminate: 0, reset: 0, requests: [], reload: [] };
  let fatal;
  const engine = {
    setInitProgressCallback() {},
    async reload(...args) { calls.reload.push(args); if (overrides.reload) await overrides.reload(); },
    async resetChat() { calls.reset++; },
    chat: { completions: { async create(request) {
      calls.requests.push(request);
      if (overrides.create) return overrides.create();
      return (async function* () {
        yield { choices: [{ delta: { content: "20 chairs " } }] };
        yield { choices: [{ delta: { content: "for INR 100." }, finish_reason: overrides.finish || "stop" }] };
      })();
    } } },
  };
  const runtime = new LocalAiRuntime({
    getConfig: overrides.getConfig || (async () => config),
    prepare: overrides.prepare || (async (_config, compact) => ({
      modelId: compact ? config.webSmallModel : config.webModel,
      create: onFatal => { fatal = onFatal; calls.create++; return { engine, terminate: () => { calls.terminate++; } }; },
    })),
  });
  t.after(() => runtime.unload());
  return { runtime, calls, fatal: error => fatal(error) };
}
const run = (runtime, signal = new AbortController().signal, compact = true, report = () => {}) =>
  runtime.run("polish", "20 chairs for INR 100.", compact, report, signal);

test("Backend model choices resolve in the installed WebLLM catalog, including f32 GPU fallback", () => {
  assert.equal(validateLocalConfig(config), config);
  for (const compact of [true, false]) for (const f16 of [true, false]) {
    const id = selectLocalModel(config, compact, f16);
    assert.ok(prebuiltAppConfig.model_list.some(model => model.model_id === id), id);
    assert.ok(id.includes(f16 ? "f16" : "f32"));
  }
  assert.throws(() => validateLocalConfig({ ...config, maxOutputTokens: 9000 }), /configuration/);
  assert.throws(() => validateLocalConfig({ ...config, tasks: {} }), /configuration/);
});

test("Streams actual chunks, reuses loaded weights and resets private chat history", async t => {
  const { runtime, calls } = fixture(t);
  const progress = [];
  const result = await run(runtime, undefined, true, value => progress.push(value));
  assert.equal(result.text, "20 chairs for INR 100.");
  assert.equal(result.truncated, false);
  assert.ok(progress.some(value => value.output));
  await run(runtime);
  assert.equal(calls.create, 1);
  assert.equal(calls.reload.length, 1);
  assert.deepEqual(calls.reload[0][1], { context_window_size: config.contextWindowTokens });
  assert.equal(calls.reset, 4);
  assert.equal(calls.requests[0].messages[1].content, JSON.stringify({ sourceText: "20 chairs for INR 100." }));
  await run(runtime, undefined, false);
  assert.equal(calls.create, 2);
  assert.equal(calls.terminate, 1);
});

test("Download-only operation loads weights without sending any prompt", async t => {
  const { runtime, calls } = fixture(t);
  await runtime.run("polish", "", true, () => {}, new AbortController().signal, true);
  assert.equal(runtime.snapshot().ready, true);
  assert.equal(calls.requests.length, 0);
});

test("Rejects oversized input and pre-aborted calls before loading weights", async t => {
  const { runtime, calls } = fixture(t);
  await assert.rejects(run(runtime, AbortSignal.abort()), /Cancelled/);
  await assert.rejects(runtime.run("polish", "x".repeat(config.maxInputCharacters + 1), true, () => {}, new AbortController().signal), /No text was silently removed/);
  assert.equal(calls.create, 0);
  assert.equal(runtime.snapshot().busy, false);
});

test("Abort during async setup cannot create a worker after cancellation", async t => {
  const pending = deferred();
  let created = 0;
  const { runtime } = fixture(t, { prepare: () => pending.promise });
  const controller = new AbortController();
  const result = run(runtime, controller.signal);
  const rejected = assert.rejects(result, /Cancelled/);
  await setImmediate();
  controller.abort();
  await rejected;
  pending.resolve({ modelId: config.webSmallModel, create() { created++; } });
  await setImmediate();
  assert.equal(created, 0);
  assert.equal(runtime.snapshot().ready, false);
});

test("A cancelled late reload cannot interfere with a successful retry", async t => {
  const pending = deferred();
  let loads = 0;
  const { runtime, calls } = fixture(t, { reload: () => ++loads === 1 ? pending.promise : undefined });
  const controller = new AbortController();
  const first = run(runtime, controller.signal);
  const rejected = assert.rejects(first, /Cancelled/);
  await setImmediate();
  await assert.rejects(run(runtime), /Another local AI task/);
  controller.abort();
  await rejected;
  await run(runtime);
  pending.resolve();
  await setImmediate();
  assert.equal(calls.create, 2);
  assert.equal(calls.terminate, 1);
  assert.equal(runtime.snapshot().ready, true);
  assert.equal(calls.requests.length, 1);
});

test("Worker crash rejects immediately and releases the busy lock", async t => {
  const { runtime, fatal, calls } = fixture(t, { reload: () => new Promise(() => {}) });
  const pending = run(runtime);
  const rejected = assert.rejects(pending, /worker crashed/);
  await setImmediate();
  fatal(new Error("worker crashed"));
  await rejected;
  assert.equal(calls.terminate, 1);
  assert.equal(runtime.snapshot().busy, false);
});

test("Generation deadline terminates stalled inference and permits retry", async t => {
  const { runtime, calls } = fixture(t, {
    getConfig: async () => ({ ...config, generationTimeoutMs: 1000 }),
    create: () => new Promise(() => {}),
  });
  await assert.rejects(run(runtime), /generation timed out/);
  assert.equal(calls.terminate, 1);
  assert.equal(runtime.snapshot().busy, false);
});

test("Empty responses fail and token-limit output is explicitly marked incomplete", async t => {
  const empty = fixture(t, { create: () => (async function* () {})() });
  await assert.rejects(run(empty.runtime), /no text/);
  const limited = fixture(t, { finish: "length" });
  assert.equal((await run(limited.runtime)).truncated, true);
});
