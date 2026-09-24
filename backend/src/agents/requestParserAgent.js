import { z } from "zod";
import { invoke } from "./shared.js";
import { Category } from "../models/Category.js";
import { assert } from "../middlewares/errors.js";

const draftSchema = z.object({
  title: z.string(),
  items: z
    .array(
      z.object({
        category: z.string(),
        quantity: z.number().int().min(1),
        capacity: z.number().int().min(1),
        specs: z.string(),
      }),
    )
    .max(10),
  missing: z.array(z.string()),
});

export async function parseRequest(text) {
  const categories = await Category.find().select("slug name").lean();
  const draft = await invoke(
    "Parse a hospitality resource requirement. Use only the supplied category slugs. Decompose each resource into a separate item. Never invent a date, location, budget or resource. If quantity/capacity is absent, use 1 and add it to missing so the user confirms it. Return a draft only; do not claim anything is booked.",
    { text, categories },
    draftSchema,
  );
  assert(
    draft.items.every((i) => categories.some((c) => c.slug === i.category)),
    422,
    "The request contains a category that is not available. Select a category manually.",
  );
  return { draft, trace: ["Request parser: structured draft created"] };
}
