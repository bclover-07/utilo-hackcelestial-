import { Router } from "express";
import { inventoryController as c } from "../controllers/inventoryController.js";

export const inventoryRoutes = Router();

inventoryRoutes.get("/inventory/dashboard", c.dashboard);
inventoryRoutes.get("/inventory/listing/:id/rentals", c.listingRentals);
inventoryRoutes.patch("/inventory/listing/:id/quick-status", c.quickStatus);
inventoryRoutes.post("/inventory/listing/:id/repost", c.repostListing);
inventoryRoutes.post("/inventory/assets", c.addAsset);
inventoryRoutes.post("/inventory/offline-deals", c.recordOfflineDeal);
inventoryRoutes.post("/inventory/offline-deals/:id/return", c.returnOfflineDeal);
