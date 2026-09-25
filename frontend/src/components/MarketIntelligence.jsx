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
            <h2>Resource locations</h2>
            <p>
              Active listings grouped by city. Availability depends on your
              requested dates.
            </p>
            {data.clusters.length ? (
              <div className="forecast-grid">
                {data.clusters.map((city) => (
                  <div className="forecast-card" key={city.city}>
                    <h3>{city.city}</h3>
                    <strong>{city.listingCount} resources</strong>
                    <p>{city.categories.join(", ").replaceAll("_", " ")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No active resource locations yet.</p>
            )}
          </section>
          <section className="panel">
            <h2>Request coverage</h2>
            {data.coverage.length ? (
              <>
              <div className="real-data-chart" role="img" aria-label="Average percentage of request items booked, grouped by request status"><ResponsiveContainer width="100%" height={220}><BarChart data={data.coverage}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="status" /><YAxis domain={[0,100]} unit="%" /><Tooltip /><Bar dataKey="avgCoveragePercent" name="Items booked (%)" fill="#639b87" radius={[5,5,0,0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
              {
              data.coverage.map((row) => (
                <p key={row.status}>
                  <strong>{row.status}</strong>: {row.count} requests ·{" "}
                  {row.avgCoveragePercent}% average items booked
                </p>
              ))}</>
            ) : (
              <p>No requests in this account scope yet.</p>
            )}
          </section>
          <section className="panel">
            <h2>Monthly booking totals</h2>
            <p>
              Agreed rental value, excluding cancellations. These are not
              collected payments.
            </p>
            {data.revenue.length ? (
              <>
              <div className="real-data-chart" role="img" aria-label="Monthly agreed booking value in Indian rupees"><ResponsiveContainer width="100%" height={250}><BarChart data={data.revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis tickFormatter={value => `₹${value}`} width={80} /><Tooltip formatter={value => money(value)} /><Bar dataKey="revenue" name="Agreed booking value (INR)" fill="#9b86bb" radius={[5,5,0,0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
              {
              data.revenue.map((row) => (
                <p key={row.period}>
                  <strong>{row.period}</strong> · {row.bookings} bookings ·{" "}
                  {money(row.revenue)}
                </p>
              ))}</>
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
