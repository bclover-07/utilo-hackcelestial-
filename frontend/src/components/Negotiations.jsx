"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";
import AgentAction from "./AgentAction";
import AgentDecision from "./AgentDecision";
import LocalAi, { conversationText } from "./LocalAi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  money,
  date,
} from "./ui";

function ZopaDistributionChart({ zopa }) {
  if (!zopa) return null;
  const data = [
    { name: "Seeker Target", amount: zopa.min, color: "#4ECDC4" },
    { name: "Current Offer", amount: zopa.current, color: "#FFE66D" },
    { name: "Provider Ask", amount: zopa.max, color: "#FF6B6B" },
  ];

  return (
    <div style={{ width: "100%", height: 140, marginTop: "10px" }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E0CF" />
          <XAxis type="number" stroke="#171915" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
          <YAxis dataKey="name" type="category" stroke="#171915" width={95} tick={{ fontSize: 10, fontWeight: 700 }} />
          <Tooltip
            formatter={(val) => [money(val), "Rate"]}
            contentStyle={{ background: "#fffef8", border: "1px solid #171915", borderRadius: 8, fontWeight: 700 }}
          />
          <Bar dataKey="amount" stroke="#171915" strokeWidth={1} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OfferConvergenceChart({ offers }) {
  if (!offers || offers.length < 2) return null;
  const data = offers.map((o, i) => ({
    round: `R${i + 1}`,
    price: o.price,
    by: o.by?.name || "Participant",
    conditions: o.conditions,
  }));
  return (
    <div style={{ margin: "1rem 0 1.25rem", padding: "1rem", background: "#FAF8F5", borderRadius: "16px", border: "1px solid #20201e", boxShadow: "3px 3px 0 #20201e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
        <div>
          <span className="eyebrow" style={{ color: "#7B61A8" }}>PRICE CONVERGENCE</span>
          <h4 style={{ margin: "2px 0 0", fontSize: "1rem" }}>Offer Trajectory ({offers.length} Rounds)</h4>
        </div>
        <span className="badge" style={{ background: "#A8E6CF", border: "1px solid #20201e" }}>
          {money(offers[0].price)} → {money(offers.at(-1).price)}
        </span>
      </div>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0CF" />
            <XAxis dataKey="round" tick={{ fontSize: 11, fontWeight: 700, fill: "#20201e" }} />
            <YAxis tick={{ fontSize: 10, fill: "#555" }} tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} domain={["dataMin - 100", "dataMax + 100"]} />
            <Tooltip
              formatter={(val) => [money(val), "Offer Price"]}
              labelFormatter={(label) => label}
              contentStyle={{ background: "#fffef8", border: "1px solid #20201e", borderRadius: 10, fontWeight: 700 }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#20201e"
              strokeWidth={2}
              dot={{ r: 4, fill: "#FFE66D", stroke: "#20201e", strokeWidth: 1 }}
              activeDot={{ r: 6, fill: "#4ECDC4" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
export function NegotiationsPage() {
  const searchParams = useSearchParams();
  const paramSelected = searchParams ? searchParams.get("selected") : null;
  const resource = useData("/quotes"),
    [selectedId, setSelectedId] = useState("");
  const { user, dashboardRole } = useAuth();
  const selected = selectedId || paramSelected || "";

  return (
    <>
      <Heading
        title="Find your middle ground."
        description="Every offer has a version. Every agreement has a record."
      />
      <State resource={resource}>
        {(data) => {
          const filtered = data.filter((q) => {
            if (paramSelected && q._id === paramSelected) return true;
            return (
              q[dashboardRole === "provider" ? "provider" : "seeker"]?._id ===
              user._id
            );
          });
          const current =
            filtered.find((q) => q._id === selected) || filtered[0];
          return filtered.length ? (
            <div className="inbox">
              <aside className="thread-list">
                {filtered.map((q) => (
                  <button
                    key={q._id}
                    className={`thread-tab ${q._id === current?._id ? "selected" : ""}`}
                    onClick={() => setSelectedId(q._id)}
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
    [advice, setAdvice] = useState(null),
    [selectedOfferPrice, setSelectedOfferPrice] = useState(null),
    [selectedOfferConditions, setSelectedOfferConditions] = useState(null),
    [socketMessages, setSocketMessages] = useState([]),
    [socketActive, setSocketActive] = useState(false);
  const last = q.offers.at(-1),
    mine = last?.by?._id === user._id;
  const open = ["invited", "offered"].includes(q.status),
    canOffer = open && (last ? !mine : q.provider._id === user._id);
  const reloadMessages = messages.reload;

  // Combine initial loaded messages with incoming real-time socket messages
  const realtimeMessages = [
    ...(messages.data || []),
    ...socketMessages.filter(
      (sm) => !(messages.data || []).some((m) => String(m._id) === String(sm._id))
    ),
  ];

  // Socket.io real-time room joining and messaging
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleConnect() {
      setSocketActive(true);
      socket.emit("join_quote", q._id);
    }

    function handleDisconnect() {
      setSocketActive(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    const timer = setTimeout(() => {
      if (socket.connected) {
        setSocketActive(true);
        socket.emit("join_quote", q._id);
      } else {
        socket.connect();
      }
    }, 0);

    function handleNewMessage(msg) {
      if (String(msg.quote) === String(q._id)) {
        setSocketMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
      }
    }

    socket.on("new_message", handleNewMessage);

    return () => {
      clearTimeout(timer);
      socket.emit("leave_quote", q._id);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
    };
  }, [q._id]);

  useEffect(() => {
    const interval = setInterval(reloadMessages, 30000);
    return () => clearInterval(interval);
  }, [reloadMessages]);
  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <h2>{q.listing?.title}</h2>
          <Badge>{q.status}</Badge>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "10px 0 16px" }}>
          <span className="badge" style={{ background: "#89CFF040", border: "1px solid #20201e" }}>
            👤 Provider: <strong>{q.provider?.name}</strong>
          </span>
          <span className="badge" style={{ background: "#FFE66D40", border: "1px solid #20201e" }}>
            🤝 Seeker: <strong>{q.seeker?.name}</strong>
          </span>
          <span className="badge" style={{ background: "#C3B1E140", border: "1px solid #20201e" }}>
            📅 {date(q.request?.start)} → {date(q.request?.end)}
          </span>
          <span className="badge" style={{ background: "#A8E6CF40", border: "1px solid #20201e" }}>
            📦 {q.request?.items[q.itemIndex]?.quantity || 1} units requested
          </span>
        </div>

        <OfferConvergenceChart offers={q.offers} />

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
              setSelectedOfferPrice(null);
              setSelectedOfferConditions(null);
              await reload();
            }}
          >
            <div className="form-grid">
              <Field
                key={`price-${selectedOfferPrice || "empty"}`}
                label="Total agreed rental (INR)"
                name="price"
                type="number"
                min="1"
                step="0.01"
                defaultValue={selectedOfferPrice ?? ""}
                required
              />
              <Field
                key={`cond-${selectedOfferConditions || "empty"}`}
                label="Conditions & logistics"
                name="conditions"
                as="textarea"
                defaultValue={selectedOfferConditions ?? ""}
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
        {advice && (
          <div style={{ marginTop: "1rem" }}>
            {advice.zopa && (
              <div style={{ background: "#fff", padding: "1.2rem", borderRadius: "16px", border: "1px solid #171915", marginBottom: "1rem", boxShadow: "3px 3px 0 #171915" }}>
                <span className="eyebrow" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>BILATERAL BARGAINING ZONE (ZOPA)</span>
                <div style={{ display: "flex", justifyContent: "space-between", margin: "0.5rem 0", fontSize: "0.9rem" }}>
                  <span>Seeker Target: <strong>{money(advice.zopa.min)}</strong></span>
                  <span>Agreement Alignment: <strong>{advice.zopa.convergence}%</strong></span>
                  <span>Provider Asking: <strong>{money(advice.zopa.max)}</strong></span>
                </div>
                <div style={{ width: "100%", height: "12px", background: "#e0e0e0", borderRadius: "6px", overflow: "hidden", border: "1px solid #171915" }}>
                  <div style={{ width: `${advice.zopa.convergence}%`, height: "100%", background: advice.zopa.convergence > 70 ? "#4caf50" : "#2196f3", borderRadius: "5px" }} />
                </div>
                <ZopaDistributionChart zopa={advice.zopa} />
                <small style={{ color: "#666", display: "block", marginTop: "0.6rem" }}>
                  {advice.zopa.status} · Current offer is {money(advice.zopa.current)}
                </small>
              </div>
            )}

            {advice.protection?.flags && (
              <div style={{ background: "#fff", padding: "1.2rem", borderRadius: "16px", border: "1px solid #171915", marginBottom: "1rem", boxShadow: "3px 3px 0 #171915" }}>
                <span className="eyebrow" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>CONTRACT & DISPUTE PROTECTION</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {advice.protection.flags.map((flag, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <span>{flag.status === "pass" ? "🛡️" : "⚠️"}</span>
                      <div>
                        <strong>{flag.label}: </strong>
                        <span style={{ color: "#444" }}>{flag.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {advice.counterOffers?.length > 0 && (
              <div style={{ background: "#fff", padding: "1.2rem", borderRadius: "16px", border: "1px solid #171915", marginBottom: "1rem", boxShadow: "3px 3px 0 #171915" }}>
                <span className="eyebrow" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>AUTONOMOUS COUNTER-OFFER BLUEPRINTS</span>
                <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.25rem 0 0.75rem 0" }}>Click any strategy to pre-populate the counter-offer form above:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {advice.counterOffers.map((co, idx) => (
                    <div key={idx} style={{ border: "1px solid #171915", borderRadius: "12px", padding: "0.75rem", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", boxShadow: "2px 2px 0 #171915" }}>
                      <div style={{ maxWidth: "70%" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{co.label}</strong>
                        <p style={{ margin: "0.2rem 0 0.2rem 0", fontSize: "0.85rem", color: "#444" }}>{co.rationale}</p>
                        <small style={{ color: "#777" }}>Proposed: <strong>{money(co.price)}</strong> {co.deliveryFee ? `+ ${money(co.deliveryFee)} delivery` : "(Zero delivery fee)"}</small>
                      </div>
                      <button
                        type="button"
                        className="button"
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", cursor: "pointer" }}
                        onClick={() => {
                          setSelectedOfferPrice(co.price);
                          setSelectedOfferConditions(co.rationale);
                        }}
                      >
                        Apply proposal →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <AgentDecision decision={advice.decision} />
          </div>
        )}
      </section>
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h3 style={{ margin: 0 }}>Conversation</h3>
          {socketActive ? (
            <span
              className="badge"
              style={{
                background: "#A8E6CF",
                border: "1px solid #20201e",
                fontSize: "0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 700,
                padding: "3px 8px",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#059669",
                  display: "inline-block",
                  boxShadow: "0 0 4px #059669",
                }}
              />
              Socket.io Live
            </span>
          ) : (
            <span
              className="badge"
              style={{
                background: "#FFE66D40",
                border: "1px solid #20201e",
                fontSize: "0.75rem",
                padding: "3px 8px",
              }}
            >
              Connecting...
            </span>
          )}
        </div>
        <LocalAi text={conversationText(realtimeMessages)} />
        <AgentAction
          endpoint="/ai/sentiment"
          body={{ quoteId: q._id }}
          label="Analyze conversation tone ✳"
        />
        {realtimeMessages.length ? (
          <div className="messages" aria-live="polite">
            {realtimeMessages.map((m) => (
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
        ) : messages.loading ? (
          <p>Loading messages...</p>
        ) : (
          <p>Start the conversation with your booking partner.</p>
        )}
        <ActionForm
          label="Send message"
          onSubmit={async (form) => {
            const result = await api(`/quotes/${q._id}/messages`, {
              method: "POST",
              body: Object.fromEntries(form),
            });
            if (result && result._id) {
              setRealtimeMessages((prev) => {
                if (prev.some((m) => String(m._id) === String(result._id))) return prev;
                return [...prev, result];
              });
            }
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
