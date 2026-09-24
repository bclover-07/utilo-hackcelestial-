import mongoose from "mongoose";
import { config, validateConfig } from "./config.js";
import { app } from "./app.js";
import { Category, Setting } from "./models/index.js";
import { startJobs } from "./jobs/scheduler.js";
validateConfig();
try {
  await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 15000 });
} catch {
  console.error(
    "MongoDB connection failed. Check backend/.env, DNS and Atlas network access.",
  );
  process.exit(1);
}
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
// Real editable taxonomy and platform policy, not sample marketplace records.
for (const [slug, name, color] of [
  ["banquet_hall", "Banquet halls", "#FFE66D"],
  ["chairs", "Chairs & seating", "#4ECDC4"],
  ["tables", "Tables", "#FFB347"],
  ["av_equipment", "Audio & visual", "#C3B1E1"],
  ["linens", "Linens & decor", "#FF85A1"],
])
  await Category.updateOne(
    { slug },
    { $setOnInsert: { slug, name, color, requiredFields: [] } },
    { upsert: true },
  );
await Setting.updateOne(
  { key: "platform" },
  {
    $setOnInsert: { key: "platform", commissionPercent: 5, minBookingValue: 0 },
  },
  { upsert: true },
);
startJobs();
const server = app.listen(config.port, () =>
  console.log(`Utlio API ready on port ${config.port}`),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
