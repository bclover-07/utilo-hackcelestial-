import { Listing } from "../models/index.js";
import { assert } from "../middlewares/errors.js";



async function exactVectors(vector, model, limit = 5) {
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
        moderationHold: { $ne: true },
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

const evidenceProjection = { _id: 0, id: "$_id", title: 1, description: 1, city: 1, price: 1, unit: 1, category: 1, capacity: 1, quantity: 1, conditions: 1, delivery: 1, minHours: 1 };

export function vectorIndexDefinition(dimensions = 384) {
  assert(Number.isInteger(dimensions) && dimensions > 0 && dimensions <= 8192, 400, "Invalid embedding dimensions.");
  return { fields: [
    { type: "vector", path: "embedding", numDimensions: dimensions, similarity: "cosine" },
    ...["status", "moderationHold", "embeddingModel"].map(path => ({ type: "filter", path })),
  ] };
}

export async function retrieveVectorEvidence(vector, model, limit = 5) {
  assert(Array.isArray(vector) && vector.length > 0 && vector.every(Number.isFinite) && vector.some(v => v !== 0), 502, "Vector retrieval requires a finite nonzero embedding.");
  assert(Number.isInteger(limit) && limit >= 1 && limit <= 50, 422, "Invalid retrieval limit.");
  const mode = process.env.MONGODB_VECTOR_MODE || "atlas";
  assert(["atlas", "exact"].includes(mode), 503, "Choose atlas or exact as the vector search engine. Automatic fallback is disabled.");
  if (mode !== "exact") {
    try {
      const sources = await Listing.aggregate([
        { $vectorSearch: { index: process.env.MONGODB_VECTOR_INDEX || "utlio_resources_vector", path: "embedding", queryVector: vector, numCandidates: Math.max(100, limit * 20), limit, filter: { status: "active", moderationHold: { $ne: true }, embeddingModel: model } } },
        
        { $match: { status: "active", moderationHold: { $ne: true }, embeddingModel: model, indexedAt: { $exists: true }, embedding: { $size: vector.length } } },
        { $project: { ...evidenceProjection, similarity: { $meta: "vectorSearchScore" } } },
      ]).option({ maxTimeMS: 12000 });
      return { sources, engine: "MongoDB Atlas vector search", fallback: false };
    } catch (error) {
      throw error;
    }
  }
  return { sources: await exactVectors(vector, model, limit), engine: "MongoDB exact cosine aggregation", fallback: false };
}

export async function retrieveVectors(vector, model, limit = 5) {
  return (await retrieveVectorEvidence(vector, model, limit)).sources;
}

export function fuseRanks(vectorRows, keywordRows, limit = 5) {
  const entries = new Map();
  for (const [method, rows] of [["semantic", vectorRows], ["keyword", keywordRows]]) {
    rows.forEach((row, index) => {
      const key = String(row.id);
      const existing = entries.get(key) || { ...row, id: key, retrievalScore: 0, matchedBy: [] };
      existing.retrievalScore += 1 / (60 + index + 1);
      existing.matchedBy.push(method);
      entries.set(key, existing);
    });
  }
  return [...entries.values()].sort((a, b) => b.retrievalScore - a.retrievalScore || a.id.localeCompare(b.id)).slice(0, limit);
}

export async function keywordEvidence(text, limit = 12) {
  const words = [...new Set(text.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])].filter(w => !["the", "for", "and", "with", "need", "find", "have", "what", "are", "can"].includes(w)).slice(0, 12);
  if (!words.length) return [];
  const regexes = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return Listing.aggregate([
    { $match: { status: "active", moderationHold: { $ne: true }, $or: [{ title: { $regex: regexes.join("|"), $options: "i" } }, { description: { $regex: regexes.join("|"), $options: "i" } }] } },
    { $set: { keywordScore: { $sum: regexes.map(word => ({ $cond: [{ $regexMatch: { input: { $concat: [{ $ifNull: ["$title", ""] }, " ", { $ifNull: ["$description", ""] }] }, regex: word, options: "i" } }, 1, 0] })) } } },
    { $sort: { keywordScore: -1, _id: 1 } }, { $limit: limit },
    { $project: { ...evidenceProjection, keywordScore: 1 } },
  ]).option({ maxTimeMS: 12000 });
}
