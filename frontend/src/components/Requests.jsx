"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AgentAction from "./AgentAction";
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

                    <div className="actions" style={{ marginTop: "1rem" }}>
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
function RequestForm({ categories }) {
  const router = useRouter(),
    { user } = useAuth();
  const [items, setItems] = useState([
      { category: "", quantity: 1, capacity: 1, specs: "" },
    ]),
    [draft, setDraft] = useState(null),
    [repeat, setRepeat] = useState(null);
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
              <div className="item-editor" key={i}>
                <div className="section-heading">
                  <h3>Resource {i + 1}</h3>
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
                defaultValue={repeat?.location?.coordinates?.[1]}
                type="number"
                min="-90"
                max="90"
                step="any"
                required
              />
              <Field
                label="Event longitude"
                name="longitude"
                defaultValue={repeat?.location?.coordinates?.[0]}
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
                if (result.draft.items.length) setItems(result.draft.items);
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
            {draft?.missing?.length > 0 && (
              <div className="notice">
                <strong>Please confirm</strong>
                <ul>
                  {draft.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
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
