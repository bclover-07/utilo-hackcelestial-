import { Schema, model, ref } from "./helpers.js";

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
    },
    roomId: String,
    caller: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: false },
    recipient: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: false },
    durationSeconds: { type: Number, default: 0 },
  },
});
