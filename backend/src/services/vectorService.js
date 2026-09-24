import { Listing } from "../models/index.js";
import { assert } from "../middlewares/errors.js";

// Exact cosine retrieval runs in MongoDB over every compatible indexed listing.
// Unlike an ANN index this needs no Atlas-specific deployment configuration.
export async function retrieveVectors(vector, model, limit = 5) {
  assert(
    Array.isArray(vector) && vector.length > 0 && vector.every(Number.isFinite),
    502,
    "Vector retrieval requires a finite embedding.",
  );
  assert(
    Number.isInteger(limit) && limit >= 1 && limit <= 50,
    422,
    "Invalid retrieval limit.",
  );
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  assert(
    Number.isFinite(norm) && norm > 0,
    502,
    "Embedding has no usable magnitude.",
  );
  return Listing.aggregate([
    {
      $match: {
        status: "active",
        embeddingModel: model,
        indexedAt: { $exists: true },
        embedding: { $size: vector.length },
      },
    },
    {
      $set: {
        dot: {
          $reduce: {
            input: { $zip: { inputs: ["$embedding", { $literal: vector }] } },
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                {
                  $multiply: [
                    { $arrayElemAt: ["$$this", 0] },
                    { $arrayElemAt: ["$$this", 1] },
                  ],
                },
              ],
            },
          },
        },
        norm: {
          $sqrt: {
            $reduce: {
              input: "$embedding",
              initialValue: 0,
              in: { $add: ["$$value", { $multiply: ["$$this", "$$this"] }] },
            },
          },
        },
      },
    },
    { $match: { norm: { $gt: 0 } } },
    {
      $set: {
        similarity: { $divide: ["$dot", { $multiply: ["$norm", norm] }] },
      },
    },
    { $sort: { similarity: -1, _id: 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        id: "$_id",
        title: 1,
        description: 1,
        city: 1,
        price: 1,
        unit: 1,
        category: 1,
        capacity: 1,
        quantity: 1,
        conditions: 1,
        delivery: 1,
        minHours: 1,
        similarity: 1,
      },
    },
  ]);
}
