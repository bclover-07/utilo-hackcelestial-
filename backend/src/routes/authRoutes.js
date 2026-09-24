import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController as c } from "../controllers/authController.js";

export const authRoutes = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

authRoutes.post("/register", authLimit, c.register);
authRoutes.post("/login", authLimit, c.login);
