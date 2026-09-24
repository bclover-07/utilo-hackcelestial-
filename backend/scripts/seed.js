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
} from "../src/models/index.js";

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

  // 2. Settings
  await Setting.updateOne(
    { key: "platform" },
    { $set: { key: "platform", commissionPercent: 5, minBookingValue: 0 } },
    { upsert: true }
  );

  const hashedPassword = await bcrypt.hash("Password123!", 12);

  // 3. Demo Provider Account
  const provider = await BusinessProfile.findOneAndUpdate(
    { email: "provider@utlio.com" },
    {
      $set: {
        name: "The Grand Mumbai Palace & Banquets",
        email: "provider@utlio.com",
        passwordHash: hashedPassword,
        role: "business",
        mode: "provider",
        phone: "+91 98201 12345",
        category: "hotel",
        city: "Mumbai",
        address: "Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
        gstin: "27AAAAA0000A1Z5",
        verification: "verified",
        verificationNote: "Official audit verified: 5-Star hospitality rating & trade license.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Demo Provider: provider@utlio.com (ID: ${provider._id})`);

  // 4. Demo Seeker Account
  const seeker = await BusinessProfile.findOneAndUpdate(
    { email: "seeker@utlio.com" },
    {
      $set: {
        name: "Elite Corporate Events & Caterers",
        email: "seeker@utlio.com",
        passwordHash: hashedPassword,
        role: "business",
        mode: "seeker",
        phone: "+91 98202 54321",
        category: "event_organizer",
        city: "Mumbai",
        address: "Link Road, Andheri West, Mumbai, Maharashtra 400053",
        gstin: "27BBBBB1111B1Z2",
        verification: "verified",
        verificationNote: "Registered corporate event management agency.",
        sessionVersion: 1,
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded Demo Seeker: seeker@utlio.com (ID: ${seeker._id})`);

  // 5. Demo Admin Account
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
  console.log(`Seeded Demo Admin: admin@utlio.com (ID: ${admin._id})`);

  // 6. Seed Provider Listings
  const listingsData = [
    {
      owner: provider._id,
      category: "banquet_hall",
      title: "Royal Crystal Grand Ballroom",
      description: "Opulent 500-guest pillar-less ballroom with acoustic wall paneling, Italian marble flooring, and crystal chandeliers. Includes private VIP staging room.",
      quantity: 1,
      capacity: 500,
      price: 65000,
      unit: "day",
      minHours: 4,
      deposit: 15000,
      delivery: false,
      deliveryFee: 0,
      conditions: "Outside sound setup permitted up to 75dB. Approved caterers only.",
      cancellationHours: 48,
      city: "Mumbai",
      address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { airConditioned: true, parkingCapacity: 150, stageEquipped: true },
      photos: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: provider._id,
      category: "banquet_hall",
      title: "Executive Summit Boardroom & Terrace",
      description: "Modern executive event hall for 120 guests with breakout garden terrace, integrated high-speed WiFi, and motorized drop-down projection screen.",
      quantity: 1,
      capacity: 120,
      price: 22000,
      unit: "day",
      minHours: 2,
      deposit: 5000,
      delivery: false,
      deliveryFee: 0,
      conditions: "Complimentary valet parking included. Tea & coffee counter infrastructure ready.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Commercial Hub, Bandra East, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { airConditioned: true, terraceView: true, conferenceSetup: true },
      photos: ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: provider._id,
      category: "chairs",
      title: "Gold Chiavari Luxury Banquet Chairs",
      description: "Set of 250 pristine gold resin Chiavari chairs with ivory velvet cushioned seating. Stackable and scratch-free, perfect for high-end galas and weddings.",
      quantity: 250,
      capacity: 1,
      price: 85,
      unit: "day",
      minHours: 1,
      deposit: 2000,
      delivery: true,
      deliveryFee: 1500,
      conditions: "Returned dry and undamaged. Cushion covers dry-cleaned by provider.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Logistics Depot, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { material: "Resin", color: "Metallic Gold", includesCushion: true },
      photos: ["https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: provider._id,
      category: "av_equipment",
      title: "JBL Professional Dual Line-Array Sound & Shure Wireless Mics",
      description: "Concert-grade sound reinforcement system including 4x active subwoofers, 8x mid-high line array modules, Soundcraft digital mixer, and 4x Shure wireless handheld mics.",
      quantity: 2,
      capacity: 1,
      price: 15000,
      unit: "event",
      minHours: 1,
      deposit: 5000,
      delivery: true,
      deliveryFee: 1200,
      conditions: "Includes professional sound technician on-site for up to 8 hours.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Equipment Wing, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { brand: "JBL Pro / Shure", technicianIncluded: true, wattage: 8000 },
      photos: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"],
    },
    {
      owner: provider._id,
      category: "av_equipment",
      title: "Christie 4K Laser Projector & 20ft Motorized Screen",
      description: "12,000 ANSI Lumens native 4K laser projector capable of daylight visibility. Complete with dual HDMI/SDI matrix switcher and heavy-duty truss stand.",
      quantity: 1,
      capacity: 1,
      price: 18000,
      unit: "event",
      minHours: 1,
      deposit: 4000,
      delivery: true,
      deliveryFee: 1000,
      conditions: "Indoor and covered semi-outdoor use only. Operator included.",
      cancellationHours: 24,
      city: "Mumbai",
      address: "BKC Equipment Wing, Mumbai",
      location: { type: "Point", coordinates: [72.868, 19.066] },
      status: "active",
      attributes: { resolution: "4K UHD", lumens: 12000, screenWidthFt: 20 },
      photos: ["https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80"],
    },
  ];

  const createdListings = [];
  for (const item of listingsData) {
    const listing = await Listing.findOneAndUpdate(
      { owner: provider._id, title: item.title },
      { $set: item },
      { upsert: true, new: true }
    );
    createdListings.push(listing);
  }
  console.log(`Seeded ${createdListings.length} listings for Provider.`);

  // 7. Seed Seeker RFQ Requests
  const startDate1 = new Date(Date.now() + 4 * 86400000); // 4 days from now
  const endDate1 = new Date(startDate1.getTime() + 12 * 3600000); // +12 hours

  const req1 = await Request.findOneAndUpdate(
    { seeker: seeker._id, title: "Annual Fintech Leadership Gala Dinner 2026" },
    {
      $set: {
        seeker: seeker._id,
        title: "Annual Fintech Leadership Gala Dinner 2026",
        items: [
          { category: "banquet_hall", quantity: 1, capacity: 400, specs: "Pillar-less ballroom with stage and VIP area" },
          { category: "chairs", quantity: 200, capacity: 1, specs: "Chiavari or cushioned banquet chairs" },
          { category: "av_equipment", quantity: 1, capacity: 1, specs: "Concert sound and 4K display" },
        ],
        location: { type: "Point", coordinates: [72.83, 19.12] },
        city: "Mumbai",
        radiusKm: 30,
        start: startDate1,
        end: endDate1,
        budget: 95000,
        urgency: "routine",
        delivery: true,
        status: "open",
      },
    },
    { upsert: true, new: true }
  );

  const startDate2 = new Date(Date.now() + 10 * 86400000);
  const endDate2 = new Date(startDate2.getTime() + 8 * 3600000);

  const req2 = await Request.findOneAndUpdate(
    { seeker: seeker._id, title: "Wedding Reception Overflow Seating & Decor" },
    {
      $set: {
        seeker: seeker._id,
        title: "Wedding Reception Overflow Seating & Decor",
        items: [
          { category: "chairs", quantity: 150, capacity: 1, specs: "Gold or white Chiavari chairs" },
          { category: "tables", quantity: 15, capacity: 10, specs: "Round banquet dining tables" },
        ],
        location: { type: "Point", coordinates: [72.83, 19.12] },
        city: "Mumbai",
        radiusKm: 25,
        start: startDate2,
        end: endDate2,
        budget: 30000,
        urgency: "urgent",
        delivery: true,
        status: "open",
      },
    },
    { upsert: true, new: true }
  );
  console.log(`Seeded 2 active RFQ requests for Seeker.`);

  // 8. Seed Quote & Live Negotiation between Provider and Seeker
  const ballroom = createdListings[0];
  const quote = await Quote.findOneAndUpdate(
    { request: req1._id, provider: provider._id, listing: ballroom._id },
    {
      $set: {
        request: req1._id,
        itemIndex: 0,
        provider: provider._id,
        seeker: seeker._id,
        listing: ballroom._id,
        status: "offered",
        version: 2,
        offers: [
          {
            by: provider._id,
            price: 65000,
            deposit: 15000,
            conditions: "Standard rate with full banquet hall access, lighting & stage.",
            at: new Date(Date.now() - 3600000 * 5),
          },
          {
            by: seeker._id,
            price: 60000,
            deposit: 12000,
            conditions: "Can we bundle 4 extra hours for tech soundcheck and rehearsal?",
            at: new Date(Date.now() - 3600000 * 2),
          },
        ],
      },
    },
    { upsert: true, new: true }
  );

  // Seed Messages in Quote
  await Message.deleteMany({ quote: quote._id });
  await Message.insertMany([
    {
      quote: quote._id,
      sender: provider._id,
      text: "Hello! We have received your requirement for the Gala Dinner. The Royal Crystal Ballroom is fully available on your dates.",
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
    {
      quote: quote._id,
      sender: seeker._id,
      text: "Thank you! We love the venue photos. We made a counter-offer at ₹60,000 if we can get soundcheck access from 2 PM onwards.",
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      quote: quote._id,
      sender: provider._id,
      text: "That sounds reasonable. We can grant soundcheck access from 2 PM if your audio engineers coordinate with our facility manager.",
      createdAt: new Date(Date.now() - 3600000 * 1),
    },
  ]);
  console.log(`Seeded active negotiation thread on quote: ${quote._id}`);

  // 9. Seed Confirmed Booking
  const boardroom = createdListings[1];
  const bookingStart = new Date(Date.now() + 2 * 86400000);
  const bookingEnd = new Date(bookingStart.getTime() + 6 * 3600000);

  const booking = await Booking.findOneAndUpdate(
    { provider: provider._id, seeker: seeker._id, listing: boardroom._id },
    {
      $set: {
        provider: provider._id,
        seeker: seeker._id,
        listing: boardroom._id,
        quote: quote._id,
        request: req1._id,
        itemIndex: 0,
        start: bookingStart,
        end: bookingEnd,
        quantity: 1,
        price: 22000,
        deposit: 5000,
        logistics: "Direct check-in at 5th Floor Executive Wing Reception. Keycard handover to Ms. Priya (Elite Events).",
        conditions: "Complimentary parking for 25 vehicles. Projection system pre-tested.",
        status: "confirmed",
        cancellationHours: 24,
      },
    },
    { upsert: true, new: true }
  );

  // Mark calendar availability block for confirmed booking
  await Availability.findOneAndUpdate(
    { booking: booking._id },
    {
      $set: {
        listing: boardroom._id,
        booking: booking._id,
        start: bookingStart,
        end: bookingEnd,
        quantity: 1,
      },
    },
    { upsert: true }
  );
  console.log(`Seeded confirmed booking & availability block: ${booking._id}`);

  // 10. Seed Ratings & Reviews
  await Rating.findOneAndUpdate(
    { from: seeker._id, to: provider._id },
    {
      $set: {
        from: seeker._id,
        to: provider._id,
        booking: booking._id,
        score: 5,
        comment: "Flawless experience! The hall was spotless, acoustics were fantastic, and the facility team went above and beyond for our corporate attendees.",
      },
    },
    { upsert: true }
  );
  console.log("Seeded verified rating and review.");

  console.log("\n=======================================================");
  console.log("          UTLIO DEMO SEEDING COMPLETED SUCCESSFULLY!   ");
  console.log("=======================================================");
  console.log("Credentials:");
  console.log("  Provider: provider@utlio.com / Password123!");
  console.log("  Seeker:   seeker@utlio.com   / Password123!");
  console.log("  Admin:    admin@utlio.com    / Password123!");
  console.log("=======================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
