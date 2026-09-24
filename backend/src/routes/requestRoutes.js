import { Router } from "express";
import { requestController as c } from "../controllers/requestController.js";
import { verifiedBusiness } from "../middlewares/auth.js";

export const requestRoutes = Router();

requestRoutes.get("/requests", c.requests);
requestRoutes.post("/requests", verifiedBusiness, c.createRequest);
requestRoutes.post("/requests/:id/cancel", c.cancelRequest);
