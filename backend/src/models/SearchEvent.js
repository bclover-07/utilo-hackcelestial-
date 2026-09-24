import { model, ref } from "./helpers.js";

export const SearchEvent = model("SearchEvent", {
  user: ref("BusinessProfile"),
  category: String,
  city: String,
  resultCount: Number,
});
