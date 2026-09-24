import { Quote, Message } from "../models/index.js";
import * as quotes from "../services/quoteService.js";
import { id } from "../services/validation.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const quoteController = {
  quotes: send((req) =>
    Quote.find(quotes.participantQuery(req.user))
      .populate("listing", "title category")
      .populate("request")
      .populate("provider seeker offers.by", "name")
      .sort({ updatedAt: -1 })
      .lean(),
  ),

  offer: send((req) => quotes.offer(req.user, recordId(req), req.body)),

  accept: send((req) => quotes.accept(req.user, recordId(req), req.body)),

  decline: send((req) => quotes.decline(req.user, recordId(req), req.body)),

  messages: send(async (req) => {
    await quotes.getQuote(req.user, recordId(req));
    const messages = await Message.find({ quote: req.params.id })
      .populate("sender", "name")
      .sort({ createdAt: -1, _id: -1 })
      .limit(500)
      .lean();
    return messages.reverse();
  }),

  message: send((req) => quotes.message(req.user, recordId(req), req.body)),
};
