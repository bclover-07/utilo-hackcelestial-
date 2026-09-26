import { model, ref } from "./helpers.js";

export const Message = model("Message", {
  quote: ref("Quote"),
  sender: ref("BusinessProfile"),
  text: String,
  type: {
    type: String,
    enum: ["chat", "video_call"],
    default: "chat",
  },
  videoCall: {
    status: {
      type: String,
      enum: ["requested", "accepted", "declined", "ended"],
      default: "requested",
    },
    roomId: String,
    caller: ref("BusinessProfile"),
    recipient: ref("BusinessProfile"),
    durationSeconds: { type: Number, default: 0 },
  },
});
