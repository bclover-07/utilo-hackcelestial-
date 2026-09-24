import { z } from "zod";
import { coordinates, id } from "./validation.js";

export const conductorItem = z.object({
  label: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(100),
  query: z.string().trim().max(120).default(""),
  quantity: z.coerce.number().int().min(1).max(100000),
  capacity: z.coerce.number().int().min(1).max(100000).default(1),
  specs: z.string().trim().max(2000).default(""),
  attributes: z.record(z.string().max(100), z.union([z.string().max(500), z.number().finite(), z.boolean()])).default({}),
});
export const conductorInput = z.object({
  title: z.string().trim().min(1).max(200),
  items: z.array(conductorItem).min(1).max(10),
  filters: z.object({
    city: z.string().trim().min(1).max(100),
    coordinates,
    radiusKm: z.coerce.number().min(1).max(300),
    start: z.coerce.date(),
    end: z.coerce.date(),
    budget: z.coerce.number().positive().max(1e9),
    delivery: z.boolean().default(false),
  }).refine(v => v.end > v.start, "End must follow start").refine(v => v.start > new Date(), "Start must be in the future"),
  excludedProviders: z.array(id).max(30).default([]),
});
export const revisionInput = z.object({ version: z.number().int().min(1), input: conductorInput });
export const requestFromPlanInput = z.object({ version: z.number().int().min(1), packageId: z.string().max(60), acknowledged: z.literal(true) });
