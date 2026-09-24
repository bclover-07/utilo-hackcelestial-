import { model, ref } from "./helpers.js";

export const Notification = model("Notification", {
  user: ref("BusinessProfile"),
  title: String,
  body: String,
  href: String,
  readAt: Date,
  emailStatus: { type: String, default: "pending" },
  attempts: { type: Number, default: 0 },
});
