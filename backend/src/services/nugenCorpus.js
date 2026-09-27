export function generateB2BRentalCorpus() {
  const documents = [];

  documents.push({
    name: "b2b_rental_negotiation_strategies.txt",
    content: `B2B Industrial Equipment Rental Negotiation Guide — Utlio Platform

RENTAL PRICING STRATEGIES
In B2B equipment rentals, pricing follows several models:
- Daily rate: Best for short-term needs (1-7 days). Premium rates apply, typically 3-5% of equipment value per day.
- Weekly rate: Standard for project-based rentals. Usually 15-20% discount over daily rates.
- Monthly rate: Long-term rentals with 30-40% discount over daily rates. Requires deposit agreements.
- Volume pricing: Multiple units of same category qualify for 10-25% tier discounts.
- Seasonal adjustments: Construction equipment commands 15-30% premium during peak season (March-October).

NEGOTIATION TACTICS FOR SEEKERS
1. Bundle requests: Combining multiple equipment needs into single RFQ increases leverage.
2. Flexible dates: Offering date flexibility can reduce rates by 10-15%.
3. Long-term commitment: Committing to 3+ month rentals unlocks best rates.
4. Direct pickup: Waiving delivery saves the provider logistics cost, translatable to 5-8% discount.
5. Advance payment: Offering upfront payment can secure 3-5% additional discount.
6. Reference deals: Citing competitor quotes (with evidence) creates price pressure.

NEGOTIATION TACTICS FOR PROVIDERS
1. Value-add bundling: Include operator training, maintenance, or insurance to justify premium.
2. Urgency leverage: Time-critical requests support firmer pricing.
3. Condition premium: Well-maintained, certified equipment commands 10-20% higher rates.
4. Delivery inclusion: Offering free delivery on high-value rentals increases conversion.
5. Loyalty pricing: Repeat customer discounts (5-10%) build long-term revenue.

DEPOSIT AND SECURITY BEST PRACTICES
- Standard deposit: 20-30% of total rental value.
- High-value equipment: Up to 50% deposit with bank guarantee option.
- Refundable deposit timeline: 7-14 business days post-return inspection.
- Damage assessment: Joint inspection with photographic evidence at pickup and return.
- Insurance requirements: Minimum third-party liability; comprehensive recommended for equipment over INR 5 lakh.

CANCELLATION POLICIES
- Free cancellation: 48-72 hours before start date (industry standard).
- Late cancellation (24-48h): 25% cancellation fee.
- Same-day cancellation: 50-100% cancellation fee.
- No-show: Full rental period charge.
- Provider cancellation: Full refund plus 10% compensation to seeker.

CONTRACT TERMS
- Minimum rental period: Typically 1 day or 8 operating hours.
- Extension policy: Auto-extension at daily rate unless notified 24h in advance.
- Subletting: Generally prohibited without written provider consent.
- Liability: Renter responsible for damage beyond normal wear and tear.
- Force majeure: Both parties released from obligations during natural disasters, strikes, etc.
- Dispute resolution: Mediation first, then arbitration under Indian Arbitration Act.`,
  });

  documents.push({
    name: "b2b_equipment_categories.txt",
    content: `B2B Equipment Rental Categories — Utlio Platform

CONSTRUCTION EQUIPMENT
- Excavators (Mini, Standard, Large): Daily INR 3,000-25,000
- Backhoe Loaders: Daily INR 4,000-8,000
- Bulldozers: Daily INR 8,000-20,000
- Tower Cranes: Monthly INR 80,000-300,000
- Concrete Mixers: Daily INR 1,500-5,000
- Compactors/Rollers: Daily INR 3,000-12,000
- Scaffolding Systems: Per sqm/month INR 30-80

INDUSTRIAL MACHINERY
- CNC Machines: Monthly INR 25,000-150,000
- Welding Equipment: Daily INR 800-3,000
- Compressors (Air): Daily INR 1,500-6,000
- Generators (DG Sets): Daily INR 2,000-15,000 based on KVA
- Hydraulic Presses: Monthly INR 15,000-60,000

EVENT & TEMPORARY INFRASTRUCTURE
- Portable Cabins: Monthly INR 8,000-25,000
- Temporary Fencing: Per meter/month INR 50-150
- Portable Toilets: Monthly INR 3,000-8,000
- Lighting Towers: Daily INR 2,000-5,000
- Sound Systems: Daily INR 5,000-30,000

IT & OFFICE EQUIPMENT
- Laptops (bulk): Monthly INR 1,500-4,000 per unit
- Projectors: Daily INR 1,000-3,000
- Conference Systems: Daily INR 3,000-10,000
- Servers (rack): Monthly INR 15,000-50,000

LOGISTICS & MATERIAL HANDLING
- Forklifts: Daily INR 3,000-8,000
- Pallet Trucks: Monthly INR 5,000-12,000
- Conveyor Systems: Monthly INR 20,000-80,000
- Reach Stackers: Daily INR 15,000-30,000

CONDITION GRADING SYSTEM
- Grade A (Excellent): Less than 500 operating hours, like-new condition. Commands full list price.
- Grade B (Good): 500-2000 hours, normal wear, fully functional. 10-15% below list price.
- Grade C (Fair): 2000-5000 hours, visible wear, all functions operational. 20-30% below list.
- Grade D (Serviceable): 5000+ hours, significant wear, may need minor repairs. 40-50% below list.

CERTIFICATION REQUIREMENTS
- Cranes: Valid load test certificate (annual)
- Electrical equipment: PAT testing certificate
- Pressure vessels: IBR certificate
- Vehicles: Valid fitness certificate and insurance
- Fire equipment: Annual inspection certificate`,
  });

  documents.push({
    name: "b2b_rental_platform_operations.txt",
    content: `Utlio Platform Operations Guide — B2B Rental Marketplace

VERIFICATION FRAMEWORK
1. KYC Verification:
   - Business PAN verification
   - GSTIN validation (automated + manual)
   - Director/Partner identity verification
   - Registered address verification via GPS triangulation
   
2. Asset Verification:
   - Live video call with GPS watermark overlay
   - Cryptographic session watermarking (GPS + UTC timestamp + session ID)
   - Dynamic liveness challenge (write and display unique code)
   - 200m GPS proximity check against GSTIN registered address
   - Multi-angle photo documentation with EXIF data preservation

3. Anti-Fraud Measures:
   - Provider location verification during video calls
   - Seeker credit scoring based on rental history
   - Escrow payment protection
   - Joint condition documentation at handover
   - Return inspection with before/after comparison

TRANSACTION LIFECYCLE
1. Discovery: Seeker browses listings or posts requirement
2. RFQ: Seeker sends Request for Quotation to providers
3. Negotiation: Multi-round negotiation with AI advisory
4. Agreement: Terms locked, escrow deposit collected
5. Handover: Joint inspection, condition documentation
6. Active Rental: Usage period with support channel
7. Return: Return inspection, damage assessment
8. Settlement: Deposit refund minus damages, rating exchange

DISPUTE RESOLUTION
- Level 1: Platform-mediated chat between parties (24h response)
- Level 2: Platform arbitration with evidence review (72h)
- Level 3: External arbitration for disputes over INR 1 lakh
- Evidence accepted: Photos, videos, GPS logs, chat transcripts, contracts

RATING SYSTEM
- 5-star rating on: Equipment condition, Communication, Punctuality, Value
- Minimum 3 completed transactions to display public rating
- Fraudulent review detection via AI sentiment analysis
- Providers below 3.0 average flagged for review
- Seekers with damage history flagged with risk indicator

LOGISTICS INTEGRATION
- Self-pickup: Seeker arranges own transport
- Provider delivery: Provider handles transport, included in delivery fee
- Third-party logistics: Platform-recommended transport partners
- Inter-city: Advance booking required, additional transit insurance
- Real-time tracking: GPS tracking on all provider deliveries`,
  });

  documents.push({
    name: "b2b_rental_market_intelligence.txt",
    content: `B2B Equipment Rental Market Intelligence — India

MARKET OVERVIEW
- Indian equipment rental market: USD 5.3 billion (2025), growing at 12% CAGR
- Key sectors: Construction (45%), Manufacturing (25%), Events (15%), IT (10%), Others (5%)
- Rental penetration: Only 5% vs global average of 40-60%
- Growth drivers: Infra spending, GST formalization, asset-light business models

PRICING TRENDS
- Construction equipment: 5-8% annual rate increase
- IT equipment: 3-5% annual decrease (technology refresh cycle)
- Event equipment: Stable with 20-30% seasonal peaks
- Industrial machinery: 4-6% annual increase

DEMAND PATTERNS
- Q1 (Jan-Mar): Moderate demand, budget season
- Q2 (Apr-Jun): High demand, project starts post-monsoon preparation
- Q3 (Jul-Sep): Dip in outdoor construction due to monsoon
- Q4 (Oct-Dec): Peak demand, project completion rush, event season

REGIONAL INSIGHTS
- West India (Maharashtra, Gujarat): Highest rental density, competitive pricing
- South India (Karnataka, Tamil Nadu): Growing tech equipment rental
- North India (Delhi NCR, Punjab): Construction equipment dominated
- East India (West Bengal, Odisha): Emerging market, limited providers

COMPETITIVE ANALYSIS
- Organized rental: 20% of market, premium pricing, certified equipment
- Unorganized rental: 80% of market, price-competitive, variable quality
- Platform opportunity: Bridge quality gap with verification + fair pricing`,
  });

  return documents;
}
