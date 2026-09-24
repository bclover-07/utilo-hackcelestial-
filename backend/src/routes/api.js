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

export const api = Router();

const send = (fn) => async (req, res) => res.json(await fn(req, res));

// Public health check
api.get("/health", send(async () => ({
  status: mongoose.connection.readyState === 1 ? "ready" : "unavailable",
})));

// Public categories taxonomy (available to unauthenticated visitors, seekers, providers, and admins)
api.get("/categories", listingController.categories);

// Public authentication routes
api.use("/auth", authRoutes);

// Protected routes (valid session cookie required)
api.use(auth);

api.get("/auth/me", authController.me);
api.post("/auth/logout", authController.logout);
api.patch("/profile", authController.profile);

// Shared authenticated routes (any authenticated role)
api.use(uploadRoutes);
api.use(notificationRoutes);
api.use(analyticsRoutes);

// Admin-only routes
api.use("/admin", adminRoutes);

// Business-only routes (seeker & provider modes)
const b = Router();
b.use(business);
b.use(searchRoutes);
b.use(listingRoutes);
b.use(requestRoutes);
b.use(quoteRoutes);
b.use(bookingRoutes);
b.use(aiRoutes);
api.use(b);
