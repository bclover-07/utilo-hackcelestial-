"use client";
import { Check, Search, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
export default function PlanEvidence({ result, busy = false }) {
  const matched = result?.matches?.filter((item) => item.total > 0).length || 0;
  const count = result?.matches?.length || 0;
  const coverage = count ? Math.round((matched / count) * 100) : 0;
  return (
    <section className="panel plan-evidence" aria-label="AI workflow evidence">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FROM BRIEF TO POSSIBILITY</span>
          <h2 style={{ marginTop: 10 }}>See how your plan comes together.</h2>
        </div>
        <span className="badge">
          {busy
            ? "Processing request"
            : result
              ? "Plan returned"
              : "Ready when you are"}
        </span>
      </div>
      <div
        className={`evidence-pipeline ${busy ? "is-working" : ""}`}
        aria-busy={busy}
      >
        {[
          [Sparkles, "Understand the brief"],
          [Search, "Check available supply"],
          [Check, "Explain the matches"],
          [ShieldCheck, "Your review"],
        ].map(([Icon, title], index) => (
          <div className="evidence-step" key={title}>
            <div>
              <Icon size={22} />
              <span>0{index + 1}</span>
              <strong>{title}</strong>
            </div>
            {index < 3 && <ArrowRight size={18} />}
          </div>
        ))}
      </div>
      <p className="hint" role="status">
        {busy
          ? "The workflow is running. Results will appear when the server returns; individual stage progress is not streamed."
          : "AI structures and explains. Availability checks use marketplace records. You decide what happens next."}
      </p>
      {result && (
        <div className="evidence-results">
          <div
            className="coverage-circle"
            style={{ "--coverage": `${coverage}%` }}
          >
            <span>
              <strong>{coverage}%</strong>
              <small>requirements matched</small>
            </span>
          </div>
          <div>
            <h3>
              {matched} of {count} requirements have candidates.
            </h3>
            <p>
              {count - matched
                ? `${count - matched} supply gaps need attention before this event is ready.`
                : "Review the suggested resources and terms with each provider."}
            </p>
            <small>
              Independent matches, not a guaranteed bundle. No inventory is
              reserved.
            </small>
            {result.elapsedMs != null && (
              <span className="badge">
                Returned in {(result.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
