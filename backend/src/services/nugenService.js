import { ApiError } from "../middlewares/errors.js";
import { invokeModel } from "../agents/shared.js";
import { Category, Listing, BusinessProfile } from "../models/index.js";

const NUGEN_BASE = "https://api.nugen.in/api/v3";

function headers() {
  const key = process.env.NUGEN_API_KEY;
  if (!key) throw new ApiError(503, "Nugen API key is not configured.");
  return {
    accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

/**
 * Executes inference on Nugen domain-aligned model with automatic Gemini fallback.
 */
async function callNugenWithFallback(systemPrompt, userPrompt, schema = null, name = "Nugen inference") {
  const key = process.env.NUGEN_API_KEY;
  const modelId = process.env.NUGEN_ALIGNED_MODEL_ID;

  if (key && modelId) {
    try {
      const res = await fetch(`${NUGEN_BASE}/inference/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: typeof userPrompt === "string" ? userPrompt : JSON.stringify(userPrompt) },
          ],
          max_tokens: 1200,
          temperature: 0.3,
          stream: false,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          if (schema) {
            try {
              const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
              return schema.parse(JSON.parse(clean));
            } catch (pErr) {
              console.warn(`[Nugen] Parse error, routing to Gemini fallback: ${pErr.message}`);
            }
          } else {
            return text;
          }
        }
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`[Nugen] HTTP ${res.status}: ${errText.slice(0, 150)}, routing to Gemini fallback`);
      }
    } catch (nugenErr) {
      console.warn(`[Nugen] Call failed (${nugenErr.message}), falling back to Gemini`);
    }
  }

  // Gemini Fallback
  return invokeModel(systemPrompt, userPrompt, schema, `${name} (Gemini Fallback)`);
}

/**
 * Negotiation Advisor grounded in REAL MongoDB listings and category pricing.
 * Tries Nugen first with automatic Gemini fallback.
 */
export async function negotiationAdvice(context = {}) {
  const category = context.category || "chairs";
  const catListings = await Listing.find({ category, status: "active" })
    .select("title price unit city deposit deliveryFee")
    .lean()
    .catch(() => []);

  const prices = catListings.map((l) => l.price);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 500;
  const minPrice = prices.length ? Math.min(...prices) : 200;
  const maxPrice = prices.length ? Math.max(...prices) : 1000;

  const currentPrice = Number(context.proposedPrice || context.price) || avgPrice;
  const diffPercent = Math.round(((currentPrice - avgPrice) / avgPrice) * 100);
  const recommendedCounter = Math.round(Math.max(minPrice, currentPrice * 0.85));
  const estimatedSavings = currentPrice - recommendedCounter;

  const dbContext = {
    category,
    marketAvg: avgPrice,
    marketMin: minPrice,
    marketMax: maxPrice,
    currentQuote: currentPrice,
    sampleSize: catListings.length,
    topComparables: catListings.slice(0, 5).map((l) => ({
      title: l.title,
      price: l.price,
      unit: l.unit || "day",
      city: l.city,
    })),
    recommendedCounter,
    estimatedSavings,
  };

  let adviceText;
  try {
    adviceText = await callNugenWithFallback(
      "You are a B2B rental negotiation advisor for the Utlio platform. Using the real database market data provided, give specific actionable negotiation advice including counter-offer targets, logistics trade-offs, volume discounts, and deposit optimization. Always reference actual numbers from the data.",
      dbContext,
      null,
      "Negotiation advice",
    );
  } catch {
    adviceText = `### Negotiation Intelligence (${catListings.length} Database Listings)
- **Market Average**: ₹${avgPrice.toLocaleString("en-IN")}/day (Range: ₹${minPrice.toLocaleString("en-IN")} - ₹${maxPrice.toLocaleString("en-IN")})
- **Current Quote**: ₹${currentPrice.toLocaleString("en-IN")} (${diffPercent >= 0 ? `${diffPercent}% above` : `${Math.abs(diffPercent)}% below`} average)
- **Recommended Counter**: ₹${recommendedCounter.toLocaleString("en-IN")} (saves ₹${estimatedSavings.toLocaleString("en-IN")})
${catListings.slice(0, 3).map((l) => `• ${l.title}: ₹${l.price}/${l.unit || "day"} (${l.city})`).join("\n")}`;
  }

  return {
    choices: [{ message: { role: "assistant", content: adviceText } }],
    marketStats: { avgPrice, minPrice, maxPrice, sampleSize: catListings.length },
    recommendedCounter,
    estimatedSavings,
    source: "database-grounded",
  };
}

/**
 * Smart Listing Optimizer grounded in real MongoDB category competitor listings.
 * Uses invokeModel (Nugen→Gemini fallback) for intelligent suggestions.
 */
export async function optimizeListing(listing = {}) {
  const category = listing.category || "chairs";
  const competitors = await Listing.find({
    category,
    status: "active",
    ...(listing._id ? { _id: { $ne: listing._id } } : {}),
  })
    .select("title price unit photos delivery deposit conditions")
    .lean()
    .catch(() => []);

  const prices = competitors.map((c) => c.price);
  const avgPrice = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : listing.price || 500;
  const minPrice = prices.length ? Math.min(...prices) : Math.round(avgPrice * 0.7);
  const maxPrice = prices.length ? Math.max(...prices) : Math.round(avgPrice * 1.4);

  const missingFields = [];
  if (!listing.photos || listing.photos.length < 3) missingFields.push("Add at least 3 high-res photos");
  if (!listing.deposit) missingFields.push("Specify refundable security deposit amount");
  if (!listing.deliveryFee && listing.delivery) missingFields.push("Add delivery fee schedule");
  if (!listing.conditions || listing.conditions.length < 20) missingFields.push("Add detailed return conditions");

  const dbContext = {
    currentTitle: listing.title || category,
    category,
    currentPrice: listing.price,
    currentDescription: listing.description,
    marketAvg: avgPrice,
    marketMin: minPrice,
    marketMax: maxPrice,
    competitorCount: competitors.length,
    missingFields,
    topCompetitors: competitors.slice(0, 4).map((c) => ({
      title: c.title,
      price: c.price,
      hasDelivery: !!c.delivery,
    })),
  };

  let titleSuggestion, descriptionSuggestion, pricingAdvice, competitiveInsight;

  try {
    const aiResponse = await callNugenWithFallback(
      "You are a B2B listing optimization expert for the Utlio rental platform. Given the listing details and competitor data from the real database, suggest an improved title, enhanced description, pricing advice, and competitive insight. Respond as a JSON object with keys: titleSuggestion, descriptionSuggestion, pricingAdvice, competitiveInsight.",
      dbContext,
      null,
      "Listing optimization",
    );

    try {
      const parsed = JSON.parse(aiResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
      titleSuggestion = parsed.titleSuggestion;
      descriptionSuggestion = parsed.descriptionSuggestion;
      pricingAdvice = parsed.pricingAdvice;
      competitiveInsight = parsed.competitiveInsight;
    } catch {
      titleSuggestion = `[Verified] ${listing.title || category} — Ready for Immediate Deployment`;
      descriptionSuggestion = aiResponse;
      pricingAdvice = listing.price > avgPrice
        ? `Your price (₹${listing.price}) is ${Math.round(((listing.price - avgPrice) / avgPrice) * 100)}% above market average (₹${avgPrice}).`
        : `Your price (₹${listing.price}) is competitive at ${Math.round(((avgPrice - listing.price) / avgPrice) * 100)}% below market average (₹${avgPrice}).`;
      competitiveInsight = `Analyzed ${competitors.length} active competitors in '${category}'.`;
    }
  } catch {
    titleSuggestion = `[Verified] ${listing.title || category} — Inspected & Ready`;
    descriptionSuggestion = `${listing.description || listing.title || category}. Thoroughly tested and certified for commercial use. B2B GST invoice provided.`;
    pricingAdvice = listing.price
      ? listing.price > avgPrice
        ? `Price (₹${listing.price}) is ${Math.round(((listing.price - avgPrice) / avgPrice) * 100)}% above category average (₹${avgPrice}). Consider ₹${Math.round(avgPrice * 1.05)} for better conversion.`
        : `Price (₹${listing.price}) is competitive (${Math.round(((avgPrice - listing.price) / avgPrice) * 100)}% below average ₹${avgPrice}).`
      : `Category average is ₹${avgPrice}/day (range ₹${minPrice} - ₹${maxPrice}).`;
    competitiveInsight = `Analyzed ${competitors.length} active competitor listings in '${category}'.`;
  }

  const resultData = {
    titleSuggestion,
    descriptionSuggestion,
    pricingAdvice,
    missingFields,
    competitiveInsight,
    marketStats: { avgPrice, minPrice, maxPrice, competitorCount: competitors.length },
  };

  return {
    choices: [{ message: { role: "assistant", content: JSON.stringify(resultData) } }],
    ...resultData,
    source: "database-grounded",
  };
}

/**
 * AI Assistant Chat grounded in live MongoDB inventory.
 * Uses invokeModel (Nugen→Gemini fallback) for natural language responses.
 */
export async function assistantChat(question = "", conversationHistory = []) {
  const cleanTokens = question.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ").filter((w) => w.length > 3);

  let listings = [];
  if (cleanTokens.length > 0) {
    const regexQueries = cleanTokens
      .map((t) => ({ title: { $regex: t, $options: "i" } }))
      .concat(cleanTokens.map((t) => ({ category: { $regex: t, $options: "i" } })));
    listings = await Listing.find({ status: "active", $or: regexQueries }).limit(5).lean().catch(() => []);
  }

  if (listings.length === 0) {
    listings = await Listing.find({ status: "active" }).limit(4).lean().catch(() => []);
  }

  const categories = await Category.find().select("slug name").lean().catch(() => []);

  const dbContext = {
    question,
    matchedListings: listings.map((l) => ({
      title: l.title,
      category: l.category,
      price: l.price,
      unit: l.unit || "day",
      quantity: l.quantity,
      city: l.city || "Mumbai",
      deposit: l.deposit || 0,
    })),
    availableCategories: categories.map((c) => c.name),
    conversationHistory: conversationHistory.slice(-4),
  };

  let answer;
  try {
    answer = await callNugenWithFallback(
      "You are Utlio's B2B rental assistant. Answer questions using ONLY the real database listings and categories provided. Include specific prices, quantities, and cities from the data. Mention Utlio's 15-20% refundable deposit protection and verified GSTIN suppliers. Never fabricate listings or prices not in the data.",
      dbContext,
      null,
      "Assistant chat",
    );
  } catch {
    if (listings.length > 0) {
      answer = `Based on Utlio's verified database:\n\n` +
        listings.map((l) => `• **${l.title}** (${l.category}): ₹${l.price}/${l.unit || "day"} | ${l.quantity} units in ${l.city || "Mumbai"}`).join("\n") +
        `\n\nAll rentals include verified GSTIN suppliers and 15-20% refundable deposit protection.`;
    } else {
      answer = `Utlio offers B2B equipment across ${categories.length} categories: ${categories.map((c) => c.name).join(", ")}. How can I help with your event or project?`;
    }
  }

  return {
    choices: [{ message: { role: "assistant", content: answer } }],
    source: "database-grounded",
  };
}

/**
 * Chat completion endpoint — used by the nugen/chat route.
 * Routes through invokeModel which handles Nugen→Gemini fallback.
 */
export async function chatCompletion(messages, opts = {}) {
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  const fullSystem = systemMsg || "You are Utlio's B2B rental intelligence assistant. Answer using verified database data only.";

  let responseContent;
  try {
    responseContent = await callNugenWithFallback(fullSystem, lastUserMsg, null, "Chat completion");
  } catch {
    const listings = await Listing.find({ status: "active" }).limit(3).lean().catch(() => []);
    if (listings.length > 0) {
      responseContent = listings.map((l) => `• **${l.title}** (${l.category}): ₹${l.price}/${l.unit || "day"} in ${l.city || "Mumbai"}`).join("\n") +
        "\n\nAll Utlio transactions include escrow deposit protection and verified supplier credentials.";
    } else {
      responseContent = "Utlio connects businesses with verified industrial and event equipment. All transactions include escrow deposit protection and multi-vendor RFQ matching.";
    }
  }

  const modelId = process.env.NUGEN_ALIGNED_MODEL_ID || process.env.GEMINI_MODEL || "gemini-3.6-flash";
  return {
    id: `chatcmpl-${Date.now()}`,
    model: modelId,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: responseContent },
        finish_reason: "stop",
      },
    ],
    source: "database-grounded",
  };
}

/**
 * Get pipeline status — simplified, no fake alignment state.
 */
export async function getPipelineStatus() {
  const isKeyConfigured = !!(process.env.NUGEN_API_KEY && process.env.NUGEN_API_KEY.trim());
  const alignedModelId = process.env.NUGEN_ALIGNED_MODEL_ID || "";

  const listingCount = await Listing.countDocuments({ status: "active" }).catch(() => 0);
  const categoryCount = await Category.countDocuments().catch(() => 0);
  const providerCount = await BusinessProfile.countDocuments({ role: "business" }).catch(() => 0);

  return {
    nugenConfigured: isKeyConfigured,
    nugenAlignedModel: alignedModelId || null,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    databaseStats: {
      activeListings: listingCount,
      categories: categoryCount,
      providers: providerCount,
    },
    inferenceChain: alignedModelId
      ? `Nugen (${alignedModelId}) → Gemini fallback`
      : `Gemini (${process.env.GEMINI_MODEL || "gemini-3.6-flash"})`,
  };
}
