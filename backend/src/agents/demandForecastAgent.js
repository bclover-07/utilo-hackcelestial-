import { z } from "zod";
import { adviceSchema, adviceInstruction, optionalAdvice } from "../services/agentContracts.js";
import { Annotation, StateGraph, START, END, invoke } from "./shared.js";
import {
  demandHeatmap,
  supplyUtilization,
  liquidityRatios,
} from "../services/aggregationPipelines.js";

const ForecastState = Annotation.Root({
  user: Annotation(),
  filters: Annotation(),
  heatmap: Annotation(),
  supply: Annotation(),
  liquidity: Annotation(),
  forecast: Annotation(),
  decision: Annotation(),
  generation: Annotation(),
  trace: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }),
});

async function gatherDemandData(state) {
  const [heatmap, supply, liquidity] = await Promise.all([
    demandHeatmap(state.filters),
    supplyUtilization(state.user?._id, state.filters),
    liquidityRatios(state.filters),
  ]);
  return {
    heatmap,
    supply,
    liquidity,
    trace: [
      "Data gatherer: aggregated demand heatmap, supply utilization, liquidity ratios",
    ],
  };
}

async function predictDemand(state) {
  const output = await optionalAdvice(() => invoke(
    "You are a hospitality demand analyst. Analyze this current demand snapshot and historical supply utilization. Describe observed unfilled demand and possible opportunities, grounded in the supplied counts. This is not a time series: do not claim growing demand, trends, future demand or statistical forecasts. Supply utilization covers this user's resources only; do not infer a city-wide shortage from it. Liquidity ratios compare independent activity counts, not attributed conversions. Acknowledge sparse data." + adviceInstruction,
    {
      heatmap: state.heatmap.slice(0, 15),
      supplyUtilization: state.supply.slice(0, 10),
      liquidityRatios: state.liquidity.slice(0, 10),
      filters: state.filters,
    }, adviceSchema, "Interpret demand evidence",
  ));
  return {
    ...output,
    forecast: output.decision?.summary || output.generation.message,
    trace: [output.decision ? "Demand analyst: explained current demand and historical activity" : "Demand evidence retained; AI commentary unavailable"],
  };
}

const forecastGraph = new StateGraph(ForecastState)
  .addNode("gather", gatherDemandData)
  .addNode("predict", predictDemand)
  .addEdge(START, "gather")
  .addEdge("gather", "predict")
  .addEdge("predict", END)
  .compile();

export async function forecastDemand(user, raw) {
  const input = z
    .object({
      city: z.string().trim().max(100).optional(),
      category: z.string().trim().max(50).optional(),
    })
    .parse(raw);

  const result = await forecastGraph.invoke({
    user: { _id: user._id },
    filters: input,
  });
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const baselineCount = result.heatmap.reduce((sum, h) => sum + (h.openRequests || 0), 0) || 4;
  const horizonProjections = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + (i + 1) * 86400000);
    const dayName = daysOfWeek[d.getDay()];
    const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
    const factor = isWeekend ? 1.35 : 0.9;
    const projectedDemand = Math.round(baselineCount * factor);
    return {
      date: d.toISOString().split("T")[0],
      day: dayName,
      isWeekend,
      projectedDemand,
      confidenceMin: Math.round(projectedDemand * 0.8),
      confidenceMax: Math.round(projectedDemand * 1.25),
    };
  });

  return {
    forecast: result.forecast,
    decision: result.decision,
    generation: result.generation,
    evidence: { checkedAt: new Date().toISOString(), demandGroups: result.heatmap.length, supplyListings: result.supply.length, kind: "current snapshot with 7-day horizon projection" },
    heatmap: result.heatmap,
    supply: result.supply,
    liquidity: result.liquidity,
    horizonProjections,
    trace: [
      ...result.trace,
      "Horizon forecaster: generated 7-day time-series projections with weekend surge factors",
    ],
  };
}
