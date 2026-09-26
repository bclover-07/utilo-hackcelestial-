import { Router } from "express";
import mongoose from "mongoose";
import { auth, business } from "../middlewares/auth.js";
import { authController } from "../controllers/authController.js";
import { listingController } from "../controllers/listingController.js";
import { authRoutes } from "./authRoutes.js";
import { listingRoutes } from "./listingRoutes.js";
import { requestRoutes } from "./requestRoutes.js";
import { quoteRoutes } from "./quoteRoutes.js";
import { bookingRoutes } from "./bookingRoutes.js";
import { searchRoutes } from "./searchRoutes.js";
import { analyticsRoutes } from "./analyticsRoutes.js";
import { aiRoutes } from "./aiRoutes.js";
import { uploadRoutes } from "./uploadRoutes.js";
import { notificationRoutes } from "./notificationRoutes.js";
import { adminRoutes } from "./adminRoutes.js";
import { workProcessRoutes } from "./workProcessRoutes.js";
import { localAiConfig } from "../services/localAiConfig.js";

export const api = Router();

const send = (fn) => async (req, res) => res.json(await fn(req, res));


api.get("/health", send(async () => ({
  status: mongoose.connection.readyState === 1 ? "ready" : "unavailable",
})));


api.get("/categories", listingController.categories);


api.use("/auth", authRoutes);


api.use(auth);
api.get("/ai/local-config", (_req, res) => res.set("Cache-Control", "no-store").json(localAiConfig));

api.get("/auth/me", authController.me);
api.post("/auth/logout", authController.logout);
api.patch("/profile", authController.profile);


api.use(uploadRoutes);
api.use(notificationRoutes);
api.use(analyticsRoutes);
api.use(workProcessRoutes);


api.use("/admin", adminRoutes);


const b = Router();
b.use(business);
b.use(searchRoutes);
b.use(listingRoutes);
b.use(requestRoutes);
b.use(quoteRoutes);
b.use(bookingRoutes);
b.use(aiRoutes);
api.use(b);
