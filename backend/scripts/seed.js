import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../src/config.js";
import {
  BusinessProfile,
  Category,
  Listing,
  Availability,
  Request,
  Quote,
  Booking,
  Message,
  Rating,
  Dispute,
  Setting,
  SearchEvent,
  SavedSearch,
  Insight,
  Notification,
  EventPlan,
} from "../src/models/index.js";
import { AgentRun } from "../src/models/AgentRun.js";
import { Memory } from "../src/models/Memory.js";
import { Audit } from "../src/models/Audit.js";
import { Report } from "../src/models/Report.js";

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected.\n");

  // ─── 1. Categories ────────────────────────────────────────────────
  const categories = [
    { slug: "banquet_hall", name: "Banquet halls & Venues", color: "#FFE66D" },
    { slug: "chairs", name: "Chairs & Seating", color: "#4ECDC4" },
    { slug: "tables", name: "Tables & Dining Setups", color: "#FFB347" },
    { slug: "av_equipment", name: "Audio, Visual & LED Screens", color: "#C3B1E1" },
    { slug: "linens", name: "Linens, Tents & Decor", color: "#FF85A1" },
    { slug: "kitchen", name: "Commercial Kitchens", color: "#85E8B8" },
  ];
  for (const cat of categories) {
    await Category.updateOne(
      { slug: cat.slug },
      { $set: { name: cat.name, color: cat.color, requiredFields: [] } },
      { upsert: true }
    );
  }
  console.log(`✔ ${categories.length} categories ready.`);

  // ─── 2. Platform setting ──────────────────────────────────────────
  await Setting.updateOne(
    { key: "platform" },
    { $set: { key: "platform", commissionPercent: 5, minBookingValue: 0 } },
    { upsert: true }
  );

  const hash = await bcrypt.hash("Password123!", 12);

  // ─── 3. Demo accounts ────────────────────────────────────────────
  const provider = await BusinessProfile.findOneAndUpdate(
    { email: "arjun@utlio.com" },
    {
      $set: {
        name: "Arjun Mehta Events & Hospitality",
        email: "arjun@utlio.com",
        passwordHash: hash,
        role: "business",
        mode: "provider",
        phone: "+91 98201 55001",
        category: "venue",
        city: "Mumbai",
        address: "Bandra Kurla Complex, Bandra East, Mumbai 400051",
        gstin: "27ARJUN1111A1Z1",
        verification: "verified",
        verificationNote: "Verified: 5-star hospitality license, fire safety clearance, FSSAI approved.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );

  const seeker = await BusinessProfile.findOneAndUpdate(
    { email: "priya@utlio.com" },
    {
      $set: {
        name: "Priya Sharma Productions",
        email: "priya@utlio.com",
        passwordHash: hash,
        role: "business",
        mode: "seeker",
        phone: "+91 98202 66002",
        category: "event_organizer",
        city: "Mumbai",
        address: "Lower Parel, Mumbai 400013",
        gstin: "27PRIYA2222B1Z2",
        verification: "verified",
        verificationNote: "Verified: Registered event production company, GST compliant.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );

  const admin = await BusinessProfile.findOneAndUpdate(
    { email: "admin@utlio.com" },
    {
      $set: {
        name: "Utlio Operations",
        email: "admin@utlio.com",
        passwordHash: hash,
        role: "admin",
        mode: "seeker",
        phone: "+91 98200 99999",
        category: "platform_operator",
        city: "Mumbai",
        verification: "verified",
        verificationNote: "Platform operations lead.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );

  console.log(`✔ Provider: arjun@utlio.com  (${provider._id})`);
  console.log(`✔ Seeker:   priya@utlio.com  (${seeker._id})`);
  console.log(`✔ Admin:    admin@utlio.com  (${admin._id})`);

  // ─── 4. Wipe old demo data ────────────────────────────────────────
  const ids = [provider._id, seeker._id];
  const allIds = [...ids, admin._id];
  await Listing.deleteMany({ owner: { $in: ids } });
  await Request.deleteMany({ seeker: { $in: ids } });
  await Quote.deleteMany({ $or: [{ provider: { $in: ids } }, { seeker: { $in: ids } }] });
  await Booking.deleteMany({ $or: [{ provider: { $in: ids } }, { seeker: { $in: ids } }] });
  await Rating.deleteMany({ $or: [{ from: { $in: ids } }, { to: { $in: ids } }] });
  await Dispute.deleteMany({ openedBy: { $in: allIds } });
  await Notification.deleteMany({ user: { $in: allIds } });
  await Insight.deleteMany({ owner: { $in: allIds } });
  await SavedSearch.deleteMany({ owner: { $in: ids } });
  await EventPlan.deleteMany({ owner: { $in: ids } });
  await AgentRun.deleteMany({ owner: { $in: allIds } });
  await Memory.deleteMany({ owner: { $in: ids } });
  await SearchEvent.deleteMany({ user: { $in: ids } });
  await Message.deleteMany({});
  await Availability.deleteMany({ listing: null }); // stale
  await Report.deleteMany({ reporter: { $in: allIds } });
  await Audit.deleteMany({ actor: { $in: allIds } });

  // ─── 5. LISTINGS — Provider (Arjun) ──────────────────────────────
  // 15 listings across all 6 categories so Discover Resources is rich.
  const listingsData = [
    // ── Banquet Halls ──
    {
      category: "banquet_hall",
      title: "The Imperial Crystal Ballroom",
      description: "Opulent 500-guest pillar-less ballroom with Italian marble flooring, crystal chandeliers, acoustic wall paneling, and a private VIP green room. Perfect for corporate galas, weddings and award ceremonies.",
      quantity: 1, capacity: 500, price: 65000, unit: "day", minHours: 4,
      deposit: 15000, delivery: false, deliveryFee: 0,
      conditions: "Approved caterers only. Dedicated power backup included. Sound allowed till midnight.",
      cancellationHours: 48,
      city: "Mumbai", address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      attributes: { airConditioned: true, parkingCapacity: 150, stageEquipped: true, bridalSuite: true },
      photos: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"],
      dynamicPricing: { enabled: true, floorPrice: 50000, ceilingPrice: 90000, surgeMultiplier: 1.15, lastAdjustedAt: new Date() },
    },
    {
      category: "banquet_hall",
      title: "Skyline Rooftop Terrace & Garden Lawn",
      description: "Stunning open-air terrace for 250 guests with panoramic BKC skyline views, teakwood dance floor, fairy-light canopy, and valet parking. Ideal for sundowner cocktails and reception dinners.",
      quantity: 1, capacity: 250, price: 38000, unit: "day", minHours: 3,
      deposit: 8000, delivery: false, deliveryFee: 0,
      conditions: "Complimentary valet included. Music till 11:30 PM per local regulations.",
      cancellationHours: 24,
      city: "Mumbai", address: "BKC Rooftop Wing, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.869, 19.067] },
      attributes: { outdoorLawn: true, sunsetView: true, valetAvailable: true, danceFloor: true },
      photos: ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "banquet_hall",
      title: "The Boardroom Conference Suite",
      description: "Intimate 80-seat conference room with motorized blackout blinds, integrated video conferencing, modular seating, and high-speed Wi-Fi. Built for leadership summits and board meetings.",
      quantity: 2, capacity: 80, price: 18000, unit: "day", minHours: 2,
      deposit: 4000, delivery: false, deliveryFee: 0,
      conditions: "Projector and whiteboard included. Catering available on request.",
      cancellationHours: 12,
      city: "Mumbai", address: "Lower Parel Business Tower, Mumbai",
      location: { type: "Point", coordinates: [72.828, 19.005] },
      attributes: { videoConferencing: true, whiteboardIncluded: true, wifi: true },
      photos: ["https://images.unsplash.com/photo-1431540015159-0b9d0acd0507?auto=format&fit=crop&w=1200&q=80"],
    },

    // ── Chairs & Seating ──
    {
      category: "chairs",
      title: "Gold Chiavari Banquet Chairs (350 pcs)",
      description: "Pristine gold resin Chiavari chairs with ivory velvet cushions. Stackable, scratch-free, sanitized. The industry standard for luxury weddings and corporate receptions.",
      quantity: 350, capacity: 1, price: 90, unit: "day", minHours: 1,
      deposit: 3000, delivery: true, deliveryFee: 1500,
      conditions: "Returned dry and undamaged. Cushion covers dry-cleaned by provider.",
      cancellationHours: 24,
      city: "Mumbai", address: "BKC Logistics Depot, Mumbai",
      location: { type: "Point", coordinates: [72.870, 19.065] },
      attributes: { material: "Resin Gold", includesVelvetCushion: true, stackable: true },
      photos: ["https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "chairs",
      title: "White Folding Garden Chairs (500 pcs)",
      description: "Lightweight white resin folding chairs for outdoor events, sangeet nights, and open-air ceremonies. Weather-resistant, easy to clean, and available in bulk.",
      quantity: 500, capacity: 1, price: 45, unit: "day", minHours: 1,
      deposit: 2000, delivery: true, deliveryFee: 1200,
      conditions: "Stacking carts included for easy setup. Damage deposit refundable.",
      cancellationHours: 12,
      city: "Mumbai", address: "Andheri Warehouse, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      attributes: { material: "White Resin", foldable: true, outdoorRated: true },
      photos: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"],
    },

    // ── Tables ──
    {
      category: "tables",
      title: "6ft Round Banquet Dining Tables (35 pcs)",
      description: "Heavy-duty 6-foot round dining tables seating 10 guests each. Vinyl edge moulding, folding steel legs, perfect for banquet dining setups.",
      quantity: 35, capacity: 10, price: 450, unit: "day", minHours: 1,
      deposit: 2000, delivery: true, deliveryFee: 1200,
      conditions: "Table covers recommended. Setup assistance provided on delivery.",
      cancellationHours: 24,
      city: "Mumbai", address: "BKC Logistics Depot, Mumbai",
      location: { type: "Point", coordinates: [72.870, 19.065] },
      attributes: { seatsPerTable: 10, diameterFeet: 6, foldable: true },
      photos: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "tables",
      title: "Cocktail High-Top Bar Tables (20 pcs)",
      description: "Sleek 42-inch cocktail tables with chrome pedestal bases. Ideal for networking mixers, product launches, and standing cocktail receptions.",
      quantity: 20, capacity: 4, price: 350, unit: "day", minHours: 1,
      deposit: 1500, delivery: true, deliveryFee: 800,
      conditions: "Spandex table covers available in black or white at ₹100 per cover.",
      cancellationHours: 12,
      city: "Mumbai", address: "Andheri Warehouse, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      attributes: { heightInches: 42, chromePedestal: true, spandexCoversAvailable: true },
      photos: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80"],
    },

    // ── AV Equipment ──
    {
      category: "av_equipment",
      title: "JBL VTX Concert Line-Array Sound System",
      description: "Concert-grade reinforcement: 4× active subwoofers, 8× mid-high modules, Soundcraft digital mixer, 4× Shure wireless mics. Includes certified FOH engineer for up to 8 hours.",
      quantity: 2, capacity: 1, price: 22000, unit: "event", minHours: 1,
      deposit: 6000, delivery: true, deliveryFee: 1500,
      conditions: "Includes FOH sound engineer on-site. Power requirements: 3-phase 63A.",
      cancellationHours: 24,
      city: "Mumbai", address: "Andheri AV Center, Mumbai",
      location: { type: "Point", coordinates: [72.836, 19.131] },
      attributes: { brand: "JBL VTX / Shure Axient", powerWatts: 12000, soundEngineerIncluded: true },
      photos: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"],
      dynamicPricing: { enabled: true, floorPrice: 18000, ceilingPrice: 30000, surgeMultiplier: 1.1, lastAdjustedAt: new Date() },
    },
    {
      category: "av_equipment",
      title: "P2.6 Ultra-HD LED Video Wall (20×10 ft)",
      description: "4K curved/flat LED wall with Novastar processor, active redundancy power, heavy-duty ground-support truss. 3840 Hz refresh rate — zero scan lines on camera.",
      quantity: 2, capacity: 1, price: 32000, unit: "event", minHours: 1,
      deposit: 10000, delivery: true, deliveryFee: 2500,
      conditions: "Includes 2 LED technicians for graphics switching and live camera feed.",
      cancellationHours: 24,
      city: "Mumbai", address: "Andheri AV Center, Mumbai",
      location: { type: "Point", coordinates: [72.836, 19.131] },
      attributes: { resolution: "4K UHD", pixelPitchMm: 2.6, novastarController: true },
      photos: ["https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "av_equipment",
      title: "Christie 4K Laser Projector & 24ft Screen",
      description: "14,000 ANSI Lumens native 4K laser projector with daylight visibility. Dual HDMI/SDI matrix switcher and motorized truss-mount screen.",
      quantity: 1, capacity: 1, price: 18000, unit: "event", minHours: 1,
      deposit: 5000, delivery: true, deliveryFee: 1200,
      conditions: "Indoor or covered semi-outdoor use. Operator included.",
      cancellationHours: 24,
      city: "Mumbai", address: "Andheri AV Center, Mumbai",
      location: { type: "Point", coordinates: [72.836, 19.131] },
      attributes: { lumens: 14000, resolution: "4K Native", motorizedScreen: true },
      photos: ["https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80"],
    },

    // ── Linens, Tents & Decor ──
    {
      category: "linens",
      title: "Moving-Head Stage Lighting Rig (Full Concert)",
      description: "12× Beam 230W moving heads, 16× LED par cans, GrandMA2 onPC console, wireless DMX transmitters, haze machines. Concert/gala lighting design included.",
      quantity: 2, capacity: 1, price: 15000, unit: "event", minHours: 1,
      deposit: 4000, delivery: true, deliveryFee: 1000,
      conditions: "Includes lighting programmer. Rigging from 8 AM on event day.",
      cancellationHours: 24,
      city: "Mumbai", address: "Andheri AV Center, Mumbai",
      location: { type: "Point", coordinates: [72.836, 19.131] },
      attributes: { movingHeads: 12, dmxConsole: "GrandMA2", hazeMachines: true },
      photos: ["https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "linens",
      title: "German Modular Pagoda Tents (20×20 ft)",
      description: "Commercial aluminum pagoda canopy tents with waterproof PVC sidewalls, cathedral windows, wind stability up to 80 km/h. Perfect for outdoor receptions and expo setups.",
      quantity: 6, capacity: 50, price: 12000, unit: "day", minHours: 1,
      deposit: 3500, delivery: true, deliveryFee: 2000,
      conditions: "Secure ground anchoring required. Rigging team arrives 4 hours before event.",
      cancellationHours: 48,
      city: "Mumbai", address: "Andheri Warehouse, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      attributes: { dimensions: "20×20ft", waterproof: true, flameRetardant: true },
      photos: ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "linens",
      title: "Premium Satin Table Linen & Napkin Set (100 covers)",
      description: "Ivory satin table covers, matching napkins, and organza sashes. Professionally laundered, pressed, and packaged for luxury dining setups.",
      quantity: 100, capacity: 1, price: 120, unit: "day", minHours: 1,
      deposit: 1500, delivery: true, deliveryFee: 600,
      conditions: "Returned within 24 hours post-event. Stain charges apply.",
      cancellationHours: 12,
      city: "Mumbai", address: "BKC Logistics Depot, Mumbai",
      location: { type: "Point", coordinates: [72.870, 19.065] },
      attributes: { material: "Satin", color: "Ivory", includesNapkins: true },
      photos: ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"],
    },

    // ── Commercial Kitchens ──
    {
      category: "kitchen",
      title: "Master Commercial Banquet Kitchen",
      description: "2,000 sq ft industrial prep kitchen with 8 high-pressure burners, tandoor station, walk-in cold room, and 5,000 CFM exhaust hood. FSSAI licensed.",
      quantity: 1, capacity: 1, price: 25000, unit: "day", minHours: 4,
      deposit: 8000, delivery: false, deliveryFee: 0,
      conditions: "Commercial catering license required. Deep-cleaning fee included in deposit.",
      cancellationHours: 48,
      city: "Mumbai", address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      attributes: { burners: 8, walkInCooler: true, exhaustHoodCFM: 5000, gasPiped: true },
      photos: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      category: "kitchen",
      title: "Mobile Catering Kitchen Unit (Food Truck Grade)",
      description: "Fully self-contained mobile kitchen trailer with LPG burners, deep fryer, prep counter, refrigerator, and hot-hold station. Ideal for outdoor events and destination weddings.",
      quantity: 2, capacity: 1, price: 15000, unit: "day", minHours: 4,
      deposit: 5000, delivery: true, deliveryFee: 3000,
      conditions: "Requires flat surface parking. LPG cylinders included for 1 day usage.",
      cancellationHours: 24,
      city: "Mumbai", address: "Andheri Warehouse, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      attributes: { mobileTruck: true, LPGIncluded: true, refrigerator: true },
      photos: ["https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=1200&q=80"],
    },
  ];

  const listings = [];
  for (const data of listingsData) {
    const l = await Listing.create({ owner: provider._id, status: "active", ...data });
    listings.push(l);
  }
  console.log(`✔ ${listings.length} listings created for Arjun.\n`);

  // Quick reference
  const [ballroom, terrace, boardroom, chiavari, foldChairs, roundTables, cocktailTables,
    jblSound, ledWall, projector, lightingRig, pagodaTent, linens, banquetKitchen, mobileKitchen] = listings;

  // ─── 6. REQUESTS (RFQs) from Priya ───────────────────────────────
  const d = (days) => new Date(Date.now() + days * 86400000);

  const req1 = await Request.create({
    seeker: seeker._id,
    title: "Annual Tech Leaders Summit & Awards Night 2026",
    items: [
      { category: "banquet_hall", quantity: 1, capacity: 400, specs: "Pillar-less ballroom with stage, VIP lounge, and green rooms" },
      { category: "chairs", quantity: 250, capacity: 1, specs: "Gold Chiavari chairs with ivory cushions" },
      { category: "av_equipment", quantity: 1, capacity: 1, specs: "Concert line-array sound with wireless mics" },
    ],
    location: { type: "Point", coordinates: [72.85, 19.07] },
    city: "Mumbai", radiusKm: 30,
    start: d(5), end: new Date(d(5).getTime() + 12 * 3600000),
    budget: 140000, urgency: "routine", delivery: true, status: "partial",
  });

  const req2 = await Request.create({
    seeker: seeker._id,
    title: "Fintech Founders Networking Lounge & Demo Night",
    items: [
      { category: "av_equipment", quantity: 1, capacity: 1, specs: "4K laser projector and motorized screen" },
      { category: "tables", quantity: 15, capacity: 10, specs: "Round banquet dining tables with covers" },
    ],
    location: { type: "Point", coordinates: [72.86, 19.08] },
    city: "Mumbai", radiusKm: 25,
    start: d(10), end: new Date(d(10).getTime() + 8 * 3600000),
    budget: 50000, urgency: "urgent", delivery: true, status: "open",
  });

  const req3 = await Request.create({
    seeker: seeker._id,
    title: "Royal Heritage Wedding Sangeet & Reception",
    items: [
      { category: "banquet_hall", quantity: 1, capacity: 250, specs: "Outdoor terrace with skyline backdrop and fairy lights" },
      { category: "chairs", quantity: 200, capacity: 1, specs: "Gold Chiavari chairs" },
      { category: "av_equipment", quantity: 1, capacity: 1, specs: "20×10ft Ultra-HD LED backdrop video wall" },
    ],
    location: { type: "Point", coordinates: [72.83, 19.12] },
    city: "Mumbai", radiusKm: 30,
    start: d(8), end: new Date(d(8).getTime() + 14 * 3600000),
    budget: 180000, urgency: "routine", delivery: true, status: "partial",
  });

  const req4 = await Request.create({
    seeker: seeker._id,
    title: "Luxury Auto Expo & Media Premiere",
    items: [
      { category: "av_equipment", quantity: 1, capacity: 1, specs: "Concert line-array sound and intelligent lighting rig" },
      { category: "linens", quantity: 2, capacity: 50, specs: "Modular weatherproof pagoda tents" },
    ],
    location: { type: "Point", coordinates: [72.87, 19.05] },
    city: "Mumbai", radiusKm: 25,
    start: d(14), end: new Date(d(14).getTime() + 10 * 3600000),
    budget: 95000, urgency: "urgent", delivery: true, status: "open",
  });

  console.log(`✔ 4 RFQ requirements created for Priya.`);

  // ─── 7. QUOTES & NEGOTIATIONS ─────────────────────────────────────
  const ago = (hrs) => new Date(Date.now() - hrs * 3600000);

  // Quote 1: Ballroom for Tech Summit (active negotiation)
  const q1 = await Quote.create({
    request: req1._id, itemIndex: 0,
    provider: provider._id, seeker: seeker._id, listing: ballroom._id,
    status: "offered", version: 3,
    offers: [
      { by: provider._id, price: 65000, conditions: "Full-day corporate rate with staging, green rooms, podium, and 150 parking slots.", at: ago(8) },
      { by: seeker._id, price: 58000, conditions: "Can we adjust to ₹58,000 if our team provides AV engineers?", at: ago(4) },
      { by: provider._id, price: 60000, conditions: "Middle ground at ₹60K with 8 AM early load-in access and backup generators.", at: ago(1) },
    ],
  });
  await Message.create([
    { quote: q1._id, sender: provider._id, text: "Hello Priya! The Imperial Crystal Ballroom is tentatively held for your Tech Leaders Summit. Staging and backstage are included.", createdAt: ago(8) },
    { quote: q1._id, sender: seeker._id, text: "Hi Arjun! The ballroom acoustics look remarkable. We proposed ₹58K since we're bringing our own AV engineers.", createdAt: ago(4) },
    { quote: q1._id, sender: provider._id, text: "We can meet at ₹60K with 8 AM access, VIP valet lanes, and backup power generators.", createdAt: ago(1) },
    { quote: q1._id, sender: seeker._id, text: "That works! Reviewing contract terms with our event committee now.", createdAt: ago(0.5) },
  ]);

  // Quote 2: Sound system for Tech Summit (accepted → booking)
  const q2 = await Quote.create({
    request: req1._id, itemIndex: 2,
    provider: provider._id, seeker: seeker._id, listing: jblSound._id,
    status: "accepted", version: 2,
    offers: [
      { by: provider._id, price: 22000, conditions: "JBL VTX line array with Soundcraft console, 4 Shure wireless mics, and FOH engineer.", at: ago(12) },
      { by: seeker._id, price: 20000, conditions: "Accepted at corporate rate for full 12-hour event.", at: ago(6) },
    ],
  });
  await Message.create([
    { quote: q2._id, sender: provider._id, text: "Hey Priya! Our JBL VTX system is pre-calibrated for keynote speeches and award ceremonies.", createdAt: ago(12) },
    { quote: q2._id, sender: seeker._id, text: "Perfect! We need 4 lapels and 2 wireless handhelds. Counter at ₹20K.", createdAt: ago(6) },
    { quote: q2._id, sender: provider._id, text: "Confirmed! Our lead engineer Rahul will arrive at 7 AM for full soundcheck.", createdAt: ago(5) },
  ]);

  // Booking 1 from Quote 2
  const bk1 = await Booking.create({
    quote: q2._id, request: req1._id, listing: jblSound._id,
    provider: provider._id, seeker: seeker._id, itemIndex: 2,
    start: req1.start, end: req1.end,
    quantity: 1, price: 20000, deposit: 5000, commission: 1000,
    conditions: "Full concert sound reinforcement with FOH engineer.",
    logistics: "Equipment truck to BKC service bay at 7 AM.",
    cancellationHours: 24, status: "confirmed",
  });
  await Availability.create({
    listing: jblSound._id, booking: bk1._id,
    start: req1.start, end: req1.end, quantity: 1,
    reason: "Booking — Tech Leaders Summit",
  });
  req1.items[2].booking = bk1._id;
  await req1.save();

  // Quote 3: Terrace for Wedding Sangeet (accepted → booking)
  const q3 = await Quote.create({
    request: req3._id, itemIndex: 0,
    provider: provider._id, seeker: seeker._id, listing: terrace._id,
    status: "accepted", version: 2,
    offers: [
      { by: provider._id, price: 40000, conditions: "Full Skyline Terrace access with fairy lighting and valet.", at: ago(20) },
      { by: seeker._id, price: 38000, conditions: "Agreed package for sangeet with setup from 2 PM.", at: ago(14) },
    ],
  });
  await Message.create([
    { quote: q3._id, sender: seeker._id, text: "Dear Arjun, organizing a 250-guest wedding sangeet. Can the terrace handle our customized stage and dance floor?", createdAt: ago(20) },
    { quote: q3._id, sender: provider._id, text: "Absolutely! Built-in teakwood dance area, sunset views, and fairy canopy ready.", createdAt: ago(16) },
    { quote: q3._id, sender: seeker._id, text: "Wonderful! Finalized at ₹38K. Looking forward to an unforgettable night.", createdAt: ago(14) },
    { quote: q3._id, sender: provider._id, text: "Thrilled to host! Our facility manager will coordinate with your decor team.", createdAt: ago(13) },
  ]);

  // Booking 2 from Quote 3
  const bk2 = await Booking.create({
    quote: q3._id, request: req3._id, listing: terrace._id,
    provider: provider._id, seeker: seeker._id, itemIndex: 0,
    start: req3.start, end: req3.end,
    quantity: 1, price: 38000, deposit: 8000, commission: 1900,
    conditions: "Full Skyline Terrace & Lawn access. Music till 11:30 PM.",
    logistics: "Guest entry via West Tower Lobby. Valet at Porte-Cochere.",
    cancellationHours: 24, status: "confirmed",
  });
  await Availability.create({
    listing: terrace._id, booking: bk2._id,
    start: req3.start, end: req3.end, quantity: 1,
    reason: "Booking — Wedding Sangeet",
  });
  req3.items[0].booking = bk2._id;
  await req3.save();

  // Quote 4: LED Wall for Wedding (active negotiation)
  const q4 = await Quote.create({
    request: req3._id, itemIndex: 2,
    provider: provider._id, seeker: seeker._id, listing: ledWall._id,
    status: "offered", version: 2,
    offers: [
      { by: provider._id, price: 32000, conditions: "20×10ft P2.6 Ultra-HD LED with Novastar 4K processor and custom truss.", at: ago(7) },
      { by: seeker._id, price: 28000, conditions: "₹28K if live video rehearsal is limited to 2 afternoon hours?", at: ago(2) },
    ],
  });
  await Message.create([
    { quote: q4._id, sender: provider._id, text: "The P2.6 LED has 3840Hz refresh — zero flicker for your wedding cinematographers!", createdAt: ago(7) },
    { quote: q4._id, sender: seeker._id, text: "Exactly what our video director insisted on. Counter-offer at ₹28K for sangeet night.", createdAt: ago(2) },
    { quote: q4._id, sender: provider._id, text: "Reviewing rigging schedule with crew. Should work if setup starts at 11 AM!", createdAt: ago(1) },
  ]);

  console.log(`✔ 4 quotes with chat messages seeded.`);
  console.log(`✔ 2 confirmed bookings (Sound + Terrace).`);

  // ─── 8. PAST COMPLETED BOOKINGS + REVIEWS ─────────────────────────
  const pastA_start = new Date(Date.now() - 14 * 86400000);
  const pastA_end = new Date(pastA_start.getTime() + 8 * 3600000);
  const pastReqA = await Request.create({
    seeker: seeker._id,
    title: "Global Executive Roundtable (Completed)",
    items: [{ category: "banquet_hall", quantity: 1, capacity: 300, specs: "Ballroom for leadership roundtable" }],
    location: { type: "Point", coordinates: [72.85, 19.07] },
    city: "Mumbai", radiusKm: 30,
    start: pastA_start, end: pastA_end,
    budget: 60000, urgency: "routine", delivery: false, status: "confirmed",
  });
  const pastQA = await Quote.create({
    request: pastReqA._id, itemIndex: 0,
    provider: provider._id, seeker: seeker._id, listing: ballroom._id,
    status: "accepted", version: 2,
    offers: [{ by: provider._id, price: 55000, conditions: "Full-day corporate rate.", at: new Date(pastA_start.getTime() - 2 * 86400000) }],
  });
  const pastBkA = await Booking.create({
    quote: pastQA._id, request: pastReqA._id, listing: ballroom._id,
    provider: provider._id, seeker: seeker._id, itemIndex: 0,
    start: pastA_start, end: pastA_end,
    quantity: 1, price: 55000, deposit: 15000, commission: 2750,
    conditions: "Full-day ballroom.", logistics: "Standard check-in.",
    cancellationHours: 24, status: "completed",
  });
  pastReqA.items[0].booking = pastBkA._id;
  await pastReqA.save();
  await Rating.create([
    { booking: pastBkA._id, from: seeker._id, to: provider._id, score: 5, comment: "Exceptional ballroom! Acoustics, lighting, and staff made our conference a huge success." },
    { booking: pastBkA._id, from: provider._id, to: seeker._id, score: 5, comment: "Priya's team is exemplary — punctual, respectful, and left the venue spotless." },
  ]);

  const pastB_start = new Date(Date.now() - 10 * 86400000);
  const pastB_end = new Date(pastB_start.getTime() + 6 * 3600000);
  const pastReqB = await Request.create({
    seeker: seeker._id,
    title: "Cinema Arts Preview & Filmmakers Gala (Completed)",
    items: [{ category: "av_equipment", quantity: 1, capacity: 1, specs: "4K laser projector and motorized screen" }],
    location: { type: "Point", coordinates: [72.83, 19.12] },
    city: "Mumbai", radiusKm: 25,
    start: pastB_start, end: pastB_end,
    budget: 20000, urgency: "routine", delivery: true, status: "confirmed",
  });
  const pastQB = await Quote.create({
    request: pastReqB._id, itemIndex: 0,
    provider: provider._id, seeker: seeker._id, listing: projector._id,
    status: "accepted", version: 2,
    offers: [{ by: provider._id, price: 18000, conditions: "4K laser projection package.", at: new Date(pastB_start.getTime() - 2 * 86400000) }],
  });
  const pastBkB = await Booking.create({
    quote: pastQB._id, request: pastReqB._id, listing: projector._id,
    provider: provider._id, seeker: seeker._id, itemIndex: 0,
    start: pastB_start, end: pastB_end,
    quantity: 1, price: 18000, deposit: 5000, commission: 900,
    conditions: "4K laser projection package.", logistics: "Delivered and rigged at venue.",
    cancellationHours: 24, status: "completed",
  });
  pastReqB.items[0].booking = pastBkB._id;
  await pastReqB.save();
  await Rating.create([
    { booking: pastBkB._id, from: seeker._id, to: provider._id, score: 5, comment: "Crisp 14,000 lumens 4K projection. Arjun's tech was punctual and extremely helpful." },
    { booking: pastBkB._id, from: provider._id, to: seeker._id, score: 4, comment: "Great production team. Clear cues and smooth equipment handover." },
  ]);

  // Past Booking C: Chairs + Tables bundle (for more review data)
  const pastC_start = new Date(Date.now() - 7 * 86400000);
  const pastC_end = new Date(pastC_start.getTime() + 10 * 3600000);
  const pastReqC = await Request.create({
    seeker: seeker._id,
    title: "Startup Demo Day & Investor Mixer (Completed)",
    items: [
      { category: "chairs", quantity: 100, capacity: 1, specs: "White folding chairs" },
      { category: "tables", quantity: 10, capacity: 4, specs: "Cocktail high-top tables" },
    ],
    location: { type: "Point", coordinates: [72.83, 19.00] },
    city: "Mumbai", radiusKm: 20,
    start: pastC_start, end: pastC_end,
    budget: 15000, urgency: "routine", delivery: true, status: "confirmed",
  });
  const pastQC = await Quote.create({
    request: pastReqC._id, itemIndex: 0,
    provider: provider._id, seeker: seeker._id, listing: foldChairs._id,
    status: "accepted", version: 1,
    offers: [{ by: provider._id, price: 4500, conditions: "100 white folding chairs for full day.", at: new Date(pastC_start.getTime() - 86400000) }],
  });
  const pastBkC = await Booking.create({
    quote: pastQC._id, request: pastReqC._id, listing: foldChairs._id,
    provider: provider._id, seeker: seeker._id, itemIndex: 0,
    start: pastC_start, end: pastC_end,
    quantity: 100, price: 4500, deposit: 2000, commission: 225,
    conditions: "100 white resin chairs.", logistics: "Delivered morning of.",
    cancellationHours: 12, status: "completed",
  });
  pastReqC.items[0].booking = pastBkC._id;
  await pastReqC.save();
  await Rating.create([
    { booking: pastBkC._id, from: seeker._id, to: provider._id, score: 4, comment: "Clean chairs, on-time delivery. A few had minor scuffs but overall great." },
    { booking: pastBkC._id, from: provider._id, to: seeker._id, score: 5, comment: "Priya's team returned all 100 chairs neatly stacked. Pleasure working together." },
  ]);

  console.log(`✔ 3 completed past bookings with 6 bilateral reviews.`);

  // ─── 9. DISPUTES ──────────────────────────────────────────────────
  await Dispute.create({
    booking: pastBkA._id, openedBy: seeker._id,
    reason: "Air conditioning chiller startup delay during first 20 minutes of vendor load-in.",
    resolution: "Resolved promptly by facility engineering. Arjun offered complimentary tea & espresso lounge.",
    status: "resolved",
  });
  console.log(`✔ 1 resolved dispute.`);

  // ─── 10. SEARCH EVENTS (market analytics) ─────────────────────────
  for (const cat of ["banquet_hall", "av_equipment", "chairs", "tables", "kitchen", "linens"]) {
    await SearchEvent.create([
      { user: seeker._id, category: cat, city: "Mumbai", resultCount: Math.floor(Math.random() * 12) + 3 },
      { user: seeker._id, category: cat, city: "Mumbai", resultCount: Math.floor(Math.random() * 8) + 5 },
    ]);
  }
  console.log(`✔ 12 search events.`);

  // ─── 11. SAVED SEARCHES ───────────────────────────────────────────
  await SavedSearch.create([
    { owner: seeker._id, name: "Mumbai Banquet Halls (300+ guests)", filters: { category: "banquet_hall", city: "Mumbai", capacity: 300 }, lastNotifiedAt: new Date() },
    { owner: seeker._id, name: "4K LED Screens & Concert Audio", filters: { category: "av_equipment", city: "Mumbai" }, lastNotifiedAt: new Date() },
    { owner: seeker._id, name: "Affordable Chairs Bulk Rental", filters: { category: "chairs", city: "Mumbai", budget: 10000 }, lastNotifiedAt: new Date() },
  ]);
  console.log(`✔ 3 saved searches.`);

  // ─── 12. INSIGHTS (market intelligence) ───────────────────────────
  await Insight.create([
    {
      owner: provider._id,
      text: "High weekend demand for BKC luxury banquet halls (+34% MoM). Dynamic surge pricing of 15% recommended on Friday and Saturday.",
      metrics: { utilizationRate: 82, revenueTrend: "+18%", averageBookingValue: 62000, topCategory: "banquet_hall" },
      generatedAt: new Date(),
    },
    {
      owner: provider._id,
      text: "Concert line-array sound and 4K LED walls have reached 88% weekend utilization across Andheri and Bandra.",
      metrics: { utilizationRate: 88, repeatClients: 6, averageLeadDays: 14, topCategory: "av_equipment" },
      generatedAt: new Date(),
    },
    {
      owner: seeker._id,
      text: "Multi-item RFQ requests for corporate conferences achieved 12% average cost reduction across venue + AV bundles.",
      metrics: { savingsRate: "12%", fulfilledRequests: 3, preferredDistrict: "BKC", totalSaved: 16800 },
      generatedAt: new Date(),
    },
    {
      owner: seeker._id,
      text: "Wedding season booking lead times have widened to 21 days. Securing terrace lawns and LED screens early avoids price surges.",
      metrics: { activeNegotiations: 2, confirmedBookings: 2, totalCommitted: 58000 },
      generatedAt: new Date(),
    },
    {
      owner: admin._id,
      text: "Platform GMV is ₹1,35,500 this month across 5 confirmed bookings. Commission revenue: ₹6,775.",
      metrics: { gmv: 135500, commissionRevenue: 6775, activeListings: 15, registeredBusinesses: 3 },
      generatedAt: new Date(),
    },
  ]);
  console.log(`✔ 5 market intelligence insights.`);

  // ─── 13. NOTIFICATIONS ────────────────────────────────────────────
  await Notification.create([
    { user: provider._id, title: "New Counter-Offer", body: "Priya proposed ₹60K for The Imperial Crystal Ballroom.", href: "/dashboard/negotiations" },
    { user: provider._id, title: "Booking Confirmed", body: "Priya confirmed Skyline Terrace & Lawn (₹38,000).", href: "/dashboard/bookings", readAt: new Date() },
    { user: provider._id, title: "New Quote Inquiry", body: "Priya sent a counter-offer of ₹28K for the LED Video Wall.", href: "/dashboard/negotiations" },
    { user: provider._id, title: "Review Received", body: "Priya left a 5-star review: 'Exceptional ballroom!'", href: "/dashboard/reviews", readAt: new Date() },
    { user: provider._id, title: "Sound System Reserved", body: "JBL VTX booking confirmed for Tech Leaders Summit (₹20K).", href: "/dashboard/bookings", readAt: new Date() },
    { user: seeker._id, title: "Counter-Offer from Arjun", body: "Arjun proposed ₹60K for the Imperial Crystal Ballroom.", href: "/dashboard/negotiations" },
    { user: seeker._id, title: "Sound System Reserved", body: "JBL VTX Sound System booking confirmed.", href: "/dashboard/bookings", readAt: new Date() },
    { user: seeker._id, title: "Terrace Confirmed", body: "Skyline Terrace is confirmed for your Wedding Sangeet.", href: "/dashboard/bookings" },
    { user: seeker._id, title: "LED Wall Offer", body: "Arjun responded to your LED Wall inquiry.", href: "/dashboard/negotiations", readAt: new Date() },
    { user: seeker._id, title: "Review Received", body: "Arjun gave you a 5-star review: 'Exemplary event organizers!'", href: "/dashboard/reviews", readAt: new Date() },
    { user: admin._id, title: "New Business Registered", body: "Arjun Mehta Events & Hospitality joined as a Provider.", href: "/admin/verifications", readAt: new Date() },
    { user: admin._id, title: "New Business Registered", body: "Priya Sharma Productions joined as a Seeker.", href: "/admin/verifications", readAt: new Date() },
    { user: admin._id, title: "Dispute Filed", body: "Priya filed a dispute about AC delay during load-in.", href: "/admin/disputes", readAt: new Date() },
    { user: admin._id, title: "Dispute Resolved", body: "AC chiller dispute resolved amicably.", href: "/admin/disputes", readAt: new Date() },
  ]);
  console.log(`✔ 14 notifications.`);

  // ─── 14. EVENT PLANS (AI Conductor) ───────────────────────────────
  await EventPlan.create([
    {
      owner: seeker._id, version: 1,
      input: { brief: "Annual Tech Summit for 400 executives with keynote theater and gala dinner in Mumbai.", budget: 150000, attendees: 400 },
      result: {
        summary: "Comprehensive venue, sound, and seating plan for BKC district.",
        estimatedTotal: 138000,
        packages: [
          { item: "The Imperial Crystal Ballroom", cost: 60000, provider: "Arjun Mehta Events" },
          { item: "JBL VTX Concert Sound System", cost: 20000, provider: "Arjun Mehta Events" },
          { item: "250 Gold Chiavari Chairs", cost: 22500, provider: "Arjun Mehta Events" },
        ],
      },
      request: req1._id,
    },
    {
      owner: seeker._id, version: 1,
      input: { brief: "Royal Wedding Sangeet with outdoor terrace and LED backdrop for 250 guests.", budget: 180000, attendees: 250 },
      result: {
        summary: "Sunset terrace setup with 4K LED backdrop and golden Chiavari seating.",
        estimatedTotal: 172000,
        packages: [
          { item: "Skyline Rooftop Terrace & Garden Lawn", cost: 38000, provider: "Arjun Mehta Events" },
          { item: "P2.6 Ultra-HD LED Video Wall", cost: 28000, provider: "Arjun Mehta Events" },
          { item: "200 Gold Chiavari Chairs", cost: 18000, provider: "Arjun Mehta Events" },
        ],
      },
      request: req3._id,
    },
  ]);
  console.log(`✔ 2 AI Conductor event plans.`);

  // ─── 15. AGENT RUNS (Agent Studio telemetry) ──────────────────────
  await AgentRun.create([
    {
      owner: provider._id, agent: "/ai/smart-price", status: "complete", elapsedMs: 840,
      steps: [
        { name: "demand-analysis", status: "complete", elapsedMs: 320, model: "gemini-2.5-flash", inputTokens: 412, outputTokens: 128 },
        { name: "surge-calculation", status: "complete", elapsedMs: 520, model: "gemini-2.5-flash", inputTokens: 520, outputTokens: 185 },
      ],
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
    {
      owner: seeker._id, agent: "conductor", status: "complete", elapsedMs: 1420,
      steps: [
        { name: "rfq-parsing", status: "complete", elapsedMs: 460, model: "gemini-2.5-flash", inputTokens: 610, outputTokens: 240 },
        { name: "resource-matching", status: "complete", elapsedMs: 960, model: "gemini-2.5-flash", inputTokens: 890, outputTokens: 410 },
      ],
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
    {
      owner: provider._id, agent: "/ai/demand-forecast", status: "complete", elapsedMs: 1100,
      steps: [
        { name: "historical-trends", status: "complete", elapsedMs: 600, model: "gemini-2.5-flash", inputTokens: 380, outputTokens: 200 },
        { name: "forecast-projection", status: "complete", elapsedMs: 500, model: "gemini-2.5-flash", inputTokens: 450, outputTokens: 190 },
      ],
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
    {
      owner: admin._id, agent: "/ai/platform-health", status: "complete", elapsedMs: 720,
      steps: [
        { name: "liquidity-scan", status: "complete", elapsedMs: 350, model: "gemini-2.5-flash", inputTokens: 300, outputTokens: 150 },
        { name: "anomaly-check", status: "complete", elapsedMs: 370, model: "gemini-2.5-flash", inputTokens: 280, outputTokens: 140 },
      ],
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  ]);
  console.log(`✔ 4 agent run telemetry records.`);

  // ─── 16. MEMORIES (AI Conductor preferences) ─────────────────────
  await Memory.create([
    { owner: seeker._id, category: "preference", key: "preferred_district", value: "Bandra Kurla Complex (BKC)", confidence: 0.95, source: "booking_history" },
    { owner: seeker._id, category: "constraint", key: "min_capacity", value: "200 guests", confidence: 1, source: "user_stated" },
    { owner: seeker._id, category: "vendor_affinity", key: "trusted_provider", value: "Arjun Mehta Events & Hospitality", confidence: 0.9, source: "booking_history" },
    { owner: seeker._id, category: "logistics", key: "delivery_required", value: "true", confidence: 1, source: "user_stated", pinned: true },
    { owner: provider._id, category: "preference", key: "peak_pricing_days", value: "Friday, Saturday", confidence: 0.85, source: "inferred_brief" },
    { owner: provider._id, category: "constraint", key: "min_booking_hours", value: "4 hours for venues", confidence: 1, source: "user_stated", pinned: true },
  ]);
  console.log(`✔ 6 AI memory entries.`);

  // ─── 17. AUDIT LOG (for admin) ────────────────────────────────────
  await Audit.create([
    { actor: admin._id, action: "verify", target: String(provider._id), detail: "Approved business verification for Arjun Mehta Events.", createdAt: ago(72) },
    { actor: admin._id, action: "verify", target: String(seeker._id), detail: "Approved business verification for Priya Sharma Productions.", createdAt: ago(48) },
    { actor: admin._id, action: "resolve_dispute", target: String(pastBkA._id), detail: "Resolved AC chiller dispute amicably.", createdAt: ago(24) },
  ]);
  console.log(`✔ 3 audit log entries.`);

  // ─── 18. FAVORITES ────────────────────────────────────────────────
  await BusinessProfile.updateOne(
    { _id: seeker._id },
    { $set: { favorites: [ballroom._id, ledWall._id, pagodaTent._id] } }
  );
  console.log(`✔ 3 saved favorites for Priya.`);

  // ─── DONE ─────────────────────────────────────────────────────────
  console.log(`
=======================================================
     UTLIO DEMO SEEDING COMPLETE
=======================================================

Password for all accounts: Password123!

DEMO ACCOUNTS:
  🏢 arjun@utlio.com   (Arjun Mehta — Provider)
  🎯 priya@utlio.com   (Priya Sharma — Seeker)
  🛡️  admin@utlio.com   (Platform Admin)

DATA SUMMARY:
  • ${listings.length} active listings across ${categories.length} categories
  • 4 RFQ requirements
  • 4 active quotes (2 with bookings, 2 in negotiation)
  • 5 bookings (2 confirmed, 3 completed)
  • 6 bilateral reviews
  • 1 resolved dispute
  • 14 notifications
  • 5 market insights
  • 3 saved searches
  • 12 search events
  • 2 AI Conductor event plans
  • 4 agent telemetry runs
  • 6 AI memories
  • 3 audit log entries
=======================================================
`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
