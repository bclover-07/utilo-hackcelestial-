"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCheck, CircleAlert, Sparkles } from "lucide-react";

export default function AgentDecision({ decision, generation, hideSummary = false }) {
  const reduced = useReducedMotion();
  if (!decision) return generation?.status === "unavailable" ? <p className="notice" role="status"><CircleAlert size={17} aria-hidden="true" /> {generation.message}</p> : null;
  return <motion.div className="agent-decision" initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .25 }}>
    {!hideSummary && <p className="ai-answer">{decision.summary}</p>}
    {decision.observations?.length > 0 && <div className="decision-observations"><h4><CheckCheck size={17} /> What the records show</h4><ul>{decision.observations.map((text, index) => <li key={index}>{text}</li>)}</ul></div>}
    {decision.actions?.length > 0 && <div><h4><Sparkles size={17} /> Suggested next steps</h4><div className="decision-actions">{decision.actions.map((action, index) => <article key={index} className="decision-action"><span className="decision-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{action.title}</strong><p>{action.detail}</p></div><ArrowUpRight size={17} aria-hidden="true" /></article>)}</div></div>}
    {decision.caveats?.length > 0 && <details className="decision-caveats"><summary><CircleAlert size={16} /> Assumptions & limitations ({decision.caveats.length})</summary><ul>{decision.caveats.map((text, index) => <li key={index}>{text}</li>)}</ul></details>}
    <small className="agent-review-note">Suggestions for your review. No marketplace action has been taken.</small>
  </motion.div>;
}
