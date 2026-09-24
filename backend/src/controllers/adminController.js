import mongoose from "mongoose";
import {
  BusinessProfile,
  Dispute,
  Report,
  Setting,
  Audit,
} from "../models/index.js";
import * as admin from "../services/adminService.js";
import { id } from "../services/validation.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const adminController = {
  verifications: send(() =>
    BusinessProfile.find({ role: "business" })
      .select("-favorites -sessionVersion")
      .sort({ createdAt: -1 })
      .lean(),
  ),

  verify: send((req) => admin.verify(req.user, recordId(req), req.body)),

  createCategory: send((req) =>
    admin.saveCategory(req.user, null, req.body),
  ),

  updateCategory: send((req) =>
    admin.saveCategory(req.user, recordId(req), req.body),
  ),

  settings: send(() => Setting.findOne({ key: "platform" }).lean()),

  saveSettings: send((req) => admin.saveSettings(req.user, req.body)),

  adminDisputes: send(() =>
    Dispute.find()
      .populate("openedBy", "name")
      .populate("booking")
      .sort({ createdAt: -1 })
      .lean(),
  ),

  evidence: send((req) => admin.evidence(recordId(req))),

  resolve: send((req) =>
    admin.resolve(req.user, recordId(req), req.body),
  ),

  reports: send(() =>
    Report.find()
      .populate("listing", "title moderationHold status")
      .populate("reporter", "name")
      .sort({ createdAt: -1 })
      .lean(),
  ),

  moderate: send((req) =>
    admin.moderate(req.user, recordId(req), req.body),
  ),

  releaseListing: send((req) =>
    admin.releaseListing(req.user, recordId(req), req.body),
  ),

  audit: send(() =>
    Audit.find()
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ),

  integrations: send(async () => ({
    database: mongoose.connection.readyState === 1,
    gemini: !!process.env.GEMINI_API_KEY,
    huggingFace: !!process.env.HF_TOKEN,
    cloudinary: !!process.env.CLOUDINARY_API_SECRET,
    email: !!process.env.SMTP_HOST,
    voice: !!process.env.ELEVENLABS_API_KEY,
  })),
};
