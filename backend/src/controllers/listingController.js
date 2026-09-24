import { Listing, Availability, Category } from "../models/index.js";
import * as listings from "../services/listingService.js";
import { id } from "../services/validation.js";
import { assert } from "../middlewares/errors.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const listingController = {
  categories: send(async () => Category.find().sort({ name: 1 }).lean()),

  listings: send((req) =>
    Listing.find({ owner: req.user._id, status: { $ne: "archived" } })
      .sort({ createdAt: -1 })
      .lean(),
  ),

  listing: send(async (req) => {
    const l = await Listing.findById(recordId(req))
      .populate("owner", "name verification city")
      .lean();
    assert(
      l &&
        (l.status === "active" || String(l.owner._id) === String(req.user._id)),
      404,
      "Listing not found.",
    );
    return l;
  }),

  createListing: send((req) => listings.createListing(req.user, req.body)),

  updateListing: send((req) =>
    listings.updateListing(req.user, recordId(req), req.body),
  ),

  listingStatus: send((req) =>
    listings.setStatus(req.user, recordId(req), req.body),
  ),

  availability: send(async (req) => {
    await listings.ownListing(req.user, recordId(req));
    return Availability.find({
      listing: req.params.id,
      end: { $gt: new Date() },
    })
      .sort({ start: 1 })
      .lean();
  }),

  block: send((req) => listings.block(req.user, recordId(req), req.body)),

  unblock: send((req) =>
    listings.unblock(req.user, recordId(req), id.parse(req.params.blockId)),
  ),

  report: send(async (req) => {
    const { Report } = await import("../models/Report.js");
    const { z } = await import("zod");
    assert(
      await Listing.exists({ _id: recordId(req), status: "active" }),
      404,
      "Listing not found.",
    );
    return Report.create({
      listing: req.params.id,
      reporter: req.user._id,
      reason: z.string().trim().min(10).max(3000).parse(req.body.reason),
    });
  }),
};
