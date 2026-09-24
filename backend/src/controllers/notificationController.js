import { Notification } from "../models/Notification.js";
import { id } from "../services/validation.js";
import { assert } from "../middlewares/errors.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const notificationController = {
  notifications: send((req) =>
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ),

  readNotification: send(async (req) => {
    const n = await Notification.findOneAndUpdate(
      { _id: recordId(req), user: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true },
    );
    assert(n, 404, "Notification not found.");
    return n;
  }),
};
