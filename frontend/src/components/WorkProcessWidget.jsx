"use client";
import { useData, date } from "./ui";

const actionIcons = {
  DIRECT_OFFER_DISPATCHED: "⚡",
  COUNTER_OFFER_DISPATCHED: "🤝",
  OFFER_ACCEPTED_BOOKED: "🎉",
  NEGOTIATION_DECLINED: "✕",
  LISTING_PUBLISHED: "🏢",
  REQUEST_POSTED: "📢",
};

export default function WorkProcessWidget({ title = "Your Work Process History", maxItems = 5 }) {
  const processes = useData("/work-processes");

  return (
    <div className="work-process-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem" }}>⏱️ {title}</h4>
        <span className="badge" style={{ background: "#A8E6CF", border: "1.5px solid #20201e", fontSize: "0.7rem", fontWeight: 700 }}>
          Database Log
        </span>
      </div>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "#666" }}>
        Chronological audit of your offers, listings and bookings.
      </p>

      {processes.loading ? (
        <small style={{ color: "#777" }}>Loading process history…</small>
      ) : processes.error ? (
        <small style={{ color: "#d32f2f" }}>Failed to load process history.</small>
      ) : !processes.data?.length ? (
        <small style={{ color: "#888" }}>No work processes recorded yet.</small>
      ) : (
        <div className="work-process-list">
          {processes.data.slice(0, maxItems).map((wp) => (
            <div key={wp._id} className="work-process-item">
              <span className="work-process-icon">{actionIcons[wp.action] || "📌"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "0.82rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {wp.title}
                </strong>
                {wp.detail && (
                  <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "#555" }}>
                    {wp.detail}
                  </p>
                )}
                <small style={{ color: "#888", fontSize: "0.7rem" }}>
                  {date(wp.createdAt)}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
