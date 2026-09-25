import { Schema, model, ref } from "./helpers.js";

// Metadata only: never persist prompts, answers, names, emails or conversation text here.
export const AgentRun = model("AgentRun", {
  owner: ref("BusinessProfile"),
  agent: { type: String, required: true },
  status: { type: String, enum: ["complete", "partial", "failed"], required: true },
  elapsedMs: Number,
  steps: [new Schema({ name: String, status: String, elapsedMs: Number, model: String, inputTokens: Number, outputTokens: Number }, { _id: false })],
  errorCode: Number,
  expiresAt: { type: Date, required: true },
}, [[{ owner: 1, createdAt: -1 }], [{ createdAt: -1 }], [{ expiresAt: 1 }, { expireAfterSeconds: 0 }]]);
