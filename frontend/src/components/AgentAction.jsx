"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Action } from "./ui";
export default function AgentAction({ endpoint, body, label }) {
  const [result, setResult] = useState(null);
  return (
    <div className="stack">
      <Action
        className="quiet"
        run={async () => {
          setResult(null);
          setResult(await api(endpoint, { method: "POST", body }));
        }}
      >
        {label}
      </Action>
      {result && (
        <div className="notice" aria-live="polite">
          {result.score != null && <strong>Urgency: {result.score}/100</strong>}
          <p className="ai-answer">{result.explanation || result.summary}</p>
          {result.sentiments?.map((item) => (
            <p key={item.messageId}>
              <span className={`sentiment-dot ${item.sentiment}`} />{" "}
              <strong>{item.sentiment}</strong> · {item.sender}: {item.text}
            </p>
          ))}
          {result.trace?.map((step) => (
            <small className="trace-step" key={step}>
              {step}
            </small>
          ))}
        </div>
      )}
    </div>
  );
}
