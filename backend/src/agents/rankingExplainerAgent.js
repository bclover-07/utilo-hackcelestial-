import { invoke } from "./shared.js";
import { adviceSchema, adviceInstruction, optionalAdvice } from "../services/agentContracts.js";

export async function explainRankings(matches, missing) {
  const evidence = matches.map((m) => ({
    item: m.item,
    results: m.items.slice(0, 3).map((l) => ({
      id: l._id,
      title: l.title,
      score: l.score,
      reasons: l.reasons,
      estimatedTotal: l.estimatedTotal,
    })),
  }));
  const output = await optionalAdvice(() => invoke(
    "Explain this shortlist using only the supplied evidence. Scores are already computed: never change them. Identify missing supply, above-budget items and missing user information. Do not promise availability beyond the checked dates, or claim a reservation." + adviceInstruction,
    { evidence, missing },
    adviceSchema, "Explain ranked evidence",
  ));
  return {
    ...output,
    answer: output.decision?.summary || output.generation.message,
    trace: [output.decision ? "Ranking explainer: explained deterministic scores" : "Ranking explanation unavailable; computed matches retained"],
  };
}
