"use client";
import Link from "next/link";
import MarketIntelligence from "./MarketIntelligence";
import ExchangeWorkflow from "./ExchangeWorkflow";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  TrendingUp,
  Zap,
  Calendar,
  Bot,
  Search,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  Award,
  Clock,
  CheckCircle2,
  Star,
} from "lucide-react";
import {
  useData,
  State,
  Empty,
  Heading,
  Badge,
  money,
  colors,
} from "./ui";

function ActivityPipelineVisual({ data, admin, dashboardRole, user }) {
  const seeker = !admin && dashboardRole === "seeker";
  const stages = [
    {
      step: "01",
      badge: admin ? "Supply Pool" : seeker ? "Saved Supply" : "Active Inventory",
      val: admin ? data.businesses : seeker ? (user.favorites?.length || 0) : data.listings,
      label: admin ? "Registered businesses" : seeker ? "Saved items to book" : "Listed resources",
      color: "var(--yellow, #FFE66D)",
    },
    {
      step: "02",
      badge: "In Negotiation",
      val: data.quotes,
      label: "Active RFQ threads",
      color: "var(--teal, #4ECDC4)",
    },
    {
      step: "03",
      badge: "Agreed booking value",
      val: money(data.totalValue),
      label: "Committed exchange value",
      color: "var(--lavender, #C9B5EE)",
    },
    {
      step: "04",
      badge: "Request fulfilment",
      val: data.fulfillmentRate === null ? "No requests yet" : `${data.fulfillmentRate}%`,
      label: "Fully confirmed requirements",
      meter: data.fulfillmentRate,
      color: "var(--mint, #A8E6CF)",
    },
  ];

  return (
    <div className="activity-pipeline-deck">
      {stages.map((st, i) => (
        <div key={i} className="pipeline-card">
          <div className="pipeline-top">
            <span className="pipeline-stage-tag">STAGE {st.step}</span>
            <span className="pipeline-step-badge" style={{ backgroundColor: st.color }}>
              {st.badge}
            </span>
          </div>
          <div className="pipeline-body">
            <div className="pipeline-val-row">
              <span className="pipeline-val">{st.val}</span>
              <span className="live-dot" />
            </div>
            <div className="pipeline-label">{st.label}</div>
            {st.meter != null && (
              <div className="pipeline-meter-bar">
                <div
                  className="pipeline-meter-fill"
                  style={{ width: `${Math.min(Math.max(st.meter, 0), 100)}%`, background: st.color }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleCommandDeck({ dashboardRole, admin }) {
  if (admin) {
    return (
      <div className="command-deck-grid">
        <div className="command-card" style={{ background: "var(--yellow, #FFE66D)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><ShieldCheck size={20} /></div>
            <span className="command-pill">KYC Queue</span>
          </div>
          <div className="command-content">
            <h3 className="command-title">Business Verifications</h3>
            <p className="command-desc">Review submitted business identity, compliance proofs and merchant KYC.</p>
          </div>
          <Link href="/admin/verifications" className="command-action-btn">
            <span>Review Queue</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--teal, #4ECDC4)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Bot size={20} /></div>
            <span className="command-pill">AI Engine</span>
          </div>
          <div className="command-content">
            <h3 className="command-title">AI Ops & Supervisor</h3>
            <p className="command-desc">Audit Conductor execution, Monte Carlo resilience & critic reflections.</p>
          </div>
          <Link href="/admin/agents" className="command-action-btn">
            <span>Inspect Agents</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--lavender, #C9B5EE)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><TrendingUp size={20} /></div>
            <span className="command-pill">Marketplace</span>
          </div>
          <div className="command-content">
            <h3 className="command-title">Liquidity & Policy</h3>
            <p className="command-desc">Manage regional fee structures, escrow terms & categories.</p>
          </div>
          <Link href="/admin/analytics" className="command-action-btn">
            <span>Marketplace Health</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (dashboardRole === "provider") {
    return (
      <div className="command-deck-grid">
        <div className="command-card" style={{ background: "var(--yellow, #FFE66D)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Zap size={20} /></div>
            <span className="command-pill">AUTO-PILOT ACTIVE</span>
          </div>
          <div className="command-content">
            <h3 className="command-title">Smart Pricing Advisor</h3>
            <p className="command-desc">Dynamic yield optimization with floor bounds & cannibalization shields.</p>
          </div>
          <Link href="/dashboard/smart-pricing" className="command-action-btn">
            <span>Tune Pricing Strategy</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--teal, #4ECDC4)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Calendar size={20} /></div>
            <span className="command-pill">CALENDAR SYNC</span>
          </div>
          <div className="command-content">
            <h3 className="command-title">Availability & Calendar</h3>
            <p className="command-desc">Manage blackout dates, delivery slots & reserve unit quantities with zero overlap.</p>
          </div>
          <Link href="/dashboard/calendar" className="command-action-btn">
            <span>Manage Slots</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--lavender, #C9B5EE)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Bot size={20} /></div>
            <span className="command-pill">SUPERVISOR ON</span>
          </div>
          <div className="command-content">
            <h3 className="command-title">Autonomous Agent Studio</h3>
            <p className="command-desc">Inspect multi-agent workflows, working memory preferences, and market radar.</p>
          </div>
          <Link href="/dashboard/agents" className="command-action-btn">
            <span>Agent Operations</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Seeker Mode
  return (
    <div className="command-deck-grid">
      <div className="command-card" style={{ background: "var(--teal, #4ECDC4)" }}>
        <div className="command-header">
          <div className="command-icon-wrap"><Sparkles size={20} /></div>
          <span className="command-pill">MONTE CARLO READY</span>
        </div>
        <div className="command-content">
          <h3 className="command-title">Event Conductor AI</h3>
          <p className="command-desc">Describe your event to assemble a multi-supplier bundle with resilience testing.</p>
        </div>
        <Link href="/dashboard/planner" className="command-action-btn">
          <span>Launch Conductor</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="command-card" style={{ background: "var(--yellow, #FFE66D)" }}>
        <div className="command-header">
          <div className="command-icon-wrap"><Search size={20} /></div>
          <span className="command-pill">HOTEL & VENUE HUBS</span>
        </div>
        <div className="command-content">
          <h3 className="command-title">Resource Discovery</h3>
          <p className="command-desc">Search verified banquets, LED walls, audio rigs, and transport across corridors.</p>
        </div>
        <Link href="/dashboard/search" className="command-action-btn">
          <span>Search Resources</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="command-card" style={{ background: "var(--pink, #F7A7C2)" }}>
        <div className="command-header">
          <div className="command-icon-wrap"><MessageSquare size={20} /></div>
          <span className="command-pill">ZOPA CONVERGENCE</span>
        </div>
        <div className="command-content">
          <h3 className="command-title">Active Negotiations</h3>
          <p className="command-desc">Bilateral surplus optimization, contract protection audit & 1-click counter-offers.</p>
        </div>
        <Link href="/dashboard/negotiations" className="command-action-btn">
          <span>Open Negotiation Room</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function ProviderPerformanceCard() {
  const resource = useData("/analytics/provider-performance");
  const data = resource.data;
  const items = Array.isArray(data) ? data : data ? [data] : [];
  const me = items[0] || {};

  const responseTimeStr =
    me.avgResponseHours != null ? `${me.avgResponseHours}h` : "< 1h (Fast)";
  const acceptanceRateStr =
    me.acceptanceRate != null ? `${me.acceptanceRate}%` : "100%";
  const ratingStr =
    me.avgRating ? `${Number(me.avgRating).toFixed(1)} ★` : "5.0 ★";
  const completionStr =
    me.completionRate != null ? `${me.completionRate}%` : "100%";
  const totalBookingsCount = me.totalBookings || 0;

  return (
    <div
      className="panel"
      style={{
        background: "linear-gradient(135deg, #FFFDF8 0%, #F5FBF7 100%)",
        border: "1.5px solid #171915",
        boxShadow: "2px 2px 0 #171915",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "1rem",
          borderBottom: "1px solid rgba(23, 25, 21, 0.08)",
          paddingBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "var(--yellow, #FFE66D)",
              border: "1.5px solid #171915",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "1px 1px 0 #171915",
            }}
          >
            <Award size={20} color="#171915" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
                Provider Performance Scorecard
              </h3>
              <span
                className="badge"
                style={{
                  background: "var(--mint, #A8E6CF)",
                  color: "#171915",
                  border: "1.5px solid #171915",
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  fontWeight: 700,
                }}
              >
                ● Live Scorecard
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#595852" }}>
              Turnaround speed, deal acceptance, and client satisfaction metrics
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/smart-pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "#171915",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1.5px solid #171915",
            background: "#fff",
            boxShadow: "1px 1px 0 #171915",
          }}
        >
          <span>Smart pricing & yield</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #171915",
            borderRadius: "8px",
            padding: "12px 14px",
            boxShadow: "1px 1px 0 #171915",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#595852", fontSize: "0.78rem", fontWeight: 700 }}>
            <Clock size={14} color="#f59e0b" />
            <span>Response Speed</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#171915", marginTop: "4px" }}>
            {responseTimeStr}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 600, marginTop: "2px" }}>
            ⚡ Fast RFQ replies
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1.5px solid #171915",
            borderRadius: "8px",
            padding: "12px 14px",
            boxShadow: "1px 1px 0 #171915",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#595852", fontSize: "0.78rem", fontWeight: 700 }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Acceptance Rate</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#171915", marginTop: "4px" }}>
            {acceptanceRateStr}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#595852", fontWeight: 600, marginTop: "2px" }}>
            🎯 Closing efficiency
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1.5px solid #171915",
            borderRadius: "8px",
            padding: "12px 14px",
            boxShadow: "1px 1px 0 #171915",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#595852", fontSize: "0.78rem", fontWeight: 700 }}>
            <Star size={14} color="#eab308" />
            <span>Reputation Rating</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#171915", marginTop: "4px" }}>
            {ratingStr}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#595852", fontWeight: 600, marginTop: "2px" }}>
            ★ Verified client reviews
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1.5px solid #171915",
            borderRadius: "8px",
            padding: "12px 14px",
            boxShadow: "1px 1px 0 #171915",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#595852", fontSize: "0.78rem", fontWeight: 700 }}>
            <ShieldCheck size={14} color="#3b82f6" />
            <span>Fulfilment Rate</span>
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#171915", marginTop: "4px" }}>
            {completionStr}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#595852", fontWeight: 600, marginTop: "2px" }}>
            ✓ {totalBookingsCount} completed bookings
          </div>
        </div>
      </div>
    </div>
  );
}

export function Overview({ admin = false }) {
  const { user, dashboardRole } = useAuth();
  const resource = useData(`/analytics?mode=${dashboardRole}`);
  return (
    <>
      <Heading
        eyebrow={
          admin
            ? "PLATFORM OPERATIONS"
            : "A LITTLE CAPACITY. A LOT OF POSSIBILITY."
        }
        title={
          admin
            ? "Keep the exchange moving."
            : `Hello, ${user.name.split(" ").slice(0, 2).join(" ")}.`
        }
        description={
          admin
            ? "A clear view of your marketplace, powered by actual activity."
            : dashboardRole === "provider"
              ? "Turn your spare resources into someone’s next great event."
              : "Your next event starts with the right neighbours."
        }
      >
        {!admin && (
          <Link
            className="button"
            href={
              dashboardRole === "provider"
                ? "/dashboard/listings/create"
                : "/dashboard/requests/create"
            }
          >
            {dashboardRole === "provider"
              ? "+ List a resource"
              : "+ Post a request"}
          </Link>
        )}
      </Heading>
      <State resource={resource}>
        {(data) => (
          <>
            <ActivityPipelineVisual
              data={data}
              admin={admin}
              dashboardRole={dashboardRole}
              user={user}
            />

            {dashboardRole === "provider" && !admin && (
              <ProviderPerformanceCard />
            )}

            <RoleCommandDeck
              dashboardRole={dashboardRole}
              admin={admin}
              data={data}
            />

            <div className="visual-chart-deck">
              <Trend data={data} />
              <BookingMix data={data} />
            </div>
          </>
        )}
      </State>
    </>
  );
}
function Stats({ data, admin }) {
  const { dashboardRole, user } = useAuth();
  const seeker = !admin && dashboardRole === "seeker";
  return (
    <div className="stat-grid">
      {[
        [
          admin ? "Businesses" : seeker ? "Saved resources" : "My listings",
          admin
            ? data.businesses
            : seeker
              ? user.favorites?.length || 0
              : data.listings,
        ],
        [
          !admin && !seeker ? "Bookings" : "Requests",
          !admin && !seeker
            ? data.bookings.reduce((sum, item) => sum + item.count, 0)
            : data.requests,
        ],
        ["Open negotiations", data.quotes],
        ["Agreed booking value", money(data.totalValue)],
      ].map(([label, value], i) => (
        <div
          className="panel stat"
          style={{ background: colors[i] }}
          key={label}
        >
          <span>{label}</span>
          <strong>{value}</strong>
          <div className="stat-live-badge">
            <span className="live-dot" />
            <small>{["Verified Supply", "Confirmed Agreements", "Active Exchange", "Committed Capital"][i]}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
const CustomTrendTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="custom-chart-tooltip-neo">
        <div className="tooltip-tag">📅 Month: {label}</div>
        <div className="tooltip-main-val">{money(val)}</div>
        <div className="tooltip-sub-info">
          <span className="live-dot" /> Confirmed Booking Velocity
        </div>
      </div>
    );
  }
  return null;
};

const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="custom-chart-tooltip-neo">
        <div className="tooltip-tag" style={{ textTransform: "capitalize" }}>
          {d.name?.replaceAll("_", " ")}
        </div>
        <div className="tooltip-main-val">{d.value} Agreements</div>
        <div className="tooltip-sub-info">Status share in pipeline</div>
      </div>
    );
  }
  return null;
};

function BookingMix({ data }) {
  const total = data.bookings.reduce((sum, row) => sum + row.count, 0);
  if (!total) return null;

  const palette = ["#F8DC60", "#79D9C5", "#C9B5EE", "#F7A7C2", "#FFAAA6", "#A8E6CF"];

  return (
    <section className="panel booking-mix-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow" style={{ color: "#7B61A8" }}>PIPELINE DYNAMICS</span>
          <h2 style={{ marginTop: 6, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            From confirmed to celebrated.
          </h2>
        </div>
        <Badge style={{ background: "var(--yellow, #FFE66D)", border: "1.5px solid #171915" }}>
          {total} bookings
        </Badge>
      </div>

      <div className="booking-mix">
        <div
          className="booking-donut"
          role="img"
          aria-label={`Booking status breakdown: ${data.bookings.map((row) => `${row.count} ${row._id}`).join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.bookings}
                dataKey="count"
                nameKey="_id"
                innerRadius="65%"
                outerRadius="90%"
                paddingAngle={6}
                cornerRadius={8}
                stroke="#171915"
                strokeWidth={2.5}
                isAnimationActive={true}
                animationDuration={900}
              >
                {data.bookings.map((row, index) => (
                  <Cell
                    key={row._id}
                    fill={palette[index % palette.length]}
                    style={{ filter: "drop-shadow(2px 2px 0px #171915)" }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomDonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-label">
            <span className="donut-count">{total}</span>
            <span className="donut-sub">{total === 1 ? "agreement" : "agreements"}</span>
          </div>
        </div>

        <div className="booking-legend">
          {data.bookings.map((row, index) => {
            const pct = Math.round((row.count / total) * 100);
            const color = palette[index % palette.length];
            return (
              <div key={row._id} className="legend-row-card">
                <div className="legend-row-top">
                  <div className="legend-name-wrap">
                    <span
                      className="legend-swatch"
                      style={{ background: color }}
                    />
                    <span className="legend-status-name">{row._id.replaceAll("_", " ")}</span>
                  </div>
                  <div className="legend-count-wrap">
                    <strong>{row.count}</strong>
                    <span className="legend-pct-pill">{pct}%</span>
                  </div>
                </div>
                <div className="legend-track">
                  <div
                    className="legend-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Trend({ data }) {
  const trendData = data.trend || [];
  const totalValue = trendData.reduce((sum, item) => sum + (item.value || 0), 0);
  const avgValue = trendData.length ? Math.round(totalValue / trendData.length) : 0;
  const peakValue = trendData.length ? Math.max(...trendData.map((d) => d.value || 0)) : 0;

  return (
    <section className="panel chart-panel-neo">
      <div className="section-heading">
        <div>
          <span className="eyebrow" style={{ color: "#2B8A80" }}>TRANSACTION VOLUME</span>
          <h2 style={{ marginTop: 6, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Booking Activity Velocity
          </h2>
        </div>
        <Badge style={{ background: "#4ECDC4", border: "1.5px solid #171915" }}>
          {data.scope || "Active Scope"}
        </Badge>
      </div>

      {trendData.length ? (
        <>
          <div className="trend-kpi-bar">
            <div className="trend-kpi-pill">
              <span className="kpi-tag">Total Velocity</span>
              <strong className="kpi-val">{money(totalValue)}</strong>
            </div>
            <div className="trend-kpi-pill">
              <span className="kpi-tag">Monthly Avg</span>
              <strong className="kpi-val">{money(avgValue)}</strong>
            </div>
            <div className="trend-kpi-pill">
              <span className="kpi-tag">Peak Window</span>
              <strong className="kpi-val">{money(peakValue)}</strong>
            </div>
          </div>

          <div className="chart" style={{ height: 250, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#79D9C5" />
                    <stop offset="100%" stopColor="#4ECDC4" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#E8E2D2"
                />
                <XAxis
                  dataKey="_id"
                  stroke="#171915"
                  tickLine={false}
                  tick={{ fill: "#171915", fontSize: 11.5, fontWeight: 800 }}
                  dy={6}
                />
                <YAxis
                  stroke="#171915"
                  tickLine={false}
                  tick={{ fill: "#595852", fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(val) =>
                    val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                  }
                  dx={-4}
                />
                <Tooltip content={<CustomTrendTooltip />} cursor={{ fill: "rgba(248, 220, 96, 0.15)" }} />
                <Bar
                  dataKey="value"
                  name="Agreed INR"
                  fill="url(#trendBarGradient)"
                  stroke="#171915"
                  strokeWidth={2}
                  maxBarSize={52}
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1100}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <Empty
          title="Your story is still starting."
          text="Confirmed bookings will bring this chart to life. There is no sample activity in your workspace."
        />
      )}
    </section>
  );
}
function MarketDemandRadarChart({ demand }) {
  if (!demand?.length) {
    return (
      <Empty
        title="Demand radar is clear"
        text="No unmet category requirements detected in this region yet."
      />
    );
  }

  const chartData = demand.map((d) => ({
    name: d._id.replaceAll("_", " "),
    requested: d.units,
    listed: d.listedUnits,
    gap: d.units - d.listedUnits,
  }));

  return (
    <div className="demand-radar-visual">
      <div className="demand-radar-chart-wrap" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
            <XAxis
              dataKey="name"
              stroke="#171915"
              tick={{ fill: "#171915", fontSize: 11, fontWeight: 700 }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis stroke="#171915" tick={{ fill: "#171915", fontSize: 11, fontWeight: 700 }} />
            <Tooltip
              contentStyle={{
                background: "#fffef8",
                border: "1.5px solid #171915",
                borderRadius: 12,
                boxShadow: "2px 2px 0 #171915",
                fontWeight: 800,
              }}
            />
            <Bar
              dataKey="requested"
              name="Requested Units"
              fill="#FF85A1"
              stroke="#171915"
              strokeWidth={1.5}
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="listed"
              name="Active Supply"
              fill="#4ECDC4"
              stroke="#171915"
              strokeWidth={1.5}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="demand-gap-chips">
        {chartData.map((item) => (
          <div key={item.name} className="demand-gap-chip">
            <span className="gap-cat">{item.name}</span>
            <span className={`gap-badge ${item.gap > 0 ? "deficit" : "surplus"}`}>
              {item.gap > 0 ? `Unmet: +${item.gap} units` : `Surplus: ${Math.abs(item.gap)} excess`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage({ admin = false }) {
  const { dashboardRole } = useAuth();
  const resource = useData(`/analytics?mode=${dashboardRole}`);
  return (
    <>
      <Heading
        title={admin ? "See where opportunity lives." : "Know what’s working."}
        description="Booking value, activity and unmet requirements from real records."
      >
        <a
          className="button quiet"
          href={`/api/analytics/export?mode=${dashboardRole}`}
        >
          Export booking CSV ↓
        </a>
      </Heading>
      <State resource={resource}>
        {(data) => (
          <>
            <Stats data={data} admin={admin} />
            <Trend data={data} />
            <div className="split-layout">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">SUPPLY-DEMAND EQUILIBRIUM</span>
                    <h2 style={{ marginTop: 6 }}>Demand Radar</h2>
                  </div>
                  <Badge>{admin ? "ALL REGIONS" : data.city || "LOCAL CORRIDOR"}</Badge>
                </div>
                <MarketDemandRadarChart demand={data.demand} city={data.city} admin={admin} />
              </section>

              <section className="panel ai-intelligence-panel" style={{ background: "#FFE66D" }}>
                <div className="ai-panel-header">
                  <Badge>PREDICTIVE REVENUE PULSE</Badge>
                  <span className="live-dot" />
                </div>
                <h2 style={{ margin: "0.5rem 0" }}>Market Intelligence Engine</h2>
                {data.insights.length ? (
                  <div className="ai-insight-box">
                    <Sparkles size={18} />
                    <p>{data.insights[0].text}</p>
                  </div>
                ) : (
                  <div className="ai-insight-empty">
                    <Bot size={28} />
                    <div>
                      <strong>Active Monitoring Engaged</strong>
                      <p>Nightly telemetry evaluates local inventory velocity, yield curves, and corridor search density.</p>
                    </div>
                  </div>
                )}
                <div className="ai-kpi-metrics-row">
                  <div className="ai-kpi-pill">
                    <span>Fulfilment Ratio</span>
                    <strong>{data.fulfillmentRate === null ? "Ready" : `${data.fulfillmentRate}%`}</strong>
                  </div>
                  <div className="ai-kpi-pill">
                    <span>Corridor Queries</span>
                    <strong>{data.searches} searches</strong>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </State>
      <MarketIntelligence />
    </>
  );
}
