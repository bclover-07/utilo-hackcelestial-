import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
// Override before importing config so these tests never connect to the user's DB.
process.env.JWT_SECRET = "isolated-test-secret-at-least-32-characters";
process.env.ADMIN_INVITE_CODE = "isolated-admin-invite-at-least-24-characters";
process.env.NODE_ENV = "test";
const { app } = await import("../src/app.js");
let db;
before(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
});
after(async () => {
  await mongoose.disconnect();
  await db?.stop();
});
const profile = {
  name: "Local Test Business",
  email: "business@example.test",
  password: "Example123!",
  role: "business",
  mode: "seeker",
  city: "Mumbai",
  phone: "1234567890",
  category: "hotel",
};
test("business session, mode persistence, role boundaries and logout", async () => {
  const client = request.agent(app);
  const signup = await client
    .post("/api/auth/register")
    .set("X-Utlio-Request", "1")
    .send(profile)
    .expect(200);
  assert.equal(signup.body.role, "business");
  assert.equal(signup.body.passwordHash, undefined);
  assert.ok(signup.headers["set-cookie"][0].includes("HttpOnly"));
  await client.patch("/api/profile").send({ mode: "provider" }).expect(403);
  await client
    .patch("/api/profile")
    .set("X-Utlio-Request", "1")
    .send({ mode: "provider", role: "admin" })
    .expect(200);
  const me = await client.get("/api/auth/me").expect(200);
  assert.equal(me.body.mode, "provider");
  assert.equal(me.body.role, "business");
  await client.get("/api/admin/verifications").expect(403);
  await client.post("/api/auth/logout").set("X-Utlio-Request", "1").expect(200);
  await client.get("/api/auth/me").expect(401);
  await client
    .post("/api/auth/login")
    .set("X-Utlio-Request", "1")
    .send({
      email: "  BUSINESS@example.test ",
      password: profile.password,
      role: "business",
      mode: "seeker",
    })
    .expect(200);
  assert.equal((await client.get("/api/auth/me")).body.mode, "seeker");
  await request(app)
    .post("/api/auth/login")
    .set("X-Utlio-Request", "1")
    .send({ ...profile, role: "admin" })
    .expect(401);
});
test("administrator signup requires invitation; admin cannot use business APIs", async () => {
  const client = request.agent(app);
  await client
    .post("/api/auth/register")
    .set("X-Utlio-Request", "1")
    .send({ ...profile, email: "admin@example.test", role: "admin" })
    .expect(403);
  await client
    .post("/api/auth/register")
    .set("X-Utlio-Request", "1")
    .send({
      ...profile,
      email: "admin@example.test",
      role: "admin",
      inviteCode: process.env.ADMIN_INVITE_CODE,
    })
    .expect(200);
  await client.get("/api/listings/mine").expect(403);
  await client
    .patch("/api/profile")
    .set("X-Utlio-Request", "1")
    .set("Origin", "https://untrusted.example")
    .send({ name: "no" })
    .expect(403);
});
