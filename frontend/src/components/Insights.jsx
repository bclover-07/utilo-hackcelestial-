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
      color: "var(--yellow)",
    },
    {
      step: "02",
      badge: "In Negotiation",
      val: data.quotes,
      label: "Active RFQ threads",
      color: "var(--teal)",
    },
    {
      step: "03",
      badge: "Agreed booking value",
      val: money(data.totalValue),
      label: "Committed exchange value",
      color: "var(--lavender)",
    },
    {
      step: "04",
      badge: "Request fulfilment",
      val: data.fulfillmentRate === null ? "No requests yet" : `${data.fulfillmentRate}%`,
      label: "Fully confirmed requirements",
      meter: data.fulfillmentRate,
      color: "var(--mint)",
    },
  ];

  return (
    <div className="activity-pipeline-deck">
      {stages.map((st, i) => (
        <div key={i} className="pipeline-card" style={{ borderLeft: `6px solid ${st.color}` }}>
          <div className="pipeline-top">
            <span className="pipeline-step-badge">{st.badge}</span>
            <span className="live-dot" />
          </div>
          <div>
            <div className="pipeline-val">{st.val}</div>
            <div className="pipeline-label">{st.label}</div>
            {st.meter != null && <div className="pipeline-meter-bar">
              <div
                className="pipeline-meter-fill"
                style={{ width: `${st.meter}%`, background: st.color }}
              />
            </div>}
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
        <div className="command-card" style={{ background: "var(--yellow)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><ShieldCheck size={22} /></div>
            <span className="command-pill">KYC Queue</span>
          </div>
          <div>
            <h3 className="command-title">Business Verifications</h3>
            <p className="command-desc">Review submitted business identity and compliance proofs.</p>
          </div>
          <Link href="/admin/verifications" className="command-action-btn">
            <span>Review Queue</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--teal)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Bot size={22} /></div>
            <span className="command-pill">AI Engine</span>
          </div>
          <div>
            <h3 className="command-title">AI Ops & Supervisor</h3>
            <p className="command-desc">Audit Conductor execution, Monte Carlo resilience & critic reflections.</p>
          </div>
          <Link href="/admin/agents" className="command-action-btn">
            <span>Inspect Agents</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--lavender)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><TrendingUp size={22} /></div>
            <span className="command-pill">Marketplace</span>
          </div>
          <div>
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
        <div className="command-card" style={{ background: "var(--yellow)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Zap size={22} /></div>
            <span className="command-pill">AUTO-PILOT ACTIVE</span>
          </div>
          <div>
            <h3 className="command-title">Smart Pricing Advisor</h3>
            <p className="command-desc">Dynamic weekend yield (+35%) with strict floor bounds & cannibalization shields.</p>
          </div>
          <Link href="/dashboard/smart-pricing" className="command-action-btn">
            <span>Tune Pricing Strategy</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--teal)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Calendar size={22} /></div>
            <span className="command-pill">CALENDAR SYNC</span>
          </div>
          <div>
            <h3 className="command-title">Availability & Calendar</h3>
            <p className="command-desc">Manage blackout dates, delivery slots & reserve unit quantities with zero overlap.</p>
          </div>
          <Link href="/dashboard/calendar" className="command-action-btn">
            <span>Manage Slots</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="command-card" style={{ background: "var(--lavender)" }}>
          <div className="command-header">
            <div className="command-icon-wrap"><Bot size={22} /></div>
            <span className="command-pill">SUPERVISOR ON</span>
          </div>
          <div>
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
      <div className="command-card" style={{ background: "var(--teal)" }}>
        <div className="command-header">
          <div className="command-icon-wrap"><Sparkles size={22} /></div>
          <span className="command-pill">MONTE CARLO READY</span>
        </div>
        <div>
          <h3 className="command-title">Event Conductor AI</h3>
          <p className="command-desc">Describe your event to assemble a multi-supplier bundle with resilience testing.</p>
        </div>
        <Link href="/dashboard/planner" className="command-action-btn">
          <span>Launch Conductor</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="command-card" style={{ background: "var(--yellow)" }}>
        <div className="command-header">
          <div className="command-icon-wrap"><Search size={22} /></div>
          <span className="command-pill">HOTEL & VENUE HUBS</span>
        </div>
        <div>
          <h3 className="command-title">Resource Discovery</h3>
          <p className="command-desc">Search verified banquets, LED walls, audio rigs, and transport across corridors.</p>
        </div>
        <Link href="/dashboard/search" className="command-action-btn">
          <span>Search Resources</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="command-card" style={{ background: "var(--pink)" }}>
        <div className="command-header">
          <div className="command-icon-wrap"><MessageSquare size={22} /></div>
          <span className="command-pill">ZOPA CONVERGENCE</span>
        </div>
        <div>
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

            <RoleCommandDeck
              dashboardRole={dashboardRole}
              admin={admin}
              data={data}
            />

            <div className="visual-chart-deck">
              <Trend data={data} />
              <BookingMix data={data} />
            </div>

            <section className="panel" style={{ marginTop: "24px" }}>
              <span className="eyebrow">
                {admin ? "THE MARKETPLACE JOURNEY" : "EXCHANGE PROTOCOL"}
              </span>
              <h2 style={{ marginTop: 10 }}>
                Transparent, quantity-aware fulfilment.
              </h2>
              <ExchangeWorkflow compact />
            </section>
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
function BookingMix({ data }) {
  const total = data.bookings.reduce((sum, row) => sum + row.count, 0);
  if (!total) return null;
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">EVERY AGREEMENT HAS A JOURNEY</span>
          <h2 style={{ marginTop: 10 }}>From confirmed to celebrated.</h2>
        </div>
        <Badge>{total} bookings</Badge>
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
                innerRadius="58%"
                outerRadius="85%"
                paddingAngle={4}
                cornerRadius={8}
                stroke="#171915"
                strokeWidth={3}
                isAnimationActive={false}
              >
                {data.bookings.map((row, index) => (
                  <Cell key={row._id} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-label">
            <strong>{total}</strong>
            <small>agreements</small>
          </div>
        </div>
        <div className="booking-legend">
          {data.bookings.map((row, index) => (
            <div key={row._id}>
              <span
                className="legend-swatch"
                style={{ background: colors[index % colors.length] }}
              />
              <span>{row._id.replaceAll("_", " ")}</span>
              <strong>{row.count}</strong>
              <small>{Math.round((row.count / total) * 100)}%</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function Trend({ data }) {
  return (
    <section className="panel chart-panel-neo">
      <div className="section-heading">
        <h2>Booking Activity Velocity</h2>
        <Badge>{data.scope}</Badge>
      </div>
      {data.trend?.length ? (
        <div className="chart" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
              <XAxis dataKey="_id" stroke="#171915" tick={{ fill: "#171915", fontSize: 12, fontWeight: 700 }} />
              <YAxis stroke="#171915" tick={{ fill: "#171915", fontSize: 12, fontWeight: 700 }} />
              <Tooltip
                contentStyle={{
                  background: "#fffef8",
                  border: "2.5px solid #171915",
                  borderRadius: 12,
                  boxShadow: "3px 3px 0 #171915",
                  fontWeight: 800,
                }}
              />
              <Bar
                dataKey="value"
                name="Agreed INR"
                fill="#4ECDC4"
                stroke="#171915"
                strokeWidth={2.5}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
                border: "2.5px solid #171915",
                borderRadius: 12,
                boxShadow: "3px 3px 0 #171915",
                fontWeight: 800,
              }}
            />
            <Bar
              dataKey="requested"
              name="Requested Units"
              fill="#FF85A1"
              stroke="#171915"
              strokeWidth={2}
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="listed"
              name="Active Supply"
              fill="#4ECDC4"
              stroke="#171915"
              strokeWidth={2}
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
