"use client";
import { useEffect, useState } from "react";
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
  money,
  date,
} from "./ui";
export function NegotiationsPage() {
  const resource = useData("/quotes"),
    [selected, setSelected] = useState("");
  const { user, dashboardRole } = useAuth();
  return (
    <>
      <Heading
        title="Find your middle ground."
        description="Every offer has a version. Every agreement has a record."
      />
      <State resource={resource}>
        {(data) => {
          const filtered = data.filter(
            (q) =>
              q[dashboardRole === "provider" ? "provider" : "seeker"]?._id ===
              user._id,
          );
          const current =
            filtered.find((q) => q._id === selected) || filtered[0];
          return filtered.length ? (
            <div className="inbox">
              <aside className="thread-list">
                {filtered.map((q) => (
                  <button
                    key={q._id}
                    className={`thread-tab ${q._id === current?._id ? "selected" : ""}`}
                    onClick={() => setSelected(q._id)}
                  >
                    <Badge>{q.status}</Badge>
                    <strong>{q.listing?.title}</strong>
                    <small>{q.request?.title}</small>
                    <span>
                      {q.offers.length
                        ? money(q.offers.at(-1).price)
                        : "Awaiting first offer"}
                    </span>
                  </button>
                ))}
              </aside>
              <QuoteDetail
                key={current._id}
                q={current}
                reload={resource.reload}
              />
            </div>
          ) : (
            <Empty
              title="No offers in this mode yet."
              text="Providers receive invitations when their listings match a request. Seekers can post a requirement to get started."
              href={
                dashboardRole === "provider"
                  ? "/dashboard/listings/create"
                  : "/dashboard/requests/create"
              }
            />
          );
        }}
      </State>
    </>
  );
}
function QuoteDetail({ q, reload }) {
  const { user } = useAuth();
  const messages = useData(`/quotes/${q._id}/messages`),
    [advice, setAdvice] = useState(null);
  const last = q.offers.at(-1),
    mine = last?.by?._id === user._id;
  const open = ["invited", "offered"].includes(q.status),
    canOffer = open && (last ? !mine : q.provider._id === user._id);
  const reloadMessages = messages.reload;
  useEffect(() => {
    const interval = setInterval(reloadMessages, 15000);
    return () => clearInterval(interval);
  }, [reloadMessages]);
  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <h2>{q.listing?.title}</h2>
          <Badge>{q.status}</Badge>
        </div>
        <p>
          {q.provider?.name} ↔ {q.seeker?.name}
        </p>
        <p>
          {q.request?.title} · {date(q.request?.start)} → {date(q.request?.end)}
        </p>
        <p>
          Requested: {q.request?.items[q.itemIndex]?.quantity} units ·{" "}
          {q.request?.items[q.itemIndex]?.specs ||
            "No additional specifications"}
        </p>
        <div className="offer-timeline">
          {q.offers.map((o, i) => (
            <div key={o._id}>
              <span className="round">{i + 1}</span>
              <div>
                <small>
                  {o.by?.name} · {date(o.at)}
                </small>
                <h3>{money(o.price)}</h3>
                <p>{o.conditions || "No additional conditions"}</p>
              </div>
            </div>
          ))}
        </div>
        {!q.offers.length && (
          <p>The provider can send the first quote below.</p>
        )}
        {open && (
          <div className="actions">
            {last && !mine && (
              <Action
                run={async () => {
                  await api(`/quotes/${q._id}/accept`, {
                    method: "POST",
                    body: { version: q.version },
                  });
                  await reload();
                }}
              >
                Accept & reserve inventory
              </Action>
            )}
            <Action
              className="quiet"
              run={async () => {
                await api(`/quotes/${q._id}/decline`, {
                  method: "POST",
                  body: { version: q.version },
                });
                await reload();
              }}
            >
              Decline
            </Action>
            <Action className="quiet" run={reload}>
              Refresh offers
            </Action>
          </div>
        )}
        {canOffer && (
          <ActionForm
            label={last ? "Send counter-offer" : "Send first quote"}
            onSubmit={async (form) => {
              await api(`/quotes/${q._id}/offers`, {
                method: "POST",
                body: { ...Object.fromEntries(form), version: q.version },
              });
              await reload();
            }}
          >
            <div className="form-grid">
              <Field
                label="Total agreed rental (INR)"
                name="price"
                type="number"
                min="1"
                step="0.01"
                required
              />
              <Field
                label="Conditions & logistics"
                name="conditions"
                as="textarea"
                rows={2}
              />
            </div>
          </ActionForm>
        )}
      </section>
      <section className="panel" style={{ background: "#EEE7FF" }}>
        <h3>Negotiation copilot</h3>
        <ActionForm
          label="Ask for advice ✳"
          onSubmit={async (form) => {
            setAdvice(null);
            setAdvice(
              await api(`/quotes/${q._id}/assistant`, {
                method: "POST",
                body: Object.fromEntries(form),
              }),
            );
            return "Advice ready. You choose what to offer.";
          }}
        >
          <Field
            label="Your question"
            name="question"
            placeholder="What trade-offs can I propose?"
            minLength={3}
            required
          />
        </ActionForm>
        {advice && <p className="ai-answer">{advice.answer}</p>}
      </section>
      <section className="panel">
        <h3>Conversation</h3>
        <AgentAction
          endpoint="/ai/sentiment"
          body={{ quoteId: q._id }}
          label="Analyze conversation tone ✳"
        />
        <State resource={messages}>
          {(data) =>
            data.length ? (
              <div className="messages" aria-live="polite">
                {data.map((m) => (
                  <div
                    key={m._id}
                    className={`message ${m.sender?._id === user._id ? "mine" : ""}`}
                  >
                    <small>
                      {m.sender?.name} · {date(m.createdAt)}
                    </small>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Start the conversation with your booking partner.</p>
            )
          }
        </State>
        <ActionForm
          label="Send message"
          onSubmit={async (form) => {
            await api(`/quotes/${q._id}/messages`, {
              method: "POST",
              body: Object.fromEntries(form),
            });
            await messages.reload();
            return "Message sent.";
          }}
        >
          <Field
            label="Message"
            name="text"
            as="textarea"
            rows={2}
            required
            maxLength={4000}
          />
        </ActionForm>
      </section>
    </div>
  );
}
