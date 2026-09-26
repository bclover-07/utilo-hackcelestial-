"use client";
import LocalAi, { conversationText } from "./LocalAi";
import { useState } from "react";
import { api } from "@/lib/api";
import PrivateDocument from "./PrivateDocument";
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
  date,
  money,
  colors,
} from "./ui";

function VerificationQueueVisualizer({ users }) {
  if (!users || users.length === 0) return null;
  const pending = users.filter((u) => u.verification === "pending").length;
  const verified = users.filter((u) => u.verification === "verified").length;
  const rejected = users.filter((u) => u.verification === "rejected").length;

  const chartData = [
    { name: "Pending KYC", count: pending, color: "#ffe66d" },
    { name: "Approved", count: verified, color: "#2ed573" },
    { name: "Rejected", count: rejected, color: "#ff4757" },
  ];

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8", marginBottom: "1.5rem" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#0F766E", marginBottom: 2 }}>KYC AUDIT PIPELINE</span>
          <h3 className="feature-chart-title">Business Verification Queue Status</h3>
        </div>
        <span className="badge" style={{ background: pending > 0 ? "#FFE66D" : "#A8E6CF", border: "1px solid #171915" }}>
          {pending} Pending Review
        </span>
      </div>
      <div className="feature-metrics-grid">
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #ffe66d" }}>
          <span>Pending Review</span>
          <strong>{pending} providers</strong>
          <small>Awaiting KYC document approval</small>
        </div>
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #2ed573" }}>
          <span>Approved Businesses</span>
          <strong>{verified} verified</strong>
          <small>Cleared compliance credentials</small>
        </div>
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #ff4757" }}>
          <span>Declined Applications</span>
          <strong>{rejected} rejected</strong>
          <small>Document mismatch or incomplete</small>
        </div>
      </div>
    </div>
  );
}

export function VerificationsPage() {
  const r = useData("/admin/verifications");
  return (
    <>
      <Heading
        title="Trust starts with evidence."
        description="Review business documents and leave a clear decision note."
      />
      <State resource={r}>
        {(data) =>
          data.length ? (
            <>
              <VerificationQueueVisualizer users={data} />
              <div className="card-grid">
                {data.map((u) => (
                <article className="panel verification-card-neo" key={u._id}>
                  <div className="section-heading">
                    <div>
                      <h2>{u.name}</h2>
                      <div className="spec-chip-strip" style={{ marginTop: 4 }}>
                        <span className="spec-chip">🏢 {u.category}</span>
                        <span className="spec-chip">📍 {u.city}</span>
                        <span className="spec-chip">📄 GSTIN: {u.gstin || "Not supplied"}</span>
                      </div>
                    </div>
                    <Badge>{u.verification}</Badge>
                  </div>
                  <div className="spec-chip-strip" style={{ margin: "0.5rem 0" }}>
                    <span className="spec-chip">✉ {u.email}</span>
                    <span className="spec-chip">📞 {u.phone}</span>
                  </div>
                  {u.documentId ? (
                    <div style={{ margin: "0.75rem 0" }}>
                      <PrivateDocument id={u.documentId} />
                    </div>
                  ) : (
                    <p className="hint">No compliance document submitted yet.</p>
                  )}
                  <ActionForm
                    label="Save decision"
                    onSubmit={async (form) => {
                      await api(`/admin/verifications/${u._id}`, {
                        method: "PATCH",
                        body: Object.fromEntries(form),
                      });
                      await r.reload();
                    }}
                  >
                    <Field label="Decision" name="verification" as="select">
                      <option value="verified">Approve</option>
                      <option value="rejected">Reject</option>
                    </Field>
                    <Field
                      label="Review note"
                      name="verificationNote"
                      as="textarea"
                      minLength={3}
                      required
                      defaultValue={u.verificationNote}
                    />
                  </ActionForm>
                </article>
              ))}
            </div>
            </>
          ) : (
            <Empty title="No businesses to review yet." />
          )
        }
      </State>
    </>
  );
}
function DisputeQueueVisualizer({ disputes }) {
  if (!disputes || disputes.length === 0) return null;
  const openCount = disputes.filter((d) => d.status === "open").length;
  const resolvedCount = disputes.filter((d) => d.status === "resolved" || d.resolution).length;

  return (
    <div className="feature-chart-panel" style={{ background: "#FFFDF8", marginBottom: "1.5rem" }}>
      <div className="feature-chart-header">
        <div>
          <span className="eyebrow" style={{ color: "#0F766E", marginBottom: 2 }}>ADMIN MEDIATION PIPELINE</span>
          <h3 className="feature-chart-title">Disputes & Incident Resolution Status</h3>
        </div>
        <span className="badge" style={{ background: openCount > 0 ? "#FF85A1" : "#A8E6CF", border: "1px solid #171915" }}>
          {openCount} Awaiting Admin Decision
        </span>
      </div>
      <div className="feature-metrics-grid">
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #ff4757" }}>
          <span>Open Escalations</span>
          <strong>{openCount} disputes</strong>
          <small>Needs administrative mediation</small>
        </div>
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #2ed573" }}>
          <span>Settled Incidents</span>
          <strong>{resolvedCount} resolved</strong>
          <small>Binding resolution closed</small>
        </div>
        <div className="feature-metric-card" style={{ borderLeft: "3px solid #4ecdc4" }}>
          <span>Resolution Ratio</span>
          <strong>{disputes.length ? Math.round((resolvedCount / disputes.length) * 100) : 100}%</strong>
          <small>Queue turnaround health</small>
        </div>
      </div>
    </div>
  );
}

export function AdminDisputes() {
  const r = useData("/admin/disputes"),
    [evidence, setEvidence] = useState(null);
  return (
    <>
      <Heading
        title="Resolve with the whole story."
        description="Read the agreement and conversation before making a decision."
      />
      <State resource={r}>
        {(data) =>
          data.length ? (
            <>
              <DisputeQueueVisualizer disputes={data} />
              <div className="card-grid">
                {data.map((d) => (
                <article className="panel" key={d._id}>
                  <Badge>{d.status}</Badge>
                  <h3>{d.openedBy?.name}</h3>
                  <p>{d.reason}</p>
                  <Action
                    className="quiet"
                    run={async () =>
                      setEvidence(await api(`/admin/disputes/${d._id}`))
                    }
                  >
                    Review evidence
                  </Action>
                  {d.status === "open" ? (
                    <ActionForm
                      label="Resolve dispute"
                      onSubmit={async (form) => {
                        await api(`/admin/disputes/${d._id}/resolve`, {
                          method: "POST",
                          body: Object.fromEntries(form),
                        });
                        await r.reload();
                      }}
                    >
                      <Field
                        label="Resolution and next steps"
                        as="textarea"
                        name="resolution"
                        minLength={10}
                        required
                      />
                    </ActionForm>
                  ) : (
                    <p>Resolution: {d.resolution}</p>
                  )}
                </article>
              ))}
            </div>
            </>
          ) : (
            <Empty title="No disputes in the queue." />
          )
        }
      </State>
      {evidence && (
        <section className="panel evidence">
          <h2>{evidence.booking.listing?.title}</h2>
          <p>
            {evidence.booking.provider?.name} ↔ {evidence.booking.seeker?.name}
          </p>
          <p>
            {date(evidence.booking.start)} → {date(evidence.booking.end)}
          </p>
          <h3>Offer history</h3>
          {evidence.quote.offers.map((o) => (
            <p key={o._id}>
              {o.by?.name}: {money(o.price)} · {o.conditions} · {date(o.at)}
            </p>
          ))}
          <h3>Messages</h3>
          <LocalAi key={evidence.dispute._id} text={conversationText(evidence.messages)} />
          {evidence.messages.map((m) => (
            <p key={m._id}>
              <strong>{m.sender?.name}</strong>: {m.text}{" "}
              <small>{date(m.createdAt)}</small>
            </p>
          ))}
        </section>
      )}
    </>
  );
}
export function ModerationPage() {
  const r = useData("/admin/reports");
  return (
    <>
      <Heading
        title="Keep the network useful."
        description="Investigate reported listings and record moderation decisions."
      />
      <State resource={r}>
        {(data) =>
          data.length ? (
            <div className="card-grid">
              {data.map((v) => (
                <article className="panel" key={v._id}>
                  <Badge>{v.status}</Badge>
                  <h3>{v.listing?.title}</h3>
                  <p>{v.reason}</p>
                  <small>Reported by {v.reporter?.name}</small>
                  {v.status === "open" ? (
                    <ActionForm
                      label="Apply decision"
                      onSubmit={async (form) => {
                        await api(`/admin/reports/${v._id}/resolve`, {
                          method: "POST",
                          body: {
                            resolution: form.get("resolution"),
                            pause: form.get("pause") === "on",
                          },
                        });
                        await r.reload();
                      }}
                    >
                      <Field
                        label="Decision notes"
                        name="resolution"
                        minLength={5}
                        as="textarea"
                        required
                      />
                      <label className="check">
                        <input type="checkbox" name="pause" /> Pause the listing
                      </label>
                    </ActionForm>
                  ) : (
                    <p>{v.resolution}</p>
                  )}
                  {v.status !== "open" && v.listing?.moderationHold && (
                    <ActionForm
                      label="Release publication hold"
                      onSubmit={async (form) => {
                        await api(`/admin/listings/${v.listing._id}/release`, {
                          method: "POST",
                          body: { reason: form.get("reason") },
                        });
                        await r.reload();
                        return "Hold released. The provider can publish the paused listing when ready.";
                      }}
                    >
                      <p>
                        The listing remains paused after release so the provider
                        can review it before publication.
                      </p>
                      <Field
                        label="Reason for releasing hold"
                        name="reason"
                        as="textarea"
                        required
                        minLength={5}
                        maxLength={3000}
                      />
                    </ActionForm>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty title="No reports to investigate." />
          )
        }
      </State>
    </>
  );
}
export function CategoriesPage() {
  const r = useData("/categories"),
    [editing, setEditing] = useState(null),
    [specifications, setSpecifications] = useState([]);
  return (
    <>
      <Heading
        title="A category for every possibility."
        description="Manage resource taxonomy and the fields providers must supply."
      />
      <div className="split-layout">
        <section className="panel" key={editing?._id || "new"}>
          <h2>{editing ? "Edit category" : "Create a category"}</h2>
          <ActionForm
            label="Save category"
            onSubmit={async (form) => {
              const data = Object.fromEntries(form);
              await api(
                editing
                  ? `/admin/categories/${editing._id}`
                  : "/admin/categories",
                {
                  method: editing ? "PUT" : "POST",
                  body: { ...data, requiredFields: specifications },
                },
              );
              setEditing(null);
              setSpecifications([]);
              await r.reload();
            }}
          >
            <Field
              label="Name"
              name="name"
              defaultValue={editing?.name}
              required
            />
            <Field
              label="Stable slug"
              name="slug"
              defaultValue={editing?.slug}
              readOnly={!!editing}
              required
              pattern="[a-z][a-z0-9_]+"
            />
            <Field
              label="Category color"
              name="color"
              type="color"
              defaultValue={editing?.color || "#4ECDC4"}
            />
            <h3>Required resource specifications</h3>
            <p className="hint">
              Providers complete these fields when listing a resource. Keep
              existing field keys stable when editing a category.
            </p>
            {specifications.map((spec, index) => (
              <fieldset className="panel form-stack" key={index}>
                <legend>Specification {index + 1}</legend>
                <Field
                  label="Field label"
                  value={spec.label}
                  required
                  onChange={(event) =>
                    setSpecifications(
                      specifications.map((item, i) =>
                        i === index
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <Field
                  label="Stable field key"
                  value={spec.key}
                  pattern="[a-zA-Z][a-zA-Z0-9_]*"
                  required
                  placeholder="powerWatts"
                  onChange={(event) =>
                    setSpecifications(
                      specifications.map((item, i) =>
                        i === index
                          ? { ...item, key: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <Field
                  label="Answer type"
                  as="select"
                  value={spec.type}
                  onChange={(event) =>
                    setSpecifications(
                      specifications.map((item, i) =>
                        i === index
                          ? { ...item, type: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes or no</option>
                </Field>
                <button
                  type="button"
                  className="quiet"
                  onClick={() =>
                    setSpecifications(
                      specifications.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove specification
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              className="quiet"
              disabled={specifications.length >= 20}
              onClick={() =>
                setSpecifications([
                  ...specifications,
                  { key: "", label: "", type: "text" },
                ])
              }
            >
              + Add specification
            </button>
          </ActionForm>
          {editing && (
            <button
              className="quiet"
              onClick={() => {
                setEditing(null);
                setSpecifications([]);
              }}
            >
              Cancel editing
            </button>
          )}
        </section>
        <State resource={r}>
          {(data) => (
            <div className="stack">
              {data.map((c, i) => (
                <article
                  className="panel"
                  key={c._id}
                  style={{ background: c.color || colors[i % colors.length] }}
                >
                  <h2>{c.name}</h2>
                  <p>
                    {c.slug} · {c.requiredFields.length} required specifications
                  </p>
                  <button
                    className="quiet"
                    onClick={() => {
                      setEditing(c);
                      setSpecifications(
                        c.requiredFields.map(({ key, label, type }) => ({
                          key,
                          label,
                          type,
                        })),
                      );
                    }}
                  >
                    Edit category
                  </button>
                </article>
              ))}
            </div>
          )}
        </State>
      </div>
    </>
  );
}
export function SettingsPage() {
  const r = useData("/admin/settings"),
    integrations = useData("/admin/integrations"),
    audit = useData("/admin/audit");
  return (
    <>
      <Heading
        title="Set the ground rules."
        description="Platform policies, configured integrations and administrative audit history."
      />
      <div className="split-layout">
        <section className="panel">
          <h2>Booking policy</h2>
          <State resource={r}>
            {(s) => (
              <ActionForm
                label="Save platform policy"
                onSubmit={async (form) => {
                  await api("/admin/settings", {
                    method: "PUT",
                    body: Object.fromEntries(form),
                  });
                  await r.reload();
                  await audit.reload();
                }}
              >
                <Field
                  label="Commission rate (%)"
                  name="commissionPercent"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  defaultValue={s?.commissionPercent ?? 5}
                  required
                />
                <Field
                  label="Minimum booking value (INR)"
                  name="minBookingValue"
                  type="number"
                  min="0"
                  defaultValue={s?.minBookingValue ?? 0}
                  required
                />
                <p>
                  Commission is recorded on new bookings. Payments and
                  settlements are handled directly between businesses.
                </p>
              </ActionForm>
            )}
          </State>
        </section>
        <section className="panel" style={{ background: "#89CFF0" }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">SERVICES & APIS</span>
              <h2 style={{ marginTop: 4 }}>Integration Status</h2>
            </div>
          </div>
          <State resource={integrations}>
            {(data) => (
              <div className="integration-status-grid">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className={`integration-chip ${value ? "is-active" : "is-inactive"}`}>
                    <span className="integration-dot" />
                    <strong>{key.toUpperCase()}</strong>
                    <small>{value ? "Active" : "Unset"}</small>
                  </div>
                ))}
              </div>
            )}
          </State>
        </section>
      </div>
      <section className="panel">
        <h2>Admin audit trail</h2>
        <State resource={audit}>
          {(data) =>
            data.length ? (
              <div className="audit-list">
                {data.map((a) => (
                  <article key={a._id}>
                    <Badge>{a.action}</Badge>
                    <strong>{a.actor?.name}</strong>
                    <p>{a.detail}</p>
                    <small>{date(a.createdAt)}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p>No administrative changes recorded yet.</p>
            )
          }
        </State>
      </section>
    </>
  );
}
