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

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected successfully.");

  // 1. Categories
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
  console.log(`Verified ${categories.length} platform categories.`);

  // 2. Global Platform Setting
  await Setting.updateOne(
    { key: "platform" },
    { $set: { key: "platform", commissionPercent: 5, minBookingValue: 0 } },
    { upsert: true }
  );

  const hashedPassword = await bcrypt.hash("Password123!", 12);

  // 3. Demo User Accounts
  // Provider 1: Shreshta
  const shreshta = await BusinessProfile.findOneAndUpdate(
    { email: "shreshta@utlio.com" },
    {
      $set: {
        name: "Shreshta Banquets & Luxury Venues",
        email: "shreshta@utlio.com",
        passwordHash: hashedPassword,
        role: "business",
        mode: "provider",
        phone: "+91 98201 11001",
        category: "venue",
        city: "Mumbai",
        address: "Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
        gstin: "27SHRES1111A1Z1",
        verification: "verified",
        verificationNote: "Official audit verified: 5-Star luxury hospitality rating & trade license.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Provider: shreshta@utlio.com (ID: ${shreshta._id})`);

  // Provider 2: Shreyas
  const shreyas = await BusinessProfile.findOneAndUpdate(
    { email: "shreyas@utlio.com" },
    {
      $set: {
        name: "Shreyas AV & Event Infrastructure",
        email: "shreyas@utlio.com",
        passwordHash: hashedPassword,
        role: "business",
        mode: "provider",
        phone: "+91 98201 22002",
        category: "vendor",
        city: "Mumbai",
        address: "Andheri Industrial Estate, Andheri West, Mumbai, Maharashtra 400053",
        gstin: "27SHREY2222B1Z2",
        verification: "verified",
        verificationNote: "Certified pro audio, laser projection and LED video wall vendor.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Provider: shreyas@utlio.com (ID: ${shreyas._id})`);

  // Seeker 1: Shivam
  const shivam = await BusinessProfile.findOneAndUpdate(
    { email: "shivam@utlio.com" },
    {
      $set: {
        name: "Shivam Corporate Experiences",
        email: "shivam@utlio.com",
        passwordHash: hashedPassword,
        role: "business",
        mode: "seeker",
        phone: "+91 98202 33003",
        category: "event_organizer",
        city: "Mumbai",
        address: "Lower Parel Business District, Mumbai, Maharashtra 400013",
        gstin: "27SHIVM3333C1Z3",
        verification: "verified",
        verificationNote: "Accredited corporate summits & tech conference organizer.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Seeker: shivam@utlio.com (ID: ${shivam._id})`);

  // Seeker 2: Vaishnavi
  const vaishnavi = await BusinessProfile.findOneAndUpdate(
    { email: "vaishnavi@utlio.com" },
    {
      $set: {
        name: "Vaishnavi Grand Events & Galas",
        email: "vaishnavi@utlio.com",
        passwordHash: hashedPassword,
        role: "business",
        mode: "seeker",
        phone: "+91 98202 44004",
        category: "event_organizer",
        city: "Mumbai",
        address: "Juhu Tara Road, Juhu, Mumbai, Maharashtra 400049",
        gstin: "27VAISH4444D1Z4",
        verification: "verified",
        verificationNote: "Premier wedding, gala & awards production agency.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Seeker: vaishnavi@utlio.com (ID: ${vaishnavi._id})`);

  // Admin Account
  const admin = await BusinessProfile.findOneAndUpdate(
    { email: "admin@utlio.com" },
    {
      $set: {
        name: "Platform Chief Operations Director",
        email: "admin@utlio.com",
        passwordHash: hashedPassword,
        role: "admin",
        mode: "seeker",
        phone: "+91 98200 99999",
        category: "platform_operator",
        city: "Mumbai",
        verification: "verified",
        verificationNote: "Lead platform governance operator.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Admin: admin@utlio.com (ID: ${admin._id})`);

  // Clean old demo associations so new demo users own all clean records
  const demoUserIds = [shreshta._id, shreyas._id, shivam._id, vaishnavi._id];
  await Listing.deleteMany({ owner: { $in: demoUserIds } });
  await Request.deleteMany({ seeker: { $in: demoUserIds } });
  await Quote.deleteMany({
    $or: [{ provider: { $in: demoUserIds } }, { seeker: { $in: demoUserIds } }],
  });
  await Booking.deleteMany({
    $or: [{ provider: { $in: demoUserIds } }, { seeker: { $in: demoUserIds } }],
  });
  await Rating.deleteMany({
    $or: [{ from: { $in: demoUserIds } }, { to: { $in: demoUserIds } }],
  });
  await Dispute.deleteMany({ openedBy: { $in: demoUserIds } });
  await Notification.deleteMany({ user: { $in: demoUserIds } });
  await Insight.deleteMany({ owner: { $in: demoUserIds } });
  await SavedSearch.deleteMany({ owner: { $in: demoUserIds } });
  await EventPlan.deleteMany({ owner: { $in: demoUserIds } });
  await AgentRun.deleteMany({ owner: { $in: demoUserIds } });

  // 4. Listings for Shreshta (Venue & Hospitality Provider)
  const shreshtaListingsData = [
    {
      owner: shreshta._id,
      category: "banquet_hall",
      title: "The Grand Shreshta Crystal Ballroom",
      description: "Opulent 500-guest pillar-less ballroom with acoustic wall paneling, Italian marble flooring, and crystal chandeliers. Includes private VIP staging room and green rooms.",
      quantity: 1,
      capacity: 500,
      price: 65000,
      unit: "day",
      minHours: 4,
      deposit: 15000,
      delivery: false,
      deliveryFee: 0,
      conditions: "Outside sound setup permitted up to 75dB. Approved caterers only. Dedicated power backup included.",
      cancellationHours: 48,
      city: "Mumbai",
      address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { airConditioned: true, parkingCapacity: 150, stageEquipped: true, bridalSuite: true },
      photos: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"],
      dynamicPricing: {
        enabled: true,
        floorPrice: 50000,
        ceilingPrice: 90000,
        surgeMultiplier: 1.15,
        lastAdjustedAt: new Date(),
      },
    },
    {
      owner: shreshta._id,
      category: "banquet_hall",
      title: "Shreshta Skyview Garden Terrace & Lawn",
      description: "Stunning open-air sunset event terrace for 250 guests with teakwood dance floor, integrated fairy lights, and panoramic skyline view of BKC.",
      quantity: 1,
      capacity: 250,
      price: 38000,
      unit: "day",
      minHours: 3,
      deposit: 8000,
      delivery: false,
      deliveryFee: 0,
      conditions: "Complimentary valet parking included. Sound allowed till 11:30 PM per local hospitality regulations.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { outdoorLawn: true, sunsetView: true, valetAvailable: true, danceFloor: true },
      photos: ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: shreshta._id,
      category: "chairs",
      title: "Shreshta Royal Gold Chiavari Seating Suite",
      description: "Set of 350 pristine gold resin Chiavari chairs with ivory velvet cushioned seating. Stackable, scratch-free, and immaculately sanitized for high-end galas and receptions.",
      quantity: 350,
      capacity: 1,
      price: 90,
      unit: "day",
      minHours: 1,
      deposit: 3000,
      delivery: true,
      deliveryFee: 1500,
      conditions: "Returned dry and undamaged. Cushion covers dry-cleaned by provider.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Logistics Depot, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { material: "Resin Gold", includesVelvetCushion: true, stackable: true },
      photos: ["https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: shreshta._id,
      category: "tables",
      title: "Shreshta Solid Wood Round Banquet Dining Tables",
      description: "Heavy-duty 6-foot round dining tables accommodating 10 guests each. Features commercial vinyl edge moulding and folding steel legs.",
      quantity: 35,
      capacity: 10,
      price: 450,
      unit: "day",
      minHours: 1,
      deposit: 2000,
      delivery: true,
      deliveryFee: 1200,
      conditions: "Table linens or protective covers recommended. Setup assistance provided on delivery.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Logistics Depot, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { seatsPerTable: 10, diameterFeet: 6, foldable: true },
      photos: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: shreshta._id,
      category: "kitchen",
      title: "Shreshta Master Commercial Banquet Kitchen",
      description: "Fully-equipped 2,000 sq ft industrial prep kitchen featuring 8 high-pressure burners, tandoor station, walk-in cold room, and 5000 CFM exhaust hood.",
      quantity: 1,
      capacity: 1,
      price: 25000,
      unit: "day",
      minHours: 4,
      deposit: 8000,
      delivery: false,
      deliveryFee: 0,
      conditions: "Commercial catering license required. Daily deep-cleaning fee included in deposit.",
      cancellationHours: 48,
      city: "Mumbai",
      address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { burners: 8, walkInCooler: true, exhaustHoodCFM: 5000, gasPiped: true },
      photos: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80"],
    },
  ];

  const shreshtaListings = [];
  for (const item of shreshtaListingsData) {
    const l = await Listing.create(item);
    shreshtaListings.push(l);
  }
  console.log(`Seeded ${shreshtaListings.length} listings for Shreshta.`);

  // 5. Listings for Shreyas (AV & Equipment Provider)
  const shreyasListingsData = [
    {
      owner: shreyas._id,
      category: "av_equipment",
      title: "Shreyas JBL VTX Concert Line-Array Sound & Shure Wireless",
      description: "Concert-grade sound reinforcement system including 4x active subwoofers, 8x mid-high line array modules, Soundcraft digital mixer, and 4x Shure wireless handheld mics with pro audio engineer.",
      quantity: 2,
      capacity: 1,
      price: 22000,
      unit: "event",
      minHours: 1,
      deposit: 6000,
      delivery: true,
      deliveryFee: 1500,
      conditions: "Includes certified FOH sound engineer on-site for up to 8 hours.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "Andheri AV Center, Andheri West, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      status: "active",
      attributes: { brand: "JBL VTX / Shure Axient", powerWatts: 12000, soundEngineerIncluded: true },
      photos: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"],
      dynamicPricing: {
        enabled: true,
        floorPrice: 18000,
        ceilingPrice: 30000,
        surgeMultiplier: 1.1,
        lastAdjustedAt: new Date(),
      },
    },
    {
      owner: shreyas._id,
      category: "av_equipment",
      title: "Shreyas P2.6 Ultra-HD LED Stage Backdrop Video Wall (20x10ft)",
      description: "High-refresh rate 4K curved or flat LED video wall with Novastar processor, active redundancy power boxes, and heavy-duty ground-support truss.",
      quantity: 2,
      capacity: 1,
      price: 32000,
      unit: "event",
      minHours: 1,
      deposit: 10000,
      delivery: true,
      deliveryFee: 2500,
      conditions: "Includes 2 LED technicians for live camera feed and graphics switching.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "Andheri AV Center, Andheri West, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      status: "active",
      attributes: { resolution: "4K UHD", pixelPitchMm: 2.6, novastarController: true, riggingTruss: true },
      photos: ["https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: shreyas._id,
      category: "av_equipment",
      title: "Shreyas Christie 4K Laser Projector & 24ft Truss Screen",
      description: "14,000 ANSI Lumens native 4K laser projector capable of daylight visibility. Complete with dual HDMI/SDI matrix switcher and heavy-duty truss stand.",
      quantity: 1,
      capacity: 1,
      price: 18000,
      unit: "event",
      minHours: 1,
      deposit: 5000,
      delivery: true,
      deliveryFee: 1200,
      conditions: "Indoor and covered semi-outdoor use only. Operator included.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "Andheri AV Center, Andheri West, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      status: "active",
      attributes: { lumens: 14000, resolution: "4K Native", motorizedScreen: true },
      photos: ["https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: shreyas._id,
      category: "linens",
      title: "Shreyas Intelligent Moving-Head Stage Lighting Rig",
      description: "Touring-spec lighting rig comprising 12 Beam 230W moving heads, 16 LED par cans, GrandMA2 onPC console, and wireless DMX transmitters.",
      quantity: 2,
      capacity: 1,
      price: 15000,
      unit: "event",
      minHours: 1,
      deposit: 4000,
      delivery: true,
      deliveryFee: 1000,
      conditions: "Includes lighting programmer for concert or gala cues.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "Andheri AV Center, Andheri West, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      status: "active",
      attributes: { movingHeads: 12, dmxConsole: "GrandMA2", fogHazeMachines: true },
      photos: ["https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: shreyas._id,
      category: "linens",
      title: "Shreyas German Modular Heavy-Duty Event Pagoda Tents",
      description: "Commercial aluminum pagoda canopy tents (20x20ft) with waterproof PVC sidewalls, transparent cathedral windows, and wind stability up to 80 km/h.",
      quantity: 6,
      capacity: 50,
      price: 12000,
      unit: "day",
      minHours: 1,
      deposit: 3500,
      delivery: true,
      deliveryFee: 2000,
      conditions: "Requires secure ground anchoring. Rigging team sets up 4 hours prior.",
      cancellationHours: 48,
      city: "Mumbai",
      address: "Andheri AV Center, Andheri West, Mumbai",
      location: { type: "Point", coordinates: [72.835, 19.130] },
      status: "active",
      attributes: { dimensions: "20x20ft", waterproof: true, flameRetardant: true },
      photos: ["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"],
    },
  ];

  const shreyasListings = [];
  for (const item of shreyasListingsData) {
    const l = await Listing.create(item);
    shreyasListings.push(l);
  }
  console.log(`Seeded ${shreyasListings.length} listings for Shreyas.`);

  // 6. Requirements (RFQs) for Seekers
  // Shivam's Request 1: Tech Leaders Summit
  const shivamStart1 = new Date(Date.now() + 4 * 86400000);
  const shivamEnd1 = new Date(shivamStart1.getTime() + 12 * 3600000);

  const shivamReq1 = await Request.create({
    seeker: shivam._id,
    title: "Asia-Pacific Tech Leaders Summit & Awards 2026",
    items: [
      {
        category: "banquet_hall",
        quantity: 1,
        capacity: 400,
        specs: "Pillar-less ballroom with stage, VIP lounge and green rooms",
      },
      {
        category: "chairs",
        quantity: 250,
        capacity: 1,
        specs: "Chiavari or cushioned banquet chairs",
      },
      {
        category: "av_equipment",
        quantity: 1,
        capacity: 1,
        specs: "Concert sound reinforcement and Shure wireless mics",
      },
    ],
    location: { type: "Point", coordinates: [72.85, 19.07] },
    city: "Mumbai",
    radiusKm: 30,
    start: shivamStart1,
    end: shivamEnd1,
    budget: 140000,
    urgency: "routine",
    delivery: true,
    status: "partial",
  });

  // Shivam's Request 2: Fintech Founders Lounge
  const shivamStart2 = new Date(Date.now() + 10 * 86400000);
  const shivamEnd2 = new Date(shivamStart2.getTime() + 8 * 3600000);

  const shivamReq2 = await Request.create({
    seeker: shivam._id,
    title: "Fintech Founders Networking Lounge & Demo Night",
    items: [
      {
        category: "av_equipment",
        quantity: 1,
        capacity: 1,
        specs: "4K Laser Projector and motorized screen setup",
      },
      {
        category: "tables",
        quantity: 15,
        capacity: 10,
        specs: "Round banquet dining tables with covers",
      },
    ],
    location: { type: "Point", coordinates: [72.86, 19.08] },
    city: "Mumbai",
    radiusKm: 25,
    start: shivamStart2,
    end: shivamEnd2,
    budget: 50000,
    urgency: "urgent",
    delivery: true,
    status: "open",
  });
  console.log("Seeded 2 RFQ requirements for Shivam.");

  // Vaishnavi's Request 1: Royal Wedding Sangeet
  const vaishnaviStart1 = new Date(Date.now() + 6 * 86400000);
  const vaishnaviEnd1 = new Date(vaishnaviStart1.getTime() + 14 * 3600000);

  const vaishnaviReq1 = await Request.create({
    seeker: vaishnavi._id,
    title: "Royal Heritage Wedding Sangeet & Reception",
    items: [
      {
        category: "banquet_hall",
        quantity: 1,
        capacity: 250,
        specs: "Outdoor terrace or banquet lawn with scenic skyline backdrop",
      },
      {
        category: "chairs",
        quantity: 200,
        capacity: 1,
        specs: "Gold Chiavari chairs with ivory velvet cushions",
      },
      {
        category: "av_equipment",
        quantity: 1,
        capacity: 1,
        specs: "Ultra-HD LED backdrop video wall (20x10ft)",
      },
    ],
    location: { type: "Point", coordinates: [72.83, 19.12] },
    city: "Mumbai",
    radiusKm: 30,
    start: vaishnaviStart1,
    end: vaishnaviEnd1,
    budget: 180000,
    urgency: "routine",
    delivery: true,
    status: "partial",
  });

  // Vaishnavi's Request 2: Luxury Brand Auto Expo
  const vaishnaviStart2 = new Date(Date.now() + 14 * 86400000);
  const vaishnaviEnd2 = new Date(vaishnaviStart2.getTime() + 10 * 3600000);

  const vaishnaviReq2 = await Request.create({
    seeker: vaishnavi._id,
    title: "Luxury Brand Auto Expo & Media Premiere",
    items: [
      {
        category: "av_equipment",
        quantity: 1,
        capacity: 1,
        specs: "Concert line array sound and intelligent lighting rig",
      },
      {
        category: "linens",
        quantity: 2,
        capacity: 50,
        specs: "German modular weatherproof pagoda tents",
      },
    ],
    location: { type: "Point", coordinates: [72.87, 19.05] },
    city: "Mumbai",
    radiusKm: 25,
    start: vaishnaviStart2,
    end: vaishnaviEnd2,
    budget: 95000,
    urgency: "urgent",
    delivery: true,
    status: "open",
  });
  console.log("Seeded 2 RFQ requirements for Vaishnavi.");

  // 7. Quotes & Active Negotiations (Connecting all 4 users!)
  // Quote 1: Shreshta (Provider) <---> Shivam (Seeker) for Ballroom
  const ballroom = shreshtaListings[0];
  const quote1 = await Quote.create({
    request: shivamReq1._id,
    itemIndex: 0,
    provider: shreshta._id,
    seeker: shivam._id,
    listing: ballroom._id,
    status: "offered",
    version: 3,
    offers: [
      {
        by: shreshta._id,
        price: 65000,
        conditions: "Standard corporate full-day rate with staging, green rooms, podium and 150 parking slots.",
        at: new Date(Date.now() - 3600000 * 8),
      },
      {
        by: shivam._id,
        price: 58000,
        conditions: "Can we adjust to ₹58,000 if our team provides our own AV audio-visual engineers?",
        at: new Date(Date.now() - 3600000 * 4),
      },
      {
        by: shreshta._id,
        price: 60000,
        conditions: "Middle ground at ₹60,000 including early 8 AM load-in access and dedicated power backup generators.",
        at: new Date(Date.now() - 3600000 * 1),
      },
    ],
  });

  // Messages in Quote 1
  await Message.create([
    {
      quote: quote1._id,
      sender: shreshta._id,
      text: "Hello Shivam! The Grand Crystal Ballroom is tentatively reserved for your Asia-Pacific Tech Leaders Summit. Staging and backstage green rooms are included.",
      createdAt: new Date(Date.now() - 3600000 * 8),
    },
    {
      quote: quote1._id,
      sender: shivam._id,
      text: "Hi Shreshta! The ballroom photos and acoustics look remarkable. We proposed ₹58,000 since we're bringing our own AV sound engineers.",
      createdAt: new Date(Date.now() - 3600000 * 4),
    },
    {
      quote: quote1._id,
      sender: shreshta._id,
      text: "We can meet you at ₹60,000 with 8 AM early access, VIP valet lanes, and backup power generators.",
      createdAt: new Date(Date.now() - 3600000 * 1),
    },
    {
      quote: quote1._id,
      sender: shivam._id,
      text: "That works brilliantly for our event committee! I am reviewing the contract terms now.",
      createdAt: new Date(Date.now() - 1800000),
    },
  ]);
  console.log(`Seeded active Quote 1 (Shreshta <-> Shivam): ${quote1._id}`);

  // Quote 2: Shreyas (Provider) <---> Shivam (Seeker) for Sound (Accepted -> Confirmed Booking!)
  const soundSystem = shreyasListings[0];
  const quote2 = await Quote.create({
    request: shivamReq1._id,
    itemIndex: 2,
    provider: shreyas._id,
    seeker: shivam._id,
    listing: soundSystem._id,
    status: "accepted",
    version: 2,
    offers: [
      {
        by: shreyas._id,
        price: 22000,
        conditions: "JBL VTX line array setup with Soundcraft digital console, 4 Shure wireless mics and pro audio engineer.",
        at: new Date(Date.now() - 3600000 * 12),
      },
      {
        by: shivam._id,
        price: 20000,
        conditions: "Accepted corporate package rate for full 12-hour event duration.",
        at: new Date(Date.now() - 3600000 * 6),
      },
    ],
  });

  await Message.create([
    {
      quote: quote2._id,
      sender: shreyas._id,
      text: "Hey Shivam! Our JBL VTX system is pre-calibrated for crystal-clear keynote speeches and awards ceremonies.",
      createdAt: new Date(Date.now() - 3600000 * 12),
    },
    {
      quote: quote2._id,
      sender: shivam._id,
      text: "Great! We need 4 lapel microphones and 2 wireless handhelds. Counter-offered at ₹20,000.",
      createdAt: new Date(Date.now() - 3600000 * 6),
    },
    {
      quote: quote2._id,
      sender: shreyas._id,
      text: "Confirmed! Our lead sound engineer Rahul will arrive at 7:00 AM on summit day for full frequency soundcheck.",
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
  ]);

  // Booking 1 for Quote 2 (Shreyas + Shivam)
  const booking1 = await Booking.create({
    quote: quote2._id,
    request: shivamReq1._id,
    listing: soundSystem._id,
    provider: shreyas._id,
    seeker: shivam._id,
    itemIndex: 2,
    start: shivamStart1,
    end: shivamEnd1,
    quantity: 1,
    price: 20000,
    deposit: 5000,
    commission: 1000,
    conditions: "Full concert line-array sound reinforcement with FOH sound engineer included.",
    logistics: "Shreyas equipment truck delivers directly to BKC service bay at 7:00 AM. Handover to Shivam team.",
    cancellationHours: 24,
    status: "confirmed",
  });

  await Availability.create({
    listing: soundSystem._id,
    booking: booking1._id,
    start: shivamStart1,
    end: shivamEnd1,
    quantity: 1,
    reason: "Marketplace booking - Tech Summit",
  });

  // Link booking to request item
  shivamReq1.items[2].booking = booking1._id;
  await shivamReq1.save();
  console.log(`Seeded Booking 1 (Shreyas -> Shivam): ${booking1._id}`);

  // Quote 3: Shreshta (Provider) <---> Vaishnavi (Seeker) for Terrace Lawn (Accepted -> Confirmed Booking!)
  const terraceLawn = shreshtaListings[1];
  const quote3 = await Quote.create({
    request: vaishnaviReq1._id,
    itemIndex: 0,
    provider: shreshta._id,
    seeker: vaishnavi._id,
    listing: terraceLawn._id,
    status: "accepted",
    version: 2,
    offers: [
      {
        by: shreshta._id,
        price: 40000,
        conditions: "Full access to Skyview Terrace & Lawn with fairy lighting and valet attendants.",
        at: new Date(Date.now() - 3600000 * 20),
      },
      {
        by: vaishnavi._id,
        price: 38000,
        conditions: "Agreed package rate for wedding sangeet with setup access from 2 PM.",
        at: new Date(Date.now() - 3600000 * 14),
      },
    ],
  });

  await Message.create([
    {
      quote: quote3._id,
      sender: vaishnavi._id,
      text: "Dear Shreshta, we are organizing a 250-guest wedding sangeet dinner. Can the terrace accommodate our customized stage and teakwood dance floor?",
      createdAt: new Date(Date.now() - 3600000 * 20),
    },
    {
      quote: quote3._id,
      sender: shreshta._id,
      text: "Yes Vaishnavi! We have a built-in teakwood dance area, scenic sunset views, and fairy canopy lights ready.",
      createdAt: new Date(Date.now() - 3600000 * 16),
    },
    {
      quote: quote3._id,
      sender: vaishnavi._id,
      text: "Wonderful! We have finalized the booking at ₹38,000. Looking forward to an unforgettable night.",
      createdAt: new Date(Date.now() - 3600000 * 14),
    },
    {
      quote: quote3._id,
      sender: shreshta._id,
      text: "Thrilled to host your couple! Our facility manager Priya will coordinate directly with your decor team.",
      createdAt: new Date(Date.now() - 3600000 * 13),
    },
  ]);

  // Booking 2 for Quote 3 (Shreshta + Vaishnavi)
  const booking2 = await Booking.create({
    quote: quote3._id,
    request: vaishnaviReq1._id,
    listing: terraceLawn._id,
    provider: shreshta._id,
    seeker: vaishnavi._id,
    itemIndex: 0,
    start: vaishnaviStart1,
    end: vaishnaviEnd1,
    quantity: 1,
    price: 38000,
    deposit: 8000,
    commission: 1900,
    conditions: "Full access to Skyview Terrace & Lawn with valet attendants. Music allowed till 11:30 PM.",
    logistics: "Direct guest entry via West Tower Lobby. Valet parking attendants posted at Porte-Cochere.",
    cancellationHours: 24,
    status: "confirmed",
  });

  await Availability.create({
    listing: terraceLawn._id,
    booking: booking2._id,
    start: vaishnaviStart1,
    end: vaishnaviEnd1,
    quantity: 1,
    reason: "Marketplace booking - Wedding Sangeet",
  });

  vaishnaviReq1.items[0].booking = booking2._id;
  await vaishnaviReq1.save();
  console.log(`Seeded Booking 2 (Shreshta -> Vaishnavi): ${booking2._id}`);

  // Quote 4: Shreyas (Provider) <---> Vaishnavi (Seeker) for LED Video Wall (Active Negotiation!)
  const ledWall = shreyasListings[1];
  const quote4 = await Quote.create({
    request: vaishnaviReq1._id,
    itemIndex: 2,
    provider: shreyas._id,
    seeker: vaishnavi._id,
    listing: ledWall._id,
    status: "offered",
    version: 2,
    offers: [
      {
        by: shreyas._id,
        price: 32000,
        conditions: "20x10ft P2.6 Ultra-HD LED screen with Novastar 4K video processor and custom truss support.",
        at: new Date(Date.now() - 3600000 * 7),
      },
      {
        by: vaishnavi._id,
        price: 28000,
        conditions: "Can we do ₹28,000 if live video rehearsal is restricted to 2 hours in the afternoon?",
        at: new Date(Date.now() - 3600000 * 2),
      },
    ],
  });

  await Message.create([
    {
      quote: quote4._id,
      sender: shreyas._id,
      text: "Hello Vaishnavi! The P2.6 LED screen has ultra-high refresh rate (3840Hz) so your wedding cinematographers get zero scan lines or flicker on camera.",
      createdAt: new Date(Date.now() - 3600000 * 7),
    },
    {
      quote: quote4._id,
      sender: vaishnavi._id,
      text: "That's exactly what our videography director insisted on! Sent a counter-offer at ₹28,000 for the sangeet night.",
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      quote: quote4._id,
      sender: shreyas._id,
      text: "Reviewing the rigging schedule with our crew. That price should be feasible if setup commences at 11 AM!",
      createdAt: new Date(Date.now() - 3600000 * 1),
    },
  ]);
  console.log(`Seeded active Quote 4 (Shreyas <-> Vaishnavi): ${quote4._id}`);

  // 8. Completed Past Bookings & Ratings (for rich Reviews & Reputation)
  // Past Booking A: Shreshta (Provider) + Shivam (Seeker)
  const pastStartA = new Date(Date.now() - 14 * 86400000);
  const pastEndA = new Date(pastStartA.getTime() + 8 * 3600000);
  const pastReqA = await Request.create({
    seeker: shivam._id,
    title: "Global Executive Leadership Roundtable (Completed)",
    items: [
      {
        category: "banquet_hall",
        quantity: 1,
        capacity: 300,
        specs: "Banquet ballroom for corporate leadership roundtable",
      },
    ],
    location: { type: "Point", coordinates: [72.85, 19.07] },
    city: "Mumbai",
    radiusKm: 30,
    start: pastStartA,
    end: pastEndA,
    budget: 60000,
    urgency: "routine",
    delivery: false,
    status: "confirmed",
  });

  const pastQuoteA = await Quote.create({
    request: pastReqA._id,
    itemIndex: 0,
    provider: shreshta._id,
    seeker: shivam._id,
    listing: ballroom._id,
    status: "accepted",
    version: 2,
    offers: [
      {
        by: shreshta._id,
        price: 55000,
        conditions: "Full day banquet hall corporate rate.",
        at: new Date(pastStartA.getTime() - 86400000 * 2),
      },
    ],
  });

  const pastBookingA = await Booking.create({
    quote: pastQuoteA._id,
    request: pastReqA._id,
    listing: ballroom._id,
    provider: shreshta._id,
    seeker: shivam._id,
    itemIndex: 0,
    start: pastStartA,
    end: pastEndA,
    quantity: 1,
    price: 55000,
    deposit: 15000,
    commission: 2750,
    conditions: "Full day banquet hall rental.",
    logistics: "Standard check-in.",
    cancellationHours: 24,
    status: "completed",
  });
  pastReqA.items[0].booking = pastBookingA._id;
  await pastReqA.save();

  // Reviews for Booking A
  await Rating.create([
    {
      booking: pastBookingA._id,
      from: shivam._id,
      to: shreshta._id,
      score: 5,
      comment: "Exceptional ballroom! The acoustics, lighting, and hospitality staff made our leadership conference an unforgettable success. Zero friction.",
    },
    {
      booking: pastBookingA._id,
      from: shreshta._id,
      to: shivam._id,
      score: 5,
      comment: "Shivam and his team are exemplary event organizers. Punctual, respectful of venue regulations, and left the hall spotless.",
    },
  ]);

  // Past Booking B: Shreyas (Provider) + Vaishnavi (Seeker)
  const projector = shreyasListings[2];
  const pastStartB = new Date(Date.now() - 10 * 86400000);
  const pastEndB = new Date(pastStartB.getTime() + 6 * 3600000);
  const pastReqB = await Request.create({
    seeker: vaishnavi._id,
    title: "Cinema Arts Preview & Filmmakers Gala (Completed)",
    items: [
      {
        category: "av_equipment",
        quantity: 1,
        capacity: 1,
        specs: "4K Laser Projector and motorized screen setup",
      },
    ],
    location: { type: "Point", coordinates: [72.83, 19.12] },
    city: "Mumbai",
    radiusKm: 25,
    start: pastStartB,
    end: pastEndB,
    budget: 20000,
    urgency: "routine",
    delivery: true,
    status: "confirmed",
  });

  const pastQuoteB = await Quote.create({
    request: pastReqB._id,
    itemIndex: 0,
    provider: shreyas._id,
    seeker: vaishnavi._id,
    listing: projector._id,
    status: "accepted",
    version: 2,
    offers: [
      {
        by: shreyas._id,
        price: 18000,
        conditions: "4K Laser projection package with motorized screen.",
        at: new Date(pastStartB.getTime() - 86400000 * 2),
      },
    ],
  });

  const pastBookingB = await Booking.create({
    quote: pastQuoteB._id,
    request: pastReqB._id,
    listing: projector._id,
    provider: shreyas._id,
    seeker: vaishnavi._id,
    itemIndex: 0,
    start: pastStartB,
    end: pastEndB,
    quantity: 1,
    price: 18000,
    deposit: 5000,
    commission: 900,
    conditions: "4K Laser projection package with motorized screen.",
    logistics: "Delivered and rigged at Juhu venue.",
    cancellationHours: 24,
    status: "completed",
  });
  pastReqB.items[0].booking = pastBookingB._id;
  await pastReqB.save();

  // Reviews for Booking B
  await Rating.create([
    {
      booking: pastBookingB._id,
      from: vaishnavi._id,
      to: shreyas._id,
      score: 5,
      comment: "Crisp 14,000 lumens 4K projection and flawless audiovisual execution. Shreyas and his technician were punctual and extremely helpful.",
    },
    {
      booking: pastBookingB._id,
      from: shreyas._id,
      to: vaishnavi._id,
      score: 5,
      comment: "Fantastic creative production team to work with. Clear cues and seamless equipment handover. Highly recommended!",
    },
  ]);
  console.log("Seeded completed bookings and 4 verified bilateral reviews.");

  // 9. Resolved Dispute Record (To test Disputes & Claims page)
  await Dispute.create({
    booking: pastBookingA._id,
    openedBy: shivam._id,
    reason: "Air conditioning chiller startup delay during the first 20 minutes of vendor load-in.",
    resolution: "Facility engineering resolved the issue promptly; Shreshta offered complimentary tea & espresso lounge service.",
    status: "resolved",
  });
  console.log("Seeded resolved dispute entry.");

  // 10. Market Analytics & Search Events
  const searchCategories = ["banquet_hall", "av_equipment", "chairs", "tables", "kitchen"];
  for (const cat of searchCategories) {
    await SearchEvent.create([
      { user: shivam._id, category: cat, city: "Mumbai", resultCount: Math.floor(Math.random() * 12) + 3 },
      { user: vaishnavi._id, category: cat, city: "Mumbai", resultCount: Math.floor(Math.random() * 10) + 4 },
    ]);
  }
  console.log("Seeded search events for market analytics.");

  // 11. Saved Searches
  await SavedSearch.create([
    {
      owner: shivam._id,
      name: "Mumbai Pillar-less Banquet Halls (300+ Pax)",
      filters: { category: "banquet_hall", city: "Mumbai", minCapacity: 300 },
      lastNotifiedAt: new Date(),
    },
    {
      owner: vaishnavi._id,
      name: "4K LED Screens & Concert Audio Systems",
      filters: { category: "av_equipment", city: "Mumbai" },
      lastNotifiedAt: new Date(),
    },
  ]);
  console.log("Seeded saved searches for seekers.");

  // 12. Strategic Insights (for Demand Outlook & Market Intelligence)
  await Insight.create([
    {
      owner: shreshta._id,
      text: "High weekend demand for BKC luxury banquet halls (+34% MoM). Recommended dynamic surge pricing of 15% on Friday and Saturday slots.",
      metrics: { utilizationRate: 82, revenueTrend: "+18%", averageBookingValue: 62000 },
      generatedAt: new Date(),
    },
    {
      owner: shreyas._id,
      text: "Concert line-array sound and 4K LED backdrop walls have reached 88% weekend utilization in Andheri and Bandra corridors.",
      metrics: { utilizationRate: 88, repeatClients: 6, averageLeadDays: 14 },
      generatedAt: new Date(),
    },
    {
      owner: shivam._id,
      text: "Multi-item RFQ requests for corporate conferences achieved an average cost reduction of 12% across venue and audiovisual bundles.",
      metrics: { savingsRate: "12%", fulfilledRequests: 3, preferredDistrict: "BKC" },
      generatedAt: new Date(),
    },
    {
      owner: vaishnavi._id,
      text: "Wedding season booking lead times have widened to 21 days. Securing terrace lawns and LED screens early avoids price surges.",
      metrics: { activeNegotiations: 2, confirmedBookings: 1, totalCommitted: 76000 },
      generatedAt: new Date(),
    },
  ]);
  console.log("Seeded market intelligence insights.");

  // 13. Notifications for all 4 Demo Accounts
  const notificationsData = [
    {
      user: shreshta._id,
      title: "New Counter-Offer Received",
      body: "Shivam proposed ₹60,000 for The Grand Crystal Ballroom.",
      href: "/dashboard/negotiations",
      readAt: null,
    },
    {
      user: shreshta._id,
      title: "Booking Confirmed",
      body: "Vaishnavi confirmed booking for Skyview Terrace & Lawn (₹38,000).",
      href: "/dashboard/bookings",
      readAt: new Date(),
    },
    {
      user: shreyas._id,
      title: "New Negotiation Request",
      body: "Vaishnavi submitted a counter-offer of ₹28,000 for the P2.6 LED Video Wall.",
      href: "/dashboard/negotiations",
      readAt: null,
    },
    {
      user: shreyas._id,
      title: "Booking Confirmed",
      body: "Shivam reserved the JBL VTX Concert Line-Array System (₹20,000).",
      href: "/dashboard/bookings",
      readAt: new Date(),
    },
    {
      user: shivam._id,
      title: "Counter-Offer from Shreshta",
      body: "Shreshta proposed a middle ground of ₹60,000 for the Crystal Ballroom.",
      href: "/dashboard/negotiations",
      readAt: null,
    },
    {
      user: shivam._id,
      title: "Sound System Reserved",
      body: "Your booking for Shreyas's JBL VTX Sound System is confirmed.",
      href: "/dashboard/bookings",
      readAt: new Date(),
    },
    {
      user: vaishnavi._id,
      title: "Terrace Booking Confirmed",
      body: "Shreshta Skyview Garden Terrace is confirmed for your Wedding Sangeet.",
      href: "/dashboard/bookings",
      readAt: null,
    },
    {
      user: vaishnavi._id,
      title: "LED Wall Offer Ready",
      body: "Shreyas responded to your inquiry regarding the P2.6 Ultra-HD LED Wall.",
      href: "/dashboard/negotiations",
      readAt: new Date(),
    },
  ];

  for (const n of notificationsData) {
    await Notification.create(n);
  }
  console.log("Seeded notification feed for all demo accounts.");

  // 14. EventPlan (for AI Conductor)
  await EventPlan.create([
    {
      owner: shivam._id,
      version: 1,
      input: {
        brief: "Annual Asia-Pacific Tech Summit for 400 executives with keynote theater and gala dinner in Mumbai.",
        budget: 150000,
        attendees: 400,
      },
      result: {
        summary: "Comprehensive venue, concert audio, and executive seating plan formulated for BKC district.",
        estimatedTotal: 138000,
        packages: [
          { item: "The Grand Shreshta Crystal Ballroom", cost: 60000, provider: "Shreshta Banquets" },
          { item: "JBL VTX Concert Sound Reinforcement", cost: 20000, provider: "Shreyas AV" },
          { item: "250 Gold Chiavari Executive Chairs", cost: 22500, provider: "Shreshta Banquets" },
        ],
      },
      request: shivamReq1._id,
    },
    {
      owner: vaishnavi._id,
      version: 1,
      input: {
        brief: "Royal Heritage Wedding Sangeet with scenic outdoor terrace and cinematic LED backdrop for 250 guests.",
        budget: 180000,
        attendees: 250,
      },
      result: {
        summary: "Sunset garden terrace setup with 4K LED backdrop and golden Chiavari seating.",
        estimatedTotal: 172000,
        packages: [
          { item: "Shreshta Skyview Garden Terrace & Lawn", cost: 38000, provider: "Shreshta Banquets" },
          { item: "P2.6 Ultra-HD LED Stage Video Wall", cost: 28000, provider: "Shreyas AV" },
          { item: "200 Gold Chiavari Seating Suite", cost: 18000, provider: "Shreshta Banquets" },
        ],
      },
      request: vaishnaviReq1._id,
    },
  ]);
  console.log("Seeded AI Conductor event plans.");

  // 15. AgentRun Telemetry (for Agent Studio)
  await AgentRun.create([
    {
      owner: shreshta._id,
      agent: "/ai/smart-price",
      status: "complete",
      elapsedMs: 840,
      steps: [
        { name: "demand-analysis", status: "complete", elapsedMs: 320, model: "gemini-2.5-flash", inputTokens: 412, outputTokens: 128 },
        { name: "surge-calculation", status: "complete", elapsedMs: 520, model: "gemini-2.5-flash", inputTokens: 520, outputTokens: 185 },
      ],
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
    {
      owner: shivam._id,
      agent: "conductor",
      status: "complete",
      elapsedMs: 1420,
      steps: [
        { name: "rfq-parsing", status: "complete", elapsedMs: 460, model: "gemini-2.5-flash", inputTokens: 610, outputTokens: 240 },
        { name: "resource-matching", status: "complete", elapsedMs: 960, model: "gemini-2.5-flash", inputTokens: 890, outputTokens: 410 },
      ],
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  ]);
  console.log("Seeded Agent Studio execution telemetry.");

  console.log("\n=======================================================");
  console.log("     UTLIO COMPREHENSIVE DEMO SEEDING COMPLETE!        ");
  console.log("=======================================================");
  console.log("Password for all accounts: Password123!\n");
  console.log("PROVIDERS:");
  console.log("  1. shreshta@utlio.com  (Shreshta Banquets & Luxury Venues)");
  console.log("  2. shreyas@utlio.com   (Shreyas AV & Event Infrastructure)\n");
  console.log("SEEKERS:");
  console.log("  3. shivam@utlio.com    (Shivam Corporate Experiences)");
  console.log("  4. vaishnavi@utlio.com (Vaishnavi Grand Events & Galas)\n");
  console.log("ADMIN:");
  console.log("  5. admin@utlio.com     (Platform Chief Operations Director)");
  console.log("=======================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
