import { model, ref } from "./helpers.js";

export const Quote = model(
  "Quote",
  {
    request: ref("Request"),
    listing: ref("Listing"),
    provider: ref("BusinessProfile"),
    seeker: ref("BusinessProfile"),
    itemIndex: Number,
    status: {
      type: String,
      enum: ["invited", "offered", "accepted", "declined", "closed"],
      default: "invited",
    },
    version: { type: Number, default: 0 },
    offers: [
      {
        by: ref("BusinessProfile"),
        price: Number,
        conditions: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  [[{ request: 1, listing: 1, itemIndex: 1 }, { unique: true }]],
);
