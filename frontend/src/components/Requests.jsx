"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AgentAction from "./AgentAction";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
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
  colors,
} from "./ui";

const PIE_COLORS = ["#4ECDC4", "#FFE66D", "#FF6B6B", "#C3B1E1", "#78E08F", "#60C5F1", "#FFA502"];

function RequestItemDistributionChart({ items, budget }) {
  if (!items || items.length === 0) return null;

  const data = items.map((item, idx) => ({
    name: (item.category || `Item ${idx + 1}`).replaceAll("_", " "),
    units: Number(item.quantity) || 1,
    capacity: (Number(item.capacity) || 1) * (Number(item.quantity) || 1),
    fulfilled: item.booking ? Number(item.quantity) || 1 : 0,
    pending: !item.booking ? Number(item.quantity) || 1 : 0,
  }));

  const pieData = items.map((item, idx) => ({
    name: (item.category || `Resource ${idx + 1}`).replaceAll("_", " "),
    value: Number(item.quantity) || 1,
  }));

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#0F766E", marginBottom: 2 }}>RESOURCE FULFILMENT & CAPACITY</span>
          <h4 className="feature-chart-title">Item Allocation & Progress Breakdown</h4>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span className="badge" style={{ background: "#4ECDC440", border: "1.5px solid #171915" }}>
            {items.length} Category Bundles
          </span>
          {budget && (
            <span className="badge" style={{ background: "#FFE66D", border: "1.5px solid #171915" }}>
              Budget: {money(budget)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", alignItems: "center" }}>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0CF" />
              <XAxis dataKey="name" stroke="#171915" tick={{ fontSize: 10, fontWeight: 700 }} />
              <YAxis stroke="#171915" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "#fffef8", border: "1.5px solid #171915", borderRadius: 10, boxShadow: "2px 2px 0 #171915", fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 4 }} />
              <Bar dataKey="fulfilled" name="Secured Units" fill="#2ed573" stroke="#171915" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="In Negotiation" fill="#ffd13b" stroke="#171915" strokeWidth={1.5} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: "100%", height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={32}
                paddingAngle={3}
                stroke="#171915"
                strokeWidth={1.5}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [`${val} Units`, name]}
                contentStyle={{ background: "#fffef8", border: "1.5px solid #171915", borderRadius: 10, boxShadow: "2px 2px 0 #171915", fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function RequestLifecycleTimeline({ status }) {
  const steps = [
    { key: "broadcast", label: "1. RFQ Broadcasted", desc: "Sent to verified matching providers" },
    { key: "quotes", label: "2. Offers Inbound", desc: "Providers propose rates & terms" },
    { key: "negotiation", label: "3. Bilateral Terms", desc: "ZOPA counter-offers & escrow" },
    { key: "fulfilled", label: "4. All Secured", desc: "Final agreement locked & ready" },
  ];

  const getStageIndex = (st) => {
    if (st === "completed" || st === "closed") return 3;
    if (st === "partial") return 2;
    if (st === "open") return 1;
    return 0;
  };

  const activeIdx = getStageIndex(status);

  return (
    <div className="feature-flow-container" style={{ margin: "14px 0" }}>
      {steps.map((step, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className={`feature-flow-step ${isDone ? "done" : isActive ? "active" : ""}`}>
              <span>{isDone ? "✓" : i + 1}</span>
              <div>
                <div>{step.label}</div>
                <small style={{ fontWeight: 500, color: "#444" }}>{step.desc}</small>
              </div>
            </div>
            {i < steps.length - 1 && <span className="feature-flow-arrow">→</span>}
          </div>
        );
      })}
    </div>
  );
}

export function RequestsPage() {
  const resource = useData("/requests");
  return (
    <>
      <Heading
        title="One event. Every moving part."
        description="Track each resource in your request, from first quote to confirmed booking."
      >
        <Link className="button" href="/dashboard/requests/create">
          + Post a requirement
        </Link>
      </Heading>
      <State resource={resource}>
        {(data) =>
          data.length ? (
            <div className="stack">
              {data.map((r) => {
                const bookedCount = r.items.filter((item) => item.booking).length;
                const totalCount = r.items.length || 1;
                const progressRatio = Math.round((bookedCount / totalCount) * 100);

                return (
                  <article className="panel request-tracking-card" key={r._id}>
                    <div className="section-heading">
                      <div>
                        <h2>{r.title}</h2>
                        <div className="spec-chip-strip" style={{ marginTop: 6 }}>
                          <span className="spec-chip">📅 {date(r.start)} → {date(r.end)}</span>
                          <span className="spec-chip">📍 {r.city}</span>
                          <span className="spec-chip">💰 Budget: {money(r.budget)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <Badge>{r.status}</Badge>
                        <span className="bundle-progress-text">{bookedCount} of {totalCount} Secured ({progressRatio}%)</span>
                      </div>
                    </div>

                    <div className="request-progress-bar-wrap">
                      <div className="request-progress-bar-fill" style={{ width: `${progressRatio}%` }} />
                    </div>

                    <RequestLifecycleTimeline status={r.status} />

                    <div className="bundle-items-visual-grid">
                      {r.items.map((item, i) => (
                        <div key={i} className={`bundle-item-card ${item.booking ? "fulfilled" : "pending"}`}>
                          <div className="bundle-item-top">
                            <span className="bundle-status-icon">{item.booking ? "✓" : "○"}</span>
                            <span className="bundle-qty">{item.quantity} units</span>
                          </div>
                          <strong>{item.category.replaceAll("_", " ")}</strong>
                          <span className={`bundle-status-tag ${item.booking ? "tag-booked" : "tag-pending"}`}>
                            {item.booking ? "Confirmed" : "In Negotiation"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <RequestItemDistributionChart items={r.items} budget={r.budget} />

                    <div className="actions" style={{ marginTop: "1.25rem" }}>
                      {["open", "partial"].includes(r.status) && (
                        <AgentAction
                          endpoint="/ai/urgency"
                          body={{ requestId: r._id }}
                          label="Analyze urgency ✳"
                        />
                      )}
                      <Link
                        className="button lavender"
                        href="/dashboard/negotiations"
                      >
                        View offers →
                      </Link>
                      {r.status === "open" && (
                        <Action
                          className="quiet"
                          run={async () => {
                            await api(`/requests/${r._id}/cancel`, {
                              method: "POST",
                            });
                            await resource.reload();
                          }}
                        >
                          Cancel request
                        </Action>
                      )}
                      <Link href={`/dashboard/requests/create?repeat=${r._id}`} className="button quiet">
                        Repeat with new dates ↗
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Empty
              title="What does your next event need?"
              text="Post one requirement to reach matching providers nearby."
              href="/dashboard/requests/create"
              label="Create a request"
            />
          )
        }
      </State>
    </>
  );
}

export function RequestEditor() {
  const categories = useData("/categories");
  return (
    <State resource={categories}>
      {(data) => <RequestForm categories={data} />}
    </State>
  );
}

function LiveRequirementEstimator({ items, budget }) {
  const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const totalCap = items.reduce((acc, it) => acc + ((Number(it.capacity) || 1) * (Number(it.quantity) || 1)), 0);
  const chartData = items.filter(it => it.category).map((it, idx) => ({
    name: it.category.replaceAll("_", " "),
    units: Number(it.quantity) || 1,
    capacity: (Number(it.capacity) || 1) * (Number(it.quantity) || 1),
  }));

  return (
    <div className="feature-chart-panel" style={{ background: "#FFF9E8" }}>
      <span className="eyebrow" style={{ color: "#7B61A8" }}>LIVE RFQ ESTIMATOR & COMPOSITION</span>
      <h3 style={{ margin: "4px 0 10px" }}>Dynamic Requirement Summary</h3>
      <div className="feature-metrics-grid">
        <div className="feature-metric-card">
          <span>Total Bundles</span>
          <strong>{items.length} resources</strong>
          <small>{totalUnits} total unit volume</small>
        </div>
        <div className="feature-metric-card">
          <span>Est. Guest Capacity</span>
          <strong>{totalCap} guests</strong>
          <small>Aggregated attendee reach</small>
        </div>
        <div className="feature-metric-card">
          <span>Target Budget</span>
          <strong>{budget ? money(budget) : "Not set"}</strong>
          <small>{budget && items.length ? `~${money(Math.round(budget / items.length))} per bundle` : "Flexible"}</small>
        </div>
      </div>

      {chartData.length > 0 && (
        <div style={{ width: "100%", height: 140, marginTop: 10 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E0CF" />
              <XAxis type="number" stroke="#171915" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" stroke="#171915" width={100} tick={{ fontSize: 10, fontWeight: 700 }} />
              <Tooltip contentStyle={{ background: "#fffef8", border: "1.5px solid #171915", borderRadius: 8, boxShadow: "2px 2px 0 #171915", fontWeight: 700 }} />
              <Bar dataKey="units" name="Units Needed" fill="#4ECDC4" stroke="#171915" strokeWidth={1.5} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function RequestForm({ categories }) {
  const router = useRouter(),
    { user } = useAuth();
  const [items, setItems] = useState([
      { category: "", quantity: 1, capacity: 1, specs: "" },
    ]),
    [draft, setDraft] = useState(null),
    [repeat, setRepeat] = useState(null),
    [budgetVal, setBudgetVal] = useState("");

  const update = (i, key, value) =>
    setItems(items.map((v, j) => (i === j ? { ...v, [key]: value } : v)));

  return (
    <>
      <Heading
        title="Big plans. One request."
        description="Bundle everything your event needs. Matching providers receive your RFQ."
      />
      <Flow active={0} />
      <div className="split-layout">
        <section className="panel">
          <ActionForm
            key={repeat?._id || "new-request"}
            label="Broadcast request →"
            onSubmit={async (form) => {
              const data = Object.fromEntries(form);
              const body = {
                ...data,
                items,
                coordinates: [Number(data.longitude), Number(data.latitude)],
                start: new Date(data.start).toISOString(),
                end: new Date(data.end).toISOString(),
                delivery: data.delivery === "on",
              };
              const result = await api("/requests", { method: "POST", body });
              router.push("/dashboard/requests");
              return `Request saved; ${result.invited} providers invited.`;
            }}
          >
            <Field
              label="Event / request title"
              name="title"
              key={draft?.title || repeat?.title || "title"}
              defaultValue={draft?.title || repeat?.title}
              required
            />
            {items.map((item, i) => (
              <div className="item-editor" key={i} style={{ border: "1.5px solid #171915", borderRadius: "14px", padding: "16px", background: "#FAF8F5", margin: "14px 0", boxShadow: "2px 2px 0 #171915" }}>
                <div className="section-heading" style={{ margin: "0 0 12px" }}>
                  <h3 style={{ margin: 0 }}>Resource {i + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="quiet"
                      onClick={() => setItems(items.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Field
                  as="select"
                  label="Category"
                  value={item.category}
                  onChange={(e) => update(i, "category", e.target.value)}
                  required
                >
                  <option value="">Choose category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Field>
                <div className="form-grid">
                  <Field
                    label="Units needed"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      update(i, "quantity", Number(e.target.value))
                    }
                    required
                  />
                  <Field
                    label="Capacity per unit"
                    type="number"
                    min="1"
                    value={item.capacity}
                    onChange={(e) =>
                      update(i, "capacity", Number(e.target.value))
                    }
                    required
                  />
                </div>
                <Field
                  label="Specifications / compatibility"
                  value={item.specs}
                  onChange={(e) => update(i, "specs", e.target.value)}
                  placeholder="E.g. stackable chairs, HDMI input, outside catering"
                />
              </div>
            ))}
            <button
              className="quiet"
              type="button"
              disabled={items.length >= 10}
              onClick={() =>
                setItems([
                  ...items,
                  { category: "", quantity: 1, capacity: 1, specs: "" },
                ])
              }
            >
              + Add a resource
            </button>

            <LiveRequirementEstimator items={items} budget={budgetVal || repeat?.budget} />

            <div className="form-grid">
              <Field
                label="Starts"
                name="start"
                type="datetime-local"
                required
              />
              <Field label="Ends" name="end" type="datetime-local" required />
              <Field
                label="Total budget (INR)"
                name="budget"
                type="number"
                min="1"
                defaultValue={repeat?.budget}
                onChange={(e) => setBudgetVal(e.target.value)}
                required
              />
              <Field
                label="City"
                name="city"
                defaultValue={repeat?.city || user.city}
                required
              />
              <Field
                label="Event latitude"
                name="latitude"
                defaultValue={repeat?.location?.coordinates?.[1] || 19.076}
                type="number"
                min="-90"
                max="90"
                step="any"
                required
              />
              <Field
                label="Event longitude"
                name="longitude"
                defaultValue={repeat?.location?.coordinates?.[0] || 72.8777}
                type="number"
                min="-180"
                max="180"
                step="any"
                required
              />
              <Field
                label="Radius (km)"
                name="radiusKm"
                type="number"
                min="1"
                max="300"
                defaultValue={repeat?.radiusKm || 25}
                required
              />
              <Field label="Priority" name="urgency" as="select" defaultValue={repeat?.urgency || "routine"}>
                <option value="routine">Routine</option>
                <option value="urgent">Time-sensitive</option>
                <option value="emergency">Emergency</option>
              </Field>
            </div>
            <label className="check">
              <input name="delivery" type="checkbox" defaultChecked={repeat?.delivery} /> Delivery required
            </label>
            <p className="hint">
              An RFQ invites offers. Review price, specifications and conditions
              before accepting; no funds are collected here.
            </p>
          </ActionForm>
        </section>
        <aside className="stack">
          <section className="panel" style={{ background: "#C3B1E1" }}>
            <Badge>GEMINI REQUEST ASSISTANT</Badge>
            <h2>Say it in your own words.</h2>
            <p>
              AI drafts the resource list. You confirm quantities, location,
              dates, and budget.
            </p>
            <ActionForm
              label="Turn this into a draft ✳"
              onSubmit={async (form) => {
                const result = await api("/ai/workflow", {
                  method: "POST",
                  body: { kind: "parse", text: form.get("text") },
                });
                setDraft(result.draft);
                if (result.draft.items?.length) setItems(result.draft.items);
                return "Draft ready. Review every field before broadcasting.";
              }}
            >
              <Field
                label="Describe your requirements"
                name="text"
                as="textarea"
                rows={5}
                minLength={5}
                required
                placeholder="I need a hall for 200 guests, 200 chairs and one projector…"
              />
            </ActionForm>
            {draft && (
              <div style={{ marginTop: "14px", padding: "14px", background: "#FFFDF4", border: "1.5px solid #171915", borderRadius: "12px", boxShadow: "2px 2px 0 #171915" }}>
                <span className="eyebrow" style={{ color: "#7B61A8" }}>PARSED AI SPECIFICATION</span>
                <strong style={{ display: "block", fontSize: "1rem" }}>{draft.title || "Parsed Event Requirement"}</strong>
                {draft.items?.length > 0 && (
                  <div className="spec-chip-strip" style={{ marginTop: 8 }}>
                    {draft.items.map((it, idx) => (
                      <span key={idx} className="spec-chip">
                        ✓ {it.quantity}x {it.category} (cap {it.capacity})
                      </span>
                    ))}
                  </div>
                )}
                {draft.missing?.length > 0 && (
                  <div className="notice" style={{ margin: "10px 0 0", padding: "10px" }}>
                    <strong>Please confirm:</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "16px" }}>
                      {draft.missing.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
          <section className="panel" style={{ background: "#A8E6CF" }}>
            <h3>Repeat a previous setup</h3>
            <Action
              run={async () => {
                const id = new URLSearchParams(window.location.search).get(
                  "repeat",
                );
                if (!id)
                  throw new Error(
                    "Choose Repeat from one of your existing requests first.",
                  );
                const all = await api("/requests");
                const r = all.find((v) => v._id === id);
                if (!r) throw new Error("Request not found.");
                setRepeat(r);
                setItems(
                  r.items.map(({ category, quantity, capacity, specs }) => ({
                    category,
                    quantity,
                    capacity,
                    specs,
                  })),
                );
              }}
            >
              Load previous resources
            </Action>
            <p>New dates are always required.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
