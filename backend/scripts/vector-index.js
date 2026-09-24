import mongoose from "mongoose";
import { config } from "../src/config.js";
import { Listing } from "../src/models/index.js";
import { vectorIndexDefinition } from "../src/services/vectorService.js";
import { indexListing } from "../src/agents/workflows.js";

try {
  await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 15000 });
  const name = process.env.MONGODB_VECTOR_INDEX || "utlio_resources_vector";
  const dimensions = Number(process.env.HF_EMBEDDING_DIMENSIONS || 384);
  const indexes = await Listing.collection.listSearchIndexes().toArray();
  const existing = indexes.find(index => index.name === name);
  if (existing) console.log(JSON.stringify({ name, status: existing.status, queryable: existing.queryable, dimensions: existing.latestDefinition?.fields?.find(field => field.type === "vector")?.numDimensions }));
  else if (process.argv.includes("--check")) console.log(JSON.stringify({ name, status: "not_created", dimensions }));
  else {
    await Listing.collection.createSearchIndex({ name, type: "vectorSearch", definition: vectorIndexDefinition(dimensions) });
    console.log(JSON.stringify({ name, status: "creation_requested", dimensions, next: "Run with --check until queryable. Index listing embeddings from provider mode." }));
  }
  if (process.argv.includes("--embed")) {
    const listings = await Listing.find({ status: "active", moderationHold: { $ne: true }, indexedAt: { $exists: false } }).select("_id owner").limit(100).lean();
    let indexed = 0;
    for (const listing of listings) {
      await indexListing({ _id: listing.owner }, listing._id);
      indexed++;
      console.log(JSON.stringify({ indexed, pendingInBatch: listings.length - indexed }));
    }
  }
  console.log(JSON.stringify({ indexedListings: await Listing.countDocuments({ indexedAt: { $exists: true } }) }));
} catch (error) {
  console.error(JSON.stringify({ error: "Vector index setup unavailable", type: error.name, code: error.code, action: "Check deployment support and createSearchIndexes permission. Retrieval errors are surfaced; no fallback is enabled." }));
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
