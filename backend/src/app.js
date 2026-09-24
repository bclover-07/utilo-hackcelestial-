import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { csrf, isAllowedOrigin } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/errors.js";
import { api } from "./routes/api.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS origin not allowed"), false);
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Try again shortly." },
  }),
  csrf,
  api,
);
app.use((req, res) => res.status(404).json({ error: "Endpoint not found." }));
app.use(errorHandler);
