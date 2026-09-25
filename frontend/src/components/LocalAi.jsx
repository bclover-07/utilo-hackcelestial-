"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { runLocalAi } from "@/lib/local-ai";

export default function LocalAi({ task = "summarize", text, onApply }) {
  const [output, setOutput] = useState(null), [status, setStatus] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [compact, setCompact] = useState(false);
  const controller = useRef(null), reduced = useReducedMotion();
  const [excerpt, setExcerpt] = useState(0);
  const input = task === "summarize" && excerpt ? text.split("\n").slice(-excerpt).join("\n") : text;
  useEffect(() => () => controller.current?.abort(), []);
  const stale = output && output.source !== input;
  return <div className="local-ai panel" style={{ background: "var(--lilac)", marginBlock: 16 }}>
    <h4><Sparkles size={18} /> AI on your device</h4>
    <p>Optional model download (hundreds of MB to over 1 GB). Requires WebGPU and free device memory. Drafts and messages stay on this device; model files download from external hosts.</p>
    <label className="check"><input type="checkbox" checked={compact} disabled={busy} onChange={e => setCompact(e.target.checked)} /> Use smaller model for limited memory</label>
    {task === "summarize" && <label>Conversation scope <select value={excerpt} disabled={busy} onChange={e => setExcerpt(Number(e.target.value))}><option value={0}>All loaded messages</option>{[5, 10, 20, 50].map(n => <option key={n} value={n}>Last {n} messages</option>)}</select><small>{input.length} characters selected; limit 6,000. Select an excerpt for longer threads.</small></label>}
    <button type="button" disabled={busy || !text?.trim()} onClick={async () => {
      if (controller.current) return;
      const pending = new AbortController(); controller.current = pending;
      setBusy(true); setError(""); setOutput(null);
      try { const result = await runLocalAi(task, input, compact, setStatus, pending.signal); if (!pending.signal.aborted) setOutput({ text: result, source: input }); }
      catch (err) { setError(pending.signal.aborted ? "Cancelled. You can keep editing." : err.message); }
      finally { controller.current = null; setBusy(false); setStatus(""); }
    }}><Sparkles size={16} /> {busy ? "Working on device…" : task === "polish" ? "Polish with AI" : "Summarize conversation"}</button>
    {busy && <button className="quiet" type="button" onClick={() => controller.current?.abort()}>Cancel</button>}
    {status && <p role="status">{status}</p>}{error && <p className="error" role="alert">{error}</p>}
    {output && <motion.div initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}>
      <p style={{ whiteSpace: "pre-wrap" }}>{output.text}</p>
      <small>{stale ? "Source text changed. Generate again before applying." : "AI suggestion. Check facts and amounts against the original."}</small>
      {onApply && <button type="button" disabled={!!stale} onClick={() => { onApply(output.text); setOutput(null); }}>Use this description</button>}
    </motion.div>}
  </div>;
}

export function conversationText(messages = []) {
  return messages.map(m => `${m.sender?.name || "Participant"} (${m.createdAt || "date unavailable"}): ${m.text.replaceAll("\n", " ")}`).join("\n");
}
