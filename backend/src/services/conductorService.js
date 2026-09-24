import mongoose from "mongoose";
import { EventPlan } from "../models/EventPlan.js";
import { Category, Request, Quote, Listing } from "../models/index.js";
import { conductorInput, revisionInput, requestFromPlanInput } from "./conductorSchema.js";
import { search, estimate } from "./matchingService.js";
import { comparePackages, satisfiesAttributes } from "./packageSolver.js";
import { runConductorGraph } from "../agents/conductorGraph.js";
import { assert } from "../middlewares/errors.js";
import { notify } from "./notificationService.js";

export async function candidatePools(user, input, session) {
  const categories = [...new Set(input.items.map(i => i.category))];
  assert(await Category.countDocuments({ slug: { $in: categories } }).session(session || null) === categories.length, 400, "Choose an existing category for every requirement.");
  
  const retrieve = async item => {
    const matches = await search({ ...input.filters, budget: undefined, query: item.query || undefined, category: item.category, capacity: item.capacity, quantity: 1 }, user, { all: true, session });
    return matches.items.map(l => ({
      listingId: String(l._id), providerId: String(l.owner), title: l.title,
      category: l.category, availableQuantity: l.availableQuantity, capacity: l.capacity,
      unitRental: estimate(l, { ...input.filters, quantity: 1, delivery: false }),
      deliveryFee: input.filters.delivery ? (l.deliveryFee || 0) : 0,
      delivery: l.delivery, deposit: l.deposit || 0, unit: l.unit, basePrice: l.price,
      minHours: l.minHours, durationHours: (input.filters.end - input.filters.start) / 3600000,
      distanceKm: l.distanceKm, attributes: l.attributes || {}, conditions: l.conditions || "",
      updatedAt: l.updatedAt, revision: l.revision || 0,
    }));
  };
  if (session) {
    const pools = [];
    for (const item of input.items) pools.push(await retrieve(item));
    return pools;
  }
  return Promise.all(input.items.map(retrieve));
}

export async function buildPlan(user, input, { session, stress = true, onProgress } = {}) {
  const started = performance.now();
  const { pools, result, scenarios, trace } = await runConductorGraph(input, () => candidatePools(user, input, session), { stress, onProgress });
  return {
    ...result, checkedAt: new Date().toISOString(), elapsedMs: Math.round(performance.now() - started),
    scenarios, scenarioSummary: { passed: scenarios.filter(s => s.recoverable).length, tested: scenarios.length, type: "single-supplier removal; same inventory snapshot" },
    requirements: input.items.map((item, index) => ({ ...item, index, candidates: pools[index].filter(l => !input.excludedProviders.includes(l.providerId) && satisfiesAttributes(l, item.attributes)).length })),
    limitations: [
      "Availability is a snapshot. No inventory is held or booked.",
      "Bounded heuristic search; lowest cost found is not a proof of global optimality.",
      "Distances are straight-line distances, not delivery travel times. Arrival times remain unverified.",
      "Free-text specifications, provider conditions and setup requirements need human confirmation. Only explicit structured attributes are checked.",
      "Budget covers listed rental and delivery charges. Refundable deposits are separate; taxes and negotiated prices require provider confirmation.",
      "Scenario results are hypothetical checks against this snapshot, not failure probabilities or guaranteed replacements.",
    ],
    trace,
  };
}

export async function createPlan(user, raw, options) {
  const input = conductorInput.parse(raw);
  const result = await buildPlan(user, input, options);
  return EventPlan.create({ owner: user._id, input, result });
}

export async function getPlan(user, id, session) {
  const plan = await EventPlan.findOne({ _id: id, owner: user._id }).session(session || null);
  assert(plan, 404, "Event plan not found.");
  return plan;
}

export function listPlans(user) {
  return EventPlan.find({ owner: user._id }).sort({ updatedAt: -1 }).limit(20).select("input.title version request result.status updatedAt").lean();
}

export async function replan(user, id, raw) {
  const { version, input } = revisionInput.parse(raw);
  const previous = await getPlan(user, id);
  assert(previous.version === version && !previous.request, 409, "This plan changed or has already created a request. Reload it or create a new plan.");
  const result = await buildPlan(user, input);
  result.comparison = comparePackages(previous.result.alternatives[0], result.alternatives[0]);
  const plan = await EventPlan.findOneAndUpdate({ _id: id, owner: user._id, version, request: { $exists: false } }, {
    $set: { input, result, previous: { version, checkedAt: previous.result.checkedAt, total: previous.result.alternatives[0]?.total ?? null } },
    $inc: { version: 1 },
  }, { new: true });
  assert(plan, 409, "Another update changed this plan. Reload before retrying.");
  return plan;
}

export async function createPlanRequest(user, id, raw) {
  const { version, packageId } = requestFromPlanInput.parse(raw);
  return mongoose.connection.transaction(async session => {
    const plan = await getPlan(user, id, session);
    assert(plan.version === version, 409, "The plan version changed. Review the latest version.");
    if (plan.request) return { requestId: plan.request, alreadyCreated: true };
    const input = conductorInput.parse(plan.input);
    const selected = plan.result.alternatives.find(p => p.id === packageId);
    assert(selected?.feasible, 409, "Select a package that satisfies the budget and checked requirements.");
    const pools = await candidatePools(user, input, session);
    const used = new Map();
    for (const row of selected.allocations) {
      const fresh = pools[row.itemIndex].find(l => l.listingId === row.listingId);
      used.set(row.listingId, (used.get(row.listingId) || 0) + row.quantity);
      assert(fresh && !input.excludedProviders.includes(fresh.providerId) && satisfiesAttributes(fresh, input.items[row.itemIndex].attributes) && fresh.availableQuantity >= used.get(row.listingId) && fresh.unitRental === row.unitRental && fresh.deliveryFee === row.deliveryFee && fresh.deposit === row.deposit && new Date(fresh.updatedAt).getTime() === new Date(row.updatedAt).getTime(), 409, "A selected listing, price or availability changed. Replan and review the updated package.");
    }
    
    
    await Listing.updateMany({ _id: { $in: [...used.keys()] } }, { $inc: { revision: 1 } }, { session });
    const request = (await Request.create([{
      seeker: user._id, title: input.title,
      items: selected.allocations.map(row => ({ category: input.items[row.itemIndex].category, quantity: row.quantity, capacity: input.items[row.itemIndex].capacity, specs: [input.items[row.itemIndex].label, input.items[row.itemIndex].specs, Object.keys(input.items[row.itemIndex].attributes).length ? JSON.stringify(input.items[row.itemIndex].attributes) : ""].filter(Boolean).join(" · ") })),
      location: { type: "Point", coordinates: input.filters.coordinates },
      city: input.filters.city, radiusKm: input.filters.radiusKm, start: input.filters.start, end: input.filters.end,
      budget: input.filters.budget, delivery: input.filters.delivery, urgency: "routine",
    }], { session }))[0];
    for (const [itemIndex, row] of selected.allocations.entries()) {
      await Quote.create([{ request: request._id, listing: row.listingId, provider: row.providerId, seeker: user._id, itemIndex }], { session });
    }
    for (const providerId of new Set(selected.allocations.map(row => row.providerId))) {
      await notify(providerId, "New planned event request", `${input.title}: review the requested resources and send your offer.`, "/dashboard/negotiations", session);
    }
    plan.request = request._id;
    await plan.save({ session });
    return { requestId: request._id, invited: new Set(selected.allocations.map(row => row.providerId)).size, alreadyCreated: false };
  });
}
