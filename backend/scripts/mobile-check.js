import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
process.env.JWT_SECRET = "mobile-contract-isolated-secret-with-more-than-32-characters";
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:1/never-connect";
for (const key of ["GEMINI_API_KEY", "HF_TOKEN", "SMTP_HOST", "ELEVENLABS_API_KEY", "DNS_SERVERS"]) process.env[key] = "";
const { app } = await import("../src/app.js");
const { Category } = await import("../src/models/index.js");
const { register } = await import("../src/services/authService.js");
const replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: "7.0.14" } });
let server;
try {
  await mongoose.connect(replica.getUri(), { dbName: "mobile_contract" });
  await Promise.all(Object.values(mongoose.models).map(m => m.init()));
  await Category.create({ name: "Chairs", slug: "chairs", color: "#79d9c5", requiredFields: [] });
  const administrator = await register({ name: "Screen contract administrator", email: "screen-admin@mobile-test.invalid", password: "ContractPassword123!", role: "business", mode: "seeker", city: "Mumbai", phone: "9999999999", category: "hospitality" });
  administrator.role = "admin"; await administrator.save();
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const port = server.address().port;
  const args = ["test", "test/api_contract_test.dart", "test/connected_screens_test.dart", "--concurrency=1", `--dart-define=CONTRACT_API=http://127.0.0.1:${port}/api`, "--reporter=expanded"];
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn("flutter", args, { cwd: fileURLToPath(new URL("../../mobile", import.meta.url)), stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", code => resolve(code ?? 1)); child.on("error", reject);
  });
} finally { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await replica.stop(); }
