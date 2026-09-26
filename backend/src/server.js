import { createServer } from "node:http";
import mongoose from "mongoose";
import { config, validateConfig } from "./config.js";
import { app } from "./app.js";
import { Category, Setting } from "./models/index.js";
import { startJobs } from "./jobs/scheduler.js";
import { initSocketServer } from "./socket.js";
import { connectDatabase } from "./services/database.js";
validateConfig();
const disconnectDatabase = await connectDatabase(config);
await mongoose.connection.db?.collection("bookings").dropIndex("quote_1").catch(() => {});
await Promise.all(
  Object.values(mongoose.models).map((m) =>
    m.init().catch((err) => console.warn(`Index init note on ${m.modelName}:`, err.message)),
  ),
);

for (const [slug, name, color, requiredFields] of [
  ["banquet_hall", "Banquet Spaces & Venues", "#FFE66D", [
    { key: "carpet_area_sqft", label: "Carpet Area (sq ft)", type: "number" },
    { key: "air_conditioning", label: "Air Conditioning (AC)", type: "boolean" },
    { key: "parking_capacity", label: "Parking Capacity (vehicles)", type: "number" },
    { key: "stage_available", label: "Stage & Performance Area", type: "boolean" },
    { key: "catering_allowed", label: "Outside Catering Allowed", type: "boolean" },
    { key: "sound_system", label: "Built-in Sound / PA System", type: "boolean" },
    { key: "power_backup", label: "Generator / Power Backup", type: "boolean" },
  ]],
  ["parking_capacity", "Parking Capacity & Spaces", "#38BDF8", [
    { key: "total_vehicle_spots", label: "Total Vehicle Capacity (spots)", type: "number" },
    { key: "covered_parking", label: "Covered / Basement Parking", type: "boolean" },
    { key: "valet_available", label: "Valet Service Available", type: "boolean" },
    { key: "bus_truck_access", label: "Bus / Heavy Vehicle Access", type: "boolean" },
    { key: "security_cctv", label: "24/7 Security & CCTV", type: "boolean" },
    { key: "ev_charging", label: "EV Charging Points", type: "boolean" },
  ]],
  ["vehicles", "Vehicles & Transport", "#F97316", [
    { key: "vehicle_type", label: "Vehicle Type (Shuttle Van, Bus, Food Truck, VIP Car)", type: "text" },
    { key: "seating_capacity", label: "Seating / Passenger Capacity", type: "number" },
    { key: "driver_included", label: "Driver / Chauffeur Included", type: "boolean" },
    { key: "fuel_included", label: "Fuel Included", type: "boolean" },
    { key: "ac_available", label: "Air Conditioned", type: "boolean" },
    { key: "permit_type", label: "Permit Type (Local, State, All-India)", type: "text" },
  ]],
  ["kitchen", "Commercial Kitchens & Capacity", "#85E8B8", [
    { key: "appliances", label: "Included Appliances (Oven, Freezer, Fryer, Burners)", type: "text" },
    { key: "gas_piped", label: "Piped Commercial Gas Line", type: "boolean" },
    { key: "fssai_certified", label: "Food Grade / FSSAI Certified", type: "boolean" },
    { key: "prep_stations", label: "Dedicated Prep Stations", type: "number" },
    { key: "cold_storage_cu_ft", label: "Cold Storage Space (cu ft)", type: "number" },
  ]],
  ["furniture", "Furniture & Seating", "#FFB347", [
    { key: "furniture_type", label: "Furniture Type (Banquet Chairs, Tables, Sofas, Bars)", type: "text" },
    { key: "material", label: "Material (Wood, Steel, Plastic, Upholstered)", type: "text" },
    { key: "stackable_foldable", label: "Stackable / Foldable", type: "boolean" },
    { key: "cushion_included", label: "Padded Cushion / Covers Included", type: "boolean" },
    { key: "indoor_outdoor", label: "Indoor / Outdoor Rated", type: "text" },
  ]],
  ["av_equipment", "Audio-Visual Equipment", "#C3B1E1", [
    { key: "equipment_type", label: "Equipment Type (Speaker, Mic, Projector, LED Wall)", type: "text" },
    { key: "power_output_watts", label: "Power Output / Brightness (Watts/Lumens)", type: "number" },
    { key: "wireless", label: "Wireless / Bluetooth", type: "boolean" },
    { key: "setup_assistance", label: "On-site Technician Included", type: "boolean" },
  ]],
  ["chairs", "Chairs & Seating", "#4ECDC4", [
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
  ["linens", "Linens & Decor", "#FF85A1", [
    { key: "fabric_material", label: "Fabric Material (Satin, Polyester, Velvet)", type: "text" },
    { key: "color_options", label: "Color / Theme Options", type: "text" },
    { key: "waterproof", label: "Waterproof / Outdoor Rated", type: "boolean" },
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
  await disconnectDatabase();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

