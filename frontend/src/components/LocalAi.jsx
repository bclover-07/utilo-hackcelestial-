"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getLocalAiConfig, inspectLocalAi, localAi, runLocalAi, unloadLocalAi } from "@/lib/local-ai";

export default function LocalAi({ task = "summarize", text = "", onApply }) {
  const [output, setOutput] = useState(null), [status, setStatus] = useState(null), [error, setError] = useState("");
  const [config, setConfig] = useState(null), [compact, setCompact] = useState(true), [device, setDevice] = useState(null);
  const [busy, setBusy] = useState(false), [excerpt, setExcerpt] = useState(0), [partial, setPartial] = useState("");
  const shared = useSyncExternalStore(localAi.subscribe, localAi.snapshot, localAi.serverSnapshot);
  const controller = useRef(null), reduced = useReducedMotion();
  const source = String(text || "");
  const input = task === "summarize" && excerpt ? source.split("\n").slice(-excerpt).join("\n") : source;
  useEffect(() => {
    const pending = new AbortController();
    getLocalAiConfig(pending.signal).then(value => {
      if (!pending.signal.aborted) { setConfig(value); setCompact(value.defaultCompact); }
    }).catch(err => { if (!pending.signal.aborted) setError(err.message); });
    return () => { pending.abort(); controller.current?.abort(); };
  }, []);
  const stale = output && (output.source !== input || output.task !== task);
  const overLimit = config && input.length > config.maxInputCharacters;
  const active = busy || shared.busy;
  async function run(mode) {
    if (controller.current) return;
    const pending = new AbortController(); controller.current = pending;
    setBusy(true); setError(""); setPartial(""); setStatus({ text: "Checking device…" });
    if (mode === "generate") setOutput(null);
    try {
      if (mode === "check") {
        const result = await inspectLocalAi(compact, pending.signal);
        if (!pending.signal.aborted) { setDevice(result); setConfig(result.config); }
      } else {
        const result = await runLocalAi(task, input, compact, value => {
          if (!pending.signal.aborted) { setStatus(value); if (value.output !== undefined) setPartial(value.output); }
        }, pending.signal, mode === "load");
        if (!pending.signal.aborted) {
          if (mode === "generate") setOutput({ ...result, source: input, task });
          // Check persisted weights independently of the successful GPU load.
          try { setDevice(await inspectLocalAi(compact, pending.signal)); } catch { /* Inference already succeeded. */ }
        }
      }
    } catch (err) { if (controller.current === pending) setError(err.message || "Local AI failed. Please retry."); }
    finally {
      if (controller.current === pending) { controller.current = null; setBusy(false); setStatus(null); setPartial(""); }
    }
  }
  return <div className="local-ai panel" style={{ background: "var(--lilac)", marginBlock: 16 }}>
    <h4><Sparkles size={18} /> AI on your device</h4>
    <p>Download a model once, then reuse it from this browser. Local AI sends no draft or conversation text to an AI server. Model files download from external hosts; saving listings and messages still uses Utlio.</p>
    <label className="check"><input type="checkbox" checked={compact} disabled={active} onChange={e => { setCompact(e.target.checked); setDevice(null); }} /> Use smaller model (less memory and faster loading)</label>
    <p><small>{shared.ready ? `Loaded in GPU memory: ${shared.modelId}` : "Model is not loaded in GPU memory."} GPU memory is released after five idle minutes.</small></p>
    {device && <p role="status"><small>{device.modelId} · {device.cached === true ? "Model weights found in browser cache" : device.cached === false ? "Model weights not yet cached" : "Browser cache status unavailable"}{device.memoryMB ? ` · Estimated GPU memory ${(device.memoryMB / 1024).toFixed(1)} GB` : ""}. A successful load verifies the complete runtime.</small></p>}
    <div className="actions">
      <button className="quiet" type="button" disabled={active} onClick={() => run("check")}>Check device & cache</button>
      <button className="quiet" type="button" disabled={active} onClick={() => run("load")}>Download / load model</button>
      {shared.ready && <button className="quiet" type="button" disabled={active} onClick={unloadLocalAi}>Release GPU memory</button>}
    </div>
    {task === "summarize" && <label>Conversation scope <select value={excerpt} disabled={active} onChange={e => setExcerpt(Number(e.target.value))}><option value={0}>All loaded messages</option>{[5, 10, 20, 50].map(n => <option key={n} value={n}>Last {n} messages</option>)}</select></label>}
    <p><small>{input.length.toLocaleString()} characters selected{config ? `; limit ${config.maxInputCharacters.toLocaleString()}` : "; checking input limit…"}.{overLimit ? " Select a shorter excerpt to continue." : ""}</small></p>
    <button type="button" disabled={active || !input.trim() || !!overLimit} onClick={() => run("generate")}><Sparkles size={16} /> {busy ? "Working on device…" : task === "polish" ? "Polish with AI" : "Summarize conversation"}</button>
    {busy && <button className="quiet" type="button" onClick={() => controller.current?.abort()}>Cancel</button>}
    {status && <div role="status"><p>{status.text}</p>{typeof status.progress === "number" && <progress aria-label="Model loading progress" max={1} value={Math.max(0, Math.min(1, status.progress))} />}</div>}
    {partial && <p style={{ whiteSpace: "pre-wrap" }}>{partial}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {output && <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}>
      <p style={{ whiteSpace: "pre-wrap" }}>{output.text}</p>
      <small>{stale ? "Source text changed. Generate again before applying." : output.truncated ? "Output reached the token limit and may be incomplete. Shorten the source and generate again." : "AI suggestion. Check facts and amounts against the original."}</small>
      {onApply && <button type="button" disabled={!!stale || output.truncated || active} onClick={() => { onApply(output.text); setOutput(null); }}>Use this description</button>}
    </motion.div>}
  </div>;
}

export function conversationText(messages = []) {
  return messages.map(m => `${m.sender?.name || "Participant"} (${m.createdAt || "date unavailable"}): ${String(m.text || "").replaceAll("\n", " ")}`).join("\n");
}
