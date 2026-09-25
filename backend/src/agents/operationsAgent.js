import { BusinessProfile, Dispute, Report, Listing } from "../models/index.js";
import { assert } from "../middlewares/errors.js";
import { invoke } from "./shared.js";
import { adviceSchema, adviceInstruction, optionalAdvice } from "../services/agentContracts.js";

export async function operationsBrief(user) {
  assert(user.role === "admin", 403, "Administrator access required.");
  const [pendingVerifications, openDisputes, openReports, heldListings] = await Promise.all([
    BusinessProfile.countDocuments({ role: "business", verification: "pending" }),
    Dispute.countDocuments({ status: "open" }),
    Report.countDocuments({ status: "open" }),
    Listing.countDocuments({ moderationHold: true }),
  ]);
  const evidence = { pendingVerifications, openDisputes, openReports, heldListings, checkedAt: new Date().toISOString() };
  const output = await optionalAdvice(() => invoke(
    "Help a marketplace administrator prioritize these work queues. Counts show workload only, not guilt, fraud or severity. Suggest which queue to inspect and what evidence to review. Do not approve KYC, adjudicate disputes, release listings, or invent individual cases." + adviceInstruction,
    evidence, adviceSchema, "Summarize operations queues",
  ));
  return { ...output, evidence, trace: ["Aggregate operational queues without private documents", "Generate review suggestions", "Administrator retains every decision"] };
}
