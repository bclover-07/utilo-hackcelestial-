import { Schema, model, ref } from "./helpers.js";

export const EventPlan = model("EventPlan", {
  owner: ref("BusinessProfile"),
  version: { type: Number, default: 1 },
  input: Schema.Types.Mixed,
  result: Schema.Types.Mixed,
  previous: Schema.Types.Mixed,
  request: { type: Schema.Types.ObjectId, ref: "Request" },
}, [[{ owner: 1, updatedAt: -1 }]]);
