import { model, ref } from "./helpers.js";

export const Report = model("Report", {
  listing: ref("Listing"),
  reporter: ref("BusinessProfile"),
  reason: String,
  status: { type: String, enum: ["open", "resolved"], default: "open" },
  resolution: String,
});
