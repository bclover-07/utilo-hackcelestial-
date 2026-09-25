"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import AgentDecision from "./AgentDecision";
import {
  useData,
  State,
  Heading,
  Field,
  ActionForm,
  Badge,
  money,
  colors,
} from "./ui";

export function SmartPricingPage() {
  const categories = useData("/categories");
  const listings = useData("/listings");
  const [result, setResult] = useState(null);
  const [category, setCategory] = useState("");
  return (
    <>
      <Heading
        eyebrow="AI PRICING INTELLIGENCE"
        title="Price with confidence."
        description="AI analyzes comparable listings, recent booking prices, and demand signals to recommend competitive pricing."
      />
      <div className="split-layout">
        <section className="panel" style={{ background: "#FFE66D" }}>
          <Badge>GEMINI PRICING AGENT</Badge>
          <h2>Get pricing advice</h2>
          <State resource={categories}>
            {(cats) => (
              <ActionForm
                label="Analyze pricing ✳"
                onSubmit={async (form) => {
                  setResult(null);
                  const data = Object.fromEntries(
                    [...form].filter(([, value]) => value !== ""),
                  );
                  setResult(
                    await api("/ai/smart-price", {
                      method: "POST",
                      body: data,
                    }),
                  );
                  return "Pricing analysis complete.";
                }}
              >
                <Field
                  as="select"
                  label="Category"
                  name="category"
                  required
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setResult(null);
                  }}
                >
                  <option value="">Choose category</option>
                  {cats.map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Field>
                <State resource={listings}>
                  {(ownedListings) => (
                    <Field
                      key={category}
                      as="select"
                      label="Your listing (optional)"
                      name="listingId"
                    >
                      <option value="">Category analysis</option>
                      {ownedListings
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.title}
                          </option>
                        ))}
                    </Field>
                  )}
                </State>
              </ActionForm>
            )}
          </State>
        </section>
        <section className="panel" style={{ background: "#A8E6CF" }}>
          <h3>How AI pricing works</h3>
          <div className="ai-flow-visual">
            <div className="ai-node" style={{ background: "#89CFF0" }}>
              📋 Comparables
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#FFB347" }}>
              💰 Booking History
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#FF85A1" }}>
              📊 Demand Signals
            </div>
            <span className="ai-arrow">→</span>
            <div className="ai-node" style={{ background: "#C3B1E1" }}>
              🧠 Gemini AI
            </div>
          </div>
          <p>
            Compares your listing against all active listings in the same
            category, factors in recent booking prices, and weighs current
            demand intensity.
          </p>
        </section>
      </div>
      {result && (
        <>
          <section className="panel">
            <h2>AI pricing recommendation</h2>
            <p className="ai-answer">{result.advice}</p>
            <AgentDecision decision={result.decision} generation={result.generation} hideSummary />

            {result.cannibalization?.detected && (
              <div className="panel" style={{ marginTop: "1rem", background: "#ffebee", border: "2px solid #ef5350", borderRadius: "10px", padding: "1rem" }}>
                <span className="eyebrow" style={{ color: "#c62828", fontSize: "0.75rem", letterSpacing: "0.08em" }}>INVENTORY CANNIBALIZATION ALERT</span>
                <h4 style={{ margin: "0.25rem 0", color: "#b71c1c" }}>Cross-Listing Margin Risk</h4>
                {result.cannibalization.warnings.map((w, idx) => (
                  <p key={idx} style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "#442222" }}>
                    ⚠️ {w.warning}
                  </p>
                ))}
              </div>
            )}

            {result.autoPilotRecommendation && (
              <div className="panel" style={{ marginTop: "1rem", background: "#e8f5e9", border: "2px solid #4caf50", borderRadius: "10px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="eyebrow" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", color: "#2e7d32" }}>DYNAMIC PRICING AUTO-PILOT</span>
                    <h3 style={{ margin: "0.2rem 0" }}>Suggested Dynamic Rate: {money(result.autoPilotRecommendation.recommendedDynamicPrice)}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#333" }}>
                      Current multiplier: <strong>{result.autoPilotRecommendation.surgeMultiplier}x</strong> based on real-time market demand pressure.
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <small style={{ display: "block", color: "#555" }}>Floor: {money(result.autoPilotRecommendation.floorPrice)} · Ceiling: {money(result.autoPilotRecommendation.ceilingPrice)}</small>
                    <span className="badge" style={{ marginTop: "0.3rem", display: "inline-block", background: "#4caf50", color: "#fff" }}>Auto-Pilot Ready</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pricing-evidence">{result.evidence?.map(row => <div className="notice" key={row.unit}><strong>{row.samples} comparable {row.unit} rates · {row.support}</strong><p>{row.suggestedRangeAvailable ? "Observed asking-price range supports a reviewable recommendation." : "Too few comparable rates to support a suggested range."}</p></div>)}</div>
            {result.trace && (
              <div className="workflow-trace">
                {result.trace.map((t, i) => (
                  <div key={i} className="trace-step">
                    <div
                      className="trace-icon"
                      style={{ background: colors[i % colors.length] }}
                    >
                      {["📋", "💰", "📊", "🧠"][i] || "✓"}
                    </div>
                    {t}
                  </div>
                ))}
              </div>
            )}
          </section>
          {result.comparables?.length > 0 && (
            <section className="panel">
              <h2>Market comparison</h2>
              <div className="forecast-grid">
                {result.comparables.map((c, i) => (
                  <div
                    key={i}
                    className="forecast-card"
                    style={{ background: colors[i % colors.length] + "40" }}
                  >
                    <Badge>{c._id || "per unit"}</Badge>
                    <div className="pricing-panel">
                      <div className="pricing-range">
                        <span>{money(c.minPrice)}</span>
                        <div className="bar">
                          <div
                            className="marker"
                            style={{
                              left: `${c.maxPrice > c.minPrice ? ((c.avgPrice - c.minPrice) / (c.maxPrice - c.minPrice)) * 100 : 50}%`,
                            }}
                          />
                        </div>
                        <span>{money(c.maxPrice)}</span>
                      </div>
                      <small>
                        Average: {money(Math.round(c.avgPrice))} · {c.count}{" "}
                        listings
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {!result.comparables?.length && (
            <section className="panel">
              <h2>No comparable listing rates yet</h2>
              <p>
                No active resources from other providers in this category are
                available for a price comparison.
              </p>
            </section>
          )}
          {result.recentBookings && (
            <section className="panel" style={{ background: "#89CFF040" }}>
              <h2>Recent booking totals</h2>
              <p>
                Agreed totals over the last 90 days vary by quantity and
                duration. They are not per-unit rental rates.
              </p>
              <div className="stat-grid">
                {[
                  [
                    "Min booked",
                    money(result.recentBookings.minBookedPrice),
                    "#A8E6CF",
                  ],
                  [
                    "Avg booked",
                    money(Math.round(result.recentBookings.avgBookedPrice)),
                    "#FFE66D",
                  ],
                  [
                    "Max booked",
                    money(result.recentBookings.maxBookedPrice),
                    "#FFB347",
                  ],
                  [
                    "Total bookings",
                    result.recentBookings.bookingCount,
                    "#89CFF0",
                  ],
                ].map(([label, value, bg]) => (
                  <div
                    key={label}
                    className="panel stat"
                    style={{ background: bg }}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>Excluding cancelled bookings</small>
                  </div>
                ))}
              </div>
            </section>
          )}
          {!result.recentBookings && (
            <section className="panel">
              <h2>No recent bookings in this category</h2>
              <p>Booking totals will appear once agreements are confirmed.</p>
            </section>
          )}
          {result.demandSignals?.length > 0 && (
            <section className="panel">
              <h2>Demand signals</h2>
              <div className="heatmap-grid">
                {result.demandSignals.map((d, i) => (
                  <div
                    key={i}
                    className="heatmap-cell"
                    style={{
                      background: d.urgentCount > 0 ? "#FF85A1" : "#A8E6CF",
                    }}
                  >
                    <strong>{d.totalUnits}</strong>
                    units requested
                    <br />
                    <small>
                      {d.city} · {d.urgentCount} urgent
                    </small>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
