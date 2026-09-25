import { z } from "zod";
import { invoke } from "./shared.js";
import { Message } from "../models/Message.js";
import { getQuote } from "../services/quoteService.js";
import { assert } from "../middlewares/errors.js";
import { adviceSchema, adviceInstruction } from "../services/agentContracts.js";

export async function classifySentiment(user, raw) {
  const { quoteId } = z.object({ quoteId: z.string().regex(/^[a-f0-9]{24}$/i) }).parse(raw);
  await getQuote(user, quoteId);
  const messages = await Message.find({ quote: quoteId }).populate("sender", "name").sort({ createdAt: -1 }).limit(20).lean();
  assert(messages.length, 409, "No messages in this negotiation thread yet.");
  messages.reverse();
  const classified = await invoke(
    "Review communication tone in this negotiation. Return exactly one label per message in the same order. Interpret the communication, never the person's character, intent or mental state. Mixed language or sarcasm may be ambiguous: acknowledge it. Offer constructive communication actions. A short thread cannot establish a trend." + adviceInstruction,
    messages.map(message => ({ text: message.text })),
    adviceSchema.extend({ labels: z.array(z.enum(["positive", "negative", "neutral", "mixed"])).min(1).max(20) }),
    "Interpret negotiation tone",
  );
  assert(classified.labels.length === messages.length, 502, "Tone analysis returned an incomplete result.");
  const { labels, ...decision } = classified;
  return {
    sentiments: messages.map((msg, index) => ({ messageId: msg._id, sender: msg.sender?.name, text: msg.text.slice(0, 100), sentiment: labels[index], timestamp: msg.createdAt })),
    summary: decision.summary, decision,
    sampleSize: messages.length,
    trace: ["Access checked: participant-only conversation", `${messages.length} recent messages reviewed in one structured call`, "Validated one tone label per message; communication suggestions require review"],
  };
}
