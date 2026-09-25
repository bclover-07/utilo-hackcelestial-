import { z } from "zod";
import { Listing, SavedSearch } from "../models/index.js";
import { search } from "../services/matchingService.js";
import { searchSchema, id } from "../services/validation.js";
import { assert } from "../middlewares/errors.js";
import { BusinessProfile } from "../models/BusinessProfile.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const searchController = {
  search: send((req) => search(req.body, req.user, { log: true })),

  favorites: send((req) =>
    Listing.find({ _id: { $in: req.user.favorites }, status: "active", moderationHold: { $ne: true } }).select("-embedding").lean(),
  ),

  favorite: send(async (req) => {
    const listing = recordId(req);
    assert(
      await Listing.exists({ _id: listing, status: "active", moderationHold: { $ne: true } }),
      404,
      "Listing not found.",
    );
    const remove = req.user.favorites.some((f) => String(f) === listing);
    await BusinessProfile.updateOne(
      { _id: req.user._id },
      remove
        ? { $pull: { favorites: listing } }
        : { $addToSet: { favorites: listing } },
    );
    return { saved: !remove };
  }),

  savedSearches: send((req) =>
    SavedSearch.find({ owner: req.user._id }).lean(),
  ),

  saveSearch: send((req) =>
    SavedSearch.create({
      owner: req.user._id,
      name: z.string().trim().min(1).max(150).parse(req.body.name),
      filters: searchSchema.parse(req.body.filters),
    }),
  ),

  deleteSearch: send(async (req) => {
    const r = await SavedSearch.deleteOne({
      _id: recordId(req),
      owner: req.user._id,
    });
    assert(r.deletedCount, 404, "Saved search not found.");
    return { ok: true };
  }),
};
