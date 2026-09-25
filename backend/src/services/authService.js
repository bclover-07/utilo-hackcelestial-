import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { BusinessProfile, Upload } from "../models/index.js";
import { registerSchema, profileSchema } from "./validation.js";
import { assert } from "../middlewares/errors.js";
import { config } from "../config.js";
export function publicUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.sessionVersion;
  return obj;
}
export function session(res, user) {
  const token = jwt.sign({ version: user.sessionVersion }, config.jwt, {
    subject: String(user._id),
    expiresIn: "8h",
    issuer: "utlio",
    audience: "utlio-web",
  });
  res.cookie("utlio_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.production,
    maxAge: 8 * 3600000,
    path: "/",
  });
}
export async function register(body) {
  const data = registerSchema.parse(body);
  const { password, ...fields } = data;
  return BusinessProfile.create({
    ...fields,
    verification: "verified",
    passwordHash: await bcrypt.hash(password, 12),
  });
}
export async function login(body) {
  const data = z
    .object({
      email: z
        .string()
        .trim()
        .pipe(z.email())
        .transform((v) => v.toLowerCase()),
      password: z.string().max(128),
      role: z.enum(["business", "admin"]),
      mode: z.enum(["provider", "seeker"]).optional(),
    })
    .parse(body);
  const user = await BusinessProfile.findOne({ email: data.email }).select(
    "+passwordHash",
  );
  const valid = await bcrypt.compare(
    data.password,
    user?.passwordHash ||
      "$2b$12$Q9a6vIqIg3GBVSqyzohXFuSsVTBgjJmsCm8Om1R99HlTKsFfCpbeW",
  );
  assert(
    user && valid && user.role === data.role,
    401,
    "Email, password or account type is incorrect.",
  );
  if (data.mode && user.role === "business" && user.mode !== data.mode) {
    user.mode = data.mode;
    await user.save();
  }
  return user;
}
export async function updateProfile(user, body) {
  const data = profileSchema.parse(body);
  if (data.documentId)
    assert(
      await Upload.exists({
        _id: data.documentId,
        owner: user._id,
        kind: "document",
      }),
      400,
      "Upload your own verification document first.",
    );
  return BusinessProfile.findByIdAndUpdate(
    user._id,
    { $set: data },
    { new: true, runValidators: true },
  );
}
