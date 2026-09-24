import { Router } from "express";
import { requestController as c } from "../controllers/requestController.js";

export const requestRoutes = Router();

requestRoutes.get("/requests", c.requests);
requestRoutes.post("/requests", c.createRequest);
requestRoutes.post("/requests/:id/cancel", c.cancelRequest);
