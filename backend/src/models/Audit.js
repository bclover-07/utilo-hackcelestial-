import { model, ref } from "./helpers.js";

export const Audit = model("Audit", {
  actor: ref("BusinessProfile"),
  action: String,
  target: String,
  detail: String,
});
