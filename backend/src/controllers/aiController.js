import * as ai from "../agents/workflows.js";
import { speak } from "../services/speechService.js";
import { id } from "../services/validation.js";
import { trackAgent } from "../services/agentRuntime.js";

const send = (fn) => async (req, res) => res.json(await trackAgent(req.user, req.route.path, () => fn(req, res)));
const recordId = (req) => id.parse(req.params.id);

export const aiController = {
  workflow: send((req) => ai.workflow(req.user, req.body)),

  rag: send((req) => ai.rag(req.user, req.body)),

  speech: async (req, res) =>
    res.type("audio/mpeg").send(await trackAgent(req.user, "speech", () => speak(req.body))),

  negotiation: send((req) =>
    ai.negotiation(req.user, recordId(req), req.body),
  ),

  indexListing: send((req) =>
    ai.indexListing(req.user, recordId(req)),
  ),

  demandForecast: send((req) => ai.demandForecast(req.user, req.body)),

  smartPrice: send((req) => ai.smartPrice(req.user, req.body)),

  sentiment: send((req) => ai.analyzeSentiment(req.user, req.body)),

  urgencyScore: send((req) => ai.urgencyScore(req.user, req.body)),
};
