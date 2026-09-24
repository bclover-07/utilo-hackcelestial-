"use client";
import { useState } from "react";
import {
  Search,
  Sparkles,
  MessagesSquare,
  CalendarCheck,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
const stages = [
  {
    icon: Search,
    title: "Describe",
    color: "var(--yellow)",
    text: "Start with your event, dates and location. Your brief becomes a structured resource request.",
    label: "Your brief → clear requirements",
  },
  {
    icon: Sparkles,
    title: "Match",
    color: "var(--lavender)",
    text: "Check quantity, capacity, distance and dates. Review matching resources and any supply gaps before moving on.",
    label: "Available resources → explained shortlist",
  },
  {
    icon: MessagesSquare,
    title: "Negotiate",
    color: "var(--pink)",
    text: "Talk directly with the provider. Compare price, delivery, deposits and terms in a versioned quote.",
    label: "A conversation → agreed terms",
  },
  {
    icon: CalendarCheck,
    title: "Reserve",
    color: "var(--teal)",
    text: "Accept the current offer. The server checks available quantity again before confirming the reservation.",
    label: "An accepted quote → checked reservation",
  },
  {
    icon: PackageCheck,
    title: "Fulfil",
    color: "var(--peach)",
    text: "Coordinate the handover, track fulfilment and leave a review after completion.",
    label: "Shared resources → a great event",
  },
];
export default function ExchangeWorkflow({ compact = false }) {
  const [active, setActive] = useState(0);
  const selected = stages[active];
  return (
    <section
      className={`exchange-workflow ${compact ? "compact" : ""}`}
      aria-label="Explore the exchange workflow"
    >
      <div className="workflow-nodes">
        {stages.map((step, i) => {
          const Icon = step.icon;
          return (
            <div className="workflow-node-wrap" key={step.title}>
              <button
                type="button"
                className={`workflow-node ${active === i ? "is-active" : ""}`}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
                style={{ "--node-color": step.color }}
              >
                <span className="workflow-node-icon">
                  <Icon size={compact ? 20 : 25} />
                </span>
                <small>0{i + 1}</small>
                <strong>{step.title}</strong>
              </button>
              {i < stages.length - 1 && (
                <ArrowRight
                  className="workflow-arrow"
                  size={20}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        className="workflow-explanation"
        aria-live="polite"
        style={{ "--node-color": selected.color }}
        key={active}
      >
        <span className="workflow-pulse" />
        <div>
          <strong>{selected.label}</strong>
          <p>{selected.text}</p>
        </div>
      </div>
    </section>
  );
}
