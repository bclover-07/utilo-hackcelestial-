import { AsyncLocalStorage } from "node:async_hooks";
import { AgentRun } from "../models/AgentRun.js";

const context = new AsyncLocalStorage();
export async function measureStep(name, work, metadata = {}) {
  const start = performance.now();
  const step = { name, ...metadata, status: "complete" };
  const run = context.getStore();
  try { return await work(step); }
  catch (error) { step.status = "failed"; throw error; }
  finally {
    step.elapsedMs = Math.round(performance.now() - start);
    run?.steps.push(step);
  }
}

export async function trackAgent(user, agent, work) {
  const run = { owner: user._id, agent, steps: [], status: "complete" };
  const start = performance.now();
  return context.run(run, async () => {
    try {
      const result = await work();
      if (run.steps.some(step => step.status === "failed") || result?.generation?.status === "unavailable") run.status = "partial";
      return result;
    } catch (error) {
      run.status = "failed";
      run.errorCode = error.status || (error.name === "ZodError" ? 400 : 500);
      throw error;
    } finally {
      run.elapsedMs = Math.round(performance.now() - start);
      run.expiresAt = new Date(Date.now() + 30 * 86400000);
      // Monitoring must never turn a successful marketplace action into an error.
      try { await AgentRun.create(run); }
      catch { console.warn("Agent run metadata could not be recorded."); }
    }
  });
}

export async function agentRuns(user) {
  const since = new Date(Date.now() - 7 * 86400000);
  const filter = { createdAt: { $gte: since }, ...(user.role === "admin" ? {} : { owner: user._id }) };
  const [recent, summary] = await Promise.all([
    AgentRun.find(filter).sort({ createdAt: -1 }).limit(30).select("agent status elapsedMs steps errorCode createdAt").lean(),
    AgentRun.aggregate([{ $match: filter }, { $group: { _id: "$agent", runs: { $sum: 1 }, complete: { $sum: { $cond: [{ $eq: ["$status", "complete"] }, 1, 0] } }, partial: { $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }, averageMs: { $avg: "$elapsedMs" } } }, { $sort: { runs: -1 } }]),
  ]);
  return { recent, summary, since, scope: user.role === "admin" ? "platform" : "your account", retentionDays: 30 };
}
