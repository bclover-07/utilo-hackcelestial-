"use client";
import Link from "next/link";
import MarketIntelligence from "./MarketIntelligence";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
  useData,
  State,
  Empty,
  Heading,
  Badge,
  Flow,
  money,
  colors,
} from "./ui";
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
            <Stats data={data} admin={admin} />
            <div className="overview-grid">
              <section
                className="panel overview-hero"
                style={{ background: "#C3B1E1" }}
              >
                <Badge>{admin ? "MARKETPLACE HEALTH" : "THE UTLIO WAY"}</Badge>
                <h2>
                  {admin
                    ? "Healthy supply. Happier events."
                    : "Big things happen when businesses share."}
                </h2>
                <p>
                  {admin
                    ? "Review verification requests, resolve issues and use the demand gap to guide your supply outreach."
                    : "One request brings providers together. Compare their terms, negotiate with a clear history, and reserve the quantity you need."}
                </p>
                <Flow />
                <Link
                  className="button quiet"
                  href={admin ? "/admin/verifications" : "/dashboard/planner"}
                >
                  {admin ? "Review businesses" : "Plan an event with AI"} ↗
                </Link>
                <span className="hero-doodle" aria-hidden="true">
                  ✳
                </span>
              </section>
              <section className="panel">
                <span className="eyebrow">YOUR NEXT MOVE</span>
                <h2>{admin ? "Build confidence." : "Make yourself known."}</h2>
                <p>
                  {admin
                    ? "Verify business evidence and keep moderation decisions traceable."
                    : `Business verification: ${user.verification}. A complete profile helps partners understand who they are working with.`}
                </p>
                <Link
                  href={admin ? "/admin/moderation" : "/dashboard/profile"}
                  className="text-link"
                >
                  {admin ? "Open moderation queue" : "Complete your profile"} →
                </Link>
                <div className="mini-stat">
                  <strong>
                    {data.fulfillmentRate === null
                      ? "—"
                      : `${data.fulfillmentRate}%`}
                  </strong>
                  <span>requests with every item booked</span>
                </div>
              </section>
            </div>
            <Trend data={data} />
          </>
        )}
      </State>
    </>
  );
}
function Stats({ data, admin }) {
  return (
    <div className="stat-grid">
      {[
        [
          admin ? "Businesses" : "My listings",
          admin ? data.businesses : data.listings,
        ],
        ["Requests", data.requests],
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
          <small>
            {i === 3
              ? "Excludes cancelled bookings; not collected payments"
              : "From persisted marketplace records"}
          </small>
        </div>
      ))}
    </div>
  );
}
function Trend({ data }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Booking activity</h2>
        <Badge>{data.scope}</Badge>
      </div>
      {data.trend.length ? (
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Agreed INR"
                fill="#4ECDC4"
                stroke="#1a1a1a"
                strokeWidth={2}
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
                <h2>Demand radar</h2>
                <p>
                  Open request units vs active listed units
                  {!admin && ` in ${data.city}`}. Listed supply does not imply
                  date availability.
                </p>
                {data.demand.length ? (
                  <div className="radar">
                    {data.demand.map((d) => (
                      <div key={d._id}>
                        <strong>{d._id.replaceAll("_", " ")}</strong>
                        <div className="radar-bars">
                          <div
                            style={{
                              width: `${Math.max(5, (100 * d.units) / Math.max(d.units, d.listedUnits, 1))}%`,
                              background: "#FF85A1",
                            }}
                          >
                            {d.units} requested
                          </div>
                          <div
                            style={{
                              width: `${Math.max(5, (100 * d.listedUnits) / Math.max(d.units, d.listedUnits, 1))}%`,
                              background: "#4ECDC4",
                            }}
                          >
                            {d.listedUnits} listed
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No unmet requirements in this scope yet.</p>
                )}
              </section>
              <section className="panel" style={{ background: "#FFE66D" }}>
                <Badge>NIGHTLY PROVIDER INSIGHTS</Badge>
                <h2>A nudge backed by numbers.</h2>
                {data.insights.length ? (
                  <p className="ai-answer">{data.insights[0].text}</p>
                ) : (
                  <p>
                    No generated insight yet. The nightly job runs at 02:00
                    India time and uses your actual booking and demand data.
                    Provider or quota failures never become fabricated insights.
                  </p>
                )}
                <p>
                  Fully booked requests:{" "}
                  <strong>
                    {data.fulfillmentRate === null
                      ? "No requests yet"
                      : `${data.fulfillmentRate}%`}
                  </strong>
                </p>
                <p>Recorded searches: {data.searches}</p>
              </section>
            </div>
          </>
        )}
      </State>
      <MarketIntelligence />
    </>
  );
}
