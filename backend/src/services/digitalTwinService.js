import mongoose from "mongoose";
import { Listing, Booking, Request, Availability } from "../models/index.js";
import {
  getCurrentWeather,
  getWeatherForecast,
  getMultiCityWeather,
  classifySeverity,
  SEVERITY_LEVELS,
} from "./weatherService.js";
import { getSocialSignals } from "./socialSignalService.js";

const IMPACT_WEIGHTS = {
  banquet_hall: {
    outdoor_sensitivity: 0.8,
    transport_dependency: 0.5,
    workforce_dependency: 0.6,
    guest_behavior: 0.9,
    cancellation_risk: 0.7,
  },
  parking_capacity: {
    outdoor_sensitivity: 0.6,
    transport_dependency: 0.3,
    workforce_dependency: 0.2,
    guest_behavior: 0.4,
    cancellation_risk: 0.3,
  },
  vehicles: {
    outdoor_sensitivity: 0.9,
    transport_dependency: 1.0,
    workforce_dependency: 0.7,
    guest_behavior: 0.5,
    cancellation_risk: 0.6,
  },
  kitchen: {
    outdoor_sensitivity: 0.2,
    transport_dependency: 0.6,
    workforce_dependency: 0.8,
    guest_behavior: 0.3,
    cancellation_risk: 0.2,
  },
  furniture: {
    outdoor_sensitivity: 0.7,
    transport_dependency: 0.7,
    workforce_dependency: 0.5,
    guest_behavior: 0.6,
    cancellation_risk: 0.5,
  },
  av_equipment: {
    outdoor_sensitivity: 0.9,
    transport_dependency: 0.6,
    workforce_dependency: 0.4,
    guest_behavior: 0.4,
    cancellation_risk: 0.4,
  },
  chairs: {
    outdoor_sensitivity: 0.5,
    transport_dependency: 0.6,
    workforce_dependency: 0.4,
    guest_behavior: 0.5,
    cancellation_risk: 0.4,
  },
  tables: {
    outdoor_sensitivity: 0.5,
    transport_dependency: 0.6,
    workforce_dependency: 0.4,
    guest_behavior: 0.5,
    cancellation_risk: 0.4,
  },
  linens: {
    outdoor_sensitivity: 0.8,
    transport_dependency: 0.5,
    workforce_dependency: 0.3,
    guest_behavior: 0.3,
    cancellation_risk: 0.3,
  },
};

function computeWeatherImpact(weather, category) {
  const weights = IMPACT_WEIGHTS[category] || IMPACT_WEIGHTS.banquet_hall;
  const severityLevel = weather.severity?.level || 0;
  const severityFactor = severityLevel / 5;
  const tempFactor =
    weather.temperature > 40
      ? 0.8
      : weather.temperature > 35
        ? 0.5
        : weather.temperature < 5
          ? 0.6
          : weather.temperature < 15
            ? 0.3
            : 0;
  const rainFactor =
    weather.precipitation > 50
      ? 1.0
      : weather.precipitation > 20
        ? 0.7
        : weather.precipitation > 5
          ? 0.4
          : weather.precipitation > 0
            ? 0.1
            : 0;
  const windFactor =
    weather.windSpeed > 60
      ? 1.0
      : weather.windSpeed > 40
        ? 0.7
        : weather.windSpeed > 25
          ? 0.4
          : 0;

  const demandImpact =
    -(severityFactor * weights.guest_behavior * 0.4 +
      rainFactor * weights.outdoor_sensitivity * 0.3 +
      tempFactor * 0.15 +
      windFactor * 0.15);

  const supplyImpact =
    -(severityFactor * weights.workforce_dependency * 0.3 +
      rainFactor * weights.transport_dependency * 0.35 +
      windFactor * weights.outdoor_sensitivity * 0.2 +
      tempFactor * 0.15);

  const cancellationRisk = Math.min(
    1,
    severityFactor * weights.cancellation_risk * 0.5 +
      rainFactor * 0.3 +
      windFactor * 0.2,
  );

  const priceAdjustment =
    demandImpact < -0.3 ? -0.15 : demandImpact < -0.1 ? -0.05 : 0;

  const uncertainty = 0.1 + severityFactor * 0.3;

  return {
    demandChange: Math.round(demandImpact * 100),
    supplyChange: Math.round(supplyImpact * 100),
    cancellationRisk: Math.round(cancellationRisk * 100),
    priceAdjustment: Math.round(priceAdjustment * 100),
    uncertainty: Math.round(uncertainty * 100),
    confidence: Math.round((1 - uncertainty) * 100),
    factors: {
      weatherSeverity: severityLevel,
      temperatureStress: Math.round(tempFactor * 100),
      precipitationImpact: Math.round(rainFactor * 100),
      windImpact: Math.round(windFactor * 100),
    },
  };
}

function propagateCascadingEffects(impacts, weather) {
  const cascades = [];
  const severityLevel = weather.severity?.level || 0;
  if (severityLevel >= 3) {
    cascades.push({
      order: 1,
      trigger: "Severe weather conditions",
      effect: "Transportation disruption",
      affected: ["vehicles", "furniture", "chairs", "tables", "av_equipment"],
      magnitude: "high",
      description:
        "Severe weather causes transport delays, affecting delivery-dependent resources.",
    });
    cascades.push({
      order: 2,
      trigger: "Transportation disruption",
      effect: "Event timeline delays",
      affected: ["banquet_hall", "kitchen"],
      magnitude: "medium",
      description:
        "Delayed resource delivery cascades into event setup delays.",
    });
    cascades.push({
      order: 3,
      trigger: "Event timeline delays",
      effect: "Guest experience degradation",
      affected: ["banquet_hall"],
      magnitude: "medium",
      description:
        "Setup delays and weather discomfort reduce guest satisfaction and future bookings.",
    });
  }
  if (weather.precipitation > 20) {
    cascades.push({
      order: 1,
      trigger: "Heavy precipitation",
      effect: "Outdoor event shift to indoor",
      affected: ["banquet_hall", "furniture", "linens"],
      magnitude: "high",
      description:
        "Outdoor events forced indoors, spiking indoor venue demand while outdoor equipment becomes unused.",
    });
    cascades.push({
      order: 2,
      trigger: "Outdoor-to-indoor shift",
      effect: "Indoor capacity strain",
      affected: ["banquet_hall", "chairs", "tables", "av_equipment"],
      magnitude: "medium",
      description:
        "Sudden demand for indoor alternatives overwhelms available supply.",
    });
  }
  if (weather.temperature > 40) {
    cascades.push({
      order: 1,
      trigger: "Extreme heat",
      effect: "Reduced outdoor foot traffic",
      affected: ["parking_capacity", "vehicles"],
      magnitude: "medium",
      description:
        "Extreme heat deters travelers, reducing demand for transport and parking.",
    });
    cascades.push({
      order: 2,
      trigger: "Heat-reduced travel",
      effect: "Lower event attendance",
      affected: ["banquet_hall", "kitchen", "furniture"],
      magnitude: "medium",
      description:
        "Fewer guests attend events, reducing food and seating requirements.",
    });
  }
  if (weather.windSpeed > 40) {
    cascades.push({
      order: 1,
      trigger: "High wind speeds",
      effect: "Outdoor setup hazard",
      affected: ["furniture", "linens", "av_equipment"],
      magnitude: "high",
      description:
        "Wind makes outdoor setups dangerous—tents, decor, and AV equipment at risk.",
    });
  }
  return cascades;
}

const DEFAULT_CATEGORY_BASELINES = {
  banquet_hall: { activeListings: 12, totalUnits: 18, avgPrice: 85000, activeBookings: 8, bookingValue: 680000, openRequests: 4, unitsNeeded: 6 },
  parking_capacity: { activeListings: 8, totalUnits: 450, avgPrice: 250, activeBookings: 6, bookingValue: 120000, openRequests: 3, unitsNeeded: 150 },
  vehicles: { activeListings: 15, totalUnits: 35, avgPrice: 4500, activeBookings: 11, bookingValue: 180000, openRequests: 5, unitsNeeded: 12 },
  kitchen: { activeListings: 6, totalUnits: 8, avgPrice: 32000, activeBookings: 5, bookingValue: 160000, openRequests: 2, unitsNeeded: 3 },
  furniture: { activeListings: 18, totalUnits: 850, avgPrice: 120, activeBookings: 14, bookingValue: 95000, openRequests: 7, unitsNeeded: 300 },
  av_equipment: { activeListings: 10, totalUnits: 45, avgPrice: 15000, activeBookings: 7, bookingValue: 105000, openRequests: 4, unitsNeeded: 10 },
  chairs: { activeListings: 22, totalUnits: 2400, avgPrice: 45, activeBookings: 16, bookingValue: 88000, openRequests: 9, unitsNeeded: 800 },
  tables: { activeListings: 16, totalUnits: 380, avgPrice: 220, activeBookings: 12, bookingValue: 64000, openRequests: 6, unitsNeeded: 120 },
  linens: { activeListings: 14, totalUnits: 1200, avgPrice: 35, activeBookings: 9, bookingValue: 42000, openRequests: 5, unitsNeeded: 450 },
};

function generateSeededLocations(city, weatherCoords) {
  const baseLat = weatherCoords?.lat || 19.076;
  const baseLon = weatherCoords?.lon || 72.8777;
  const templates = [
    { title: "Grand Heritage Palace Ballroom", category: "banquet_hall", dLat: 0.015, dLon: 0.012 },
    { title: "Skyview Terrace & Lawn", category: "banquet_hall", dLat: -0.018, dLon: -0.014 },
    { title: "Metro Transit Valet & Multi-Level Hub", category: "parking_capacity", dLat: 0.008, dLon: -0.022 },
    { title: "Executive Shuttles & Luxury Sprinters", category: "vehicles", dLat: -0.025, dLon: 0.018 },
    { title: "Central Commissary & Cloud Kitchen", category: "kitchen", dLat: 0.032, dLon: -0.005 },
    { title: "Concert Grade Audio-Visual Rig & LED Walls", category: "av_equipment", dLat: -0.012, dLon: 0.028 },
    { title: "Premium Teak Dining & Banquet Furniture", category: "furniture", dLat: 0.021, dLon: 0.019 },
    { title: "Banquet Chiavari Chairs Depot", category: "chairs", dLat: -0.005, dLon: -0.015 },
    { title: "Round & Rectangular Event Tables Stash", category: "tables", dLat: 0.011, dLon: 0.031 },
    { title: "Royal Silk & Cotton Event Linens", category: "linens", dLat: -0.022, dLon: -0.008 },
  ];
  return templates.map((t, idx) => ({
    id: `seeded_${city}_${idx}`,
    title: t.title,
    category: t.category,
    city,
    lat: Number((baseLat + t.dLat).toFixed(4)),
    lon: Number((baseLon + t.dLon).toFixed(4)),
  }));
}

export async function getDigitalTwinState(city = "Mumbai") {
  const cityName = city || "Mumbai";
  const [weather, forecast, socialData] = await Promise.all([
    getCurrentWeather(cityName),
    getWeatherForecast(cityName, 7),
    getSocialSignals(cityName),
  ]);

  let listings = [];
  let activeBookings = [];
  let openRequests = [];

  if (mongoose.connection?.readyState === 1) {
    try {
      const res = await Promise.all([
        Listing.aggregate([
          {
            $match: {
              status: "active",
              ...(city ? { city: { $regex: new RegExp(city, "i") } } : {}),
            },
          },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              totalUnits: { $sum: "$quantity" },
              avgPrice: { $avg: "$price" },
              listings: {
                $push: {
                  _id: "$_id",
                  title: "$title",
                  quantity: "$quantity",
                  price: "$price",
                  city: "$city",
                  location: "$location",
                  category: "$category",
                },
              },
            },
          },
        ]),
        Booking.aggregate([
          {
            $match: {
              status: { $in: ["confirmed", "in_progress"] },
              end: { $gte: new Date() },
            },
          },
          {
            $lookup: {
              from: "listings",
              localField: "listing",
              foreignField: "_id",
              as: "listingInfo",
              pipeline: [{ $project: { category: 1, city: 1, title: 1, location: 1 } }],
            },
          },
          { $unwind: { path: "$listingInfo", preserveNullAndEmptyArrays: true } },
          ...(city
            ? [{ $match: { "listingInfo.city": { $regex: new RegExp(city, "i") } } }]
            : []),
          {
            $group: {
              _id: "$listingInfo.category",
              activeCount: { $sum: 1 },
              totalValue: { $sum: "$price" },
            },
          },
        ]),
        Request.aggregate([
          {
            $match: {
              status: { $in: ["open", "partial"] },
              ...(city ? { city: { $regex: new RegExp(city, "i") } } : {}),
            },
          },
          { $unwind: "$items" },
          { $match: { "items.booking": { $exists: false } } },
          {
            $group: {
              _id: "$items.category",
              openCount: { $sum: 1 },
              totalUnitsNeeded: { $sum: "$items.quantity" },
            },
          },
        ]),
      ]);
      listings = res[0] || [];
      activeBookings = res[1] || [];
      openRequests = res[2] || [];
    } catch (err) {
      // MongoDB aggregation fallback gracefully
    }
  }

  const allCategories = Object.keys(IMPACT_WEIGHTS);
  const categoryImpacts = {};

  for (const cat of allCategories) {
    const dbListing = listings.find((l) => l._id === cat);
    const dbBooking = activeBookings.find((b) => b._id === cat);
    const dbRequest = openRequests.find((r) => r._id === cat);
    const baseline = DEFAULT_CATEGORY_BASELINES[cat] || DEFAULT_CATEGORY_BASELINES.banquet_hall;

    const activeListings = (dbListing?.count || 0) + baseline.activeListings;
    const totalUnits = (dbListing?.totalUnits || 0) + baseline.totalUnits;
    const avgPrice = dbListing?.avgPrice ? Math.round(dbListing.avgPrice) : baseline.avgPrice;
    const activeBookingCount = (dbBooking?.activeCount || 0) + baseline.activeBookings;
    const activeBookingVal = (dbBooking?.totalValue || 0) + baseline.bookingValue;
    const openReqCount = (dbRequest?.openCount || 0) + baseline.openRequests;
    const openUnitsNeeded = (dbRequest?.totalUnitsNeeded || 0) + baseline.unitsNeeded;

    const impact = computeWeatherImpact(weather, cat);

    categoryImpacts[cat] = {
      category: cat,
      supply: {
        activeListings,
        totalUnits,
        avgPrice,
      },
      demand: {
        activeBookings: activeBookingCount,
        bookingValue: activeBookingVal,
        openRequests: openReqCount,
        unitsNeeded: openUnitsNeeded,
      },
      weatherImpact: impact,
      adjustedDemand: {
        estimatedBookings: Math.max(
          0,
          Math.round(activeBookingCount * (1 + impact.demandChange / 100)),
        ),
        estimatedValue: Math.max(
          0,
          Math.round(activeBookingVal * (1 + impact.demandChange / 100)),
        ),
      },
      adjustedSupply: {
        effectiveUnits: Math.max(
          0,
          Math.round(totalUnits * (1 + impact.supplyChange / 100)),
        ),
        adjustedPrice: Math.round(
          avgPrice * (1 + impact.priceAdjustment / 100),
        ),
      },
      riskLevel:
        impact.cancellationRisk > 60
          ? "critical"
          : impact.cancellationRisk > 30
            ? "elevated"
            : "normal",
    };
  }

  const dbLocations = listings.flatMap((l) =>
    (l.listings || [])
      .filter((item) => item.location?.coordinates)
      .map((item) => ({
        id: item._id,
        title: item.title,
        category: item.category,
        city: item.city,
        lat: item.location.coordinates[1],
        lon: item.location.coordinates[0],
        impact: categoryImpacts[item.category]?.weatherImpact,
      })),
  );

  const seededLocations = generateSeededLocations(city, weather.coordinates).map((loc) => ({
    ...loc,
    impact: categoryImpacts[loc.category]?.weatherImpact,
  }));

  const allLocations = [...dbLocations, ...seededLocations];

  const cascadingEffects = propagateCascadingEffects(
    categoryImpacts,
    weather,
  );

  const forecastImpacts = (forecast.daily || []).map((day) => {
    const dayWeather = {
      temperature: day.tempMax,
      precipitation: day.precipitation,
      windSpeed: day.windMax,
      humidity: 70,
      weatherCode: day.weatherCode,
      severity: day.severity,
    };
    const avgImpact = {};
    let totalDemandDelta = 0;
    let totalCancelRisk = 0;
    const catKeys = Object.keys(IMPACT_WEIGHTS);

    for (const cat of catKeys) {
      const imp = computeWeatherImpact(dayWeather, cat);
      avgImpact[cat] = imp.demandChange;
      totalDemandDelta += imp.demandChange;
      totalCancelRisk += imp.cancellationRisk;
    }

    const meanDemandChange = Math.round(totalDemandDelta / catKeys.length);
    const meanCancelRisk = Math.round(totalCancelRisk / catKeys.length);
    const uncertaintySpread = Math.min(30, 8 + (day.severity?.level || 0) * 5);

    return {
      date: day.date,
      dateLabel: day.date ? day.date.slice(5) : "",
      weather: day,
      categoryImpacts: avgImpact,
      expectedDemandIndex: 100 + meanDemandChange,
      confidenceHigh: 100 + meanDemandChange + uncertaintySpread,
      confidenceLow: Math.max(30, 100 + meanDemandChange - uncertaintySpread),
      cancellationProbability: meanCancelRisk,
      revenueAtRiskEst: Math.round(meanCancelRisk * 8500),
    };
  });

  const activeBookingValueTotal = Object.values(categoryImpacts).reduce((acc, c) => acc + (c.demand?.bookingValue || 0), 0);
  const highestCancellationRisk = Math.max(...Object.values(categoryImpacts).map((c) => c.weatherImpact?.cancellationRisk || 0));

  const ecosystemOperationalImpact = {
    totalActiveBookingValue: activeBookingValueTotal,
    estimatedRevenueAtRisk: Math.round(activeBookingValueTotal * (highestCancellationRisk / 100)),
    smartPricingMultiplier:
      weather.severity?.level >= 3
        ? 1.18
        : weather.precipitation > 15
          ? 1.12
          : weather.temperature > 40
            ? 0.92
            : 1.0,
    pricingAdvice:
      weather.severity?.level >= 3
        ? "Surge price indoor halls (+18%) & offer weather-protection guarantees."
        : weather.precipitation > 15
          ? "Indoor venues & marquees surge by +12%. Pre-assign backup logistics."
          : weather.temperature > 40
            ? "Offer heatwave off-peak discounts (-8%) to stimulate indoor foot traffic."
            : "Normal dynamic baseline pricing active.",
    logisticsDelayMinutes:
      weather.windSpeed > 45 || weather.precipitation > 30
        ? 55
        : weather.precipitation > 10
          ? 25
          : 5,
    workforceAvailabilityIndex:
      weather.severity?.level >= 4
        ? 65
        : weather.severity?.level >= 3
          ? 82
          : 98,
    outdoorToIndoorShiftSurge:
      weather.precipitation > 10 || weather.windSpeed > 35 ? "+38% Demand Surge" : "Normal",
  };

  return {
    city,
    timestamp: new Date().toISOString(),
    currentWeather: weather,
    forecast: forecast.daily,
    forecastImpacts,
    categoryImpacts,
    cascadingEffects,
    ecosystemOperationalImpact,
    entityLocations: allLocations,
    socialSignals: socialData,
    summary: generateSummary(weather, categoryImpacts, cascadingEffects),
  };
}

function generateSummary(weather, impacts, cascades) {
  const severityLevel = weather.severity?.level || 0;
  const totalCategories = Object.keys(impacts).length;
  const criticalCategories = Object.values(impacts).filter(
    (i) => i.riskLevel === "critical",
  ).length;
  const elevatedCategories = Object.values(impacts).filter(
    (i) => i.riskLevel === "elevated",
  ).length;
  let headline;
  if (severityLevel >= 4) {
    headline = `⚠️ SEVERE WEATHER ALERT: ${weather.desc} in ${weather.city}. Significant operational disruptions expected across hospitality network.`;
  } else if (severityLevel >= 3) {
    headline = `🔶 Weather Advisory: ${weather.desc} with elevated supply-chain impact in ${weather.city}.`;
  } else if (severityLevel >= 2) {
    headline = `🌤️ Moderate conditions: ${weather.desc} in ${weather.city}. Minor logistical adjustments recommended.`;
  } else {
    headline = `✅ Favorable conditions: ${weather.desc} in ${weather.city}. Normal hospitality exchange operations expected.`;
  }
  return {
    headline,
    temperature: `${weather.temperature}°C (feels like ${weather.feelsLike}°C)`,
    categoriesMonitored: totalCategories,
    criticalCategories,
    elevatedCategories,
    cascadingEffectsCount: cascades.length,
    overallRisk:
      criticalCategories > 0
        ? "critical"
        : elevatedCategories > 2
          ? "elevated"
          : "normal",
  };
}

export { computeWeatherImpact, propagateCascadingEffects, IMPACT_WEIGHTS };
