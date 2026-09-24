import { Router } from "express";
import { notificationController as c } from "../controllers/notificationController.js";

export const notificationRoutes = Router();

notificationRoutes.get("/notifications", c.notifications);
notificationRoutes.patch("/notifications/:id/read", c.readNotification);
