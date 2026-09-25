"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BookOpen, Bot, CheckCheck, Clock3, Database, Search, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { ActionForm, Badge, Empty, Field, Heading, State, date, useData } from "./ui";
import AgentDecision from "./AgentDecision";

const runName = value => ({ "/ai/workflow": "Brief & matching", "/ai/knowledge": "Resource research", "/ai/forecast": "Demand analyst", "/ai/smart-price": "Pricing advisor", "/ai/sentiment": "Communication coach", "/ai/urgency": "Urgency advisor", "/quotes/:id/assistant": "Negotiation advisor", "/listings/:id/index": "Resource indexing", conductor: "Event Conductor", "conductor-recovery": "Recovery planner", operations: "Operations copilot", "provider-digest": "Provider digest" })[value] || value;

export default function AgentStudio({ admin = false }) {
  const resource = useData(admin ? "/admin/agents" : "/ai/studio");
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);
  return <>
    <Heading eyebrow={admin ? "AI OPERATIONS" : "YOUR AI WORKSPACE"} title="Meet your working team." description="Specialist tools, visible evidence and a record of what actually ran."><button className="quiet" onClick={resource.reload}><Activity size={17} /> Refresh activity</button></Heading>
    <section className="studio-hero panel"><div><span className="eyebrow"><Bot size={16} /> AGENT STUDIO</span><h2>From a question<br />to a better next move.</h2><p>{admin ? "See platform-wide agent outcomes and prepare an operations review brief." : "Research resources, explore your specialists and inspect your own recent agent runs."}</p></div><div className="studio-principles"><span><Database size={20} /> Grounded in records</span><span><CheckCheck size={20} /> Validated outputs</span><span><ShieldCheck size={20} /> You make the decisions</span></div></section>
    <section className="panel studio-research" id="research"><div className="section-heading"><h2>{admin ? <><ShieldCheck /> Operations briefing</> : <><BookOpen /> Ask the resource researcher</>}</h2><Badge>{admin ? "REVIEW ASSISTANT" : "HYBRID RETRIEVAL"}</Badge></div>
      <p>{admin ? "Prepare suggested review priorities from current verification, dispute and moderation queue counts." : "Ask about features, terms or suitability. Each generated claim links to the listings used as evidence. Check dates in Discover before requesting a booking."}</p>
      <ActionForm label={admin ? "Prepare review brief" : "Research marketplace"} onSubmit={async form => { setResult(null); const response = await api(admin ? "/admin/agents/brief" : "/ai/knowledge", { method: "POST", body: admin ? {} : { text: form.get("text") } }); setResult(response); await resource.reload(); return "Evidence review complete."; }}>
        {!admin && <Field as="textarea" label="What would you like to know?" name="text" rows={3} minLength={3} maxLength={2000} placeholder="Which sound systems offer delivery, and what do their rental terms say?" required />}
      </ActionForm>
      {result && <div className="studio-result" aria-live="polite">
        {admin ? <><div className="studio-queue-grid">{[["Pending verifications", "pendingVerifications", "/admin/verifications"], ["Open disputes", "openDisputes", "/admin/disputes"], ["Open reports", "openReports", "/admin/moderation"], ["Held listings", "heldListings", "/admin/moderation"]].map(([label, key, href]) => <Link key={key} href={href}><strong>{result.evidence[key]}</strong><span>{label} <ArrowUpRight size={15} /></span></Link>)}</div><AgentDecision decision={result.decision} generation={result.generation} /></> : <>
          <div className="source-context"><Search size={16} /><span>{result.retrieval.semanticCount} semantic · {result.retrieval.keywordCount} keyword candidates · combined by rank</span></div>
          {result.claims?.map((claim, index) => <article className="cited-claim" key={index}><p>{claim.text}</p><div>{claim.sourceIds.map(id => <Link key={id} href={`/dashboard/resources/${id}`}><BookOpen size={13} /> {result.sources.find(source => source.id === id)?.title || "Source listing"}<ArrowUpRight size={13} /></Link>)}</div></article>)}
          {!result.claims?.length && <p>{result.answer}</p>}
          {result.missing?.length > 0 && <div className="notice"><strong>Still to confirm</strong><ul>{result.missing.map((text, index) => <li key={index}>{text}</li>)}</ul></div>}
          <p className="agent-review-note">Citation IDs are checked against retrieved records. AI interpretation still needs your review. Availability has not been checked.</p>
        </>}
      </div>}
    </section>
    <State resource={resource}>{data => <>
      <div className="section-heading"><div><span className="eyebrow">SPECIALIST DIRECTORY</span><h2>The right tool for the task.</h2></div><div className="segmented" aria-label="Filter agents">{["all", "seeker", "provider", ...(admin ? ["admin"] : [])].map(value => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={filter === value ? "selected" : ""}>{value}</button>)}</div></div>
      <div className="agent-catalog">{data.agents.filter(agent => filter === "all" || agent.role === filter || (agent.role === "both" && filter !== "admin")).map((agent, index) => <article className="panel agent-directory-card" key={agent.id}><div className="section-heading"><span className="agent-card-icon"><Bot size={23} /></span><small>{String(index + 1).padStart(2, "0")} / {agent.role}</small></div><h3>{agent.title}</h3><p>{agent.description}</p><small className="agent-engine">{agent.engine}</small><div className="agent-check"><ShieldCheck size={16} /><span>{agent.check}</span></div>{(!admin || agent.role === "admin") && <Link href={agent.href}>Open workspace <ArrowUpRight size={16} /></Link>}</article>)}</div>
      <section className="panel"><div className="section-heading"><div><span className="eyebrow">OBSERVED EXECUTION</span><h2><Activity size={22} /> Recent agent runs</h2></div><Badge>Last 7 days · {data.scope}</Badge></div><p>Timings and outcomes from real executions. Partial means computed evidence survived an AI failure. Records expire after {data.retentionDays} days; prompt and response text are excluded.</p>
        {data.summary.length > 0 && <div className="run-summary">{data.summary.map(group => <div key={group._id}><strong>{runName(group._id)}</strong><span>{group.runs} runs · {group.complete} complete · {group.partial} partial · {group.failed} failed</span><small><Clock3 size={12} /> {(group.averageMs / 1000).toFixed(1)}s average elapsed</small></div>)}</div>}
        {data.recent.length ? <div className="agent-run-list">{data.recent.map(run => <details key={run._id} className="agent-run"><summary><span><Activity size={16} /> {runName(run.agent)}</span><Badge>{run.status}</Badge><small>{(run.elapsedMs / 1000).toFixed(1)}s · {date(run.createdAt)}</small></summary><div className="run-steps">{run.steps.map((step, index) => <div key={index}><span>{step.name}</span><Badge>{step.status}</Badge><small>{step.elapsedMs}ms{step.inputTokens != null ? ` · ${step.inputTokens} input / ${step.outputTokens ?? "—"} output tokens` : ""}</small></div>)}{run.errorCode && <p>Request ended with status {run.errorCode}. Review inputs or retry the relevant tool.</p>}{!run.steps.length && <p>No model or solver step was recorded for this run.</p>}</div></details>)}</div> : <Empty title="Your next run starts the record." text="Use a specialist tool to see its actual timing and outcome here." />}
      </section>
      <div className="notice studio-config"><Sparkles size={18} /><span>Generation key: {data.configuration.generation ? "configured" : "missing"} · Embedding key: {data.configuration.embeddings ? "configured" : "missing"}. {data.configuration.note}</span></div>
    </>}</State>
  </>;
}
