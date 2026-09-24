import mongoose from "mongoose";
import { Request, Quote, Category } from "../models/index.js";
import { requestSchema } from "./validation.js";
import { search } from "./matchingService.js";
import { notify } from "./notificationService.js";
import { assert } from "../middlewares/errors.js";
export async function createRequest(user, raw) {
  const data = requestSchema.parse(raw);
  const categories = [...new Set(data.items.map((item) => item.category))];
  assert(
    (await Category.countDocuments({ slug: { $in: categories } })) ===
      categories.length,
    400,
    "Every requested item must use an existing category.",
  );
  const { coordinates, ...rest } = data;
  return mongoose.connection.transaction(async (session) => {
    const request = (
      await Request.create(
        [
          {
            ...rest,
            seeker: user._id,
            location: { type: "Point", coordinates },
          },
        ],
        { session },
      )
    )[0];
    let invited = 0;
    for (const [itemIndex, item] of data.items.entries()) {
      const matches = await search(
        {
          ...item,
          coordinates,
          city: data.city,
          radiusKm: data.radiusKm,
          start: data.start,
          end: data.end,
          delivery: data.delivery,
        },
        user,
        { session },
      );
      for (const listing of matches.items) {
        await Quote.create(
          [
            {
              request: request._id,
              listing: listing._id,
              provider: listing.owner,
              seeker: user._id,
              itemIndex,
            },
          ],
          { session },
        );
        await notify(
          listing.owner,
          `${data.urgency === "emergency" ? "Emergency: " : ""}New resource request`,
          `${data.title}: ${item.quantity} × ${item.category}`,
          "/dashboard/negotiations",
          session,
        );
        invited++;
      }
    }
    return { request, invited };
  });
}
export async function cancelRequest(user, id) {
  return mongoose.connection.transaction(async (session) => {
    const r = await Request.findOne({ _id: id, seeker: user._id }).session(
      session,
    );
    assert(r, 404, "Request not found.");
    assert(
      !r.items.some((i) => i.booking),
      409,
      "Cancel confirmed bookings individually first.",
    );
    r.status = "cancelled";
    r.revision++;
    await r.save({ session });
    await Quote.updateMany(
      { request: id, status: { $in: ["invited", "offered"] } },
      { $set: { status: "closed" } },
      { session },
    );
    return r;
  });
}
