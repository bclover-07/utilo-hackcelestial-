"use client";
import { useState } from "react";
import Link from "next/link";
import VoiceSummary from "./VoiceSummary";
import { api } from "@/lib/api";
import { Heading, Field, ActionForm, Flow, Badge, money } from "./ui";
export function PlannerPage() {
  const [result, setResult] = useState(null),
    [answer, setAnswer] = useState(null);
  return (
    <>
      <Heading
        eyebrow="UTLIO LAB · REAL DATA, CLEAR REASONING"
        title="Give your event a head start."
        description="Describe the whole setup. See a resource-by-resource plan and the gaps that still need attention."
      />
      <Flow
        steps={["Describe", "Decompose", "Retrieve", "Rank", "Review"]}
        active={result ? 4 : 0}
      />
      <div className="split-layout">
        <section className="panel" style={{ background: "#C3B1E1" }}>
          <h2>Event readiness planner</h2>
          <ActionForm
            label="Build my shortlist ✳"
            onSubmit={async (form) => {
              setResult(null);
              const data = Object.fromEntries(form);
              const filters = {
                city: data.city,
                coordinates: [Number(data.longitude), Number(data.latitude)],
                radiusKm: Number(data.radiusKm),
                start: new Date(data.start).toISOString(),
                end: new Date(data.end).toISOString(),
              };
              setResult(
                await api("/ai/workflow", {
                  method: "POST",
                  body: { kind: "bundle", text: data.text, filters },
                }),
              );
              return "Plan ready for review. No request or booking has been created.";
            }}
          >
            <Field
              label="What does your event need?"
              name="text"
              as="textarea"
              rows={5}
              required
              minLength={5}
            />
            <div className="form-grid">
              <Field label="City" name="city" required />
              <Field
                label="Radius (km)"
                name="radiusKm"
                type="number"
                min="1"
                max="300"
                defaultValue="25"
                required
              />
              <Field
                label="Start"
                name="start"
                type="datetime-local"
                required
              />
              <Field label="End" name="end" type="datetime-local" required />
              <Field
                label="Latitude"
                name="latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                required
              />
              <Field
                label="Longitude"
                name="longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                required
              />
            </div>
          </ActionForm>
        </section>
        <section className="panel" style={{ background: "#FFE66D" }}>
          <Badge>RESOURCE KNOWLEDGE SEARCH</Badge>
          <h2>Find meaning, not just keywords.</h2>
          <p>
            Search indexed listing descriptions with Hugging Face vectors.
            Gemini answers using the retrieved resources.
          </p>
          <ActionForm
            label="Ask the resource library"
            onSubmit={async (form) => {
              setAnswer(null);
              setAnswer(
                await api("/ai/knowledge", {
                  method: "POST",
                  body: Object.fromEntries(form),
                }),
              );
              return "Answer grounded in the sources below.";
            }}
          >
            <Field
              label="Your question"
              name="text"
              as="textarea"
              rows={4}
              minLength={3}
              required
            />
          </ActionForm>
          {answer && (
            <>
              <p className="ai-answer">{answer.answer}</p>
              <VoiceSummary text={answer.answer} />
              <h3>Retrieved sources</h3>
              {answer.sources.map((s) => (
                <p key={s.id}>
                  <Link href={`/dashboard/resources/${s.id}`}>{s.title}</Link> ·{" "}
                  {s.city}
                </p>
              ))}
              <details>
                <summary>How this answer was made</summary>
                {answer.trace.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </details>
            </>
          )}
        </section>
      </div>
      {result && (
        <section className="panel">
          <Heading
            title={result.draft.title}
            description="A proposed plan, ready for your judgment."
          />
          <div className="readiness-grid">
            {result.matches.map((m, i) => (
              <article className={m.total ? "ready" : "missing"} key={i}>
                <Badge>{m.total ? "Supply found" : "Supply gap"}</Badge>
                <h3>
                  {m.item.quantity} × {m.item.category.replaceAll("_", " ")}
                </h3>
                <p>{m.total} matching resources for these dates</p>
                {m.items.slice(0, 3).map((l) => (
                  <div key={l._id}>
                    <Link href={`/dashboard/resources/${l._id}`}>
                      {l.title}
                    </Link>
                    <p>
                      {money(l.estimatedTotal)} · score {l.score}/100
                    </p>
                  </div>
                ))}
              </article>
            ))}
          </div>
          <p className="ai-answer">{result.answer}</p>
          <VoiceSummary text={result.answer} />
          {result.draft.missing.length > 0 && (
            <div className="notice">
              Still to confirm: {result.draft.missing.join("; ")}
            </div>
          )}
          <details>
            <summary>Workflow trace</summary>
            {result.trace.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </details>
          <Link className="button" href="/dashboard/requests/create">
            Create a reviewed request →
          </Link>
        </section>
      )}
    </>
  );
}
