import { Schema, model, ref } from "./helpers.js";

export const Insight = model("Insight", {
  owner: ref("BusinessProfile"),
  text: String,
  metrics: Schema.Types.Mixed,
  generatedAt: Date,
});
