import { z } from "zod";
import { Memory } from "../models/Memory.js";
import { assert } from "../middlewares/errors.js";

const memorySchema = z.object({
  category: z.enum(["preference", "constraint", "logistics", "vendor_affinity"]).default("preference"),
  key: z.string().trim().min(2).max(100),
  value: z.string().trim().min(2).max(500),
  confidence: z.number().min(0).max(1).default(1),
  pinned: z.boolean().default(false),
});

export async function listMemories(user) {
  return Memory.find({ owner: user._id }).sort({ pinned: -1, updatedAt: -1 }).lean();
}

export async function saveMemory(user, raw) {
  const data = memorySchema.parse(raw);
  return Memory.findOneAndUpdate(
    { owner: user._id, key: data.key },
    { $set: { ...data, source: "user_stated" } },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function deleteMemory(user, id) {
  const deleted = await Memory.findOneAndDelete({ _id: id, owner: user._id });
  assert(deleted, 404, "Memory preference not found.");
  return { success: true };
}

export async function getMemoriesForContext(userId) {
  if (!userId) return "";
  const memories = await Memory.find({ owner: userId }).sort({ pinned: -1 }).limit(10).lean();
  if (!memories.length) return "";
  return "User working preferences & constraints (from cross-session working memory):\n" +
    memories.map(m => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`).join("\n");
}
