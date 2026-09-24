import { Request } from "../models/Request.js";
import * as requests from "../services/requestService.js";
import { id } from "../services/validation.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const requestController = {
  requests: send((req) =>
    Request.find({ seeker: req.user._id }).sort({ createdAt: -1 }).lean(),
  ),

  createRequest: send((req) => requests.createRequest(req.user, req.body)),

  cancelRequest: send((req) =>
    requests.cancelRequest(req.user, recordId(req)),
  ),
};
