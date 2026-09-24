import { z } from "zod";
import * as authService from "../services/authService.js";
import { BusinessProfile } from "../models/BusinessProfile.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));

export const authController = {
  register: send(async (req, res) => {
    const u = await authService.register(req.body);
    authService.session(res, u);
    return authService.publicUser(u);
  }),

  login: send(async (req, res) => {
    const u = await authService.login(req.body);
    authService.session(res, u);
    return authService.publicUser(u);
  }),

  me: send(async (req) => authService.publicUser(req.user)),

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
};
