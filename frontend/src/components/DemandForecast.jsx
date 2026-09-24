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
        title="See what the market needs next."
        description="AI analyzes real search patterns, request volumes, and supply gaps to predict upcoming demand."
      />
      <div className="split-layout">
        <section className="panel" style={{ background: "#C3B1E1" }}>
          <Badge>LANGGRAPH DEMAND FORECASTER</Badge>
          <h2>Forecast demand by market</h2>
          <State resource={categories}>
            {(cats) => (
              <ActionForm
                label="Generate forecast ✳"
                onSubmit={async (form) => {
                  setResult(null);
                  const data = Object.fromEntries(
                    [...form].filter(([, v]) => v !== ""),
                  );
                  setResult(
                    await api("/ai/forecast", { method: "POST", body: data }),
                  );
                  return "Forecast generated from real marketplace data.";
                }}
              >
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
              </ActionForm>
            )}
          </State>
        </section>
        <section className="panel" style={{ background: "#FFE66D" }}>
          <h3>How it works</h3>
          <div className="ai-flow-visual">
            <div className="ai-node" style={{ background: "#A8E6CF" }}>
              📊 Data Gatherer
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#89CFF0" }}>
              🔍 Heatmap
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#FFB347" }}>
              ⚡ Supply Check
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#C3B1E1" }}>
              🧠 Gemini AI
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#FF85A1" }}>
              📈 Forecast
            </div>
          </div>
          <p>
            The LangGraph pipeline gathers real aggregated data from searches,
            requests, and listings, then runs it through Gemini for pattern
            analysis.
          </p>
        </section>
      </div>
      {result && (
        <>
          <section className="panel">
            <h2>AI Forecast</h2>
            <p className="ai-answer">{result.forecast}</p>
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
          <DemandHeatmap data={result.heatmap} />
          <SupplyUtilization data={result.supply} />
          <LiquidityView data={result.liquidity} />
        </>
      )}
    </>
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
  const heatColors = ["#A8E6CF", "#FFE66D", "#FFB347", "#FF85A1", "#FF6B6B"];
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Demand heatmap</h2>
        <Badge>LIVE DATA</Badge>
      </div>
      <p>Hotter cells indicate higher unmet demand based on open requests.</p>
      <div className="heatmap-grid">
        {data.slice(0, 20).map((d, i) => {
          const level = Math.min(
            4,
            Math.floor(((d.intensity || 0) / maxIntensity) * 5),
          );
          return (
            <div
              key={i}
              className="heatmap-cell"
              style={{ background: heatColors[level] }}
            >
              <strong>{d.totalUnits}</strong>
              {(d.category || "").replaceAll("_", " ")}
              <br />
              <small>
                {d.city} · {d.requestCount} requests
              </small>
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
                  ["Average rating", me.avgRating || "—", "#FFB347"],
                  ["Total bookings", me.totalBookings, "#89CFF0"],
                ].map(([label, value, bg]) => (
                  <div
                    className="panel stat"
                    style={{ background: bg }}
                    key={label}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>From marketplace records</small>
                  </div>
                ))}
              </div>
              <section className="panel">
                <h2>Performance radar</h2>
                <p>
                  Derived indicators: response = 100 − twice hours; rating =
                  stars × 20; volume = bookings × 10 (capped at 100). Missing
                  values remain blank.
                </p>
                <div className="chart" style={{ height: 320 }}>
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
