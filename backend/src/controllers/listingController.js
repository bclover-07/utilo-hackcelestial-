import { Listing, Availability, Category } from "../models/index.js";
import * as listings from "../services/listingService.js";
import { id } from "../services/validation.js";
import { assert } from "../middlewares/errors.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const listingController = {
  categories: send(async () => Category.find().sort({ name: 1 }).lean()),

  listings: send(async (req) => {
    const userListings = await Listing.find({ owner: req.user._id, status: { $ne: "archived" } })
      .select("-embedding")
      .sort({ createdAt: -1 })
      .lean();
    
    const now = new Date();
    const blocks = await Availability.find({
      listing: { $in: userListings.map(l => l._id) },
      start: { $lte: now },
      end: { $gt: now }
    }).lean();

    for (const l of userListings) {
      const activeBlocks = blocks.filter(b => String(b.listing) === String(l._id));
      l.occupiedQuantity = activeBlocks.reduce((acc, b) => acc + (b.quantity || 1), 0);
    }
    
    return userListings;
  }),

  listing: send(async (req) => {
    const l = await Listing.findById(recordId(req))
      .select("-embedding")
      .populate("owner", "name verification city")
      .lean();
    assert(
      l &&
        ((l.status === "active" && !l.moderationHold) || String(l.owner?._id) === String(req.user._id)),
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
      .populate({
        path: "booking",
        populate: { path: "seeker", select: "name" },
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
