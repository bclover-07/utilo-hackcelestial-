import { Router } from "express";
import rateLimit from "express-rate-limit";
import { nugenController as c } from "../controllers/nugenController.js";

export const nugenRoutes = Router();

const nugenLimit = rateLimit({
  windowMs: 60000,
  limit: 10,
  keyGenerator: (req) => String(req.user._id),
  message: { error: "Nugen AI request limit reached. Try again in one minute." },
});

nugenRoutes.get("/nugen/status", c.status);
nugenRoutes.get("/nugen/models/base", c.listBaseModels);
nugenRoutes.get("/nugen/models/aligned", c.listAlignedModels);

nugenRoutes.get("/nugen/corpus", c.getCorpus);
nugenRoutes.post("/nugen/corpus/upload", nugenLimit, c.uploadCorpus);
nugenRoutes.get("/nugen/documents", c.listDocuments);
nugenRoutes.get("/nugen/documents/:id/status", c.documentStatus);

nugenRoutes.post("/nugen/alignment/create", nugenLimit, c.createAlignment);
nugenRoutes.get("/nugen/alignment/:id/status", c.alignmentStatus);
nugenRoutes.get("/nugen/alignments", c.listAlignments);

nugenRoutes.post("/nugen/models/:id/deploy", nugenLimit, c.deployModel);
nugenRoutes.get("/nugen/models/:id/deployment", c.deploymentStatus);

nugenRoutes.post("/nugen/chat", nugenLimit, c.chat);
nugenRoutes.post("/nugen/negotiate", nugenLimit, c.negotiationAdvice);
nugenRoutes.post("/nugen/optimize-listing", nugenLimit, c.optimizeListing);
nugenRoutes.post("/nugen/config", c.updateConfig);
