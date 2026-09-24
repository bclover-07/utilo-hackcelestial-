import { model, ref } from "./helpers.js";

export const Message = model("Message", {
  quote: ref("Quote"),
  sender: ref("BusinessProfile"),
  text: String,
});
