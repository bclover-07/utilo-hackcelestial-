import { Router } from "express";
import rateLimit from "express-rate-limit";
import { aiController as c } from "../controllers/aiController.js";

export const aiRoutes = Router();

const aiLimit = rateLimit({
  windowMs: 60000,
  limit: 8,
  keyGenerator: (req) => String(req.user._id),
  message: { error: "AI request limit reached. Try again in one minute." },
});

aiRoutes.post("/ai/workflow", aiLimit, c.workflow);
aiRoutes.post("/ai/knowledge", aiLimit, c.rag);
aiRoutes.post("/ai/speech", aiLimit, c.speech);
aiRoutes.post("/ai/forecast", aiLimit, c.demandForecast);
aiRoutes.post("/ai/smart-price", aiLimit, c.smartPrice);
aiRoutes.post("/ai/sentiment", aiLimit, c.sentiment);
aiRoutes.post("/ai/urgency", aiLimit, c.urgencyScore);
