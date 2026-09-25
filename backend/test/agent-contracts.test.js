import test from "node:test";
import assert from "node:assert/strict";
import { validateCitations, pricingEvidence, optionalAdvice, adviceSchema } from "../src/services/agentContracts.js";
import { ApiError } from "../src/middlewares/errors.js";
import { solvePackages } from "../src/services/packageSolver.js";
import { peakReserved, estimate } from "../src/services/matchingService.js";
import { withDeadline } from "../src/services/deadline.js";
import { fuseRanks } from "../src/services/vectorService.js";

test("RAG rejects a citation outside retrieved evidence", () => {
  assert.throws(() => validateCitations([{ text: "claim", sourceIds: ["invented"] }], [{ id: "real" }]), /outside/);
  assert.throws(() => validateCitations([{ text: "claim", sourceIds: [] }], [{ id: "real" }]), /outside/);
  assert.equal(validateCitations([{ text: "claim", sourceIds: ["real"] }], [{ id: "real" }]).length, 1);
});
test("Pricing gates sparse evidence separately for each rental unit", () => {
  const result = pricingEvidence([{ _id: "hour", count: 2, minPrice: 10, maxPrice: 20, avgPrice: 15 }, { _id: "day", count: 8, minPrice: 90, maxPrice: 120, avgPrice: 100 }]);
  assert.equal(result[0].suggestedRangeAvailable, false);
  assert.equal(result[1].suggestedRangeAvailable, true);
  assert.deepEqual(result[1].observedRange, [90,120]);
});
test("Partial advice is explicit and cannot mask application failures", async () => {
  const result = await optionalAdvice(() => { throw new ApiError(503, "Provider failed"); });
  assert.equal(result.decision, null);
  assert.equal(result.generation.status, "unavailable");
  await assert.rejects(optionalAdvice(() => { throw new ApiError(403, "Denied"); }), /Denied/);
  await assert.rejects(optionalAdvice(() => { throw new TypeError("Bug"); }), /Bug/);
});
test("Advice output requires bounded structured fields", () => {
  assert.equal(adviceSchema.safeParse({ summary: "Text only" }).success, false);
  assert.equal(adviceSchema.safeParse({ summary: "Observed", observations: [], actions: [], caveats: [] }).success, true);
});
const item = { label: "Chairs", quantity: 5, capacity: 1, attributes: {} };
const listing = (id, stock, cost = 10) => ({ listingId: id, providerId: id, availableQuantity: stock, capacity: 1, attributes: {}, unitRental: cost, deliveryFee: 0, deposit: 0, distanceKm: 1, durationHours: 24, minHours: 1, delivery: true });
test("Conductor splits required quantity across real candidate pools", () => {
  const result = solvePackages([item], [[listing("a",3), listing("b",2)]], { budget: 100 });
  assert.equal(result.feasible, true);
  assert.equal(result.alternatives[0].allocations.reduce((sum,row) => sum+row.quantity,0),5);
});
test("Conductor never double allocates shared stock", () => {
  const pool = [listing("shared",5)];
  assert.equal(solvePackages([item,item],[pool,pool],{ budget: 500 }).feasible,false);
});
test("Budget and excluded suppliers are enforced during recovery", () => {
  const pools = [[listing("a",5),listing("b",5,30)]];
  assert.equal(solvePackages([item],pools,{ budget: 100 },["a"]).status,"over_budget");
  assert.equal(solvePackages([item],pools,{ budget: 100 },["a","b"]).status,"no_package_found");
});
test("Unknown structured attributes exclude candidates", () => {
  const requirement = { ...item, attributes: { material: "wood" } };
  assert.equal(solvePackages([requirement],[[listing("a",5)]],{budget:100}).feasible,false);
});
test("Adjacent reservations do not overlap; peak quantity is time aware", () => {
  const day=86400000, start=new Date("2030-01-01");
  const blocks=[{start,end:new Date(+start+day),quantity:3},{start:new Date(+start+day),end:new Date(+start+2*day),quantity:4}];
  assert.equal(peakReserved(blocks,start,new Date(+start+2*day)),4);
});
test("Rental estimates account for quantity, rounded billing duration and delivery", () => {
  assert.equal(estimate({price:10,unit:"day",minHours:1,deliveryFee:25},{start:"2030-01-01",end:"2030-01-02T01:00:00Z",quantity:3,delivery:true}),85);
});
test("Provider deadline aborts work and does not invent a result", async () => {
  let signal;
  await assert.rejects(withDeadline(s => { signal=s; return new Promise(() => {}); },10), /too long/);
  assert.equal(signal.aborted,true);
});
test("Hybrid ranks deduplicate listings and preserve retrieval provenance", () => {
  const result=fuseRanks([{id:"a"},{id:"b"}],[{id:"b"},{id:"c"}]);
  assert.equal(result[0].id,"b");
  assert.deepEqual(result[0].matchedBy,["semantic","keyword"]);
  assert.equal(result.length,3);
});
