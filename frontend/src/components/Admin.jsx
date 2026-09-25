"use client";
import LocalAi, { conversationText } from "./LocalAi";
import { useState } from "react";
import { api } from "@/lib/api";
import PrivateDocument from "./PrivateDocument";
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
            <div className="card-grid">
              {data.map((u) => (
                <article className="panel" key={u._id}>
                  <Badge>{u.verification}</Badge>
                  <h2>{u.name}</h2>
                  <p>
                    {u.category} · {u.city}
                  </p>
                  <p>
                    {u.email} · {u.phone}
                  </p>
                  <p>Registration: {u.gstin || "Not supplied"}</p>
                  {u.documentId ? (
                    <PrivateDocument id={u.documentId} />
                  ) : (
                    <p>No document submitted.</p>
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
          ) : (
            <Empty title="No businesses to review yet." />
          )
        }
      </State>
    </>
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
          <h2>Integration configuration</h2>
          <State resource={integrations}>
            {(data) => (
              <dl className="spec-list">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value ? "Configured" : "Not configured"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </State>
          <p>
            Configured means a server-side setting is present. It does not
            guarantee that credentials or quotas are valid.
          </p>
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
