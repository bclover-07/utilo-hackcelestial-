

const round = v => Math.round((v + Number.EPSILON) * 100) / 100;
const cents = v => Math.round(v * 100);
const key = rows => rows.map(r => `${r.itemIndex}:${r.listingId}:${r.quantity}`).sort().join("|");
const byCost = (a, b) => a.totalCents - b.totalCents || a.supplierCount - b.supplierCount || a.key.localeCompare(b.key);
const bySuppliers = (a, b) => a.supplierCount - b.supplierCount || byCost(a, b);
const byDistance = (a, b) => a.distanceKm - b.distanceKm || byCost(a, b);

export function satisfiesAttributes(listing, required = {}) {
  return Object.entries(required).every(([name, expected]) => {
    const actual = listing.attributes?.[name];
    return typeof expected === "string"
      ? typeof actual === "string" && actual.trim().toLowerCase() === expected.trim().toLowerCase()
      : actual === expected;
  });
}

function decorate(rows) {
  const listings = [...new Map(rows.map(r => [r.listingId, r])).values()];
  
  
  const rentalCents = rows.reduce((sum, r) => sum + cents(r.unitRental) * r.quantity, 0);
  const deliveryCents = listings.reduce((sum, r) => sum + cents(r.deliveryFee), 0);
  return {
    rows, key: key(rows), totalCents: rentalCents + deliveryCents,
    rentalTotal: rentalCents / 100, deliveryTotal: deliveryCents / 100,
    depositTotal: round(listings.reduce((sum, r) => sum + (r.deposit || 0), 0)),
    supplierCount: new Set(rows.map(r => r.providerId)).size,
    distanceKm: round(listings.reduce((sum, r) => sum + (r.distanceKm || 0), 0)),
  };
}

function usedByListing(rows) {
  const used = new Map();
  for (const row of rows) used.set(row.listingId, (used.get(row.listingId) || 0) + row.quantity);
  return used;
}

function diversify(states, width = 36) {
  const unique = [...new Map(states.map(s => [s.key, s])).values()];
  const chosen = new Map();
  for (const compare of [byCost, bySuppliers, byDistance])
    for (const s of [...unique].sort(compare).slice(0, width / 3)) chosen.set(s.key, s);
  return [...chosen.values()];
}

export function solvePackages(items, pools, filters, excludedProviders = []) {
  const excluded = new Set(excludedProviders.map(String));
  const candidates = pools.map((pool, index) => pool.filter(l =>
    !excluded.has(l.providerId) && l.availableQuantity > 0 &&
    l.capacity >= items[index].capacity && satisfiesAttributes(l, items[index].attributes),
  ));
  
  const order = items.map((_, i) => i).sort((a, b) => candidates[a].length - candidates[b].length || items[b].capacity - items[a].capacity);
  let beam = [decorate([])], explored = 0;
  for (const itemIndex of order) {
    const item = items[itemIndex], next = [];
    for (const state of beam) {
      const used = usedByListing(state.rows);
      const pool = candidates[itemIndex].map(l => ({ ...l, remaining: l.availableQuantity - (used.get(l.listingId) || 0) })).filter(l => l.remaining > 0);
      const providers = new Set(state.rows.map(r => r.providerId));
      const sorts = [
        (a, b) => a.unitRental - b.unitRental || a.deliveryFee - b.deliveryFee,
        (a, b) => b.remaining - a.remaining || a.unitRental - b.unitRental,
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.unitRental - b.unitRental,
        (a, b) => Number(providers.has(b.providerId)) - Number(providers.has(a.providerId)) || a.unitRental - b.unitRental,
        (a, b) => (a.unitRental * Math.min(item.quantity, a.remaining) + (used.has(a.listingId) ? 0 : a.deliveryFee)) / Math.min(item.quantity, a.remaining) - (b.unitRental * Math.min(item.quantity, b.remaining) + (used.has(b.listingId) ? 0 : b.deliveryFee)) / Math.min(item.quantity, b.remaining),
      ];
      for (const compare of sorts) {
        const sorted = [...pool].sort((a, b) => compare(a, b) || a.listingId.localeCompare(b.listingId));
        
        
        for (let first = 0; first < Math.min(sorted.length, 8); first++) {
          const sequence = [sorted[first], ...sorted.filter((_, i) => i !== first)];
          let need = item.quantity;
          const rows = [...state.rows];
          for (const listing of sequence) {
            const quantity = Math.min(need, listing.remaining);
            if (quantity <= 0) continue;
            rows.push({ ...listing, itemIndex, label: item.label, quantity });
            need -= quantity;
            if (!need) break;
          }
          explored++;
          if (!need) next.push(decorate(rows));
        }
      }
    }
    beam = diversify(next);
    if (!beam.length) break;
  }
  const feasible = beam.filter(s => s.rows.length && s.totalCents <= cents(filters.budget));
  const source = feasible.length ? feasible : beam.filter(s => s.rows.length);
  const alternatives = [];
  for (const [id, label, compare] of [["value", "Lowest cost found", byCost], ["simple", "Fewer suppliers", bySuppliers], ["nearby", "Closer resources", byDistance]]) {
    const option = [...source].sort(compare)[0];
    if (!option || alternatives.some(p => p.signature === option.key)) continue;
    const allocations = option.rows.sort((a, b) => a.itemIndex - b.itemIndex || a.listingId.localeCompare(b.listingId)).map(({ remaining, ...r }) => ({ ...r, rentalTotal: cents(r.unitRental) * r.quantity / 100 }));
    const allocationByListing = usedByListing(allocations);
    alternatives.push({
      id, label, signature: option.key, allocations,
      total: option.totalCents / 100, rentalTotal: option.rentalTotal, deliveryTotal: option.deliveryTotal,
      depositTotal: option.depositTotal, supplierCount: option.supplierCount,
      distanceKm: option.distanceKm, feasible: option.totalCents <= cents(filters.budget),
      budgetRemaining: (cents(filters.budget) - option.totalCents) / 100,
      evidence: [
        { label: "Required quantities", passed: items.every((item, i) => allocations.filter(r => r.itemIndex === i).reduce((sum, r) => sum + r.quantity, 0) === item.quantity) },
        { label: "Shared inventory", passed: allocations.every(r => allocationByListing.get(r.listingId) <= r.availableQuantity) },
        { label: "Capacity and structured attributes", passed: allocations.every(r => r.capacity >= items[r.itemIndex].capacity && satisfiesAttributes(r, items[r.itemIndex].attributes)) },
        { label: "Rental window and delivery option", passed: allocations.every(r => r.durationHours >= r.minHours && (!filters.delivery || r.delivery)) },
        { label: "Total rental + delivery budget", passed: option.totalCents <= cents(filters.budget) },
      ],
    });
  }
  const gaps = items.map((item, index) => {
    const supply = candidates[index].reduce((sum, l) => sum + l.availableQuantity, 0);
    return { itemIndex: index, label: item.label, required: item.quantity, independentlyAvailable: supply, missing: Math.max(0, item.quantity - supply) };
  }).filter(g => g.missing > 0);
  const complete = alternatives.length > 0;
  return {
    alternatives, gaps, feasible: feasible.length > 0,
    status: feasible.length ? "feasible" : complete ? "over_budget" : "no_package_found",
    budgetGap: complete && !feasible.length ? round(alternatives[0].total - filters.budget) : 0,
    search: { explored, beamWidth: 36, firstChoicesPerOrder: 8, candidateLimitPerRequirement: 200, optimalityProven: false },
    explanation: feasible.length
      ? "These packages satisfy the checked inventory, quantity, time, capacity, delivery-option and budget constraints at the time of this search."
      : complete ? "A complete allocation was found, but its rental and delivery cost exceeds your package budget."
        : "No complete package was found within the bounded search. Adjust requirements, radius or dates. Shared stock can cause a gap even when each item has candidates.",
  };
}

export function comparePackages(before, after) {
  if (!before || !after) return { comparable: false, changes: [], message: "One version has no complete package to compare." };
  const a = new Map(before.allocations.map(r => [`${r.itemIndex}:${r.listingId}`, r]));
  const b = new Map(after.allocations.map(r => [`${r.itemIndex}:${r.listingId}`, r]));
  const changes = [...new Set([...a.keys(), ...b.keys()])].flatMap(k => {
    const old = a.get(k), next = b.get(k);
    if (old?.quantity === next?.quantity && old?.unitRental === next?.unitRental && old?.deliveryFee === next?.deliveryFee) return [];
    return [{ listingId: (next || old).listingId, title: (next || old).title, before: old?.quantity || 0, after: next?.quantity || 0 }];
  });
  return { comparable: true, costChange: round(after.total - before.total), supplierChange: after.supplierCount - before.supplierCount, changes, unchangedAllocations: [...a.keys()].filter(k => b.has(k) && a.get(k).quantity === b.get(k).quantity).length };
}
