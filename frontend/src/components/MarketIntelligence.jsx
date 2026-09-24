"use client";
import { useAuth } from "@/context/AuthContext";
import { useData, State, money } from "./ui";
import {
  DemandHeatmap,
  SupplyUtilization,
  LiquidityView,
} from "./DemandForecast";
export default function MarketIntelligence() {
  const { dashboardRole } = useAuth();
  const resource = useData(`/analytics/intelligence?mode=${dashboardRole}`);
  return (
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
              data.coverage.map((row) => (
                <p key={row.status}>
                  <strong>{row.status}</strong>: {row.count} requests ·{" "}
                  {row.avgCoveragePercent}% average items booked
                </p>
              ))
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
              data.revenue.map((row) => (
                <p key={row.period}>
                  <strong>{row.period}</strong> · {row.bookings} bookings ·{" "}
                  {money(row.revenue)}
                </p>
              ))
            ) : (
              <p>No booking value recorded yet.</p>
            )}
          </section>
        </div>
      )}
    </State>
  );
}
