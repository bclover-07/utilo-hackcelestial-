import { agentCatalog } from "../services/agentCatalog.js";
import { agentRuns, trackAgent } from "../services/agentRuntime.js";
import { operationsBrief } from "../agents/operationsAgent.js";

export const agentStudioController = {
  overview: async (req, res) => res.json({
    agents: agentCatalog.filter(agent => req.user.role === "admin" || agent.role !== "admin"),
    ...(await agentRuns(req.user)),
    configuration: { generation: Boolean(process.env.GEMINI_API_KEY), embeddings: Boolean(process.env.HF_TOKEN), note: "Configuration presence only. Recent runs show observed outcomes, not a live health check." },
  }),
  operations: async (req, res) => res.json(await trackAgent(req.user, "operations", () => operationsBrief(req.user))),
};
