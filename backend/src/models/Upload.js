import { model, ref } from "./helpers.js";

export const Upload = model("Upload", {
  owner: ref("BusinessProfile"),
  publicId: String,
  url: String,
  kind: { type: String, enum: ["image", "document"] },
  resourceType: String,
});
