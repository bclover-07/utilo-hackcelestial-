import { createServer } from "node:http";
import mongoose from "mongoose";
import { config, validateConfig } from "./config.js";
import { app } from "./app.js";
import { Category, Setting } from "./models/index.js";
import { startJobs } from "./jobs/scheduler.js";
import { initSocketServer } from "./socket.js";
validateConfig();
try {
  await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 2000 });
} catch {
  console.log("Local MongoDB not detected. Starting in-memory MongoDB fallback...");
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const memServer = await MongoMemoryServer.create({ binary: { version: "7.0.14" } });
    await mongoose.connect(memServer.getUri());
    console.log("Connected to in-memory MongoDB successfully.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

for (const [slug, name, color, requiredFields] of [
  ["banquet_hall", "Banquet halls", "#FFE66D", [
    { key: "air_conditioning", label: "Air Conditioning (AC)", type: "boolean" },
    { key: "parking_capacity", label: "Parking Capacity (vehicles)", type: "number" },
    { key: "stage_available", label: "Stage & Performance Area", type: "boolean" },
    { key: "catering_allowed", label: "Outside Catering Allowed", type: "boolean" },
    { key: "sound_system", label: "Built-in Sound / PA System", type: "boolean" },
    { key: "power_backup", label: "Generator / Power Backup", type: "boolean" },
  ]],
  ["chairs", "Chairs & seating", "#4ECDC4", [
    { key: "chair_type", label: "Chair Style (Banquet, Folding, Cushion)", type: "text" },
    { key: "material", label: "Frame Material (Steel, Wood, Plastic)", type: "text" },
    { key: "stackable", label: "Stackable / Easy Storage", type: "boolean" },
    { key: "cushion_included", label: "Padded Cushion Included", type: "boolean" },
    { key: "weight_capacity_kg", label: "Max Load Capacity (kg)", type: "number" },
  ]],
  ["tables", "Tables", "#FFB347", [
    { key: "shape", label: "Table Shape (Round, Rectangular, High-boy)", type: "text" },
    { key: "seating_per_table", label: "Seats per Table", type: "number" },
    { key: "material", label: "Surface Material", type: "text" },
    { key: "folding", label: "Foldable Legs", type: "boolean" },
  ]],
  ["av_equipment", "Audio & visual", "#C3B1E1", [
    { key: "equipment_type", label: "Equipment Type (Speaker, Mic, Screen, Projector)", type: "text" },
    { key: "power_output_watts", label: "Power Output / Brightness (Watts/Lumens)", type: "number" },
    { key: "wireless", label: "Wireless / Bluetooth", type: "boolean" },
    { key: "setup_assistance", label: "On-site Technician Included", type: "boolean" },
  ]],
  ["linens", "Linens & decor", "#FF85A1", [
    { key: "fabric_material", label: "Fabric Material (Satin, Polyester, Velvet)", type: "text" },
    { key: "color_options", label: "Color / Theme Options", type: "text" },
    { key: "waterproof", label: "Waterproof / Outdoor Rated", type: "boolean" },
  ]],
  ["kitchen", "Commercial Kitchens", "#85E8B8", [
    { key: "appliances", label: "Included Appliances (Oven, Freezer, Fryer)", type: "text" },
    { key: "gas_piped", label: "Piped Commercial Gas Line", type: "boolean" },
    { key: "fssai_certified", label: "Food Grade / FSSAI Certified", type: "boolean" },
  ]],
])
  await Category.updateOne(
    { slug },
    { $set: { slug, name, color, requiredFields } },
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
const httpServer = createServer(app);
export const io = initSocketServer(httpServer);
const server = httpServer.listen(config.port, () =>
  console.log(`Utlio API ready on port ${config.port} with Socket.io real-time chat`),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

