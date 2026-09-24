import { Booking, Rating, Dispute } from "../models/index.js";
import * as bookings from "../services/bookingService.js";
import { participantQuery } from "../services/quoteService.js";
import { id } from "../services/validation.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const bookingController = {
  bookings: send((req) =>
    Booking.find(participantQuery(req.user))
      .populate("listing", "title category")
      .populate("provider seeker", "name")
      .sort({ start: -1 })
      .lean(),
  ),

  bookingStatus: send((req) =>
    bookings.transition(req.user, recordId(req), req.body),
  ),

  review: send((req) =>
    bookings.review(req.user, recordId(req), req.body),
  ),

  reviews: send((req) =>
    Rating.find({ $or: [{ from: req.user._id }, { to: req.user._id }] })
      .populate("from to", "name")
      .populate("booking", "start end")
      .sort({ createdAt: -1 })
      .lean(),
  ),

  dispute: send((req) =>
    bookings.dispute(req.user, recordId(req), req.body),
  ),

  disputes: send(async (req) => {
    const ids = await Booking.find(participantQuery(req.user)).distinct("_id");
    return Dispute.find({ booking: { $in: ids } })
      .populate("booking")
      .sort({ createdAt: -1 })
      .lean();
  }),

  calendar: async (req, res) =>
    res
      .type("text/calendar")
      .attachment("booking.ics")
      .send(await bookings.calendar(req.user, recordId(req))),

  receipt: send((req) =>
    bookings.bookingSummary(req.user, recordId(req)),
  ),
};
