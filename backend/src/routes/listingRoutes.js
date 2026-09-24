import { Router } from "express";
import { listingController as c } from "../controllers/listingController.js";
import { aiController } from "../controllers/aiController.js";
import rateLimit from "express-rate-limit";

export const listingRoutes = Router();

const aiLimit = rateLimit({
  windowMs: 60000,
  limit: 8,
  keyGenerator: (req) => String(req.user._id),
  message: { error: "AI request limit reached. Try again in one minute." },
});

listingRoutes.get("/listings", c.listings);
listingRoutes.post("/listings", c.createListing);
listingRoutes.get("/listings/:id", c.listing);
listingRoutes.put("/listings/:id", c.updateListing);
listingRoutes.patch("/listings/:id/status", c.listingStatus);
listingRoutes.get("/listings/:id/availability", c.availability);
listingRoutes.post("/listings/:id/availability", c.block);
listingRoutes.delete("/listings/:id/availability/:blockId", c.unblock);
listingRoutes.post("/listings/:id/index", aiLimit, aiController.indexListing);
listingRoutes.post("/listings/:id/report", c.report);
