"use client";
import { useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { api } from "@/lib/api";
import { ActionForm, Field, money } from "./ui";
import AgentDecision from "./AgentDecision";

function MatchScoreMiniGauge({ score }) {
  const radius = 16;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const strokeColor = score >= 85 ? "#10b981" : score >= 65 ? "#f59e0b" : "#6366f1";

  return (
    <div className="match-score-mini" title={`${score}% Compatibility`}>
      <svg height={radius * 2} width={radius * 2}>
        <circle stroke="#e5e0cf" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      <span className="mini-gauge-text">{score}%</span>
    </div>
  );
}

export default function MatchWorkbench() {
  const [result, setResult] = useState(null);
  return (
    <details className="panel" id="matching">
      <summary><Layers size={18} /> AI Shortlist & Multi-Resource Match Workbench</summary>
      <div style={{ marginTop: "0.75rem", marginBottom: "1rem" }}>
        <span className="eyebrow">INTELLIGENT GAP ANALYSIS</span>
        <h3 style={{ margin: "4px 0" }}>Test Multi-Supplier Event Feasibility</h3>
      </div>
      <ActionForm
        label="Analyze matches & gaps →"
        onSubmit={async (form) => {
          setResult(null);
          const data = Object.fromEntries([...form].filter(([, value]) => value !== ""));
          if ((data.latitude == null) !== (data.longitude == null))
            throw new Error("Enter both coordinates or leave both blank.");
          const filters = {
            city: data.city,
            budget: data.budget,
            radiusKm: data.radiusKm,
            delivery: data.delivery === "on",
            ...(data.start ? { start: new Date(data.start).toISOString() } : {}),
            ...(data.end ? { end: new Date(data.end).toISOString() } : {}),
            ...(data.latitude != null ? { coordinates: [Number(data.longitude), Number(data.latitude)] } : {}),
          };
          setResult(await api("/ai/workflow", { method: "POST", body: { kind: "bundle", text: data.text, filters } }));
          return "Multi-resource matches evaluated.";
        }}
      >
        <Field label="Resource brief" name="text" as="textarea" rows={3} minLength={5} maxLength={4000} required placeholder="We need 80 chairs and a projector for a corporate workshop." />
        <div className="form-grid">
          <Field label="City (optional)" name="city" maxLength={100} />
          <Field label="Budget per requirement (INR, optional)" name="budget" type="number" min={1} />
          <Field label="Start (optional; supply both dates)" name="start" type="datetime-local" />
          <Field label="End" name="end" type="datetime-local" />
          <Field label="Latitude (optional)" name="latitude" type="number" step="any" min={-90} max={90} />
          <Field label="Longitude (optional)" name="longitude" type="number" step="any" min={-180} max={180} />
          <Field label="Radius (km)" name="radiusKm" type="number" min={1} max={300} defaultValue={25} />
        </div>
        <label className="check"><input type="checkbox" name="delivery" /> Provider delivery required</label>
      </ActionForm>
      {result && (
        <div className="studio-result" style={{ marginTop: "1.5rem" }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">MATCH ASSESSMENT</span>
              <h2>{result.draft.title}</h2>
            </div>
            <div className="kpi-mini-grid" style={{ margin: 0 }}>
              <div className="coverage-kpi-card" style={{ minWidth: 100, padding: "6px 12px" }}>
                <span className="kpi-percent-label">Matched</span>
                <strong>{result.summary.matched} / {result.summary.requirements}</strong>
              </div>
              <div className="coverage-kpi-card" style={{ minWidth: 80, padding: "6px 12px" }}>
                <span className="kpi-percent-label">Gaps</span>
                <strong>{result.summary.gaps}</strong>
              </div>
              <div className="coverage-kpi-card" style={{ minWidth: 80, padding: "6px 12px" }}>
                <span className="kpi-percent-label">Latency</span>
                <strong>{(result.elapsedMs / 1000).toFixed(1)}s</strong>
              </div>
            </div>
          </div>

          {result.draft.missing.length > 0 && (
            <div className="notice" style={{ marginTop: "0.5rem" }}>
              <strong>Required Confirmation</strong>
              <ul>
                {result.draft.missing.map((text, index) => (
                  <li key={index}>{text}</li>
                ))}
              </ul>
            </div>
          )}

          <AgentDecision decision={result.decision} generation={result.generation} />

          <div className="match-requirements-deck" style={{ marginTop: "1.25rem" }}>
            {result.matches.map((match, index) => (
              <section className="match-requirement-panel" key={index}>
                <div className="section-heading" style={{ marginBottom: 8 }}>
                  <h4>{match.item.quantity} × {match.item.label}</h4>
                  <span className="badge">{match.total} matches</span>
                </div>
                {match.items.length ? (
                  <div className="match-rows-grid">
                    {match.items.slice(0, 3).map((listing) => (
                      <Link className="match-row-card" key={listing._id} href={`/dashboard/resources/${listing._id}`}>
                        <div className="match-card-top">
                          <strong>{listing.title}</strong>
                          <MatchScoreMiniGauge score={listing.score} />
                        </div>
                        <div className="match-card-metrics">
                          <span>Est: <strong>{money(listing.estimatedTotal)}</strong></span>
                          <span>Unit: <strong>{money(listing.price)}</strong></span>
                        </div>
                        {listing.reasons?.length > 0 && (
                          <div className="reason-pills-wrap" style={{ marginTop: 6 }}>
                            {listing.reasons.map((r) => (
                              <span key={r} className="reason-chip">
                                <span className="chip-check">✓</span> {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p>No matching inventory in immediate radius. Consider widening search bounds.</p>
                )}
              </section>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <Link className="button lavender" href="/dashboard/planner">
              Launch Event Conductor Package →
            </Link>
          </div>
        </div>
      )}
    </details>
  );
}
