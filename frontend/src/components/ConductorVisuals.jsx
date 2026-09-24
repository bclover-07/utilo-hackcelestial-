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
      {requirements.map((item, index) => <g key={index}><rect x={24} y={y(index, requirements.length) - 27} width={242} height={54} rx={16} fill="#FFFDF4" stroke="#20201e" strokeWidth={3} /><text x={40} y={y(index, requirements.length) - 3} className="graph-label">{item.label.length > 26 ? `${item.label.slice(0, 25)}…` : item.label}</text><text x={40} y={y(index, requirements.length) + 16} className="graph-detail">{item.quantity} units · capacity {item.capacity}</text></g>)}
      {suppliers.map((supplier, index) => { const rows = option.allocations.filter(a => a.providerId === supplier); return <g key={supplier}><rect x={634} y={y(index, suppliers.length) - 27} width={242} height={54} rx={16} fill={colors[index % colors.length]} stroke="#20201e" strokeWidth={3} /><text x={650} y={y(index, suppliers.length) - 3} className="graph-label">Supplier {index + 1} · {rows.length} allocation{rows.length === 1 ? "" : "s"}</text><text x={650} y={y(index, suppliers.length) + 16} className="graph-detail">{rows.reduce((sum, a) => sum + a.quantity, 0)} units · {money(rows.reduce((sum, a) => sum + a.rentalTotal, 0))} rental</text></g>; })}
    </svg></div>
    <div className="conductor-budget-visual"><div><strong>Package cost against budget</strong><span>{money(option.total)} / {money(plan.input.filters.budget)}</span></div><div className="conductor-budget-track" role="meter" aria-label="Package cost as percentage of budget, capped at 100" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(option.total / plan.input.filters.budget * 100))}><span className={option.feasible ? "" : "is-over-budget"} style={{ width: `${Math.min(100, option.total / plan.input.filters.budget * 100)}%` }} /></div><small>{option.feasible ? `${money(option.budgetRemaining)} remains within your rental and delivery budget.` : `${money(-option.budgetRemaining)} above your budget.`} Deposits are separate.</small></div>
  </section>;
}
