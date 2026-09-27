import { Router } from "express";
import rateLimit from "express-rate-limit";
import { nugenController as c } from "../controllers/nugenController.js";

export const nugenRoutes = Router();

const nugenLimit = rateLimit({
  windowMs: 60000,
  limit: 10,
  keyGenerator: (req) => String(req.user._id),
  message: { error: "AI request limit reached. Try again in one minute." },
});

nugenRoutes.get("/nugen/status", c.status);
nugenRoutes.post("/nugen/chat", nugenLimit, c.chat);
nugenRoutes.post("/nugen/negotiate", nugenLimit, c.negotiationAdvice);
nugenRoutes.post("/nugen/optimize-listing", nugenLimit, c.optimizeListing);
