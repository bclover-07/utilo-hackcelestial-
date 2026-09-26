import * as inventory from "../services/inventoryService.js";
import * as listings from "../services/listingService.js";
import { id } from "../services/validation.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const inventoryController = {
  dashboard: send((req) => inventory.getInventoryDashboard(req.user)),

  listingRentals: send((req) =>
    inventory.getListingRentals(req.user, recordId(req)),
  ),

  quickStatus: send((req) =>
    listings.setStatus(req.user, recordId(req), req.body),
  ),

  recordOfflineDeal: send((req) =>
    inventory.recordOfflineDeal(req.user, req.body),
  ),

  returnOfflineDeal: send((req) =>
    inventory.returnOfflineDeal(req.user, recordId(req), req.body),
  ),

  repostListing: send((req) =>
    inventory.repostListing(req.user, recordId(req)),
  ),

  addAsset: send((req) =>
    inventory.addInventoryAsset(req.user, req.body),
  ),
};
