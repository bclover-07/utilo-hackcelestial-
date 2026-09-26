"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, GitBranch, ShieldCheck, RotateCcw, ArrowUpRight, Plus, X, Check, AlertTriangle, Layers, Network } from "lucide-react";
import { api, streamPlan } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Heading, Field, Badge, money, date, useData, ActionForm } from "./ui";
import VoiceSummary from "./VoiceSummary";
import ConductorVisuals from "./ConductorVisuals";

const blankItem = () => ({ label: "", query: "", category: "", quantity: 1, capacity: 1, specs: "", attributesText: "" });
function formItems(items) {
  return items.map(({ attributesText, attributes, ...item }) => ({ ...item, attributes: attributesText?.trim() ? JSON.parse(attributesText) : attributes || {} }));
}

export function PlannerPage() {
  const { user } = useAuth();
  const categories = useData("/categories"), saved = useData("/ai/plans"), memories = useData("/ai/memory");
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("My event resource plan");
  const [items, setItems] = useState([blankItem()]);
  const [filters, setFilters] = useState({ city: user?.city || "", radiusKm: 25, start: "", end: "", latitude: "", longitude: "", budget: "", delivery: false });
  const [plan, setPlan] = useState(null), [selected, setSelected] = useState("value");
  const [busy, setBusy] = useState(""), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [questions, setQuestions] = useState([]), [excluded, setExcluded] = useState([]), [acknowledged, setAcknowledged] = useState(false);
  const [budget, setBudget] = useState("");
  const [answer, setAnswer] = useState(null);
  const [progress, setProgress] = useState([]);
  const result = plan?.result;
  const option = result?.alternatives.find(p => p.id === selected) || result?.alternatives[0];

  async function run(label, work) {
    if (busy) return;
    setBusy(label); setError(""); setNotice("");
    try { await work(); } catch (e) { setError(e instanceof SyntaxError ? "Structured attributes must be a valid JSON object, such as {\"material\":\"wood\"}." : e.message); }
    finally { setBusy(""); }
  }
  function receive(next) {
    setPlan(next); setSelected(next.result.alternatives[0]?.id || "value");
    setBudget(next.input.filters.budget); setExcluded(next.input.excludedProviders || []); setAcknowledged(false);
  }
  const changeItem = (index, field, value) => setItems(previous => previous.map((item, i) => i === index ? { ...item, [field]: value } : item));
  function readInput() {
    if (!filters.start || !filters.end) throw new Error("Choose a start and end time.");
    if (filters.latitude === "" || filters.longitude === "") throw new Error("Set the event coordinates or use your location.");
    return { title, items: formItems(items), filters: { city: filters.city, radiusKm: Number(filters.radiusKm), coordinates: [Number(filters.longitude), Number(filters.latitude)], start: new Date(filters.start).toISOString(), end: new Date(filters.end).toISOString(), budget: Number(filters.budget), delivery: filters.delivery }, excludedProviders: [] };
  }
  async function recover(nextExcluded = excluded) {
    if (!plan) return;
    await run("Checking fresh inventory and rebuilding packages…", async () => {
      receive(await api(`/ai/plans/${plan._id}/replan`, { method: "POST", body: { version: plan.version, input: { ...plan.input, filters: { ...plan.input.filters, budget: Number(budget) }, excludedProviders: nextExcluded } } }));
      await saved.reload();
      setNotice("A new plan version is ready. No booking was changed.");
    });
  }
  return <>
    <Heading eyebrow="UTLIO CONDUCTOR · PLAN / TEST / ADAPT" title="Make every moving part work." description="Turn an event brief into a checked resource package. Explore the trade-offs. Be ready when plans change." />
    <section className="conductor-hero panel">
      <div><Badge>YOUR EVENT, CONNECTED</Badge><h2>Big ideas.<br /><span>Workable plans.</span></h2><p>AI interprets your brief. The allocation engine checks quantities, shared inventory and costs. You stay in control.</p><div className="conductor-pills"><span><Sparkles size={16} /> Understand</span><span><Layers size={16} /> Assemble</span><span><GitBranch size={16} /> Stress-test</span></div></div>
      <div className="conductor-orbit" aria-hidden="true"><div className="orbit-center"><Network size={38} /><strong>CONDUCTOR</strong></div><span className="orbit-node node-one">Resources</span><span className="orbit-node node-two">Your budget</span><span className="orbit-node node-three">Availability</span><span className="orbit-node node-four">Plan B</span></div>
    </section>
    <div role="status" aria-live="polite">{busy && <div className="notice conductor-busy"><span className="live-dot" /> {busy}</div>}{notice && <div className="notice">{notice}</div>}</div>
    {error && <div className="notice error-panel" role="alert">{error}</div>}
    <div className="conductor-workbench">
      <section className="panel conductor-intake">
        <div className="section-heading"><div><span className="eyebrow">01 / INTERPRET</span><h2>Start with the whole picture.</h2></div><Sparkles size={26} /></div>
        <label className="field"><span>Describe your event</span><textarea rows={5} maxLength={4000} value={brief} onChange={e => setBrief(e.target.value)} placeholder="We’re hosting a workshop for 150 guests in Navi Mumbai. We need 150 chairs and a projector for six hours, with delivery." /></label>
        <p className="hint">Try English, Hindi or Marathi text. Review every extracted field, especially mixed-language quantities and dates.</p>
        <button className="button" disabled={!!busy || brief.trim().length < 5} onClick={() => run("AI is extracting an editable requirement draft…", async () => {
          const response = await api("/ai/workflow", { method: "POST", body: { kind: "parse", text: brief } });
          setTitle(response.draft.title); setItems(response.draft.items.map(item => ({ ...item, label: item.label || item.category.replaceAll("_", " "), attributesText: "" }))); setQuestions(response.draft.missing);
          setNotice("Draft extracted. Check the requirements and set your event details before building a package.");
        })}><Sparkles size={17} /> Extract requirements</button>
        <p className="hint">You can also fill the editable requirements directly. Package checks work without an AI response.</p>
        {questions.length > 0 && <div className="conductor-questions"><h3>Confirm before planning</h3><ul>{questions.map((question, i) => <li key={i}>{question}</li>)}</ul></div>}
      </section>
      <section className="panel conductor-library">
        <span className="eyebrow">YOUR PLAN LIBRARY</span><h2>Pick up where you left off.</h2>
        {saved.loading ? <p role="status">Loading saved plans…</p> : saved.error ? <p role="alert">{saved.error}</p> : saved.data?.length ? <div className="conductor-saved">{saved.data.map(entry => <button className="quiet" disabled={!!busy} key={entry._id} onClick={() => run("Opening your saved plan…", async () => receive(await api(`/ai/plans/${entry._id}`)))}><span><strong>{entry.input.title}</strong><small>Version {entry.version} · {entry.request ? "Request created" : entry.result.status.replaceAll("_", " ")}</small></span><ArrowUpRight size={18} /></button>)}</div> : <p>Your saved packages and recovery versions will appear here after your first plan.</p>}
        <div className="conductor-principle"><ShieldCheck size={24} /><p><strong>Every recommendation has a receipt.</strong><br />Inspect the records and checked constraints. A proposed package always needs your approval.</p></div>
      </section>
    </div>
    <form className="panel conductor-editor" onSubmit={e => { e.preventDefault(); run("Checking inventory, assembling packages and testing supplier failures…", async () => { setProgress([]); receive(await streamPlan(readInput(), event => setProgress(previous => [...previous.filter(p => p.step !== event.step), event]))); await saved.reload(); setNotice("Plan saved. Review the packages and evidence below."); }); }}>
      <fieldset disabled={!!busy}>
        <div className="section-heading"><div><span className="eyebrow">02 / CONFIRM</span><h2>Your requirements, precisely.</h2></div><Badge>EDITABLE DRAFT</Badge></div>
        <Field label="Plan name" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} />
        <div className="conductor-items">{items.map((item, index) => <article className="conductor-item" key={index}>
          <div className="section-heading"><strong>Resource {String(index + 1).padStart(2, "0")}</strong><button type="button" className="quiet" aria-label={`Remove resource ${index + 1}`} disabled={items.length === 1} onClick={() => setItems(previous => previous.filter((_, i) => i !== index))}><X size={16} /></button></div>
          <div className="form-grid">
            <Field label="Resource name" required value={item.label} onChange={e => changeItem(index, "label", e.target.value)} placeholder="Banquet chairs" />
            <label className="field"><span>Category</span><select required value={item.category} onChange={e => changeItem(index, "category", e.target.value)}><option value="">Choose category</option>{categories.data?.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
            <Field label="Quantity" type="number" min={1} max={100000} required value={item.quantity} onChange={e => changeItem(index, "quantity", Number(e.target.value))} />
            <Field label="Capacity per resource" type="number" min={1} max={100000} required value={item.capacity} onChange={e => changeItem(index, "capacity", Number(e.target.value))} />
            <Field label="Listing title keyword (optional)" value={item.query} maxLength={120} onChange={e => changeItem(index, "query", e.target.value)} placeholder="chair" />
            <Field label="Requirements to confirm with provider" value={item.specs} maxLength={2000} onChange={e => changeItem(index, "specs", e.target.value)} placeholder="Matching covers; setup before 10 AM" />
          </div>
          <details><summary>Exact attribute constraints</summary><p className="hint">Use the listing’s attribute keys. Exact values are enforced; missing attributes exclude the listing. Free-text requirements above need provider confirmation.</p><Field label="Required attributes (JSON object)" as="textarea" rows={2} value={item.attributesText} onChange={e => changeItem(index, "attributesText", e.target.value)} placeholder={'{"material":"wood"}'} /></details>
        </article>)}</div>
        {categories.error && <p role="alert">{categories.error}</p>}
        <button className="quiet" type="button" disabled={items.length >= 10} onClick={() => setItems(previous => [...previous, blankItem()])}><Plus size={16} /> Add a resource</button>
        <div className="conductor-event-fields"><h3>The event boundaries</h3><div className="form-grid">
          <Field label="City" required value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} />
          <Field label="Whole-package budget (INR)" type="number" min={1} max={1e9} required value={filters.budget} onChange={e => setFilters({ ...filters, budget: e.target.value })} />
          <Field label="Starts at (your local time)" type="datetime-local" required value={filters.start} onChange={e => setFilters({ ...filters, start: e.target.value })} />
          <Field label="Ends at (your local time)" type="datetime-local" required value={filters.end} onChange={e => setFilters({ ...filters, end: e.target.value })} />
          <Field label="Latitude" type="number" step="any" min={-90} max={90} required value={filters.latitude} onChange={e => setFilters({ ...filters, latitude: e.target.value })} />
          <Field label="Longitude" type="number" step="any" min={-180} max={180} required value={filters.longitude} onChange={e => setFilters({ ...filters, longitude: e.target.value })} />
          <Field label="Search radius (km)" type="number" min={1} max={300} required value={filters.radiusKm} onChange={e => setFilters({ ...filters, radiusKm: e.target.value })} />
          <label className="conductor-check"><input type="checkbox" checked={filters.delivery} onChange={e => setFilters({ ...filters, delivery: e.target.checked })} /><span>Require provider delivery</span></label>
        </div><button className="quiet" type="button" onClick={() => { if (!navigator.geolocation) { setError("Location is unavailable. Enter the event coordinates manually."); return; } navigator.geolocation.getCurrentPosition(position => setFilters(previous => ({ ...previous, latitude: position.coords.latitude.toFixed(6), longitude: position.coords.longitude.toFixed(6) })), () => setError("Location permission was unavailable. Enter the event coordinates manually."), { timeout: 10000 }); }}>Use my current location</button><p className="hint">Use the event location, which may differ from where you are now. Budget includes listed rental and delivery charges; refundable deposits are shown separately.</p></div>
        <button type="submit" className="button"><Network size={18} /> Build a checked package <ArrowUpRight size={18} /></button>
      </fieldset>
    </form>
    {progress.length > 0 && <section className="panel conductor-live-flow" aria-label="Live LangGraph workflow">{progress.map(event => <div key={event.step} className={event.status === "complete" ? "is-complete" : "is-running"}><span>{event.status === "complete" ? <Check size={18} /> : <RotateCcw size={18} />}</span><strong>{event.step}</strong><small>{event.status === "complete" ? `${event.elapsedMs} ms · complete` : busy ? "Running" : "Interrupted"}</small></div>)}</section>}
    {plan && <section className="conductor-results" aria-label="Event plan results">
      <div className="panel conductor-result-header"><div><span className="eyebrow">03 / EXPLORE · VERSION {plan.version}</span><h2>{plan.input.title}</h2><p>{result.explanation}</p><small>Inventory checked {date(result.checkedAt)} · {(result.elapsedMs / 1000).toFixed(2)}s</small></div><Badge>{result.feasible ? "CHECKED PACKAGE FOUND" : "NEEDS ADJUSTMENT"}</Badge></div>
      <div className="conductor-package-options" role="group" aria-label="Package alternatives">{result.alternatives.map(p => <button key={p.id} disabled={!!busy} className={`conductor-package ${option?.id === p.id ? "is-selected" : ""}`} aria-pressed={option?.id === p.id} onClick={() => { setSelected(p.id); setAcknowledged(false); }}><span className="eyebrow">{p.label}</span><strong>{money(p.total)}</strong><span>{p.supplierCount} supplier{p.supplierCount === 1 ? "" : "s"} · {p.allocations.length} allocations</span><small>{p.feasible ? `${money(p.budgetRemaining)} within budget` : `${money(-p.budgetRemaining)} over budget`}</small>{option?.id === p.id && <Check size={22} />}</button>)}</div>
      {result.gaps.length > 0 && <div className="panel conductor-gaps"><h3><AlertTriangle size={20} /> Where supply falls short</h3>{result.gaps.map(gap => <p key={gap.itemIndex}><strong>{gap.label}</strong>: need {gap.required}, found {gap.independentlyAvailable} independently available; short by {gap.missing}.</p>)}<p className="hint">Shared stock is allocated across the whole package. Individual candidate counts do not guarantee joint feasibility.</p></div>}
      {option && <>
        <ConductorVisuals plan={plan} option={option} />
        <div className="conductor-workbench"><section className="panel conductor-evidence"><span className="eyebrow">THE EVIDENCE LEDGER</span><h2>Check the work.</h2>{option.evidence.map(entry => <div className="conductor-proof" key={entry.label}><span className={entry.passed ? "proof-pass" : "proof-fail"}>{entry.passed ? <Check size={17} /> : <X size={17} />}</span><span>{entry.label}</span><strong>{entry.passed ? "Passed" : "Failed"}</strong></div>)}<div className="notice">These checks cover recorded constraints. Setup, arrival time and free-text specifications still require confirmation.</div></section>
        <section className="panel conductor-cost"><span className="eyebrow">THE NUMBERS</span><h2>Every rupee accounted for.</h2><dl><div><dt>Resource rentals</dt><dd>{money(option.rentalTotal)}</dd></div><div><dt>Listed delivery charges</dt><dd>{money(option.deliveryTotal)}</dd></div><div className="cost-total"><dt>Estimated package</dt><dd>{money(option.total)}</dd></div><div><dt>Refundable deposits, separately</dt><dd>{money(option.depositTotal)}</dd></div></dl><p className="hint">Provider quotes may differ. Distances total {option.distanceKm.toFixed(1)} straight-line km across distinct listings; this is not a delivery route or ETA.</p></section></div>
        <section className="panel"><span className="eyebrow">YOUR ALLOCATION</span><h2>The people and resources behind the plan.</h2><div className="conductor-allocations">{option.allocations.map((allocation, i) => <article key={`${allocation.itemIndex}-${allocation.listingId}`} className="conductor-allocation"><span className="allocation-number">{String(i + 1).padStart(2, "0")}</span><div><Badge>{allocation.label}</Badge><h3><Link href={`/dashboard/resources/${allocation.listingId}`}>{allocation.title} <ArrowUpRight size={16} /></Link></h3><p>{allocation.quantity} units × {money(allocation.unitRental)} for this rental window</p><small>{allocation.availableQuantity} units available at check · {allocation.distanceKm?.toFixed(1)} km away</small><details><summary>Listing evidence & conditions</summary><p>{allocation.conditions || "No additional conditions listed. Confirm operational details with the provider."}</p><small>Listing {allocation.listingId} · Updated {date(allocation.updatedAt)}</small></details></div><strong>{money(allocation.rentalTotal)}</strong></article>)}</div></section>
      </>}
      <div className="conductor-workbench">
        <section className="panel conductor-resilience"><span className="eyebrow">04 / STRESS-TEST</span><h2>What if a supplier drops out?</h2><div className="resilience-stat"><strong>{result.scenarioSummary.passed}<span>/{result.scenarioSummary.tested}</span></strong><p>tested supplier-removal scenarios<br />have a replacement within budget</p></div><p className="hint">Tests use the lowest-cost feasible package and the same inventory snapshot. Up to six suppliers are tested. This is not a success probability.</p>{result.scenarios.map((scenario, index) => <div className="conductor-scenario" key={scenario.providerId}><div><strong>Scenario {index + 1}: remove supplier</strong><p>{scenario.affected.join(", ")}</p><small>{scenario.recoverable ? `Replacement found · cost change ${money(scenario.costChange)}` : "No feasible replacement found within the search"}</small></div><button className="quiet" disabled={!!busy || !!plan.request || excluded.includes(scenario.providerId)} onClick={() => recover([...new Set([...excluded, scenario.providerId])])}>Explore this <GitBranch size={15} /></button></div>)}</section>
        <section className="panel conductor-recovery"><span className="eyebrow">05 / ADAPT</span><h2>Change the boundaries.</h2><p>Recheck live inventory with a new budget or excluded suppliers. Each run saves a new version of this plan.</p><Field label="Replanning budget (INR)" type="number" min={1} max={1e9} value={budget} disabled={!!busy || !!plan.request} onChange={e => setBudget(e.target.value)} /><p>{excluded.length} supplier{excluded.length === 1 ? "" : "s"} excluded from this scenario</p><div className="actions"><button disabled={!!busy || !!plan.request} onClick={() => recover()}><RotateCcw size={16} /> Replan with fresh inventory</button>{excluded.length > 0 && <button className="quiet" disabled={!!busy || !!plan.request} onClick={() => recover([])}>Include all suppliers again</button>}</div>{result.comparison && <div className="conductor-diff"><h3>Compared with version {plan.previous?.version}</h3>{result.comparison.comparable ? <><p><strong>{money(result.comparison.costChange)}</strong> cost change · {result.comparison.unchangedAllocations} unchanged allocations</p>{result.comparison.changes.map((change, i) => <p key={i}>{change.title}: <strong>{change.before} → {change.after}</strong> units</p>)}{!result.comparison.changes.length && <p>Resource allocations are unchanged.</p>}</> : <p>{result.comparison.message}</p>}</div>}</section>
      </div>
      <section className="panel conductor-approval"><div><span className="eyebrow">06 / YOUR DECISION</span><h2>Ready to involve the providers?</h2><p>Create a request for the selected allocations. Providers review and quote; no inventory is reserved and no payment is taken.</p></div>{plan.request ? <Link className="button" href="/dashboard/requests">Open your created request <ArrowUpRight size={18} /></Link> : <><label className="conductor-check"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} disabled={!!busy} /><span>I reviewed this package, its unverified requirements, deposits and provider conditions.</span></label><button disabled={!!busy || !option?.feasible || !acknowledged} onClick={() => run("Revalidating inventory and creating your reviewed request…", async () => { const created = await api(`/ai/plans/${plan._id}/request`, { method: "POST", body: { version: plan.version, packageId: option.id, acknowledged: true } }); setPlan(previous => ({ ...previous, request: created.requestId })); await saved.reload(); setNotice(created.alreadyCreated ? "This plan already has a request. Open it below." : "Request created for the selected suppliers. Review their offers in Negotiations."); })}>Create reviewed request <ArrowUpRight size={18} /></button></>}</section>
      <details className="panel"><summary>Method, workflow evidence and limitations</summary><p>{result.search.explored} allocation candidates explored. Bounded beam width {result.search.beamWidth}; global optimality is not proven.</p>{result.trace.map(entry => <p key={entry.step}><strong>{entry.step}:</strong> {entry.detail}</p>)}<ul>{result.limitations.map(limit => <li key={limit}>{limit}</li>)}</ul></details>
    </section>}
    <details className="panel conductor-memory" style={{ marginTop: "1rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>🧠 Active AI Working Memory (Personalized Preferences)</summary>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        Preferences stored here are automatically injected into the Conductor and RAG Supervisor across sessions (e.g., preferred logistics, eco-friendly standards, budget rules).
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "0.75rem 0" }}>
        {memories.data?.map(m => (
          <div key={m._id} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.75rem", borderRadius: "20px", background: "#f0f4f8", border: "1px solid #171915", fontSize: "0.85rem", boxShadow: "2px 2px 0 #171915" }}>
            <span><strong>[{m.category}]:</strong> {m.key} → {m.value}</span>
            <button type="button" style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#171915", fontWeight: "bold" }} onClick={async () => { await api(`/ai/memory/${m._id}`, { method: "DELETE" }); await memories.reload(); }}>
              ✕
            </button>
          </div>
        ))}
        {!memories.data?.length && <p style={{ fontSize: "0.85rem", color: "#888" }}>No working preferences saved yet. Add one below:</p>}
      </div>
      <ActionForm label="Add working memory preference" onSubmit={async form => { await api("/ai/memory", { method: "POST", body: Object.fromEntries(form) }); await memories.reload(); return "Preference memorized."; }}>
        <div className="form-grid">
          <Field label="Category" name="category" as="select" defaultValue="preference">
            <option value="preference">General Preference</option>
            <option value="logistics">Logistics & Delivery</option>
            <option value="constraint">Event Constraint</option>
            <option value="vendor_affinity">Vendor Affinity</option>
          </Field>
          <Field label="Preference Key" name="key" placeholder="e.g. delivery_preference" required />
          <Field label="Preference Value" name="value" placeholder="e.g. Always require provider delivery with equipment setup" required />
        </div>
      </ActionForm>
    </details>

    <details className="panel conductor-knowledge">
      <summary>Ask the indexed resource library</summary>
      <p>Semantic search over indexed listing descriptions with Multi-Agent Supervisor Decomposition and Critic Reflection.</p>
      <ActionForm label="Search the resource library" onSubmit={async form => { setAnswer(null); setAnswer(await api("/ai/knowledge", { method: "POST", body: Object.fromEntries(form) })); return "Answer verified against live records."; }}>
        <Field label="Your question" name="text" as="textarea" minLength={3} maxLength={2000} required />
      </ActionForm>
      {answer && (
        <>
          {answer.subtasks?.length > 0 && (
            <div style={{ margin: "0.75rem 0", padding: "0.75rem", background: "#f8f9fa", border: "1px solid #171915", borderRadius: "14px", boxShadow: "2px 2px 0 #171915" }}>
              <span className="eyebrow" style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>SUPERVISOR DECOMPOSITION</span>
              <ul style={{ margin: "0.3rem 0 0 1rem", fontSize: "0.8rem", color: "#555" }}>
                {answer.subtasks.map((st, i) => <li key={i}>{st}</li>)}
              </ul>
            </div>
          )}

          <p className="ai-answer">{answer.answer}</p>
          <VoiceSummary text={answer.answer} />

          {answer.reflection?.zeroHallucinationCertified && (
            <div style={{ marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.6rem", background: "#e8f5e9", color: "#2e7d32", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
              <span>✓</span> Zero-Hallucination Certified · Checked {answer.reflection.checkedClaims} claims against {answer.reflection.sourcesConsulted} live database records
            </div>
          )}

          <div className="conductor-source-links">
            {answer.sources.map(source => (
              <Link key={source.id} href={`/dashboard/resources/${source.id}`}>{source.title} <ArrowUpRight size={14} /></Link>
            ))}
          </div>
        </>
      )}
    </details>
  </>;
}
