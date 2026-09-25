import { search } from "../services/matchingService.js";
import { measureStep } from "../services/agentRuntime.js";

export async function planBundle(draft, filters, user) {
  const matches = await Promise.all(draft.items.map(async (item, index) => measureStep(`Match requirement ${index + 1}`, async () => ({
      item,
      ...(await search({ ...filters, ...item }, user)),
    }))));
  return {
    matches,
    trace: ["Bundle planner: retrieved item availability in parallel; independent matches are not a reserved package"],
  };
}
