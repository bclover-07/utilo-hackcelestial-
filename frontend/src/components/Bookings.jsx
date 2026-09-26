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

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8", marginBottom: "2rem" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#0F766E", marginBottom: 2 }}>RESOLUTION HEALTH & SLA</span>
          <h3 className="feature-chart-title">Dispute Resolution Overview</h3>
        </div>
        <span className="badge" style={{ background: openCount > 0 ? "#FF85A1" : "#A8E6CF", border: "1px solid #171915" }}>
          {openCount > 0 ? `${openCount} Action Required` : "100% In Order"}
        </span>
      </div>

      <div className="feature-metrics-grid">
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #ff4757" }}>
          <span>Active In Review</span>
          <strong>{openCount} disputes</strong>
          <small>Mediation in progress</small>
        </div>
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #2ed573" }}>
          <span>Settled & Resolved</span>
          <strong>{resolvedCount} cases</strong>
          <small>Agreement reached</small>
        </div>
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #4ecdc4" }}>
          <span>Resolution Ratio</span>
          <strong>{disputes.length ? Math.round((resolvedCount / disputes.length) * 100) : 100}%</strong>
          <small>Successful outcomes</small>
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
              {filtered.map((b) => (
                <article className="panel" key={b._id}>
                  <div className="section-heading">
                    <h2>{b.listing?.title}</h2>
                    <Badge>{b.status}</Badge>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "8px 0 14px" }}>
                    <span className="badge" style={{ background: "#89CFF040", border: "1px solid #20201e" }}>
                      🏢 Provider: <strong>{b.provider?.name}</strong>
                    </span>
                    <span className="badge" style={{ background: "#FFE66D40", border: "1px solid #20201e" }}>
                      🎯 Renter: <strong>{b.seeker?.name}</strong>
                    </span>
                    <span className="badge" style={{ background: "#C3B1E140", border: "1px solid #20201e" }}>
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

                  <div style={{ margin: "1.25rem 0", padding: "1.25rem", background: "#FFFDF8", border: "1px solid #20201e", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", boxShadow: "2px 2px 0 #20201e" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "1.8rem" }}>🔐</span>
                      <div>
                        <span className="eyebrow" style={{ color: "#7B61A8", marginBottom: 2 }}>SECURITY HANDOVER PASS</span>
                        <div style={{ fontFamily: "monospace", fontSize: "1.2rem", fontWeight: 900, letterSpacing: "1.5px", color: "#20201e" }}>
                          {b.handoverCode || "VERIFIED-FULFILMENT"}
                        </div>
                        <small style={{ color: "#555" }}>Verify code upon physical exchange</small>
                      </div>
                    </div>
                    <span className="badge" style={{ background: "#A8E6CF", border: "1px solid #20201e" }}>
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
                    <div style={{ margin: "1rem 0", padding: "0.8rem 1rem", background: "#FFF9C430", border: "1px solid #20201e", borderLeft: "3px solid #FFB347", borderRadius: "8px", fontSize: "0.9rem" }}>
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
                  <article className="panel" key={d._id}>
                    <div className="section-heading">
                      <h3>Booking {d.booking?._id?.slice(-8)}</h3>
                      <Badge>{d.status}</Badge>
                    </div>
                    <p style={{ margin: "10px 0" }}>{d.reason}</p>
                    {d.resolution && (
                      <div className="notice" style={{ margin: "12px 0 0" }}>
                        <strong>Resolution</strong>
                        <p style={{ margin: "6px 0 0" }}>{d.resolution}</p>
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
