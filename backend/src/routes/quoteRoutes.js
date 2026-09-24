import { Router } from "express";
import rateLimit from "express-rate-limit";
import { quoteController as c } from "../controllers/quoteController.js";
import { aiController } from "../controllers/aiController.js";

export const quoteRoutes = Router();

const aiLimit = rateLimit({
  windowMs: 60000,
  limit: 8,
  keyGenerator: (req) => String(req.user._id),
  message: { error: "AI request limit reached. Try again in one minute." },
});

quoteRoutes.get("/quotes", c.quotes);
quoteRoutes.post("/quotes/:id/offers", c.offer);
quoteRoutes.post("/quotes/:id/accept", c.accept);
quoteRoutes.post("/quotes/:id/decline", c.decline);
quoteRoutes.get("/quotes/:id/messages", c.messages);
quoteRoutes.post("/quotes/:id/messages", c.message);
quoteRoutes.post("/quotes/:id/assistant", aiLimit, aiController.negotiation);
