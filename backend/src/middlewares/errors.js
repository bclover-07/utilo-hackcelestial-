export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function assert(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ZodError")
    return res.status(400).json({
      error: error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  if (error.code === 11000)
    return res.status(409).json({ error: "This record already exists." });
  if (["CastError", "ValidationError", "MulterError"].includes(error.name))
    return res
      .status(400)
      .json({ error: "Invalid data or file. Check the form and try again." });
  if (error.status)
    return res.status(error.status).json({ error: error.message });
  console.error("Request failed:", error.name); // Never log credentials, provider payloads or request bodies.
  res
    .status(500)
    .json({ error: "The operation could not be completed. Please try again." });
}
