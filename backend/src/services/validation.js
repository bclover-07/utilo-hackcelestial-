import { z } from "zod";
const text = z.string().trim().min(1).max(500);
const nonnegative = z.coerce.number().finite().min(0).max(1e9);
const positive = z.coerce.number().finite().positive().max(1e7);
export const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record ID");
export const coordinates = z.tuple([
  z.coerce.number().min(-180).max(180),
  z.coerce.number().min(-90).max(90),
]);
export const range = { start: z.coerce.date(), end: z.coerce.date() };
export const validRange = (value) => value.end > value.start;
export const registerSchema = z.object({
  name: text,
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email())
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(10)
    .max(128)
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must fit within 72 UTF-8 bytes",
    ),
  role: z.enum(["business", "admin"]).default("business"),
  mode: z.enum(["provider", "seeker"]).default("seeker"),
  city: text,
  category: text,
  phone: text,
});
export const profileSchema = z
  .object({
    name: text,
    city: text,
    category: text,
    phone: text,
    address: z.string().trim().max(500).optional(),
    gstin: z.string().max(20).optional(),
    documentId: id.optional(),
    mode: z.enum(["provider", "seeker"]).optional(),
  })
  .partial();
export const listingSchema = z.object({
  title: text,
  description: z.string().trim().min(10).max(5000),
  category: text,
  quantity: positive.int(),
  capacity: positive.int(),
  price: positive,
  unit: z.enum(["hour", "day", "event"]),
  minHours: positive,
  deposit: nonnegative.default(0),
  delivery: z.boolean().default(false),
  deliveryFee: nonnegative.default(0),
  conditions: z.string().max(3000).default(""),
  cancellationHours: nonnegative.default(24),
  city: text,
  address: text,
  coordinates,
  photos: z.array(z.url()).max(10).default([]),
  attributes: z
    .record(
      z.string().max(100),
      z.union([z.string().max(500), z.number().finite(), z.boolean()]),
    )
    .default({}),
  dynamicPricing: z
    .object({
      enabled: z.boolean().default(false),
      floorPrice: nonnegative.optional(),
      ceilingPrice: nonnegative.optional(),
      surgeMultiplier: z.number().min(0.5).max(3).default(1),
    })
    .optional(),
});
export const requestSchema = z
  .object({
    title: text,
    items: z
      .array(
        z.object({
          category: text,
          quantity: positive.int(),
          capacity: positive.int().default(1),
          specs: z.string().max(2000).default(""),
        }),
      )
      .min(1)
      .max(10),
    city: text,
    coordinates,
    radiusKm: positive.max(300),
    ...range,
    budget: positive,
    urgency: z.enum(["routine", "urgent", "emergency"]).default("routine"),
    delivery: z.boolean().default(false),
  })
  .refine(validRange, "End must be after start")
  .refine((v) => v.start > new Date(), "Start must be in the future");
export const searchSchema = z
  .object({
    query: z.string().max(200).optional(),
    category: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    coordinates: coordinates.optional(),
    radiusKm: positive.max(300).default(25),
    budget: positive.optional(),
    quantity: positive.int().default(1),
    capacity: positive.int().default(1),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    delivery: z.boolean().optional(),
    page: positive.int().default(1),
  })
  .refine(
    (v) => (!v.start && !v.end) || (v.start && v.end && v.end > v.start),
    "Supply both dates, with end after start",
  );
export const offerSchema = z.object({
  price: positive,
  conditions: z.string().max(3000).default(""),
  version: nonnegative.int(),
});
export const categorySchema = z.object({
  name: text,
  slug: z.string().regex(/^[a-z][a-z0-9_]{1,50}$/),
  color: z.string().regex(/^#[a-f\d]{6}$/i),
  requiredFields: z
    .array(
      z.object({
        key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
        label: text,
        type: z.enum(["text", "number", "boolean"]),
      }),
    )
    .max(20)
    .refine(
      (fields) =>
        new Set(fields.map((field) => field.key)).size === fields.length,
      "Specification keys must be unique",
    )
    .default([]),
});
