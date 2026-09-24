import { test } from "node:test";
import assert from "node:assert/strict";
import { registerSchema, profileSchema } from "../src/services/validation.js";
import { summarizePlan } from "../src/services/planSummary.js";
import { withDeadline } from "../src/services/deadline.js";
import {
  peakReserved,
  overlaps,
  estimate,
} from "../src/services/matchingService.js";
const registration = {
  name: "Test Hospitality",
  email: "  HELLO@example.com  ",
  password: "Example123!",
  city: "Mumbai",
  category: "hotel",
  phone: "1234567890",
};
test("AI deadlines stop waiting even if an SDK ignores its abort signal", async () => {
  let signal;
  await assert.rejects(
    withDeadline((value) => {
      signal = value;
      return new Promise(() => {});
    }, 15),
    (error) => error.status === 503,
  );
  assert.equal(signal.aborted, true);
  assert.equal(await withDeadline(async () => "ready", 100), "ready");
});
test("signup defaults to one business workspace and normalizes email", () => {
  const result = registerSchema.parse(registration);
  assert.equal(result.role, "business");
  assert.equal(result.mode, "seeker");
  assert.equal(result.email, "hello@example.com");
  assert.equal(
    registerSchema.parse({ ...registration, mode: "provider" }).role,
    "business",
  );
});
test("profile updates cannot grant admin permissions or verification", () => {
  assert.deepEqual(
    profileSchema.parse({
      role: "admin",
      verification: "verified",
      mode: "provider",
    }),
    { mode: "provider" },
  );
});
test("password validation prevents bcrypt truncation including multibyte passwords", () => {
  assert.equal(
    registerSchema.safeParse({ ...registration, password: "short" }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...registration, password: "é".repeat(37) })
      .success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...registration, password: "a".repeat(72) })
      .success,
    true,
  );
});
test("plan coverage reports partial supply and does not imply a reservation", () => {
  assert.deepEqual(summarizePlan([{ total: 3 }, { total: 0 }, { total: 2 }]), {
    requirements: 3,
    matched: 2,
    gaps: 1,
    coveragePercent: 67,
    candidates: 5,
    reservationCreated: false,
  });
  assert.equal(summarizePlan().coveragePercent, 0);
});
test("adjacent reservations do not overlap and quantity is peak concurrent usage", () => {
  const block = (start, end, quantity) => ({
    start: new Date(`2026-10-01T${start}:00Z`),
    end: new Date(`2026-10-01T${end}:00Z`),
    quantity,
  });
  const a = block("10:00", "11:00", 5),
    b = block("11:00", "12:00", 7),
    c = block("10:30", "11:30", 3);
  assert.equal(overlaps(a, b), false);
  assert.equal(peakReserved([a, b], a.start, b.end), 7);
  assert.equal(peakReserved([a, b, c], a.start, b.end), 10);
});
test("rental estimate uses quantity, rounded billing period and delivery", () => {
  assert.equal(
    estimate(
      { unit: "hour", price: 100, minHours: 1, deliveryFee: 250 },
      {
        quantity: 3,
        start: "2026-10-01T10:00:00Z",
        end: "2026-10-01T11:30:00Z",
        delivery: true,
      },
    ),
    850,
  );
});
