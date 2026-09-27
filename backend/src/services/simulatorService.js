import mongoose from "mongoose";
import {
  computeWeatherImpact,
  propagateCascadingEffects,
  IMPACT_WEIGHTS,
} from "./digitalTwinService.js";
import { classifySeverity, decodeWeatherCode } from "./weatherService.js";
import { Listing, Booking, Request } from "../models/index.js";

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

function buildSyntheticWeather(baseWeather, overrides) {
  const synthetic = {
    ...baseWeather,
    temperature:
      overrides.temperature !== undefined
        ? overrides.temperature
        : baseWeather.temperature,
    precipitation:
      overrides.precipitation !== undefined
        ? overrides.precipitation
        : baseWeather.precipitation,
    rain:
      overrides.rain !== undefined ? overrides.rain : baseWeather.rain,
    windSpeed:
      overrides.windSpeed !== undefined
        ? overrides.windSpeed
        : baseWeather.windSpeed,
    windGusts:
      overrides.windGusts !== undefined
        ? overrides.windGusts
        : baseWeather.windGusts || baseWeather.windSpeed * 1.5,
    humidity:
      overrides.humidity !== undefined
        ? overrides.humidity
        : baseWeather.humidity,
    weatherCode:
      overrides.weatherCode !== undefined
        ? overrides.weatherCode
        : baseWeather.weatherCode,
    cloudCover:
      overrides.cloudCover !== undefined
        ? overrides.cloudCover
        : baseWeather.cloudCover,
  };
  const wmo = decodeWeatherCode(synthetic.weatherCode);
  synthetic.desc = wmo.desc;
  synthetic.icon = wmo.icon;
  synthetic.severity = classifySeverity(synthetic);
  synthetic.isSimulated = true;
  synthetic.overrides = overrides;
  return synthetic;
}

export async function runWhatIfSimulation(
  baseWeather,
  overrides,
  city = "Mumbai",
) {
  const syntheticWeather = buildSyntheticWeather(baseWeather, overrides);
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
              pipeline: [{ $project: { category: 1, city: 1 } }],
            },
          },
          { $unwind: { path: "$listingInfo", preserveNullAndEmptyArrays: true } },
          ...(city
            ? [
                {
                  $match: {
                    "listingInfo.city": { $regex: new RegExp(city, "i") },
                  },
                },
              ]
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
      // Fallback gracefully
    }
  }

  const allCategories = Object.keys(IMPACT_WEIGHTS);
  const baseImpacts = {};
  const simulatedImpacts = {};
  const comparison = {};

  for (const cat of allCategories) {
    const dbListing = listings.find((l) => l._id === cat);
    const dbBooking = activeBookings.find((b) => b._id === cat);
    const dbRequest = openRequests.find((r) => r._id === cat);
    const baseline = DEFAULT_CATEGORY_BASELINES[cat] || DEFAULT_CATEGORY_BASELINES.banquet_hall;

    const baseImpact = computeWeatherImpact(baseWeather, cat);
    const simImpact = computeWeatherImpact(syntheticWeather, cat);

    const bookingCount = (dbBooking?.activeCount || 0) + baseline.activeBookings;
    const bookingVal = (dbBooking?.totalValue || 0) + baseline.bookingValue;
    const requestCount = (dbRequest?.openCount || 0) + baseline.openRequests;

    baseImpacts[cat] = {
      ...baseImpact,
      activeBookings: bookingCount,
      bookingValue: bookingVal,
      openRequests: requestCount,
    };
    simulatedImpacts[cat] = {
      ...simImpact,
      activeBookings: bookingCount,
      bookingValue: bookingVal,
      openRequests: requestCount,
    };
    comparison[cat] = {
      category: cat,
      demandDelta: simImpact.demandChange - baseImpact.demandChange,
      supplyDelta: simImpact.supplyChange - baseImpact.supplyChange,
      riskDelta: simImpact.cancellationRisk - baseImpact.cancellationRisk,
      priceDelta: simImpact.priceAdjustment - baseImpact.priceAdjustment,
      direction:
        simImpact.demandChange < baseImpact.demandChange
          ? "worse"
          : simImpact.demandChange > baseImpact.demandChange
            ? "better"
            : "unchanged",
      baseRisk:
        baseImpact.cancellationRisk > 60
          ? "critical"
          : baseImpact.cancellationRisk > 30
            ? "elevated"
            : "normal",
      simulatedRisk:
        simImpact.cancellationRisk > 60
          ? "critical"
          : simImpact.cancellationRisk > 30
            ? "elevated"
            : "normal",
    };
  }
  const baseCascades = propagateCascadingEffects(baseImpacts, baseWeather);
  const simCascades = propagateCascadingEffects(
    simulatedImpacts,
    syntheticWeather,
  );
  const recommendations = generateRecommendations(
    comparison,
    syntheticWeather,
    baseCascades,
    simCascades,
  );
  return {
    scenario: {
      baseWeather: {
        temperature: baseWeather.temperature,
        precipitation: baseWeather.precipitation,
        windSpeed: baseWeather.windSpeed,
        weatherCode: baseWeather.weatherCode,
        desc: baseWeather.desc,
        severity: baseWeather.severity,
      },
      simulatedWeather: {
        temperature: syntheticWeather.temperature,
        precipitation: syntheticWeather.precipitation,
        windSpeed: syntheticWeather.windSpeed,
        weatherCode: syntheticWeather.weatherCode,
        desc: syntheticWeather.desc,
        severity: syntheticWeather.severity,
      },
      overridesApplied: overrides,
    },
    baseImpacts,
    simulatedImpacts,
    comparison,
    cascadingEffects: {
      base: baseCascades,
      simulated: simCascades,
      newEffects: simCascades.filter(
        (sc) => !baseCascades.some((bc) => bc.effect === sc.effect),
      ),
    },
    recommendations,
    timestamp: new Date().toISOString(),
  };
}

function generateRecommendations(comparison, weather, baseCascades, simCascades) {
  const recs = [];
  for (const [cat, comp] of Object.entries(comparison)) {
    if (comp.direction === "worse") {
      if (comp.riskDelta > 20) {
        recs.push({
          category: cat,
          priority: "high",
          type: "risk_mitigation",
          action: `Cancellation risk for ${cat.replace(/_/g, " ")} increases by ${comp.riskDelta}%. Proactively contact clients with confirmed bookings.`,
        });
      }
      if (comp.demandDelta < -15) {
        recs.push({
          category: cat,
          priority: "medium",
          type: "pricing",
          action: `Demand for ${cat.replace(/_/g, " ")} may drop by ${Math.abs(comp.demandDelta)}%. Consider offering weather-protection guarantees or discounts.`,
        });
      }
      if (comp.supplyDelta < -10) {
        recs.push({
          category: cat,
          priority: "medium",
          type: "logistics",
          action: `Supply availability for ${cat.replace(/_/g, " ")} reduced by ${Math.abs(comp.supplyDelta)}%. Pre-arrange backup logistics.`,
        });
      }
    }
    if (
      comp.simulatedRisk === "critical" &&
      comp.baseRisk !== "critical"
    ) {
      recs.push({
        category: cat,
        priority: "critical",
        type: "alert",
        action: `${cat.replace(/_/g, " ")} moves to CRITICAL risk under this scenario. Consider pausing new bookings and activating emergency protocols.`,
      });
    }
  }
  if (simCascades.length > baseCascades.length) {
    recs.push({
      category: "system",
      priority: "high",
      type: "cascade_warning",
      action: `${simCascades.length - baseCascades.length} additional cascading effects triggered. Cross-category coordination needed.`,
    });
  }
  if (weather.precipitation > 30) {
    recs.push({
      category: "system",
      priority: "high",
      type: "operational",
      action:
        "Heavy precipitation scenario: Advise all outdoor events to prepare indoor backup venues. Alert transport providers about potential route disruptions.",
    });
  }
  if (weather.temperature > 42) {
    recs.push({
      category: "system",
      priority: "high",
      type: "safety",
      action:
        "Extreme heat scenario: Ensure all outdoor venues have cooling arrangements. Advise rescheduling daytime outdoor events.",
    });
  }
  return recs.sort((a, b) => {
    const p = { critical: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] || 3) - (p[b.priority] || 3);
  });
}

export const PRESET_SCENARIOS = [
  {
    id: "heavy_monsoon",
    name: "Heavy Monsoon Rain",
    description: "Simulates intense monsoon rainfall with strong winds",
    overrides: {
      precipitation: 65,
      rain: 60,
      windSpeed: 45,
      weatherCode: 65,
      humidity: 95,
      cloudCover: 100,
    },
  },
  {
    id: "extreme_heat",
    name: "Extreme Heatwave",
    description: "Simulates scorching summer temperatures above 45°C",
    overrides: {
      temperature: 46,
      humidity: 20,
      windSpeed: 8,
      weatherCode: 0,
      cloudCover: 5,
      precipitation: 0,
    },
  },
  {
    id: "cyclone",
    name: "Cyclone / Severe Storm",
    description: "Simulates cyclonic conditions with extreme wind and rain",
    overrides: {
      precipitation: 120,
      rain: 110,
      windSpeed: 90,
      windGusts: 130,
      weatherCode: 99,
      humidity: 98,
      cloudCover: 100,
    },
  },
  {
    id: "mild_fog",
    name: "Dense Fog",
    description: "Simulates heavy fog reducing visibility",
    overrides: {
      weatherCode: 45,
      humidity: 100,
      windSpeed: 5,
      temperature: 12,
      cloudCover: 100,
      precipitation: 0,
    },
  },
  {
    id: "pleasant",
    name: "Perfect Weather",
    description: "Simulates ideal conditions for outdoor events",
    overrides: {
      temperature: 25,
      humidity: 50,
      windSpeed: 10,
      weatherCode: 1,
      cloudCover: 15,
      precipitation: 0,
    },
  },
  {
    id: "cold_snap",
    name: "Cold Snap",
    description: "Simulates unseasonal cold wave",
    overrides: {
      temperature: 3,
      humidity: 80,
      windSpeed: 20,
      weatherCode: 3,
      cloudCover: 90,
      precipitation: 2,
    },
  },
];

export { buildSyntheticWeather };
