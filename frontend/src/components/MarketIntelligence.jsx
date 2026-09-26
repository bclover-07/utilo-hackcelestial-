"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useData, State, money, Field, ActionForm } from "./ui";
import {
  DemandHeatmap,
  SupplyUtilization,
  LiquidityView,
} from "./DemandForecast";
export default function MarketIntelligence() {
  const { dashboardRole } = useAuth();
  const [market, setMarket] = useState("");
  const categories = useData("/categories");
  const resource = useData(`/analytics/intelligence?mode=${dashboardRole}${market}`);
  return (
    <>
    <section className="panel"><h2>Explore a market</h2><ActionForm label="Apply market filters" onSubmit={async form => { const params = new URLSearchParams([...form].filter(([, value]) => value !== "")); setMarket(params.size ? `&${params}` : ""); return "Market filters applied."; }}><div className="form-grid"><Field label="City" name="city" maxLength={100} placeholder="All cities" /><Field label="Resource category" as="select" name="category"><option value="">All categories</option>{categories.data?.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}</Field></div></ActionForm>{categories.error && <p role="alert">{categories.error}</p>}<p className="hint">Filters apply to demand, supply, liquidity and locations. Request coverage and monthly booking totals retain the account scope.</p></section>
    <State resource={resource}>
      {(data) => (
        <div className="stack">
          <DemandHeatmap data={data.demand} />
          <SupplyUtilization data={data.supply} />
          <LiquidityView data={data.liquidity} />
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">REGIONAL SUPPLY HUBS</span>
                <h2 style={{ marginTop: 4 }}>Resource Locations</h2>
              </div>
              <span className="badge">{data.clusters.length} active hubs</span>
            </div>
            {data.clusters.length ? (
              <div className="forecast-grid">
                {data.clusters.map((city) => (
                  <div className="forecast-card geo-cluster-card" key={city.city}>
                    <div className="geo-header">
                      <span className="geo-pin">📍</span>
                      <h3>{city.city}</h3>
                    </div>
                    <div className="geo-metric-badge">
                      <strong>{city.listingCount}</strong> resources available
                    </div>
                    <div className="geo-categories">
                      {city.categories.map((c) => (
                        <span key={c} className="spec-chip">
                          {c.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No active resource locations yet.</p>
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FULFILMENT PIPELINE</span>
                <h2 style={{ marginTop: 4 }}>Request Coverage Ratio</h2>
              </div>
            </div>
            {data.coverage.length ? (
              <>
                <div className="real-data-chart" role="img" aria-label="Average percentage of request items booked, grouped by request status">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.coverage}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
                      <XAxis dataKey="status" stroke="#171915" tick={{ fill: "#171915", fontSize: 12, fontWeight: 700 }} />
                      <YAxis domain={[0, 100]} unit="%" stroke="#171915" tick={{ fill: "#171915", fontSize: 12, fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#fffef8",
                          border: "1.5px solid #171915",
                          borderRadius: 12,
                          boxShadow: "2px 2px 0 #171915",
                          fontWeight: 800,
                        }}
                      />
                      <Bar dataKey="avgCoveragePercent" name="Items booked (%)" fill="#639b87" stroke="#171915" strokeWidth={1} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-mini-grid" style={{ marginTop: "1rem" }}>
                  {data.coverage.map((row) => (
                    <div key={row.status} className="coverage-kpi-card">
                      <div className="kpi-card-header">
                        <span className="kpi-status-badge">{row.status}</span>
                        <strong>{row.count} reqs</strong>
                      </div>
                      <div className="kpi-bar-wrap">
                        <div className="kpi-bar-fill" style={{ width: `${row.avgCoveragePercent}%` }} />
                      </div>
                      <span className="kpi-percent-label">{row.avgCoveragePercent}% items confirmed</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>No requests in this account scope yet.</p>
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">REVENUE TRAJECTORY</span>
                <h2 style={{ marginTop: 4 }}>Monthly Exchange Totals</h2>
              </div>
            </div>
            {data.revenue.length ? (
              <>
                <div className="real-data-chart" role="img" aria-label="Monthly agreed booking value in Indian rupees">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.revenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e0cf" />
                      <XAxis dataKey="period" stroke="#171915" tick={{ fill: "#171915", fontSize: 12, fontWeight: 700 }} />
                      <YAxis tickFormatter={(value) => `₹${value}`} width={80} stroke="#171915" tick={{ fill: "#171915", fontSize: 12, fontWeight: 700 }} />
                      <Tooltip
                        formatter={(value) => money(value)}
                        contentStyle={{
                          background: "#fffef8",
                          border: "1.5px solid #171915",
                          borderRadius: 12,
                          boxShadow: "2px 2px 0 #171915",
                          fontWeight: 800,
                        }}
                      />
                      <Bar dataKey="revenue" name="Agreed Booking Value" fill="#9b86bb" stroke="#171915" strokeWidth={1} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="kpi-mini-grid" style={{ marginTop: "1rem" }}>
                  {data.revenue.map((row) => (
                    <div key={row.period} className="revenue-kpi-card">
                      <span className="revenue-period-tag">{row.period}</span>
                      <strong className="revenue-val">{money(row.revenue)}</strong>
                      <small className="revenue-bookings">{row.bookings} bookings agreed</small>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>No booking value recorded yet.</p>
            )}
          </section>
        </div>
      )}
    </State>
    </>
  );
}
