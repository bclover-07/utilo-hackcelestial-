"use client";
import { useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { api } from "@/lib/api";
import { ActionForm, Field, money } from "./ui";
import AgentDecision from "./AgentDecision";

export default function MatchWorkbench() {
  const [result, setResult] = useState(null);
  return <details className="panel" id="matching"><summary><Layers size={18} /> Quick shortlist & ranking explanation</summary><p>Describe several resources to inspect independent matches and supply gaps. Use the Event Conductor to check a combined package budget and shared stock.</p>
    <ActionForm label="Find and explain matches" onSubmit={async form => {
      setResult(null);
      const data = Object.fromEntries([...form].filter(([,value]) => value !== ""));
      if ((data.latitude == null) !== (data.longitude == null)) throw new Error("Enter both coordinates or leave both blank.");
      const filters = { city: data.city, budget: data.budget, radiusKm: data.radiusKm, delivery: data.delivery === "on", ...(data.start ? { start: new Date(data.start).toISOString() } : {}), ...(data.end ? { end: new Date(data.end).toISOString() } : {}), ...(data.latitude != null ? { coordinates: [Number(data.longitude), Number(data.latitude)] } : {}) };
      setResult(await api("/ai/workflow", { method: "POST", body: { kind: "bundle", text: data.text, filters } }));
      return "Independent matches checked. Review the gaps and suggested next steps.";
    }}>
      <Field label="Resource brief" name="text" as="textarea" rows={3} minLength={5} maxLength={4000} required placeholder="We need 80 chairs and a projector for a workshop." />
      <div className="form-grid"><Field label="City (optional)" name="city" maxLength={100} /><Field label="Budget per requirement (INR, optional)" name="budget" type="number" min={1} /><Field label="Start (optional; supply both dates)" name="start" type="datetime-local" /><Field label="End" name="end" type="datetime-local" /><Field label="Latitude (optional)" name="latitude" type="number" step="any" min={-90} max={90} /><Field label="Longitude (optional)" name="longitude" type="number" step="any" min={-180} max={180} /><Field label="Radius (km)" name="radiusKm" type="number" min={1} max={300} defaultValue={25} /></div>
      <label className="check"><input type="checkbox" name="delivery" /> Delivery required</label>
    </ActionForm>
    {result && <div className="studio-result"><h3>{result.draft.title}</h3><p>{result.summary.matched} of {result.summary.requirements} requirements have candidates · {result.summary.gaps} gaps · {(result.elapsedMs/1000).toFixed(1)}s elapsed</p>{result.draft.missing.length > 0 && <div className="notice"><strong>Please confirm</strong><ul>{result.draft.missing.map((text,index)=><li key={index}>{text}</li>)}</ul></div>}<AgentDecision decision={result.decision} generation={result.generation} />{result.matches.map((match,index)=><section className="match-requirement" key={index}><h4>{match.item.quantity} × {match.item.label} · {match.total} matches</h4>{match.items.slice(0,3).map(listing=><Link className="match-row" key={listing._id} href={`/dashboard/resources/${listing._id}`}><strong>{listing.title}</strong><span>{money(listing.estimatedTotal)} · {listing.score}/100 fit</span><small>{listing.reasons.join(" · ")}</small></Link>)}{!match.total && <p>No matching inventory for this requirement. Adjust the brief or constraints.</p>}</section>)}<p className="agent-review-note">Each requirement is checked independently within 200 candidates. These matches do not establish whole-event feasibility or create a reservation.</p><Link className="button quiet" href="/dashboard/planner">Build a combined event package →</Link></div>}
  </details>;
}
