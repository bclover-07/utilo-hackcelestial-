import { Router } from "express";
import rateLimit from "express-rate-limit";
import { aiController as c } from "../controllers/aiController.js";
import { conductorController as conductor } from "../controllers/conductorController.js";
import { verifiedBusiness } from "../middlewares/auth.js";
import { agentStudioController } from "../controllers/agentStudioController.js";

export const aiRoutes = Router();

const aiLimit = rateLimit({
  windowMs: 60000,
  limit: 8,
  keyGenerator: (req) => String(req.user._id),
  message: { error: "AI request limit reached. Try again in one minute." },
});

aiRoutes.post("/ai/workflow", aiLimit, c.workflow);
aiRoutes.get("/ai/studio", agentStudioController.overview);
aiRoutes.post("/ai/knowledge", aiLimit, c.rag);
aiRoutes.post("/ai/speech", aiLimit, c.speech);
aiRoutes.post("/ai/forecast", aiLimit, c.demandForecast);
aiRoutes.post("/ai/smart-price", aiLimit, c.smartPrice);
aiRoutes.post("/ai/sentiment", aiLimit, c.sentiment);
aiRoutes.post("/ai/urgency", aiLimit, c.urgencyScore);
aiRoutes.get("/ai/plans", conductor.list);
aiRoutes.get("/ai/plans/:id", conductor.get);
aiRoutes.post("/ai/plans", aiLimit, conductor.create);
aiRoutes.post("/ai/plans/stream", aiLimit, conductor.stream);
aiRoutes.post("/ai/plans/:id/replan", aiLimit, conductor.replan);
aiRoutes.post("/ai/plans/:id/request", verifiedBusiness, conductor.request);
