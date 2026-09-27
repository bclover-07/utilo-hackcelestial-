import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { BusinessProfile } from "../models/index.js";
import { ApiError, assert } from "./errors.js";
export async function auth(req, res, next) {
  let payload;
  try {
    payload = jwt.verify(req.cookies.utlio_session, config.jwt, {
      algorithms: ["HS256"],
      issuer: "utlio",
      audience: "utlio-web",
    });
  } catch {
    throw new ApiError(401, "Please log in to continue.");
  }
  const user = await BusinessProfile.findById(payload.sub);
  assert(
    user && user.sessionVersion === payload.version,
    401,
    "Your session has expired.",
  );
  req.user = user;
  next();
}
export function admin(req, res, next) {
  assert(req.user.role === "admin", 403, "Administrator access required.");
  next();
}
export function business(req, res, next) {
  assert(req.user.role === "business", 403, "Business account required.");
  next();
}
export function verifiedBusiness(req, res, next) {
  assert(
    req.user.role === "business" && req.user.verification !== "rejected",
    403,
    "Your business account has been restricted. Please contact support or update your verification documents."
  );
  next();
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/+$/, "").toLowerCase();

  // Parse config.origin which may be comma-separated
  const configuredList = (config.origin || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, "").toLowerCase())
    .filter(Boolean);

  if (configuredList.includes(cleanOrigin)) return true;

  // Always permit production Utlio frontend Vercel deployments & previews
  if (
    cleanOrigin === "https://utilo-hackcelestial-frontend.vercel.app" ||
    /^https:\/\/utilo-hackcelestial-frontend(-[a-z0-9-]+)?\.vercel\.app$/.test(cleanOrigin)
  ) {
    return true;
  }

  if (!config.production) {
    if (
      /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
        cleanOrigin,
      )
    ) {
      return true;
    }
  }
  return false;
}

export function csrf(req, res, next) {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    assert(
      req.get("X-Utlio-Request") === "1",
      403,
      "Missing request verification header.",
    );
    assert(
      isAllowedOrigin(req.get("origin")),
      403,
      "Origin not allowed.",
    );
  }
  next();
}
