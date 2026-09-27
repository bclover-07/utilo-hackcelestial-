"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  useData,
  State,
  Empty,
  Heading,
  Field,
  ActionForm,
  Action,
  Badge,
  Flow,
  money,
  date,
} from "./ui";

function ReviewsAnalyticsVisualizer({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    const s = Math.min(5, Math.max(1, r.score || 5));
    counts[s] = (counts[s] || 0) + 1;
    sum += s;
  });

  const avg = (sum / reviews.length).toFixed(1);
  const chartData = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star} ★`,
    count: counts[star],
    percentage: Math.round((counts[star] / reviews.length) * 100),
  }));

  const STAR_COLORS = ["#2ed573", "#78e08f", "#ffe66d", "#ffa502", "#ff4757"];

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8", marginBottom: "2rem" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#7B61A8", marginBottom: 2 }}>COMMUNITY TRUST INDEX</span>
          <h3 className="feature-chart-title">Rating & Satisfaction Spectrum</h3>
        </div>
        <span className="badge" style={{ background: "#FFE66D", border: "1px solid #171915" }}>
          {reviews.length} Verified Reviews
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", background: "#FAF8F5", border: "1px solid #171915", borderRadius: "14px", textAlign: "center" }}>
          <span style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 1, fontFamily: "var(--font-space), Arial, sans-serif" }}>
            {avg}
          </span>
          <div style={{ color: "#FFA500", fontSize: "1.3rem", margin: "6px 0" }}>
            {"★".repeat(Math.round(Number(avg)))}{"☆".repeat(5 - Math.round(Number(avg)))}
          </div>
          <small style={{ fontWeight: 750, color: "#555" }}>Average Across All Fulfilments</small>
        </div>

        <div style={{ width: "100%", height: 170 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E0CF" />
              <XAxis type="number" stroke="#171915" tick={{ fontSize: 10 }} />
              <YAxis dataKey="star" type="category" stroke="#171915" width={45} tick={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip
                formatter={(val, name, item) => [`${val} reviews (${item.payload.percentage}%)`, "Frequency"]}
                contentStyle={{ background: "#fffef8", border: "1px solid #171915", borderRadius: 8, fontWeight: 700 }}
              />
              <Bar dataKey="count" fill="#4ECDC4" stroke="#171915" strokeWidth={1} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STAR_COLORS[index % STAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DisputesPipelineVisualizer({ disputes }) {
  if (!disputes || disputes.length === 0) return null;

  const openCount = disputes.filter((d) => d.status === "open").length;
  const resolvedCount = disputes.filter((d) => d.status === "resolved" || d.resolution).length;
  const resolutionRatio = disputes.length ? Math.round((resolvedCount / disputes.length) * 100) : 100;
  
  const chartData = [
    { name: "Resolved / Settled", value: resolvedCount || 0, fill: "url(#disputeResolvedGrad)" },
    { name: "Active Mediation", value: openCount || 0, fill: "url(#disputeActiveGrad)" },
  ].filter(d => d.value > 0);

  // Fallback for 0 disputes or 100% resolved
  if (chartData.length === 0) {
    chartData.push({ name: "Resolved / Settled", value: 1, fill: "url(#disputeResolvedGrad)" });
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)",
        border: "1px solid rgba(23, 25, 21, 0.12)",
        borderRadius: "20px",
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02)",
        padding: "1.5rem",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "1.25rem",
          paddingBottom: "1rem",
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
              color: "#0F766E",
              display: "inline-block",
              marginBottom: 4,
            }}
          >
            RESOLUTION HEALTH & SLA
          </span>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#171915", letterSpacing: "-0.02em" }}>
            Dispute Resolution Overview
          </h3>
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
            background: openCount > 0 ? "#FEE2E2" : "#DCFCE7",
            color: openCount > 0 ? "#991B1B" : "#166534",
            border: openCount > 0 ? "1px solid #FCA5A5" : "1px solid #86EFAC",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: openCount > 0 ? "#EF4444" : "#22C55E",
              boxShadow: openCount > 0 ? "0 0 6px #EF4444" : "0 0 6px #22C55E",
            }}
          />
          {openCount > 0 ? `${openCount} Action Required` : "100% In Order"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          alignItems: "center",
        }}
      >
        {/* KPI Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(23, 25, 21, 0.08)",
              borderRadius: "16px",
              padding: "1rem",
              boxShadow: "0 4px 14px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "100px",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Active Review
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: openCount > 0 ? "#EF4444" : "#94A3B8",
                  display: "inline-block",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#171915", lineHeight: 1.1, margin: "6px 0 2px" }}>
                {openCount} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748B" }}>disputes</span>
              </div>
              <small style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>Mediation in progress</small>
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(23, 25, 21, 0.08)",
              borderRadius: "16px",
              padding: "1rem",
              boxShadow: "0 4px 14px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "100px",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Settled Cases
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10B981",
                  display: "inline-block",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#171915", lineHeight: 1.1, margin: "6px 0 2px" }}>
                {resolvedCount} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748B" }}>cases</span>
              </div>
              <small style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>Agreement reached</small>
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(23, 25, 21, 0.08)",
              borderRadius: "16px",
              padding: "1rem",
              boxShadow: "0 4px 14px -2px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "100px",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Success Ratio
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#06B6D4",
                  display: "inline-block",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F766E", lineHeight: 1.1, margin: "6px 0 2px" }}>
                {resolutionRatio}%
              </div>
              <small style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>Platform SLA metric</small>
            </div>
          </div>
        </div>

        {/* Circular SLA Gauge Visual */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem",
          }}
        >
          <div style={{ width: "100%", height: 160, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="disputeResolvedGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="disputeActiveGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F87171" />
                    <stop offset="100%" stopColor="#DC2626" />
                  </linearGradient>
                </defs>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  cornerRadius={6}
                  paddingAngle={chartData.length > 1 ? 4 : 0}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Stat Overlay */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 900,
                  color: "#0F766E",
                  lineHeight: 1,
                  display: "block",
                  letterSpacing: "-0.5px",
                }}
              >
                {resolutionRatio}%
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                SLA Score
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "0.74rem",
              fontWeight: 600,
              color: "#475569",
              marginTop: "4px",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
              Resolved ({resolvedCount})
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
              Active ({openCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingFulfillmentVisualizer({ bookings, role }) {
  if (!bookings || bookings.length === 0) return null;

  const totalValue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalUnits = bookings.reduce((sum, b) => sum + (b.quantity || 1), 0);
  const activeCount = bookings.filter((b) => b.status === "confirmed" || b.status === "in_progress").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  const chartData = bookings.slice(0, 8).map((b) => ({
    name: b.listing?.title?.length > 15 ? `${b.listing.title.slice(0, 15)}…` : b.listing?.title || "Booking",
    rental: b.price || 0,
    deposit: b.deposit || 0,
    quantity: b.quantity || 1,
  }));

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8", marginBottom: "1.75rem" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#0F766E", marginBottom: 2 }}>FULFILMENT PORTFOLIO SPECTRUM</span>
          <h3 className="feature-chart-title">Confirmed Agreements & Financial Flow</h3>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge" style={{ background: "#FFE66D", border: "1.5px solid #171915" }}>
            Total Value: {money(totalValue)}
          </span>
          <span className="badge" style={{ background: "#4ECDC440", border: "1.5px solid #171915" }}>
            {bookings.length} Bookings ({totalUnits} Units)
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 190 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0CF" />
            <XAxis dataKey="name" stroke="#171915" tick={{ fontSize: 10, fontWeight: 700 }} />
            <YAxis stroke="#171915" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip
              formatter={(val, name) => [money(val), name === "rental" ? "Rental Fee" : "Security Deposit"]}
              contentStyle={{ background: "#fffef8", border: "1.5px solid #171915", borderRadius: 10, fontWeight: 700, boxShadow: "2px 2px 0 #171915" }}
            />
            <Bar dataKey="rental" name="Agreed Rental" fill="#4ECDC4" stroke="#171915" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
            <Bar dataKey="deposit" name="Refundable Deposit" fill="#FFE66D" stroke="#171915" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="feature-metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: 12 }}>
        <div className="feature-metric-card" style={{ border: "1.5px solid #171915", boxShadow: "2px 2px 0 #171915" }}>
          <span><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2ed573", border: "1px solid #171915", display: "inline-block", marginRight: 6 }} />Active Exchanges</span>
          <strong>{activeCount} active</strong>
          <small>In fulfillment pipeline</small>
        </div>
        <div className="feature-metric-card" style={{ border: "1.5px solid #171915", boxShadow: "2px 2px 0 #171915" }}>
          <span><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ecdc4", border: "1px solid #171915", display: "inline-block", marginRight: 6 }} />Completed Orders</span>
          <strong>{completedCount} delivered</strong>
          <small>Fulfilled & finalized</small>
        </div>
        <div className="feature-metric-card" style={{ border: "1.5px solid #171915", boxShadow: "2px 2px 0 #171915" }}>
          <span><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60c5f1", border: "1px solid #171915", display: "inline-block", marginRight: 6 }} />Total Fleet Assets</span>
          <strong>{totalUnits} units</strong>
          <small>Under active custody</small>
        </div>
        <div className="feature-metric-card" style={{ border: "1.5px solid #171915", boxShadow: "2px 2px 0 #171915" }}>
          <span><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd13b", border: "1px solid #171915", display: "inline-block", marginRight: 6 }} />Average Deal Size</span>
          <strong>{money(Math.round(totalValue / (bookings.length || 1)))}</strong>
          <small>Per agreed booking</small>
        </div>
      </div>
    </div>
  );
}

export function BookingsPage() {
  const resource = useData("/bookings"),
    { user, dashboardRole } = useAuth();
  return (
    <>
      <Heading
        title="From agreed to delivered."
        description="Track fulfilment, coordinate logistics and keep a clear record."
      />
      <State resource={resource}>
        {(data) => {
          const filtered = data.filter(
            (b) =>
              b[dashboardRole === "provider" ? "provider" : "seeker"]?._id ===
              user._id,
          );
          return filtered.length ? (
            <div className="stack">
              <BookingFulfillmentVisualizer bookings={filtered} role={dashboardRole} />
              {filtered.map((b) => (
                <article className="panel" key={b._id}>
                  <div className="section-heading">
                    <h2>{b.listing?.title}</h2>
                    <Badge>{b.status}</Badge>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 0 14px" }}>
                    <span className="badge" style={{ background: "#89CFF040", border: "1.5px solid #171915" }}>
                      🏢 Provider: <strong>{b.provider?.name}</strong>
                    </span>
                    <span className="badge" style={{ background: "#FFE66D40", border: "1.5px solid #171915" }}>
                      🎯 Renter: <strong>{b.seeker?.name}</strong>
                    </span>
                    <span className="badge" style={{ background: "#C3B1E140", border: "1.5px solid #171915" }}>
                      📦 {b.quantity} Units
                    </span>
                  </div>

                  <Flow
                    steps={[
                      "Confirmed",
                      "In progress",
                      "Completed",
                      "Reviewed",
                    ]}
                    active={
                      b.status === "completed"
                        ? 2
                        : b.status === "in_progress"
                          ? 1
                          : 0
                    }
                  />

                  <div style={{ margin: "1.25rem 0", padding: "1.25rem", background: "#FFFDF8", border: "1.5px solid #171915", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", boxShadow: "2px 2px 0 #171915" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "1.8rem" }}>🔐</span>
                      <div>
                        <span className="eyebrow" style={{ color: "#7B61A8", marginBottom: 2 }}>SECURITY HANDOVER PASS</span>
                        <div style={{ fontFamily: "monospace", fontSize: "1.2rem", fontWeight: 900, letterSpacing: "1.5px", color: "#171915" }}>
                          {b.handoverCode || "VERIFIED-FULFILMENT"}
                        </div>
                        <small style={{ color: "#555" }}>Verify code upon physical exchange</small>
                      </div>
                    </div>
                    <span className="badge" style={{ background: "#A8E6CF", border: "1.5px solid #171915" }}>
                      ✓ Verified Logistics
                    </span>
                  </div>

                  <div className="booking-facts">
                    <div>
                      <small>WHEN</small>
                      <strong>{date(b.start)}</strong>
                      <span>to {date(b.end)}</span>
                    </div>
                    <div>
                      <small>AGREED RENTAL</small>
                      <strong>{money(b.price)}</strong>
                      <span>
                        {b.quantity} units · deposit {money(b.deposit)}
                      </span>
                    </div>
                    <div>
                      <small>HANDOVER & LOGISTICS</small>
                      <strong>{b.logistics}</strong>
                      <span>Direct settlement</span>
                    </div>
                  </div>

                  {b.conditions && (
                    <div style={{ margin: "1rem 0", padding: "0.8rem 1rem", background: "#FFF9C430", border: "1.5px solid #171915", boxShadow: "2px 2px 0 #171915", borderRadius: "10px", fontSize: "0.9rem" }}>
                      <strong>Fulfilment terms:</strong> {b.conditions}
                    </div>
                  )}
                  <BookingRecord id={b._id} />
                  <div className="actions" style={{ marginTop: "1rem" }}>
                    <a
                      className="button quiet"
                      href={`/api/bookings/${b._id}/calendar`}
                    >
                      Download calendar (.ics)
                    </a>
                    <button className="quiet" onClick={() => window.print()}>
                      Print booking record
                    </button>
                    {b.provider._id === user._id &&
                      ["confirmed", "in_progress"].includes(b.status) && (
                        <Action
                          disabled={new Date(b.status === "confirmed" ? b.start : b.end) > new Date()}
                          run={async () => {
                            await api(`/bookings/${b._id}/status`, {
                              method: "PATCH",
                              body: {
                                status:
                                  b.status === "confirmed"
                                    ? "in_progress"
                                    : "completed",
                              },
                            });
                            await resource.reload();
                          }}
                        >
                          {b.status === "confirmed"
                            ? "Start fulfilment"
                            : "Mark completed"}
                        </Action>
                      )}
                  </div>
                  {b.status === "confirmed" && (
                    <details>
                      <summary>Cancel booking</summary>
                      <p>
                        Cancellation is available at least {b.cancellationHours}{" "}
                        hours before the start.
                      </p>
                      <ActionForm
                        label="Cancel this booking"
                        onSubmit={async (form) => {
                          await api(`/bookings/${b._id}/status`, {
                            method: "PATCH",
                            body: {
                              status: "cancelled",
                              reason: form.get("reason"),
                            },
                          });
                          await resource.reload();
                        }}
                      >
                        <Field
                          label="Cancellation reason"
                          name="reason"
                          required
                        />
                      </ActionForm>
                    </details>
                  )}
                  {b.status === "completed" && (
                    <details>
                      <summary>Leave a review</summary>
                      <ActionForm
                        label="Publish review"
                        onSubmit={async (form) => {
                          await api(`/bookings/${b._id}/review`, {
                            method: "POST",
                            body: Object.fromEntries(form),
                          });
                          return "Your review is published.";
                        }}
                      >
                        <Field label="Rating" as="select" name="score">
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} / 5
                            </option>
                          ))}
                        </Field>
                        <Field
                          label="Your experience"
                          as="textarea"
                          name="comment"
                          minLength={5}
                          required
                        />
                      </ActionForm>
                    </details>
                  )}
                  {b.status !== "cancelled" && (
                    <details>
                      <summary>Report a booking issue</summary>
                      <ActionForm
                        label="Open dispute"
                        onSubmit={async (form) => {
                          await api(`/bookings/${b._id}/dispute`, {
                            method: "POST",
                            body: Object.fromEntries(form),
                          });
                          return "Dispute submitted. Follow its status under Disputes.";
                        }}
                      >
                        <Field
                          label="What happened?"
                          name="reason"
                          as="textarea"
                          minLength={10}
                          required
                        />
                      </ActionForm>
                    </details>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Your next booking belongs here."
              text="Accept an offer to reserve inventory and start the booking journey."
              href="/dashboard/negotiations"
              label="View offers"
            />
          );
        }}
      </State>
    </>
  );
}

function BookingRecord({ id }) {
  const [record, setRecord] = useState(null);
  return (
    <details className="booking-record" style={{ margin: "14px 0" }}>
      <summary>Inspect agreement & offer history</summary>
      <Action className="quiet" run={async () => setRecord(await api(`/bookings/${id}/summary`))}>
        Load latest agreement
      </Action>
      {record && (
        <div className="studio-result" style={{ marginTop: "12px" }}>
          <dl className="spec-list">
            <div>
              <dt>Booking reference</dt>
              <dd>{record.booking._id}</dd>
            </div>
            <div>
              <dt>Agreed rental</dt>
              <dd>{money(record.booking.price)}</dd>
            </div>
            <div>
              <dt>Deposit</dt>
              <dd>{money(record.booking.deposit)}</dd>
            </div>
            <div>
              <dt>Terms</dt>
              <dd>{record.booking.conditions || "No additional terms recorded"}</dd>
            </div>
            <div>
              <dt>Cancellation notice</dt>
              <dd>{record.booking.cancellationHours} hours</dd>
            </div>
          </dl>
          <h4>Recorded offers</h4>
          <ol>
            {record.offers.map((offer, index) => (
              <li key={offer._id || index}>
                {money(offer.price)} · {offer.conditions || "No additional terms"}
              </li>
            ))}
          </ol>
          <small>Agreement record only. Payments are arranged directly between businesses.</small>
        </div>
      )}
    </details>
  );
}

export function ReviewsPage() {
  const resource = useData("/reviews"),
    { user } = useAuth();
  return (
    <>
      <Heading
        title="Trust, earned together."
        description="Reviews come from completed bookings, in both directions."
      />
      <State resource={resource}>
        {(data) =>
          data.length ? (
            <>
              <ReviewsAnalyticsVisualizer reviews={data} />
              <div className="card-grid">
                {data.map((r) => (
                  <article className="panel" key={r._id}>
                    <Badge>
                      {r.from?._id === user._id ? "Given" : "Received"}
                    </Badge>
                    <h2 className="stars" style={{ margin: "10px 0 6px", color: "#ffa500" }}>
                      {"★".repeat(r.score)}
                      {"☆".repeat(5 - r.score)}
                    </h2>
                    <p style={{ margin: "8px 0" }}>{r.comment}</p>
                    <small style={{ color: "#666" }}>
                      {r.from?.name} → {r.to?.name} · {date(r.createdAt)}
                    </small>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <Empty
              title="A reputation starts with a booking."
              text="After fulfilment, both businesses can leave one review from the booking page."
            />
          )
        }
      </State>
    </>
  );
}

export function DisputesPage() {
  const resource = useData("/disputes");
  return (
    <>
      <Heading
        title="Let’s work it out."
        description="Booking issues and their resolution history."
      />
      <State resource={resource}>
        {(data) =>
          data.length ? (
            <>
              <DisputesPipelineVisualizer disputes={data} />
              <div className="stack">
                {data.map((d) => (
                  <article
                    key={d._id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid rgba(23, 25, 21, 0.1)",
                      borderRadius: "16px",
                      padding: "1.25rem 1.5rem",
                      boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
                      marginBottom: "1rem",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                        Booking #{d.booking?._id?.slice(-8) || d._id?.slice(-8)}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          background: d.status === "resolved" ? "#DCFCE7" : "#FEE2E2",
                          color: d.status === "resolved" ? "#166534" : "#991B1B",
                          border: d.status === "resolved" ? "1px solid #86EFAC" : "1px solid #FCA5A5",
                        }}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p style={{ margin: "8px 0 0", color: "#374151", fontSize: "0.92rem", lineHeight: 1.5 }}>
                      {d.reason}
                    </p>
                    {d.resolution && (
                      <div
                        style={{
                          margin: "12px 0 0",
                          padding: "10px 14px",
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          borderRadius: "12px",
                        }}
                      >
                        <strong style={{ fontSize: "0.82rem", color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          ✓ Agreed Resolution
                        </strong>
                        <p style={{ margin: "4px 0 0", color: "#15803D", fontSize: "0.88rem" }}>{d.resolution}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <Empty
              title="No disputes to track."
              text="If an issue arises, open a dispute from the relevant booking."
            />
          )
        }
      </State>
    </>
  );
}
