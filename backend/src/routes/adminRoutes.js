import { Router } from "express";
import { admin } from "../middlewares/auth.js";
import { adminController as c } from "../controllers/adminController.js";
import rateLimit from "express-rate-limit";
import { agentStudioController } from "../controllers/agentStudioController.js";

export const adminRoutes = Router();

adminRoutes.use(admin);
adminRoutes.get("/agents", agentStudioController.overview);
adminRoutes.post("/agents/brief", rateLimit({ windowMs: 60000, limit: 8, keyGenerator: req => String(req.user._id), message: { error: "AI request limit reached. Try again in one minute." } }), agentStudioController.operations);
adminRoutes.get("/verifications", c.verifications);
adminRoutes.patch("/verifications/:id", c.verify);
adminRoutes.post("/categories", c.createCategory);
adminRoutes.put("/categories/:id", c.updateCategory);
adminRoutes.get("/settings", c.settings);
adminRoutes.put("/settings", c.saveSettings);
adminRoutes.get("/disputes", c.adminDisputes);
adminRoutes.get("/disputes/:id", c.evidence);
adminRoutes.post("/disputes/:id/resolve", c.resolve);
adminRoutes.get("/reports", c.reports);
adminRoutes.post("/reports/:id/resolve", c.moderate);
adminRoutes.post("/listings/:id/release", c.releaseListing);
adminRoutes.get("/audit", c.audit);
adminRoutes.get("/integrations", c.integrations);
