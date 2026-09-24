import { ApiError } from "../middlewares/errors.js";
// Enforce a deadline even when an upstream SDK does not honor cancellation.
export async function withDeadline(operation, milliseconds = 45000) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(
            new ApiError(
              503,
              "The AI service took too long to respond. Please retry. No booking was created.",
            ),
          );
        }, milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
