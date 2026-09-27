import { z } from "zod";
import * as authService from "../services/authService.js";
import { BusinessProfile } from "../models/BusinessProfile.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));

export const authController = {
  register: send(async (req, res) => {
    const u = await authService.register(req.body);
    const token = authService.session(res, u);
    return { ...authService.publicUser(u), socketToken: token };
  }),

  login: send(async (req, res) => {
    const u = await authService.login(req.body);
    const token = authService.session(res, u);
    return { ...authService.publicUser(u), socketToken: token };
  }),

  me: send(async (req) => {
    const token = req.cookies?.utlio_session || null;
    return { ...authService.publicUser(req.user), socketToken: token };
  }),

  socketToken: send(async (req) => {
    return { token: req.cookies?.utlio_session || null };
  }),

  logout: send(async (req, res) => {
    await BusinessProfile.updateOne(
      { _id: req.user._id },
      { $inc: { sessionVersion: 1 } },
    );
    res.clearCookie("utlio_session", { path: "/" });
    return { ok: true };
  }),

  profile: send(async (req) =>
    authService.publicUser(await authService.updateProfile(req.user, req.body)),
  ),

  verifyGstin: send(async (req) => {
    const { lookupGstin } = await import("../services/gstinService.js");
    const gstinToVerify = (req.body?.gstin || req.user.gstin || "").trim().toUpperCase();
    if (!gstinToVerify) {
      throw Object.assign(new Error("Please enter a valid 15-digit GSTIN."), { status: 400 });
    }
    const result = await lookupGstin(gstinToVerify, req.user);
    if (!result.success) {
      throw Object.assign(new Error(result.error || "GSTIN verification failed."), { status: 400 });
    }
    const updated = await BusinessProfile.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          gstin: gstinToVerify,
          gstinData: result,
          verification: "verified",
          verificationMethod: req.user.documentId ? "hybrid" : "automated_gstin",
          verificationNote: `Automated GSTIN Registry Verification Passed (${result.tradeName}, ${result.state})`,
        },
      },
      { new: true },
    );
    return authService.publicUser(updated);
  }),
};
