import { search } from "../services/matchingService.js";

export async function planBundle(draft, filters, user) {
  const matches = [];
  for (const item of draft.items) {
    matches.push({
      item,
      ...(await search({ ...filters, ...item }, user)),
    });
  }
  return {
    matches,
    trace: ["Bundle planner: retrieved availability for each item"],
  };
}
