import { Schema, model, ref } from "./helpers.js";

export const BusinessProfile = model("BusinessProfile", {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["business", "admin"], default: "business" },
  mode: { type: String, enum: ["provider", "seeker"], default: "seeker" },
  phone: String,
  category: String,
  city: String,
  address: String,
  gstin: String,
  documentId: { type: Schema.Types.ObjectId, ref: "Upload" },
  verification: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "verified",
  },
  verificationNote: String,
  sessionVersion: { type: Number, default: 0 },
  favorites: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
});
