import { model, ref } from "./helpers.js";

export const WorkProcess = model("WorkProcess", {
  user: ref("BusinessProfile"),
  action: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, default: "" },
  category: { type: String, default: "general" },
  status: { type: String, default: "completed" },
  metadata: { type: Object, default: {} },
});
