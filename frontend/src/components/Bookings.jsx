"use client";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
export function BookingsPage() {
  const resource = useData("/bookings"),
    { user, dashboardRole } = useAuth();
  return (
    <>
      <Heading
        title="From agreed to delivered."
        description="Track fulfilment, coordinate logistics and keep a clear record."
      />
      <State resource={resource}>
        {(data) => {
          const filtered = data.filter(
            (b) =>
              b[dashboardRole === "provider" ? "provider" : "seeker"]?._id ===
              user._id,
          );
          return filtered.length ? (
            <div className="stack">
              {filtered.map((b) => (
                <article className="panel" key={b._id}>
                  <div className="section-heading">
                    <h2>{b.listing?.title}</h2>
                    <Badge>{b.status}</Badge>
                  </div>
                  <p>
                    {b.provider?.name} ↔ {b.seeker?.name}
                  </p>
                  <Flow
                    steps={[
                      "Confirmed",
                      "In progress",
                      "Completed",
                      "Reviewed",
                    ]}
                    active={
                      b.status === "completed"
                        ? 2
                        : b.status === "in_progress"
                          ? 1
                          : 0
                    }
                  />
                  <div className="booking-facts">
                    <div>
                      <small>WHEN</small>
                      <strong>{date(b.start)}</strong>
                      <span>to {date(b.end)}</span>
                    </div>
                    <div>
                      <small>AGREED RENTAL</small>
                      <strong>{money(b.price)}</strong>
                      <span>
                        {b.quantity} units · deposit {money(b.deposit)}
                      </span>
                    </div>
                    <div>
                      <small>HANDOVER</small>
                      <strong>{b.logistics}</strong>
                      <span>Payment arranged directly</span>
                    </div>
                  </div>
                  <p>{b.conditions}</p>
                  <div className="actions">
                    <a
                      className="button quiet"
                      href={`/api/bookings/${b._id}/calendar`}
                    >
                      Download calendar (.ics)
                    </a>
                    <button className="quiet" onClick={() => window.print()}>
                      Print booking record
                    </button>
                    {b.provider._id === user._id &&
                      ["confirmed", "in_progress"].includes(b.status) && (
                        <Action
                          run={async () => {
                            await api(`/bookings/${b._id}/status`, {
                              method: "PATCH",
                              body: {
                                status:
                                  b.status === "confirmed"
                                    ? "in_progress"
                                    : "completed",
                              },
                            });
                            await resource.reload();
                          }}
                        >
                          {b.status === "confirmed"
                            ? "Start fulfilment"
                            : "Mark completed"}
                        </Action>
                      )}
                  </div>
                  {b.status === "confirmed" && (
                    <details>
                      <summary>Cancel booking</summary>
                      <p>
                        Cancellation is available at least {b.cancellationHours}{" "}
                        hours before the start.
                      </p>
                      <ActionForm
                        label="Cancel this booking"
                        onSubmit={async (form) => {
                          await api(`/bookings/${b._id}/status`, {
                            method: "PATCH",
                            body: {
                              status: "cancelled",
                              reason: form.get("reason"),
                            },
                          });
                          await resource.reload();
                        }}
                      >
                        <Field
                          label="Cancellation reason"
                          name="reason"
                          required
                        />
                      </ActionForm>
                    </details>
                  )}
                  {b.status === "completed" && (
                    <details>
                      <summary>Leave a review</summary>
                      <ActionForm
                        label="Publish review"
                        onSubmit={async (form) => {
                          await api(`/bookings/${b._id}/review`, {
                            method: "POST",
                            body: Object.fromEntries(form),
                          });
                          return "Your review is published.";
                        }}
                      >
                        <Field label="Rating" as="select" name="score">
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} / 5
                            </option>
                          ))}
                        </Field>
                        <Field
                          label="Your experience"
                          as="textarea"
                          name="comment"
                          minLength={5}
                          required
                        />
                      </ActionForm>
                    </details>
                  )}
                  {b.status !== "cancelled" && (
                    <details>
                      <summary>Report a booking issue</summary>
                      <ActionForm
                        label="Open dispute"
                        onSubmit={async (form) => {
                          await api(`/bookings/${b._id}/dispute`, {
                            method: "POST",
                            body: Object.fromEntries(form),
                          });
                          return "Dispute submitted. Follow its status under Disputes.";
                        }}
                      >
                        <Field
                          label="What happened?"
                          name="reason"
                          as="textarea"
                          minLength={10}
                          required
                        />
                      </ActionForm>
                    </details>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Your next booking belongs here."
              text="Accept an offer to reserve inventory and start the booking journey."
              href="/dashboard/negotiations"
              label="View offers"
            />
          );
        }}
      </State>
    </>
  );
}
export function ReviewsPage() {
  const resource = useData("/reviews"),
    { user } = useAuth();
  return (
    <>
      <Heading
        title="Trust, earned together."
        description="Reviews come from completed bookings, in both directions."
      />
      <State resource={resource}>
        {(data) =>
          data.length ? (
            <div className="card-grid">
              {data.map((r) => (
                <article className="panel" key={r._id}>
                  <Badge>
                    {r.from?._id === user._id ? "Given" : "Received"}
                  </Badge>
                  <h2 className="stars">
                    {"★".repeat(r.score)}
                    {"☆".repeat(5 - r.score)}
                  </h2>
                  <p>{r.comment}</p>
                  <small>
                    {r.from?.name} → {r.to?.name} · {date(r.createdAt)}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="A reputation starts with a booking."
              text="After fulfilment, both businesses can leave one review from the booking page."
            />
          )
        }
      </State>
    </>
  );
}
export function DisputesPage() {
  const resource = useData("/disputes");
  return (
    <>
      <Heading
        title="Let’s work it out."
        description="Booking issues and their resolution history."
      />
      <State resource={resource}>
        {(data) =>
          data.length ? (
            <div className="stack">
              {data.map((d) => (
                <article className="panel" key={d._id}>
                  <Badge>{d.status}</Badge>
                  <h3>Booking {d.booking?._id?.slice(-8)}</h3>
                  <p>{d.reason}</p>
                  {d.resolution && (
                    <div className="notice">
                      <strong>Resolution</strong>
                      <p>{d.resolution}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="No disputes to track."
              text="If an issue arises, open a dispute from the relevant booking."
            />
          )
        }
      </State>
    </>
  );
}
