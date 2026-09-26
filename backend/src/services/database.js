import mongoose from "mongoose";

// A temporary standalone MongoDB breaks reservation transactions and can silently
// replace the real database during an outage. Allow a replica-set fallback only
// when a developer deliberately opts in, never in production.
export async function connectDatabase(config, dependencies = {}) {
  const db = dependencies.db || mongoose;
  const createReplica = dependencies.createReplica || (async () => {
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    return MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: "7.0.14" } });
  });
  let temporary;
  try {
    try {
      await db.connect(config.mongo, { serverSelectionTimeoutMS: 10000 });
    } catch {
      await db.disconnect();
      if (config.production || !config.allowMemoryDb) {
        throw new Error("MongoDB is unavailable. Start the configured replica set or check MONGODB_URI. No temporary database was substituted.");
      }
      console.warn("Using an explicitly enabled temporary MongoDB replica set. All data will be lost when this API stops.");
      temporary = await createReplica();
      await db.connect(temporary.getUri());
    }
    const hello = await db.connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") {
      throw new Error("MongoDB must be a replica set or sharded cluster for booking transactions.");
    }
    return async () => { await db.disconnect(); await temporary?.stop(); };
  } catch (error) {
    await db.disconnect();
    await temporary?.stop();
    throw error;
  }
}
