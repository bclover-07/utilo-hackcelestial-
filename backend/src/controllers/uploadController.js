import { upload, documentUrl } from "../services/uploadService.js";
import { id } from "../services/validation.js";

const send = (fn) => async (req, res) => res.json(await fn(req, res));
const recordId = (req) => id.parse(req.params.id);

export const uploadController = {
  upload: send((req) => upload(req.user, req.file, req.body.kind)),
  document: send((req) => documentUrl(req.user, recordId(req))),
};
