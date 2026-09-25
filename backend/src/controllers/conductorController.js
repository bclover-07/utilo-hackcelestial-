import * as conductor from "../services/conductorService.js";
import { id } from "../services/validation.js";
import { trackAgent } from "../services/agentRuntime.js";

export const conductorController = {
  stream: async (req, res) => {
    res.set({ "Content-Type": "application/x-ndjson", "Cache-Control": "no-store", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    const send = event => { if (!res.destroyed) res.write(`${JSON.stringify(event)}\n`); };
    try {
      const plan = await trackAgent(req.user, "conductor", () => conductor.createPlan(req.user, req.body, { onProgress: progress => send({ type: "progress", ...progress }) }));
      send({ type: "result", plan });
    } catch (error) {
      const message = error.name === "ZodError" ? error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") : error.status ? error.message : "Planning could not complete. Check your saved plans before retrying.";
      send({ type: "error", message });
    } finally { res.end(); }
  },
  create: async (req, res) => res.status(201).json(await trackAgent(req.user, "conductor", () => conductor.createPlan(req.user, req.body))),
  list: async (req, res) => res.json(await conductor.listPlans(req.user)),
  get: async (req, res) => res.json(await conductor.getPlan(req.user, id.parse(req.params.id))),
  replan: async (req, res) => res.json(await trackAgent(req.user, "conductor-recovery", () => conductor.replan(req.user, id.parse(req.params.id), req.body))),
  request: async (req, res) => res.json(await conductor.createPlanRequest(req.user, id.parse(req.params.id), req.body)),
};
