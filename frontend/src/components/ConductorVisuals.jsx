"use client";
import { useId } from "react";
import { money } from "./ui";

export default function ConductorVisuals({ plan, option }) {
  const titleId = useId();
  const requirements = plan.input.items;
  const suppliers = [...new Set(option.allocations.map(a => a.providerId))];
  const height = Math.max(320, requirements.length * 74 + 50, suppliers.length * 74 + 50);
  const y = (index, count) => 40 + (index + .5) * (height - 80) / count;
  const colors = ["#B6E880", "#C8BEFF", "#FFB7CE", "#89CFF0", "#FFE66D", "#FFCBA4"];
  return <section className="panel conductor-map"><div className="section-heading"><div><span className="eyebrow">THE EVENT RESOURCE GRAPH</span><h2>See the connections.</h2><p>Every line is a selected allocation. Inspect the source listings in the allocation cards below.</p></div><span className="badge">LIVE PLAN DATA</span></div>
    <div className="conductor-graph-scroll"><svg viewBox={`0 0 900 ${height}`} role="img" aria-labelledby={titleId} className="conductor-graph"><title id={titleId}>Resource allocation diagram: {requirements.length} requirements connected to {suppliers.length} suppliers, estimated cost {money(option.total)}.</title>
      {option.allocations.map((row, index) => { const supplier = suppliers.indexOf(row.providerId); return <path key={`${row.itemIndex}-${row.listingId}`} d={`M 266 ${y(row.itemIndex, requirements.length)} C 410 ${y(row.itemIndex, requirements.length)}, 490 ${y(supplier, suppliers.length)}, 634 ${y(supplier, suppliers.length)}`} fill="none" stroke={colors[supplier % colors.length]} strokeWidth={7} className="conductor-connection" style={{ animationDelay: `${index * 70}ms` }}><title>{row.quantity} × {row.title} for {requirements[row.itemIndex].label}</title></path>; })}
      <text x="24" y="20" className="graph-caption">YOUR REQUIREMENTS</text><text x="634" y="20" className="graph-caption">SELECTED SUPPLIERS</text>
      {requirements.map((item, index) => <g key={index}><rect x={24} y={y(index, requirements.length) - 27} width={242} height={54} rx={16} fill="#FFFDF4" stroke="#20201e" strokeWidth={1} /><text x={40} y={y(index, requirements.length) - 3} className="graph-label">{item.label.length > 26 ? `${item.label.slice(0, 25)}…` : item.label}</text><text x={40} y={y(index, requirements.length) + 16} className="graph-detail">{item.quantity} units · capacity {item.capacity}</text></g>)}
      {suppliers.map((supplier, index) => { const rows = option.allocations.filter(a => a.providerId === supplier); return <g key={supplier}><rect x={634} y={y(index, suppliers.length) - 27} width={242} height={54} rx={16} fill={colors[index % colors.length]} stroke="#20201e" strokeWidth={1} /><text x={650} y={y(index, suppliers.length) - 3} className="graph-label">Supplier {index + 1} · {rows.length} allocation{rows.length === 1 ? "" : "s"}</text><text x={650} y={y(index, suppliers.length) + 16} className="graph-detail">{rows.reduce((sum, a) => sum + a.quantity, 0)} units · {money(rows.reduce((sum, a) => sum + a.rentalTotal, 0))} rental</text></g>; })}
    </svg></div>
    {option.corridorOptimized && (
      <div className="notice conductor-corridor-badge" style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", background: "#e8f5e9", border: "1px solid #171915" }}>
        <span style={{ fontSize: "1.25rem" }}>🚚</span>
        <div>
          <strong>Logistics Corridor Aligned</strong>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>{option.corridorNote || "Suppliers clustered along the same transit corridor to reduce combined delivery friction."}</p>
        </div>
      </div>
    )}

    {plan.result?.scenarioSummary && (
      <div className="conductor-resilience-strip" style={{ marginTop: "1rem", padding: "1rem", borderRadius: "16px", border: "1px solid #171915", background: "#f8f9fa", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", boxShadow: "3px 3px 0 #171915" }}>
        <div>
          <span className="eyebrow" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>MONTE CARLO RESILIENCE</span>
          <h4 style={{ margin: "0.25rem 0", fontSize: "1.1rem" }}>Multi-Supplier Survivability</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#555" }}>
            Tested single dropouts & dual-vendor failure shocks: <strong>{plan.result.scenarioSummary.passed} / {plan.result.scenarioSummary.tested} scenarios passed</strong>
          </p>
        </div>
        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "110px", height: "12px", background: "#e0e0e0", borderRadius: "6px", overflow: "hidden", border: "1px solid #171915" }}>
            <div style={{ width: `${plan.result.scenarioSummary.resilienceScore || 100}%`, height: "100%", background: (plan.result.scenarioSummary.resilienceScore || 100) >= 80 ? "#4caf50" : "#ff9800", borderRadius: "6px" }} />
          </div>
          <strong style={{ fontSize: "1.3rem" }}>{plan.result.scenarioSummary.resilienceScore ?? 100}%</strong>
        </div>
      </div>
    )}

    {plan.result?.gaps?.some(g => g.substituteHint) && (
      <div className="panel conductor-substitutes" style={{ marginTop: "1rem", background: "#fff9c4", border: "1px dashed #171915", padding: "1rem", borderRadius: "16px", boxShadow: "3px 3px 0 #171915" }}>
        <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>💡</span> AI Substitute & Relaxation Suggestions
        </h4>
        {plan.result.gaps.filter(g => g.substituteHint).map(g => (
          <div key={g.itemIndex} style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>
            <strong>{g.label}:</strong> {g.substituteHint}
          </div>
        ))}
      </div>
    )}

    <div className="conductor-budget-visual"><div><strong>Package cost against budget</strong><span>{money(option.total)} / {money(plan.input.filters.budget)}</span></div><div className="conductor-budget-track" role="meter" aria-label="Package cost as percentage of budget, capped at 100" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(option.total / plan.input.filters.budget * 100))}><span className={option.feasible ? "" : "is-over-budget"} style={{ width: `${Math.min(100, option.total / plan.input.filters.budget * 100)}%` }} /></div><small>{option.feasible ? `${money(option.budgetRemaining)} remains within your rental and delivery budget.` : `${money(-option.budgetRemaining)} above your budget.`} Deposits are separate.</small></div>
  </section>;
}
