"use client";
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { api } from "@/lib/api";
import AgentDecision from "./AgentDecision";
import {
  useData,
  State,
  Heading,
  Field,
  ActionForm,
  Badge,
  colors,
  Empty,
} from "./ui";

export function DemandForecastPage() {
  const [result, setResult] = useState(null);
  const categories = useData("/categories");
  return (
    <>
      <Heading
        eyebrow="AI DEMAND INTELLIGENCE"
        title="Understand today's demand."
        description="Explore current open requests and recorded utilization, with suggested actions grounded in marketplace evidence."
      />
      <div style={{ margin: "24px 0", width: "100%" }}>
        <section className="panel" style={{ background: "#C3B1E1", width: "100%" }}>
          <Badge>LANGGRAPH DEMAND ANALYST</Badge>
          <h2>Inspect demand by market</h2>
          <State resource={categories}>
            {(cats) => (
              <ActionForm
                label="Analyze demand ✳"
                onSubmit={async (form) => {
                  setResult(null);
                  const data = Object.fromEntries(
                    [...form].filter(([, v]) => v !== ""),
                  );
                  setResult(
                    await api("/ai/forecast", { method: "POST", body: data }),
                  );
                  return "Demand snapshot reviewed.";
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  <Field
                    label="City (optional)"
                    name="city"
                    placeholder="Mumbai"
                  />
                  <Field label="Category (optional)" name="category" as="select">
                    <option value="">All categories</option>
                    {cats.map((category) => (
                      <option key={category._id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </Field>
                </div>
              </ActionForm>
            )}
          </State>
        </section>
      </div>
      {result && (
        <>
          <section className="panel">
            <h2>Demand observations</h2>
            <p className="ai-answer">{result.forecast}</p>
            <AgentDecision decision={result.decision} generation={result.generation} hideSummary />
            <p className="agent-review-note">Current snapshot, not a predictive forecast. {result.evidence?.demandGroups} demand groups reviewed.</p>
            {result.trace && (
              <div className="workflow-trace">
                {result.trace.map((t, i) => (
                  <div key={i} className="trace-step">
                    <div
                      className="trace-icon"
                      style={{ background: colors[i % colors.length] }}
                    >
                      {["📊", "🔍", "⚡", "🧠"][i] || "✓"}
                    </div>
                    {t}
                  </div>
                ))}
              </div>
            )}
          </section>
          <HorizonProjectionChart data={result.horizonProjections} />
          <DemandHeatmap data={result.heatmap} />
          <SupplyUtilization data={result.supply} />
          <LiquidityView data={result.liquidity} />
        </>
      )}
    </>
  );
}

export function HorizonProjectionChart({ data }) {
  if (!data?.length) return null;
  return (
    <section className="panel" style={{ marginTop: "1rem" }}>
      <div className="section-heading">
        <h2>7-day demand horizon projection</h2>
        <Badge>TIME-SERIES ML HORIZON</Badge>
      </div>
      <p>Calculates daily projected demand factoring weekend event surges and current open booking pressure.</p>
      <div style={{ width: "100%", height: 260, marginTop: "1rem" }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0CF" />
            <XAxis dataKey="day" stroke="#171915" tick={{ fontSize: 11, fontWeight: 700 }} />
            <YAxis stroke="#171915" tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value, name) => [value, name === "projectedDemand" ? "Projected Units" : name]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
              contentStyle={{ background: "#fffef8", border: "1.5px solid #171915", borderRadius: 10, boxShadow: "2px 2px 0 #171915", fontWeight: 700 }}
            />
            <Area type="monotone" dataKey="projectedDemand" stroke="#171915" strokeWidth={2} fill="#c3b1e1" fillOpacity={0.6} />
            <Area type="monotone" dataKey="confidenceMax" stroke="#9575cd" strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="forecast-grid" style={{ marginTop: "1rem" }}>
        {data.map((d) => (
          <div key={d.date} className="forecast-card" style={{ padding: "0.75rem", background: d.isWeekend ? "#ffe082" : "#f5f5f5", border: "1.5px solid #171915", borderRadius: "14px", boxShadow: "2px 2px 0 #171915" }}>
            <span className="eyebrow" style={{ fontSize: "0.7rem" }}>{d.day} · {d.date.slice(5)}</span>
            <strong style={{ fontSize: "1.2rem", display: "block" }}>{d.projectedDemand} units</strong>
            <small style={{ color: d.isWeekend ? "#d84315" : "#666" }}>
              {d.isWeekend ? "Weekend peak surge (+35%)" : "Routine weekday flow"}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DemandHeatmap({ data }) {
  if (!data?.length)
    return (
      <Empty
        title="No open demand in this market."
        text="Open resource requests will appear here when businesses submit them."
      />
    );

  const maxIntensity = Math.max(...data.map((d) => d.intensity || 1));
  const heatPalettes = [
    { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", accent: "#22C55E", label: "Normal" },
    { bg: "#FEFCE8", border: "#FEF08A", text: "#854D0E", accent: "#EAB308", label: "Elevated" },
    { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412", accent: "#F97316", label: "High" },
    { bg: "#FFF1F2", border: "#FECDD3", text: "#9F1239", accent: "#F43F5E", label: "Surge" },
    { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", accent: "#EF4444", label: "Peak Deficit" },
  ];

  return (
    <section
      className="panel"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)",
        border: "1px solid rgba(23, 25, 21, 0.12)",
        borderRadius: "20px",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "1rem",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#0F766E",
              display: "inline-block",
              marginBottom: 3,
            }}
          >
            REAL-TIME ABSORPTION
          </span>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#171915" }}>
            Demand Heatmap
          </h2>
        </div>
        <span
          style={{
            fontSize: "0.76rem",
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: "9999px",
            background: "#CCFBF1",
            color: "#0F766E",
            border: "1px solid #5EEAD4",
          }}
        >
          Live Market Ingestion
        </span>
      </div>
      <p style={{ margin: "0 0 1.25rem", color: "#64748B", fontSize: "0.88rem" }}>
        Hotter nodes represent higher unmet equipment & venue demand aggregated from live RFQs.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        {data.slice(0, 20).map((d, i) => {
          const level = Math.min(
            4,
            Math.floor(((d.intensity || 0) / maxIntensity) * 5)
          );
          const palette = heatPalettes[level];

          return (
            <div
              key={i}
              style={{
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: "16px",
                padding: "1rem",
                boxShadow: "0 3px 12px -2px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "110px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Top Temperature Glow Accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: palette.accent,
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#1E293B",
                    textTransform: "capitalize",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {(d.category || "").replaceAll("_", " ")}
                </span>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "2px 6px",
                    borderRadius: "9999px",
                    background: "#FFFFFF",
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {palette.label}
                </span>
              </div>

              <div style={{ margin: "6px 0 4px" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: palette.text, lineHeight: 1 }}>
                  {d.totalUnits?.toLocaleString() || 0}
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B", marginTop: 2 }}>
                  units requested
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "6px",
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontWeight: 600 }}>📍 {d.city || "All"}</span>
                <span>{d.requestCount} RFQs</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SupplyUtilization({ data }) {
  if (!data?.length)
    return (
      <Empty
        title="No supply utilization yet."
        text="Active resources and their reservations will appear here."
      />
    );
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Supply utilization</h2>
        <Badge>30-DAY WINDOW</Badge>
      </div>
      <div className="forecast-grid">
        {data.slice(0, 12).map((d, i) => (
          <div
            key={i}
            className="forecast-card"
            style={{ background: colors[i % colors.length] + "40" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <UtilizationRing percent={d.utilizationPercent} />
              <div>
                <h4>{d.title}</h4>
                <small>
                  {d.bookedDays} / {d.totalCapacityDays} capacity-days ·{" "}
                  {d.bookingCount} bookings
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UtilizationRing({ percent }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent > 70 ? "#FF6B6B" : percent > 40 ? "#FFB347" : "#4ECDC4";
  return (
    <div className="utilization-ring">
      <svg width="80" height="80">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#e5e0d5"
          strokeWidth="8"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span>{percent}%</span>
    </div>
  );
}

export function LiquidityView({ data }) {
  if (!data?.length)
    return (
      <Empty
        title="No market activity to compare."
        text="Searches, requests and bookings are needed to calculate market liquidity."
      />
    );
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Market liquidity</h2>
        <Badge>SEARCHES → BOOKINGS</Badge>
      </div>
      <div className="stack">
        {data.slice(0, 10).map((d, i) => (
          <div key={i}>
            <strong>
              {(d.category || "").replaceAll("_", " ")} — {d.city}
            </strong>
            <div className="liquidity-bar">
              <div
                style={{
                  width: `${Math.min(100, d.searches ? (d.requests / d.searches) * 100 : 0)}%`,
                  background: "#89CFF0",
                }}
              >
                {d.requests}
              </div>
              <div
                style={{
                  width: `${Math.min(100, d.searches ? (d.bookings / d.searches) * 100 : 0)}%`,
                  background: "#4ECDC4",
                }}
              >
                {d.bookings}
              </div>
            </div>
            <small>
              {d.searches} searches · {d.requests} request items · {d.bookings}{" "}
              bookings ·{" "}
              {d.liquidityRatio == null
                ? "No search baseline"
                : `${d.liquidityRatio}% bookings/searches`}{" "}
              ·
              {d.conversionRate == null
                ? "No request baseline"
                : `${d.conversionRate}% bookings/request items`}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketPulsePage() {
  const pulse = useData("/analytics/market-pulse");
  return (
    <>
      <Heading
        eyebrow="REAL-TIME INTELLIGENCE"
        title="Market pulse."
        description="Live marketplace activity, trending categories, and price movement from real data."
      />
      <State resource={pulse}>
        {(data) => (
          <>
            <div className="pulse-grid">
              {[
                [
                  "Searches today",
                  data.snapshot.searchesToday,
                  "#FFE66D",
                  "🔍",
                ],
                [
                  "Requests today",
                  data.snapshot.requestsToday,
                  "#89CFF0",
                  "📋",
                ],
                ["Bookings today", data.snapshot.bookingsToday, "#A8E6CF", "✓"],
                [
                  "Updated business profiles",
                  data.snapshot.activeBusinesses,
                  "#C3B1E1",
                  "🏢",
                ],
              ].map(([label, value, bg, icon]) => (
                <div
                  key={label}
                  className="pulse-card"
                  style={{ background: bg }}
                >
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <span className="pulse-value">{value}</span>
                  <span className="pulse-label">{label}</span>
                  <span className="pulse-sub">Last 24 hours</span>
                </div>
              ))}
            </div>
            {data.trendingCategories?.length > 0 && (
              <section className="panel">
                <h2>Trending categories</h2>
                <p>
                  Categories with highest search velocity in the last 24 hours.
                </p>
                <div className="chart" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendingCategories}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="searchVelocity"
                        name="Search velocity"
                        fill="#C3B1E1"
                        fillOpacity={0.6}
                        stroke="#7B61A8"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
            {data.priceMovement?.length > 0 && (
              <section className="panel">
                <h2>Booking totals</h2>
                <p>Average booking prices by category from the last 7 days.</p>
                <div className="forecast-grid">
                  {data.priceMovement.map((p, i) => (
                    <div
                      key={i}
                      className="forecast-card"
                      style={{ background: colors[i % colors.length] + "40" }}
                    >
                      <Badge>{(p.category || "").replaceAll("_", " ")}</Badge>
                      <h4>₹{(p.avgPrice || 0).toLocaleString("en-IN")}</h4>
                      <small>Average from {p.bookingCount} bookings</small>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </State>
    </>
  );
}

export function ProviderPerformancePage() {
  const perf = useData("/analytics/provider-performance");
  return (
    <>
      <Heading
        eyebrow="PROVIDER INSIGHTS"
        title="Your performance scorecard."
        description="Response time, acceptance rate, ratings, and booking history from real data."
      />
      <State resource={perf}>
        {(data) => {
          const items = Array.isArray(data) ? data : [data];
          const me = items[0];
          if (!me)
            return (
              <p>
                No performance data available yet. Complete bookings to build
                your scorecard.
              </p>
            );
          const radarData = [
            {
              metric: "Response",
              value:
                me.avgResponseHours != null
                  ? Math.max(0, 100 - me.avgResponseHours * 2)
                  : null,
              fullMark: 100,
            },
            {
              metric: "Acceptance",
              value: me.acceptanceRate ?? null,
              fullMark: 100,
            },
            {
              metric: "Rating",
              value: me.avgRating ? me.avgRating * 20 : null,
              fullMark: 100,
            },
            {
              metric: "Completion",
              value: me.completionRate ?? null,
              fullMark: 100,
            },
            {
              metric: "Volume",
              value: Math.min(100, (me.totalBookings || 0) * 10),
              fullMark: 100,
            },
          ];
          return (
            <>
              <div className="stat-grid">
                {[
                  [
                    "Response time",
                    me.avgResponseHours != null
                      ? `${me.avgResponseHours}h`
                      : "—",
                    "#FFE66D",
                  ],
                  [
                    "Acceptance rate",
                    me.acceptanceRate == null ? "—" : `${me.acceptanceRate}%`,
                    "#A8E6CF",
                  ],
                  ["Average rating", me.avgRating ? `${me.avgRating} ★` : "—", "#FFB347"],
                  ["Total bookings", me.totalBookings || 0, "#89CFF0"],
                ].map(([label, value, bg]) => (
                  <div
                    className="panel stat"
                    style={{ background: bg }}
                    key={label}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <section className="panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <h2 style={{ margin: 0 }}>Performance radar</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span className="badge" style={{ background: "#A8E6CF", border: "1.5px solid #171915" }}>
                      ⚡ Response Speed
                    </span>
                    <span className="badge" style={{ background: "#FFE66D", border: "1.5px solid #171915" }}>
                      🎯 Acceptance
                    </span>
                    <span className="badge" style={{ background: "#FFB347", border: "1.5px solid #171915" }}>
                      ★ Reputation
                    </span>
                  </div>
                </div>
                <div className="chart" style={{ height: 320, marginTop: "1rem" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#d4d1c8" />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fontSize: 12, fontWeight: 700 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#4ECDC4"
                        fill="#4ECDC4"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          );
        }}
      </State>
    </>
  );
}
