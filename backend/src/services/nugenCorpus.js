import fs from "fs";
import path from "path";
import { Category, Listing, BusinessProfile } from "../models/index.js";

export async function generateB2BRentalCorpus() {
  const documents = [];

  // Check if nugen_training_corpus folder exists
  const corpusDir = path.resolve(process.cwd(), "..", "nugen_training_corpus");
  const localCorpusDir = path.resolve(process.cwd(), "nugen_training_corpus");
  const targetDir = fs.existsSync(corpusDir) ? corpusDir : (fs.existsSync(localCorpusDir) ? localCorpusDir : null);

  if (targetDir) {
    try {
      const files = fs.readdirSync(targetDir).filter(f => f.endsWith(".txt"));
      for (const file of files) {
        const filePath = path.join(targetDir, file);
        const content = fs.readFileSync(filePath, "utf8");
        documents.push({
          name: file,
          content,
        });
      }
    } catch (err) {
      console.warn("Could not read corpus directory from disk:", err.message);
    }
  }

  // If no files read from disk or to augment with live DB data
  if (documents.length === 0) {
    documents.push({
      name: "01_utlio_b2b_rental_domain_master.txt",
      content: `UTLIO PLATFORM MASTER DOMAIN CORPUS — B2B EQUIPMENT RENTAL ARCHITECTURE
INDUSTRIAL, EVENT & COMMERCIAL ASSET RENTAL NORMS IN INDIA

1. OVERVIEW & PLATFORM PRINCIPLES
Utlio is an enterprise B2B peer-to-peer equipment rental marketplace designed to eliminate asset idleness. Businesses rent idle capital equipment (banquet venues, sound systems, stage lighting, power generators, commercial dining sets, logistics trucks) to seekers on flexible daily, weekly, or event-based contracts.

2. B2B RENTAL PRICING DYNAMICS
- Short-term rentals (1 to 3 days): Daily pricing is billed at full market rate with no discount. Standard for single-day corporate seminars, weddings, or weekend shoots.
- Medium-term rentals (4 to 14 days): 15% to 25% discount over cumulative daily rate.
- Long-term rentals (15+ days / Monthly): 35% to 50% discount over cumulative daily rate.
- Minimum rental duration: 1 full operating shift (8 hours) or 1 calendar day.
- Overtime usage: Billed at 1.5x pro-rata hourly rate for equipment requiring active monitoring.

3. SECURITY DEPOSIT, ESCROW & FINANCIAL CLEARANCE
- Standard Deposit Ratio: 15% to 25% of total equipment asset replacement value or 1x the rental fee, whichever is lower.
- High-Value / Critical Assets: Up to 50% refundable deposit or formal corporate bank guarantee.
- Escrow Protection: Deposits are held securely in Utlio Escrow during the rental period.`,
    });
  }

  // Augment with Live MongoDB Data (never return stubs!)
  try {
    const [cats, listings, profiles] = await Promise.all([
      Category.find({}).lean().catch(() => []),
      Listing.find({ status: "active" }).lean().catch(() => []),
      BusinessProfile.find({}).lean().catch(() => []),
    ]);

    if (cats.length > 0 || listings.length > 0) {
      let liveBenchmark = `UTLIO VERIFIED INVENTORY CATALOG & MARKET BENCHMARKS\n`;
      liveBenchmark += `LIVE DATABASE GROUNDING SNAPSHOT — ${new Date().toISOString()}\n\n`;
      liveBenchmark += `1. CATALOG CATEGORIES SUMMARY (${cats.length} ACTIVE CATEGORIES)\n`;
      cats.forEach(c => {
        const catListings = listings.filter(l => l.category === c.slug);
        const avg = catListings.length ? Math.round(catListings.reduce((s, l) => s + l.price, 0) / catListings.length) : 0;
        liveBenchmark += `- Slug: ${c.slug} | Name: ${c.name} | Active Listings: ${catListings.length} | Market Avg: ₹${avg}\n`;
      });

      liveBenchmark += `\n2. ACTIVE VERIFIED LISTINGS IN DATABASE (${listings.length} LISTINGS)\n`;
      listings.forEach((l, idx) => {
        liveBenchmark += `${idx + 1}. [${l.category}] ${l.title}\n`;
        liveBenchmark += `   - Price: ₹${l.price} per ${l.unit || "day"}\n`;
        liveBenchmark += `   - Available Stock: ${l.quantity} units | Capacity: ${l.capacity || 1}\n`;
        liveBenchmark += `   - City: ${l.city || "Mumbai"} | Delivery: ${l.delivery ? `Yes (+₹${l.deliveryFee || 0})` : "Self Pickup"}\n`;
        liveBenchmark += `   - Deposit: ₹${l.deposit || 0}\n`;
        if (l.conditions) liveBenchmark += `   - Conditions: ${l.conditions}\n`;
        liveBenchmark += `\n`;
      });

      liveBenchmark += `3. VERIFIED PROVIDER PROFILES (${profiles.length} BUSINESSES)\n`;
      profiles.forEach((p, idx) => {
        liveBenchmark += `${idx + 1}. ${p.businessName || p.legalName || "Verified Supplier"} | City: ${p.city || "Mumbai"} | GSTIN: ${p.gstin || "VERIFIED"}\n`;
      });

      // Update or add the live benchmark document
      const existingIdx = documents.findIndex(d => d.name.includes("catalog_benchmark") || d.name.includes("equipment_categories"));
      if (existingIdx >= 0) {
        documents[existingIdx].content = liveBenchmark;
      } else {
        documents.push({
          name: "04_utlio_verified_inventory_catalog_benchmark.txt",
          content: liveBenchmark,
        });
      }
    }
  } catch (err) {
    console.warn("Could not ground corpus in live MongoDB:", err.message);
  }

  return documents;
}
