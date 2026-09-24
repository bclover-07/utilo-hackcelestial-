import { Schema, model, ref } from "./helpers.js";

export const SavedSearch = model("SavedSearch", {
  owner: ref("BusinessProfile"),
  name: String,
  filters: Schema.Types.Mixed,
  lastNotifiedAt: Date,
});
