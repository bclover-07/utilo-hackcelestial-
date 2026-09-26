import test from "node:test";
import assert from "node:assert/strict";
import { connectDatabase } from "../src/services/database.js";

function fixture({ fails = false, standalone = false } = {}) {
  const calls = { connects: 0, replicas: 0, stops: 0 };
  return {
    calls,
    db: {
      async connect() { if (++calls.connects === 1 && fails) throw new Error("unavailable"); },
      async disconnect() {},
      connection: { db: { admin: () => ({ command: async () => standalone ? { ok: 1 } : { setName: "rs0" } }) } },
    },
    async createReplica() { calls.replicas++; return { getUri: () => "mongodb://test", stop: async () => { calls.stops++; } }; },
  };
}
test("Database outages never silently substitute temporary storage", async () => {
  for (const config of [{ production: true, allowMemoryDb: true }, { production: false, allowMemoryDb: false }]) {
    const deps = fixture({ fails: true });
    await assert.rejects(connectDatabase(config, deps), /No temporary database/);
    assert.equal(deps.calls.replicas, 0);
  }
});
test("Explicit development fallback starts and cleans up a replica set", async () => {
  const deps = fixture({ fails: true });
  const stop = await connectDatabase({ production: false, allowMemoryDb: true }, deps);
  assert.equal(deps.calls.replicas, 1);
  await stop();
  assert.equal(deps.calls.stops, 1);
});
test("Standalone MongoDB is rejected before accepting booking traffic", async () => {
  await assert.rejects(connectDatabase({}, fixture({ standalone: true })), /booking transactions/);
});
