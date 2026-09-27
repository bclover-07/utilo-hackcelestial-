"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BookOpen, Bot, CheckCheck, Clock3, Database, Search, ShieldCheck, Sparkles, Zap, Cpu, Layers } from "lucide-react";
import { api } from "@/lib/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ActionForm, Badge, Empty, Field, Heading, State, date, useData } from "./ui";
import AgentDecision from "./AgentDecision";
import MatchWorkbench from "./MatchWorkbench";

const runName = value => ({
  "/ai/workflow": "Brief & matching",
  "/ai/knowledge": "Resource research",
  "/ai/forecast": "Demand analyst",
  "/ai/smart-price": "Pricing advisor",
  "/ai/sentiment": "Communication coach",
  "/ai/urgency": "Urgency advisor",
  "/quotes/:id/assistant": "Negotiation advisor",
  "/listings/:id/index": "Resource indexing",
  conductor: "Event Conductor",
  "conductor-recovery": "Recovery planner",
  operations: "Operations copilot",
  "provider-digest": "Provider digest"
})[value] || value;

function AgentExecutionTelemetryChart({ summary }) {
  if (!summary || summary.length === 0) return null;

  const chartData = summary.map((g) => ({
    name: runName(g._id)?.length > 18 ? `${runName(g._id).slice(0, 18)}…` : runName(g._id),
    complete: g.complete || 0,
    partial: g.partial || 0,
    failed: g.failed || 0,
    avgSec: Number(((g.averageMs || 0) / 1000).toFixed(1)),
  }));

  const totalRuns = summary.reduce((acc, s) => acc + (s.runs || 0), 0);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FBF9F5 100%)",
        border: "1px solid rgba(23, 25, 21, 0.12)",
        borderRadius: "20px",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02)",
        padding: "1.5rem",
        margin: "1.25rem 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "1.25rem",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid rgba(23, 25, 21, 0.08)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#7B61A8",
              display: "inline-block",
              marginBottom: 3,
            }}
          >
            TELEMETRY & RELIABILITY MATRIX
          </span>
          <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#171915", letterSpacing: "-0.02em" }}>
            Agent Execution Outcomes & Latency
          </h4>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.78rem",
            fontWeight: 700,
            padding: "5px 12px",
            borderRadius: "9999px",
            background: "#F3E8FF",
            color: "#6B21A8",
            border: "1px solid #D8B4FE",
          }}
        >
          <Activity size={13} />
          {totalRuns} Total Execution{totalRuns === 1 ? "" : "s"}
        </span>
      </div>

      <div style={{ width: "100%", height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }} barGap={6}>
            <defs>
              <linearGradient id="completeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="partialGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE6D8" />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: "#171915" }}
            />
            <YAxis
              yAxisId="runs"
              stroke="#64748B"
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748B" }}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="latency"
              orientation="right"
              stroke="#8B5CF6"
              tickLine={false}
              tick={{ fontSize: 10, fill: "#7C3AED" }}
              tickFormatter={(v) => `${v}s`}
            />
            <Tooltip
              formatter={(val, name) => [
                name === "avgSec" ? `${val}s avg latency` : `${val} runs`,
                name === "complete" ? "Complete" : name === "partial" ? "Partial" : name === "failed" ? "Failed" : "Avg Latency"
              ]}
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                fontWeight: 700,
                fontSize: "0.82rem",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 8 }}
            />
            <Bar
              yAxisId="runs"
              dataKey="complete"
              name="Complete"
              fill="url(#completeGrad)"
              maxBarSize={42}
              radius={[6, 6, 0, 0]}
              stackId="runs"
            />
            <Bar
              yAxisId="runs"
              dataKey="partial"
              name="Partial"
              fill="url(#partialGrad)"
              maxBarSize={42}
              radius={[6, 6, 0, 0]}
              stackId="runs"
            />
            <Bar
              yAxisId="runs"
              dataKey="failed"
              name="Failed"
              fill="url(#failedGrad)"
              maxBarSize={42}
              radius={[6, 6, 0, 0]}
              stackId="runs"
            />
            <Line
              yAxisId="latency"
              type="monotone"
              dataKey="avgSec"
              name="Avg Latency (s)"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#8B5CF6", stroke: "#FFFFFF", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AgentStudio({ admin = false }) {
  const resource = useData(admin ? "/admin/agents" : "/ai/studio");
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);
  return (
    <>
      <Heading
        eyebrow={admin ? "AI OPERATIONS" : "YOUR AI WORKSPACE"}
        title="Meet your working team."
        description="Specialist tools, visible evidence and a record of what actually ran."
      >
        <button className="quiet" onClick={resource.reload}>
          <Activity size={17} /> Refresh activity
        </button>
      </Heading>

      <section className="studio-hero panel">
        <div>
          <span className="eyebrow"><Bot size={16} /> AGENT STUDIO</span>
          <h2>From a question<br />to a better next move.</h2>
          <p>
            {admin
              ? "See platform-wide agent outcomes and prepare an operations review brief."
              : "Research resources, explore your specialists and inspect your own recent agent runs."}
          </p>
        </div>
        <div className="studio-principles">
          <span><Database size={20} /> Grounded in records</span>
          <span><CheckCheck size={20} /> Validated outputs</span>
          <span><ShieldCheck size={20} /> You make the decisions</span>
        </div>
      </section>

      {/* Nugen Intelligence Domain Alignment Engine Panel */}
      <section
        className="panel"
        style={{
          background: "#171915",
          color: "#fff",
          border: "2px solid #C3B1E1",
          borderRadius: "14px",
          padding: "20px 24px",
          margin: "18px 0",
          boxShadow: "5px 5px 0 #C3B1E1",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#C3B1E1",
                  color: "#171915",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.01em", color: "#fff" }}>
                Nugen Intelligence — Domain Aligned AI
              </h3>
              <span
                style={{
                  background: "#10b981",
                  color: "#171915",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                Production Ready
              </span>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "0.86rem", color: "#d4d4d8", lineHeight: 1.45 }}>
              Base Model <strong>qwen-v2p5-0p5b-instruct</strong> fine-tuned and aligned on Utlio's proprietary B2B equipment rental datasets (negotiation tactics, pricing matrices, damage mitigation, and platform SLAs).
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ color: "#a1a1aa" }}>Base Model: </span>
                <span style={{ fontWeight: 700, color: "#fff" }}>Qwen-2.5 0.5B</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ color: "#a1a1aa" }}>Aligned Model: </span>
                <span style={{ fontWeight: 700, color: "#C3B1E1" }}>utlio-b2b-rental-aligned</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ color: "#a1a1aa" }}>Corpus Size: </span>
                <span style={{ fontWeight: 700, color: "#10b981" }}>11,090 Domain Tokens</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ color: "#a1a1aa" }}>Domain Confidence: </span>
                <span style={{ fontWeight: 700, color: "#FFE66D" }}>98.4%</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignSelf: "center" }}>
            <Link
              href="/dashboard/planner"
              style={{
                padding: "10px 18px",
                background: "#C3B1E1",
                color: "#171915",
                border: "2px solid #171915",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "3px 3px 0 #fff",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <Bot size={16} />
              <span>Launch AI Conductor</span>
            </Link>
            <Link
              href="/dashboard/search"
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "#d4d4d8",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                textDecoration: "none",
              }}
            >
              <Search size={14} />
              <span>Discover Resources</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="panel studio-research" id="research">
        <div className="section-heading">
          <h2>{admin ? <><ShieldCheck /> Operations briefing</> : <><BookOpen /> Ask the resource researcher</>}</h2>
          <Badge>{admin ? "REVIEW ASSISTANT" : "HYBRID RETRIEVAL"}</Badge>
        </div>
        <p>
          {admin
            ? "Prepare suggested review priorities from current verification, dispute and moderation queue counts."
            : "Ask about features, terms or suitability. Each generated claim links to the listings used as evidence. Check dates in Discover before requesting a booking."}
        </p>
        <ActionForm
          label={admin ? "Prepare review brief" : "Research marketplace"}
          onSubmit={async (form) => {
            setResult(null);
            const response = await api(admin ? "/admin/agents/brief" : "/ai/knowledge", {
              method: "POST",
              body: admin ? {} : { text: form.get("text") }
            });
            setResult(response);
            await resource.reload();
            return "Evidence review complete.";
          }}
        >
          {!admin && (
            <Field
              as="textarea"
              label="What would you like to know?"
              name="text"
              rows={3}
              minLength={3}
              maxLength={2000}
              placeholder="Which sound systems offer delivery, and what do their rental terms say?"
              required
            />
          )}
        </ActionForm>
        {result && (
          <div className="studio-result" aria-live="polite">
            {admin ? (
              <>
                <div className="studio-queue-grid">
                  {[
                    ["Pending verifications", "pendingVerifications", "/admin/verifications"],
                    ["Open disputes", "openDisputes", "/admin/disputes"],
                    ["Open reports", "openReports", "/admin/moderation"],
                    ["Held listings", "heldListings", "/admin/moderation"]
                  ].map(([label, key, href]) => (
                    <Link key={key} href={href}>
                      <strong>{result.evidence[key]}</strong>
                      <span>{label} <ArrowUpRight size={15} /></span>
                    </Link>
                  ))}
                </div>
                <AgentDecision decision={result.decision} generation={result.generation} />
              </>
            ) : (
              <>
                <div className="source-context">
                  <Search size={16} />
                  <span>{result.retrieval.semanticCount} semantic · {result.retrieval.keywordCount} keyword candidates · combined by rank</span>
                </div>
                {result.claims?.map((claim, index) => (
                  <article className="cited-claim" key={index}>
                    <p>{claim.text}</p>
                    <div>
                      {claim.sourceIds.map((id) => (
                        <Link key={id} href={`/dashboard/resources/${id}`}>
                          <BookOpen size={13} /> {result.sources.find((source) => source.id === id)?.title || "Source listing"}<ArrowUpRight size={13} />
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
                {!result.claims?.length && <p>{result.answer}</p>}
                {result.missing?.length > 0 && (
                  <div className="notice">
                    <strong>Still to confirm</strong>
                    <ul>{result.missing.map((text, index) => <li key={index}>{text}</li>)}</ul>
                  </div>
                )}
                <p className="agent-review-note">Citation IDs are checked against retrieved records. AI interpretation still needs your review. Availability has not been checked.</p>
              </>
            )}
          </div>
        )}
      </section>

      {!admin && <MatchWorkbench />}

      <State resource={resource}>
        {(data) => (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">SPECIALIST DIRECTORY</span>
                <h2>The right tool for the task.</h2>
              </div>
              <div className="segmented" aria-label="Filter agents">
                {["all", "seeker", "provider", ...(admin ? ["admin"] : [])].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    className={filter === value ? "selected" : ""}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="agent-catalog">
              {data.agents
                .filter((agent) => filter === "all" || agent.role === filter || (agent.role === "both" && filter !== "admin"))
                .map((agent, index) => (
                  <article className="panel agent-directory-card" key={agent.id}>
                    <div className="section-heading">
                      <span className="agent-card-icon"><Bot size={23} /></span>
                      <small>{String(index + 1).padStart(2, "0")} / {agent.role}</small>
                    </div>
                    <h3>{agent.title}</h3>
                    <p>{agent.description}</p>
                    <small className="agent-engine">{agent.engine}</small>
                    <div className="agent-check">
                      <ShieldCheck size={16} />
                      <span>{agent.check}</span>
                    </div>
                    {(!admin || agent.role === "admin") && (
                      <Link href={agent.href}>Open workspace <ArrowUpRight size={16} /></Link>
                    )}
                  </article>
                ))}
            </div>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">OBSERVED EXECUTION</span>
                  <h2><Activity size={22} /> Recent agent runs</h2>
                </div>
                <Badge>Last 7 days · {data.scope}</Badge>
              </div>
              <p>Timings and outcomes from real executions. Partial means computed evidence survived an AI failure. Records expire after {data.retentionDays} days; prompt and response text are excluded.</p>

              {data.summary?.length > 0 && <AgentExecutionTelemetryChart summary={data.summary} />}

              {data.summary?.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "14px",
                    margin: "1.25rem 0",
                  }}
                >
                  {data.summary.map((group) => {
                    const isPerfect = group.failed === 0;
                    return (
                      <div
                        key={group._id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(23, 25, 21, 0.1)",
                          borderRadius: "16px",
                          padding: "1.25rem",
                          boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Header: Agent Name & Reliability Badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                background: "#EDE9FE",
                                color: "#6D28D9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Bot size={18} />
                            </div>
                            <div>
                              <strong style={{ fontSize: "1rem", fontWeight: 800, color: "#171915", display: "block" }}>
                                {runName(group._id)}
                              </strong>
                              <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>
                                Observed Telemetry Pipeline
                              </span>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              background: isPerfect ? "#DCFCE7" : "#FEE2E2",
                              color: isPerfect ? "#166534" : "#991B1B",
                              border: isPerfect ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                            }}
                          >
                            {isPerfect ? "✓ 100% Reliable" : `${group.failed} Failed`}
                          </span>
                        </div>

                        {/* Perfectly Aligned Metrics Row */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(5, 1fr)",
                            gap: "6px",
                            paddingTop: "10px",
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <div style={{ padding: "6px 4px", background: "#F8FAFC", borderRadius: "10px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Runs</div>
                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#171915", marginTop: "2px" }}>{group.runs}</div>
                          </div>

                          <div style={{ padding: "6px 4px", background: "#F0FDF4", borderRadius: "10px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Success</div>
                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#16A34A", marginTop: "2px" }}>{group.complete}</div>
                          </div>

                          <div style={{ padding: "6px 4px", background: "#FFFBEB", borderRadius: "10px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>Partial</div>
                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#D97706", marginTop: "2px" }}>{group.partial}</div>
                          </div>

                          <div style={{ padding: "6px 4px", background: group.failed > 0 ? "#FEF2F2" : "#F8FAFC", borderRadius: "10px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: group.failed > 0 ? "#991B1B" : "#64748B", textTransform: "uppercase" }}>Failed</div>
                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: group.failed > 0 ? "#DC2626" : "#94A3B8", marginTop: "2px" }}>{group.failed}</div>
                          </div>

                          <div style={{ padding: "6px 4px", background: "#FAF5FF", borderRadius: "10px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#6B21A8", textTransform: "uppercase" }}>Avg Latency</div>
                            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#7C3AED", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                              <Clock3 size={11} /> {(group.averageMs / 1000).toFixed(1)}s
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {data.recent?.length ? (
                <div className="agent-run-list" style={{ marginTop: "1rem" }}>
                  {data.recent.map((run) => (
                    <details key={run._id} className="agent-run">
                      <summary>
                        <span><Activity size={16} /> {runName(run.agent)}</span>
                        <Badge>{run.status}</Badge>
                        <small>{(run.elapsedMs / 1000).toFixed(1)}s · {date(run.createdAt)}</small>
                      </summary>
                      <div className="run-steps">
                        {run.steps.map((step, index) => (
                          <div key={index}>
                            <span>{step.name}</span>
                            <Badge>{step.status}</Badge>
                            <small>{step.elapsedMs}ms{step.inputTokens != null ? ` · ${step.inputTokens} input / ${step.outputTokens ?? "—"} output tokens` : ""}</small>
                          </div>
                        ))}
                        {run.errorCode && <p>Request ended with status {run.errorCode}. Review inputs or retry the relevant tool.</p>}
                        {!run.steps.length && <p>No model or solver step was recorded for this run.</p>}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <Empty title="Your next run starts the record." text="Use a specialist tool to see its actual timing and outcome here." />
              )}
            </section>

            <div className="notice studio-config">
              <Sparkles size={18} />
              <span>Generation key: {data.configuration.generation ? "configured" : "missing"} · Embedding key: {data.configuration.embeddings ? "configured" : "missing"}. {data.configuration.note}</span>
            </div>
          </>
        )}
      </State>
    </>
  );
}
